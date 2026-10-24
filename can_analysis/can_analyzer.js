/* ===================================================================
   TRENDS FOR SALE (TFS) - CAN BUS PROTOCOL ANALYZER SCRIPT
   Multi-Interface: Vector vxlapi Bridge, Web Serial SLCAN, & Simulator
   =================================================================== */

// Global State
let isConnected = false;
let isPaused = false;
let autoScroll = true;
let activeInterface = 'vector'; // 'vector' | 'serial' | 'virtual'

let wsBridge = null;
let serialPort = null;
let serialReader = null;
let serialWriter = null;
let virtualSimInterval = null;
let txCycleInterval = null;

let frameCount = 0;
let lastFrameTime = 0;
let fpsCounter = 0;
let fpsTimer = null;
const capturedFrames = [];

// DOM Elements
const statusBadge = document.getElementById('can-status-badge');
const statusDot = document.getElementById('can-status-dot');
const statusText = document.getElementById('can-status-text');

const interfaceSelect = document.getElementById('interface-select');
const bitrateSelect = document.getElementById('bitrate-select');
const connectBtn = document.getElementById('can-connect-btn');
const connectBtnText = document.getElementById('can-connect-text');

const vectorHelperBar = document.getElementById('vector-helper-bar');
const bridgeModal = document.getElementById('bridge-modal');
const bridgeGuideBtn = document.getElementById('bridge-guide-btn');
const openBridgeModalBtn = document.getElementById('open-bridge-modal-btn');
const closeBridgeModal = document.getElementById('close-bridge-modal');

const traceTableBody = document.getElementById('trace-table-body');
const traceScrollArea = document.getElementById('trace-scroll-area');
const traceEmptyMsg = document.getElementById('trace-empty-message');

const idFilterInput = document.getElementById('id-filter-input');
const pauseTraceBtn = document.getElementById('pause-trace-btn');
const autoscrollTraceBtn = document.getElementById('autoscroll-trace-btn');
const clearTraceBtn = document.getElementById('clear-trace-btn');
const exportTraceBtn = document.getElementById('export-trace-btn');

const totalFramesBadge = document.getElementById('total-frames-count');
const busLoadBadge = document.getElementById('bus-load-indicator');
const fpsBadge = document.getElementById('fps-indicator');

// Studio / Transmit Elements
const txForm = document.getElementById('tx-form');
const txCanId = document.getElementById('tx-can-id');
const txIdType = document.getElementById('tx-id-type');
const txDlc = document.getElementById('tx-dlc');
const txChannel = document.getElementById('tx-channel');
const txPayload = document.getElementById('tx-payload');
const txCycleEnable = document.getElementById('tx-cycle-enable');
const txCycleMs = document.getElementById('tx-cycle-ms');
const txStopCycleBtn = document.getElementById('tx-stop-cycle-btn');
const presetBtns = document.querySelectorAll('.preset-btn');

// DBC Gauge Elements
const sigRpm = document.getElementById('sig-rpm');
const barRpm = document.getElementById('bar-rpm');
const sigSpeed = document.getElementById('sig-speed');
const barSpeed = document.getElementById('bar-speed');
const sigTemp = document.getElementById('sig-temp');
const sigSoc = document.getElementById('sig-soc');

// Studio Tab Switching
const studioTabs = document.querySelectorAll('.studio-tab');
const tabPanes = document.querySelectorAll('.tab-pane');

studioTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    studioTabs.forEach(t => t.classList.remove('active'));
    tabPanes.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.getAttribute('data-tab');
    document.getElementById(`pane-${target}`)?.classList.add('active');
  });
});

// -------------------------------------------------------------------
// 1. Connection & Interface Controller
// -------------------------------------------------------------------
function updateConnectionUI(connected, desc = '') {
  isConnected = connected;
  if (connected) {
    statusDot.classList.add('connected');
    statusDot.classList.remove('disconnected');
    statusBadge.classList.add('connected');
    statusText.textContent = `Connected: ${desc}`;
    connectBtnText.textContent = 'Disconnect Bus';
    connectBtn.classList.remove('btn-primary');
    connectBtn.classList.add('btn-secondary');
    if (vectorHelperBar) vectorHelperBar.style.display = 'none';
  } else {
    statusDot.classList.remove('connected');
    statusDot.classList.add('disconnected');
    statusBadge.classList.remove('connected');
    statusText.textContent = 'Disconnected';
    connectBtnText.textContent = 'Connect Bus';
    connectBtn.classList.remove('btn-secondary');
    connectBtn.classList.add('btn-primary');
    if (activeInterface === 'vector' && vectorHelperBar) {
      vectorHelperBar.style.display = 'block';
    }
  }
}

connectBtn.addEventListener('click', async () => {
  if (isConnected) {
    disconnectAll();
  } else {
    activeInterface = interfaceSelect.value;
    const bitrate = parseInt(bitrateSelect.value, 10);

    if (activeInterface === 'vector') {
      connectVectorBridge(bitrate);
    } else if (activeInterface === 'serial') {
      connectWebSerial(bitrate);
    } else if (activeInterface === 'virtual') {
      connectVirtualSimulator(bitrate);
    }
  }
});

interfaceSelect.addEventListener('change', () => {
  if (isConnected) disconnectAll();
  activeInterface = interfaceSelect.value;
  if (activeInterface === 'vector') {
    if (vectorHelperBar) vectorHelperBar.style.display = 'block';
  } else {
    if (vectorHelperBar) vectorHelperBar.style.display = 'none';
  }
});

function disconnectAll() {
  if (wsBridge) {
    wsBridge.close();
    wsBridge = null;
  }
  if (serialPort) {
    closeSerialPort();
  }
  if (virtualSimInterval) {
    clearInterval(virtualSimInterval);
    virtualSimInterval = null;
  }
  if (txCycleInterval) {
    clearInterval(txCycleInterval);
    txCycleInterval = null;
    txStopCycleBtn.style.display = 'none';
  }
  if (fpsTimer) {
    clearInterval(fpsTimer);
    fpsTimer = null;
  }
  updateConnectionUI(false);
}

// -------------------------------------------------------------------
// 2. Vector vxlapi WebSocket Bridge Client
// -------------------------------------------------------------------
function connectVectorBridge(bitrate) {
  try {
    statusText.textContent = 'Connecting to Vector Bridge...';
    wsBridge = new WebSocket('ws://localhost:9002');

    wsBridge.onopen = () => {
      // Send handshake & channel configuration
      wsBridge.send(JSON.stringify({
        command: 'configure',
        bitrate: bitrate,
        channel: 1,
        app_name: 'TFS_CAN_Workbench'
      }));
      updateConnectionUI(true, `Vector Hardware @ ${bitrate / 1000}k`);
      startFpsMonitor();
    };

    wsBridge.onmessage = (event) => {
      if (isPaused) return;
      try {
        const frame = JSON.parse(event.data);
        handleIncomingFrame(frame);
      } catch (err) {
        console.error('Frame decode error:', err);
      }
    };

    wsBridge.onerror = () => {
      disconnectAll();
      if (vectorHelperBar) vectorHelperBar.style.display = 'block';
      alert('Could not connect to TFS Vector Bridge at ws://localhost:9002. Please ensure vector_bridge.py or start_bridge.bat is running.');
    };

    wsBridge.onclose = () => {
      if (isConnected) disconnectAll();
    };
  } catch (err) {
    disconnectAll();
    alert('Vector Bridge error: ' + err.message);
  }
}

// -------------------------------------------------------------------
// 3. Web Serial (SLCAN / CANable)
// -------------------------------------------------------------------
async function connectWebSerial(bitrate) {
  if (!('serial' in navigator)) {
    alert('Web Serial API is not supported in this browser. Please use Chrome, Edge, or Brave.');
    return;
  }

  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 115200 });
    serialWriter = serialPort.writable.getWriter();

    // Map bitrate to SLCAN speed command
    // S0: 10k, S1: 20k, S2: 50k, S3: 100k, S4: 125k, S5: 250k, S6: 500k, S7: 800k, S8: 1000k
    let speedCmd = 'S6\r';
    if (bitrate === 125000) speedCmd = 'S4\r';
    else if (bitrate === 250000) speedCmd = 'S5\r';
    else if (bitrate === 1000000) speedCmd = 'S8\r';

    await serialWriter.write(new TextEncoder().encode(`C\r${speedCmd}O\r`)); // Close, set speed, Open bus

    updateConnectionUI(true, `Web Serial SLCAN @ ${bitrate / 1000}k`);
    startFpsMonitor();
    readSerialLoop();
  } catch (err) {
    disconnectAll();
    alert('Serial CAN connection failed: ' + err.message);
  }
}

async function readSerialLoop() {
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    serialReader = serialPort.readable.getReader();
    while (true) {
      const { value, done } = await serialReader.read();
      if (done) break;
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\r');
        buffer = lines.pop();

        for (const line of lines) {
          parseSlcanFrame(line.trim());
        }
      }
    }
  } catch (err) {
    if (isConnected) disconnectAll();
  }
}

function parseSlcanFrame(line) {
  if (!line || (line[0] !== 't' && line[0] !== 'T')) return;
  const isExt = line[0] === 'T';
  const idLen = isExt ? 8 : 3;
  const id = parseInt(line.substring(1, 1 + idLen), 16);
  const dlc = parseInt(line.substring(1 + idLen, 2 + idLen), 10);
  const hexData = line.substring(2 + idLen);

  const bytes = [];
  for (let i = 0; i < hexData.length; i += 2) {
    bytes.push(parseInt(hexData.substr(i, 2), 16));
  }

  handleIncomingFrame({
    id: id,
    dlc: dlc,
    data: bytes,
    channel: 1,
    is_extended: isExt,
    dir: 'RX'
  });
}

async function closeSerialPort() {
  if (serialReader) {
    await serialReader.cancel();
    serialReader.releaseLock();
    serialReader = null;
  }
  if (serialWriter) {
    serialWriter.releaseLock();
    serialWriter = null;
  }
  await serialPort.close();
  serialPort = null;
}

// -------------------------------------------------------------------
// 4. Built-In Virtual Automotive ECU Simulator
// -------------------------------------------------------------------
let simRpm = 1800;
let simSpeed = 45.0;
let simTemp = 86;
let simSoc = 92;

function connectVirtualSimulator(bitrate) {
  updateConnectionUI(true, `Virtual Simulator (Auto Bus @ ${bitrate / 1000}k)`);
  startFpsMonitor();

  let tick = 0;
  virtualSimInterval = setInterval(() => {
    if (isPaused) return;
    tick++;

    // 0x100 Engine Speed & Torque (every 20ms)
    simRpm = Math.floor(2200 + Math.sin(tick / 15) * 800 + (Math.random() * 50));
    const rpmHigh = (simRpm >> 8) & 0xFF;
    const rpmLow = simRpm & 0xFF;
    handleIncomingFrame({
      id: 0x100,
      dlc: 8,
      data: [rpmHigh, rpmLow, 0x44, 0x12, 0x00, 0x00, 0x10, (tick & 0xFF)],
      channel: 1,
      is_extended: false,
      dir: 'RX'
    });

    // 0x200 Vehicle Speed & Brake (every 50ms)
    if (tick % 2 === 0) {
      simSpeed = Math.max(0, 55.0 + Math.sin(tick / 20) * 20.0).toFixed(1);
      const speedRaw = Math.floor(parseFloat(simSpeed) * 100);
      handleIncomingFrame({
        id: 0x200,
        dlc: 8,
        data: [(speedRaw >> 8) & 0xFF, speedRaw & 0xFF, 0x02, 0x80, 0x00, 0x00, 0x00, 0x00],
        channel: 1,
        is_extended: false,
        dir: 'RX'
      });
    }

    // 0x350 Battery State of Charge (every 100ms)
    if (tick % 5 === 0) {
      handleIncomingFrame({
        id: 0x350,
        dlc: 8,
        data: [simSoc, simTemp, 0x14, 0x28, 0x00, 0x00, 0x03, 0xE8],
        channel: 1,
        is_extended: false,
        dir: 'RX'
      });
    }

    // 0x7E8 OBD-II Diagnostic Response (every 500ms)
    if (tick % 25 === 0) {
      handleIncomingFrame({
        id: 0x7E8,
        dlc: 8,
        data: [0x04, 0x41, 0x0C, rpmHigh, rpmLow, 0xAA, 0xAA, 0xAA],
        channel: 1,
        is_extended: false,
        dir: 'RX'
      });
    }
  }, 20);
}

// -------------------------------------------------------------------
// 5. Frame Processor & Trace Table Rendering
// -------------------------------------------------------------------
function handleIncomingFrame(frame) {
  frameCount++;
  fpsCounter++;

  const nowSec = performance.now() / 1000;
  const dTimeMs = lastFrameTime ? ((nowSec - lastFrameTime) * 1000).toFixed(2) : '0.00';
  lastFrameTime = nowSec;

  frame.index = frameCount;
  frame.timeStr = nowSec.toFixed(4);
  frame.dTime = dTimeMs;
  capturedFrames.push(frame);

  // Update Counters
  if (totalFramesBadge) totalFramesBadge.textContent = frameCount.toLocaleString();

  // Decode DBC signals
  decodeDbcSignals(frame);

  // Check ID Filter
  const filterVal = idFilterInput?.value.trim().toLowerCase();
  if (filterVal) {
    const idHex = '0x' + frame.id.toString(16).toLowerCase();
    const idDec = frame.id.toString(10);
    if (!idHex.includes(filterVal) && !idDec.includes(filterVal)) {
      return; // Skip rendering row
    }
  }

  renderTraceRow(frame);
}

function renderTraceRow(frame) {
  if (traceEmptyMsg) traceEmptyMsg.style.display = 'none';

  const hexBytes = frame.data.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  const asciiStr = frame.data.map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
  const idStr = frame.is_extended ? '0x' + frame.id.toString(16).padStart(8, '0').toUpperCase() : '0x' + frame.id.toString(16).padStart(3, '0').toUpperCase();

  const row = document.createElement('div');
  row.className = `trace-row ${frame.dir.toLowerCase()}`;

  // Color classes
  if (frame.id >= 0x7E0 && frame.id <= 0x7EF) {
    row.classList.add('diag');
  } else if (frame.id < 0x100) {
    row.classList.add('hi-pri');
  }

  row.innerHTML = `
    <span class="col-idx">${frame.index}</span>
    <span class="col-time">${frame.timeStr}</span>
    <span class="col-dtime">${frame.dTime}</span>
    <span class="col-ch">${frame.channel || 1}</span>
    <span class="col-id">${idStr}</span>
    <span class="col-type">${frame.is_extended ? 'EXT' : 'STD'}</span>
    <span class="col-dir ${frame.dir.toLowerCase()}">${frame.dir}</span>
    <span class="col-dlc">${frame.dlc}</span>
    <span class="col-data font-mono">${hexBytes}</span>
    <span class="col-ascii font-mono">${asciiStr}</span>
  `;

  traceTableBody.appendChild(row);

  // Keep DOM tidy (max 1000 rows in memory to prevent browser lag)
  if (traceTableBody.children.length > 800) {
    traceTableBody.removeChild(traceTableBody.children[0]);
  }

  if (autoScroll && traceScrollArea) {
    traceScrollArea.scrollTop = traceScrollArea.scrollHeight;
  }
}

// -------------------------------------------------------------------
// 6. Live DBC Signal Telemetry Decoder
// -------------------------------------------------------------------
function decodeDbcSignals(frame) {
  // 0x100: Engine Speed
  if (frame.id === 0x100 && frame.data.length >= 2) {
    const rpm = (frame.data[0] << 8) | frame.data[1];
    if (sigRpm) sigRpm.textContent = rpm.toLocaleString();
    if (barRpm) barRpm.style.width = `${Math.min(100, (rpm / 7000) * 100)}%`;
  }

  // 0x200: Vehicle Speed
  if (frame.id === 0x200 && frame.data.length >= 2) {
    const rawSpeed = (frame.data[0] << 8) | frame.data[1];
    const speed = (rawSpeed / 100).toFixed(1);
    if (sigSpeed) sigSpeed.textContent = speed;
    if (barSpeed) barSpeed.style.width = `${Math.min(100, (speed / 160) * 100)}%`;
  }

  // 0x350: Battery SOC & Temperature
  if (frame.id === 0x350 && frame.data.length >= 2) {
    if (sigSoc) sigSoc.textContent = frame.data[0];
    if (sigTemp) sigTemp.textContent = frame.data[1];
  }
}

// FPS & Bus Load Monitor
function startFpsMonitor() {
  if (fpsTimer) clearInterval(fpsTimer);
  fpsTimer = setInterval(() => {
    if (fpsBadge) fpsBadge.textContent = fpsCounter;
    // Estimate bus load based on 500kbps nominal
    const estLoad = Math.min(100, Math.floor((fpsCounter * 128 / 500000) * 100));
    if (busLoadBadge) busLoadBadge.textContent = `${estLoad}%`;
    fpsCounter = 0;
  }, 1000);
}

// -------------------------------------------------------------------
// 7. Transmit / Frame Injector Logic
// -------------------------------------------------------------------
function transmitFrame() {
  if (!isConnected) {
    alert('Please connect to a bus interface first.');
    return;
  }

  const rawId = txCanId.value.trim();
  const id = rawId.startsWith('0x') || rawId.startsWith('0X') ? parseInt(rawId, 16) : parseInt(rawId, 10);
  const isExt = txIdType.value === 'ext';
  const dlc = parseInt(txDlc.value, 10);
  const ch = parseInt(txChannel.value, 10);

  const cleanHex = txPayload.value.replace(/0x|\s+|,/gi, '');
  const match = cleanHex.match(/.{1,2}/g) || [];
  const bytes = match.map(b => parseInt(b, 16));

  const frame = {
    id: id,
    dlc: dlc,
    data: bytes,
    channel: ch,
    is_extended: isExt,
    dir: 'TX'
  };

  // Dispatch to active interface
  if (activeInterface === 'vector' && wsBridge && wsBridge.readyState === WebSocket.OPEN) {
    wsBridge.send(JSON.stringify({
      command: 'transmit',
      ...frame
    }));
  } else if (activeInterface === 'serial' && serialWriter) {
    const cmdPrefix = isExt ? 'T' : 't';
    const idHex = isExt ? id.toString(16).padStart(8, '0') : id.toString(16).padStart(3, '0');
    const dataHex = match.join('');
    const slcanString = `${cmdPrefix}${idHex}${dlc}${dataHex}\r`;
    serialWriter.write(new TextEncoder().encode(slcanString));
  }

  // Echo locally in trace table
  handleIncomingFrame(frame);
}

txForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (txCycleEnable.checked) {
    if (txCycleInterval) clearInterval(txCycleInterval);
    const ms = Math.max(10, parseInt(txCycleMs.value, 10) || 100);
    transmitFrame();
    txCycleInterval = setInterval(transmitFrame, ms);
    txStopCycleBtn.style.display = 'inline-block';
  } else {
    transmitFrame();
  }
});

txStopCycleBtn.addEventListener('click', () => {
  if (txCycleInterval) {
    clearInterval(txCycleInterval);
    txCycleInterval = null;
    txStopCycleBtn.style.display = 'none';
  }
});

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    txCanId.value = btn.getAttribute('data-id');
    txDlc.value = btn.getAttribute('data-dlc');
    txPayload.value = btn.getAttribute('data-bytes');
    txIdType.value = 'std';
  });
});

// -------------------------------------------------------------------
// 8. Trace Actions (Filter, Pause, Clear, Export)
// -------------------------------------------------------------------
idFilterInput?.addEventListener('input', () => {
  // Clear and re-filter visible rows
  traceTableBody.innerHTML = '';
  capturedFrames.forEach(f => {
    const filterVal = idFilterInput.value.trim().toLowerCase();
    if (!filterVal || ('0x' + f.id.toString(16)).includes(filterVal) || f.id.toString().includes(filterVal)) {
      renderTraceRow(f);
    }
  });
});

pauseTraceBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseTraceBtn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
  pauseTraceBtn.classList.toggle('active', isPaused);
});

autoscrollTraceBtn.addEventListener('click', () => {
  autoScroll = !autoScroll;
  autoscrollTraceBtn.classList.toggle('active', autoScroll);
});

clearTraceBtn.addEventListener('click', () => {
  traceTableBody.innerHTML = '';
  capturedFrames.length = 0;
  frameCount = 0;
  if (totalFramesBadge) totalFramesBadge.textContent = '0';
  if (traceEmptyMsg) traceEmptyMsg.style.display = 'block';
});

exportTraceBtn.addEventListener('click', () => {
  if (capturedFrames.length === 0) {
    alert('No frames to export.');
    return;
  }

  // Vector ASC Format header
  let asc = `date ${new Date().toUTCString()}\nbase hex  timestamps absolute\ninternal events logged\n// TFS CAN Analyzer Trace Export\n`;
  asc += `Begin Triggerblock ${new Date().toUTCString()}\n0.000000 Start of measurement\n`;

  capturedFrames.forEach(f => {
    const ch = f.channel || 1;
    const idHex = f.id.toString(16).toUpperCase() + (f.is_extended ? 'x' : '');
    const dir = f.dir === 'TX' ? 'Tx' : 'Rx';
    const dataStr = f.data.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    asc += `  ${f.timeStr.padStart(10, ' ')} ${ch}  ${idStr(f)} ${dir.padEnd(4, ' ')} d ${f.dlc} ${dataStr}\n`;
  });

  asc += `End Triggerblock\n`;

  function idStr(f) {
    return (f.id.toString(16).toUpperCase() + (f.is_extended ? 'x' : '')).padEnd(8, ' ');
  }

  const blob = new Blob([asc], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tfs_can_trace_${new Date().toISOString().slice(0, 10)}.asc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Modal Handlers
function toggleBridgeModal(show) {
  if (bridgeModal) bridgeModal.classList.toggle('open', show);
}

bridgeGuideBtn?.addEventListener('click', () => toggleBridgeModal(true));
openBridgeModalBtn?.addEventListener('click', () => toggleBridgeModal(true));
closeBridgeModal?.addEventListener('click', () => toggleBridgeModal(false));
window.addEventListener('click', (e) => {
  if (e.target === bridgeModal) toggleBridgeModal(false);
});
