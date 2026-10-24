/* ===================================================================
   TRENDS FOR SALE (TFS) - PRO SERIAL TERMINAL WORKBENCH SCRIPT
   =================================================================== */

// Global State
let port = null;
let reader = null;
let writer = null;
let selectedPort = null;
let autoScroll = true;
let showTimestamps = true;
let currentViewMode = 'ascii'; // 'ascii' | 'hex'

let rxTotalBytes = 0;
let txTotalBytes = 0;

let dtrState = false;
let rtsState = false;

// Command History
const commandHistory = [];
let historyIndex = -1;

// Serial Config
let serialConfig = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none'
};

// DOM Elements
const statusBadge = document.getElementById('status-badge');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

const portSelectBtn = document.getElementById('port-select-btn');
const selectedPortLabel = document.getElementById('selected-port-label');
const quickBaudrate = document.getElementById('quick-baudrate');
const connectBtn = document.getElementById('connect-btn');
const connectBtnText = document.getElementById('connect-btn-text');

const consoleOutput = document.getElementById('output');
const consoleScrollContainer = document.getElementById('console-scroll-container');
const autoscrollBtn = document.getElementById('autoscroll-btn');
const clearBtn = document.getElementById('clear-btn');
const savelogBtn = document.getElementById('savelog-btn');
const toggleTimestampsBtn = document.getElementById('toggle-timestamps-btn');

const modeAsciiBtn = document.getElementById('mode-ascii-btn');
const modeHexBtn = document.getElementById('mode-hex-btn');

const rxBytesCounter = document.getElementById('rx-bytes-count');
const txBytesCounter = document.getElementById('tx-bytes-count');

const dtrBtn = document.getElementById('dtr-btn');
const rtsBtn = document.getElementById('rts-btn');
const espResetBtn = document.getElementById('esp-reset-btn');

const inputBox = document.getElementById('input-box');
const sendBtn = document.getElementById('send-btn');
const lineEndingSelect = document.getElementById('line-ending');
const sendFormatSelect = document.getElementById('send-format');
const macroButtons = document.querySelectorAll('.quick-macro-btn');

const configureBtn = document.getElementById('configure-btn');
const configModal = document.getElementById('config-modal');
const closeConfig = document.getElementById('close-config');
const cancelConfigBtn = document.getElementById('cancel-config-btn');
const configForm = document.getElementById('config-form');

const unsupportedBanner = document.getElementById('unsupported-banner');

// Helper: Formatted Timestamp [HH:MM:SS.mmm]
function getTimestamp() {
  const now = new Date();
  const time = now.getHours().toString().padStart(2, '0') + ':' +
    now.getMinutes().toString().padStart(2, '0') + ':' +
    now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${time}.${ms}`;
}

// Check Web Serial API Support
function checkSerialSupport() {
  if (!('serial' in navigator)) {
    if (unsupportedBanner) {
      unsupportedBanner.style.display = 'block';
    }
    appendOutputLine('Web Serial API is NOT supported in this browser. Please use Chrome, Edge, or Brave.', 'err');
    return false;
  }
  return true;
}

// Append Line to Terminal Output
function appendOutputLine(content, type = 'info', rawBytes = null) {
  if (!consoleOutput) return;

  const lineDiv = document.createElement('div');
  lineDiv.className = `output-line ${type}`;

  if (showTimestamps) {
    const timeSpan = document.createElement('span');
    timeSpan.className = 'output-timestamp';
    timeSpan.textContent = `[${getTimestamp()}]`;
    lineDiv.appendChild(timeSpan);
  }

  const textSpan = document.createElement('span');
  textSpan.className = 'output-text';

  if (currentViewMode === 'hex' && rawBytes) {
    // Format raw bytes as hex
    const hexArr = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0').toUpperCase());
    textSpan.textContent = `[${type.toUpperCase()} HEX]: ` + hexArr.join(' ');
  } else {
    textSpan.textContent = content;
  }

  lineDiv.appendChild(textSpan);
  consoleOutput.appendChild(lineDiv);

  if (autoScroll) {
    scrollOutputToBottom();
  }
}

// Scroll Output to Bottom
function scrollOutputToBottom() {
  if (consoleScrollContainer) {
    consoleScrollContainer.scrollTop = consoleScrollContainer.scrollHeight;
  }
}

// Update Traffic Metrics
function addTraffic(rx = 0, tx = 0) {
  rxTotalBytes += rx;
  txTotalBytes += tx;
  if (rxBytesCounter) rxBytesCounter.textContent = rxTotalBytes.toLocaleString();
  if (txBytesCounter) txBytesCounter.textContent = txTotalBytes.toLocaleString();
}

// Request / Select Port
async function requestSerialPort() {
  if (!checkSerialSupport()) return;

  try {
    const p = await navigator.serial.requestPort();
    selectedPort = p;
    const info = p.getInfo();
    let label = 'COM Port Selected';
    if (info.usbVendorId && info.usbProductId) {
      label = `VID:${info.usbVendorId.toString(16).toUpperCase()} PID:${info.usbProductId.toString(16).toUpperCase()}`;
    }
    selectedPortLabel.textContent = label;
    appendOutputLine(`Port selected: ${label}`, 'sys');
  } catch (err) {
    if (err.name !== 'NotFoundError') {
      appendOutputLine(`Port selection error: ${err.message}`, 'err');
    }
  }
}

// Set Connection Status UI
function setConnectionUI(connected, portDetails = '') {
  if (connected) {
    statusDot.classList.add('connected');
    statusDot.classList.remove('disconnected');
    statusBadge.classList.add('connected');
    statusText.textContent = `Connected (${portDetails})`;
    connectBtnText.textContent = 'Disconnect';
    connectBtn.classList.remove('btn-primary');
    connectBtn.classList.add('btn-secondary');
  } else {
    statusDot.classList.remove('connected');
    statusDot.classList.add('disconnected');
    statusBadge.classList.remove('connected');
    statusText.textContent = 'Disconnected';
    connectBtnText.textContent = 'Connect';
    connectBtn.classList.remove('btn-secondary');
    connectBtn.classList.add('btn-primary');
  }
}

// Open / Connect to Serial Port
async function toggleConnection() {
  if (!checkSerialSupport()) return;

  if (port) {
    // Disconnect
    await disconnectSerial();
    return;
  }

  if (!selectedPort) {
    // If not selected yet, prompt user
    await requestSerialPort();
    if (!selectedPort) return;
  }

  try {
    serialConfig.baudRate = parseInt(quickBaudrate.value, 10) || 115200;

    port = selectedPort;
    await port.open({
      baudRate: serialConfig.baudRate,
      dataBits: serialConfig.dataBits,
      stopBits: serialConfig.stopBits,
      parity: serialConfig.parity,
      flowControl: serialConfig.flowControl
    });

    const info = port.getInfo();
    const portDesc = info.usbVendorId ? `USB Device @ ${serialConfig.baudRate}` : `${serialConfig.baudRate} bps`;
    setConnectionUI(true, portDesc);
    appendOutputLine(`Serial port opened at ${serialConfig.baudRate} bps (${serialConfig.dataBits}-${serialConfig.parity[0].toUpperCase()}-${serialConfig.stopBits})`, 'sys');

    // Create write stream
    writer = port.writable.getWriter();

    // Start read loop
    readLoop();
  } catch (err) {
    port = null;
    writer = null;
    setConnectionUI(false);
    appendOutputLine(`Connection failed: ${err.message}`, 'err');
  }
}

// Disconnect Serial
async function disconnectSerial() {
  if (!port) return;

  try {
    if (reader) {
      await reader.cancel();
      reader.releaseLock();
      reader = null;
    }
    if (writer) {
      writer.releaseLock();
      writer = null;
    }
    await port.close();
    appendOutputLine('Serial port closed.', 'sys');
  } catch (err) {
    appendOutputLine(`Error closing port: ${err.message}`, 'err');
  } finally {
    port = null;
    setConnectionUI(false);
  }
}

// Serial Receive Loop
async function readLoop() {
  let partialBuffer = '';
  const textDecoder = new TextDecoder();

  try {
    reader = port.readable.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        addTraffic(value.byteLength, 0);

        if (currentViewMode === 'hex') {
          appendOutputLine('', 'rx', value);
        } else {
          // Decode text stream and handle newlines cleanly
          const decoded = textDecoder.decode(value, { stream: true });
          partialBuffer += decoded;

          const lines = partialBuffer.split(/\r\n|\n|\r/);
          partialBuffer = lines.pop(); // keep last incomplete chunk

          for (const line of lines) {
            if (line.length > 0) {
              appendOutputLine(`[RX]: ${line}`, 'rx');
            }
          }
        }
      }
    }
  } catch (err) {
    if (port) {
      appendOutputLine(`Read loop terminated: ${err.message}`, 'err');
    }
  } finally {
    if (reader) {
      reader.releaseLock();
      reader = null;
    }
  }
}

// Send Data to Serial
async function sendData(customPayload = null) {
  if (!port || !writer) {
    appendOutputLine('Error: Port is not connected. Connect a device first.', 'err');
    return;
  }

  let text = customPayload !== null ? customPayload : inputBox.value;
  if (customPayload === null && !text.trim()) return;

  // Add to command history if user typed it
  if (customPayload === null && text.trim()) {
    commandHistory.push(text);
    historyIndex = commandHistory.length;
    inputBox.value = '';
  }

  const format = sendFormatSelect.value;
  const lineEnding = lineEndingSelect.value;

  try {
    let payloadBytes;

    if (format === 'hex') {
      // Parse Hex string into Uint8Array
      const cleanHex = text.replace(/0x|\s+|,/gi, '');
      if (cleanHex.length % 2 !== 0) {
        appendOutputLine('Invalid Hex string: odd number of nibbles.', 'err');
        return;
      }
      const match = cleanHex.match(/.{1,2}/g) || [];
      payloadBytes = new Uint8Array(match.map(byte => parseInt(byte, 16)));
      appendOutputLine(`[TX HEX]: ${match.join(' ').toUpperCase()}`, 'tx');
    } else {
      // ASCII text with line endings
      let ending = '';
      if (lineEnding === 'crlf') ending = '\r\n';
      else if (lineEnding === 'lf') ending = '\n';
      else if (lineEnding === 'cr') ending = '\r';

      const fullString = text + ending;
      payloadBytes = new TextEncoder().encode(fullString);
      appendOutputLine(`[TX]: ${text}`, 'tx');
    }

    await writer.write(payloadBytes);
    addTraffic(0, payloadBytes.byteLength);
  } catch (err) {
    appendOutputLine(`Send failed: ${err.message}`, 'err');
  }
}

// Toggle DTR and RTS Pins
async function setControlSignals() {
  if (!port) {
    appendOutputLine('Hardware signals require an active serial connection.', 'info');
    return;
  }
  try {
    await port.setSignals({
      dataTerminalReady: dtrState,
      requestToSend: rtsState
    });
    appendOutputLine(`Signals updated &mdash; DTR: ${dtrState ? 'ON' : 'OFF'}, RTS: ${rtsState ? 'ON' : 'OFF'}`, 'sys');
  } catch (err) {
    appendOutputLine(`Failed to set hardware signals: ${err.message}`, 'err');
  }
}

// Pulse DTR/RTS to Reset MCU (ESP32 / Arduino standard reset sequence)
async function resetMCU() {
  if (!port) {
    appendOutputLine('Connect to an MCU first to trigger reset.', 'err');
    return;
  }
  try {
    appendOutputLine('Pulsing DTR/RTS reset sequence...', 'sys');
    // Set DTR false, RTS true
    await port.setSignals({ dataTerminalReady: false, requestToSend: true });
    await new Promise(r => setTimeout(r, 100));
    // Set DTR true, RTS false
    await port.setSignals({ dataTerminalReady: true, requestToSend: false });
    await new Promise(r => setTimeout(r, 100));
    // Release both
    await port.setSignals({ dataTerminalReady: false, requestToSend: false });
    appendOutputLine('Reset pulse complete.', 'sys');
  } catch (err) {
    appendOutputLine(`Reset sequence error: ${err.message}`, 'err');
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  checkSerialSupport();

  // Port selector
  portSelectBtn.addEventListener('click', requestSerialPort);

  // Connect toggle
  connectBtn.addEventListener('click', toggleConnection);

  // Quick baudrate change
  quickBaudrate.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      const customRate = prompt('Enter custom baud rate (bps):', '500000');
      if (customRate && !isNaN(customRate)) {
        const opt = document.createElement('option');
        opt.value = customRate;
        opt.textContent = `${customRate} (Custom)`;
        opt.selected = true;
        quickBaudrate.appendChild(opt);
        serialConfig.baudRate = parseInt(customRate, 10);
      } else {
        quickBaudrate.value = '115200';
      }
    } else {
      serialConfig.baudRate = parseInt(e.target.value, 10);
    }
  });

  // Auto-scroll toggle
  autoscrollBtn.addEventListener('click', () => {
    autoScroll = !autoScroll;
    autoscrollBtn.classList.toggle('active', autoScroll);
  });

  // User manual scroll detection
  if (consoleScrollContainer) {
    consoleScrollContainer.addEventListener('scroll', () => {
      const isAtBottom = consoleScrollContainer.scrollTop + consoleScrollContainer.clientHeight >= consoleScrollContainer.scrollHeight - 10;
      if (!isAtBottom && autoScroll) {
        autoScroll = false;
        autoscrollBtn.classList.remove('active');
      }
    });
  }

  // Clear Output
  clearBtn.addEventListener('click', () => {
    if (consoleOutput) consoleOutput.innerHTML = '';
    rxTotalBytes = 0;
    txTotalBytes = 0;
    addTraffic(0, 0);
  });

  // Toggle Timestamps
  toggleTimestampsBtn.addEventListener('click', () => {
    showTimestamps = !showTimestamps;
    toggleTimestampsBtn.classList.toggle('active', showTimestamps);
  });

  // View Mode: ASCII vs HEX
  modeAsciiBtn.addEventListener('click', () => {
    currentViewMode = 'ascii';
    modeAsciiBtn.classList.add('active');
    modeHexBtn.classList.remove('active');
  });

  modeHexBtn.addEventListener('click', () => {
    currentViewMode = 'hex';
    modeHexBtn.classList.add('active');
    modeAsciiBtn.classList.remove('active');
  });

  // Download Log
  savelogBtn.addEventListener('click', () => {
    const textContent = Array.from(consoleOutput.children).map(c => c.textContent).join('\n');
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tfs_serial_log_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Send Actions
  sendBtn.addEventListener('click', () => sendData());
  inputBox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendData();
    } else if (e.key === 'ArrowUp') {
      // Command history up
      if (historyIndex > 0) {
        historyIndex--;
        inputBox.value = commandHistory[historyIndex] || '';
      }
    } else if (e.key === 'ArrowDown') {
      // Command history down
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        inputBox.value = commandHistory[historyIndex] || '';
      } else {
        historyIndex = commandHistory.length;
        inputBox.value = '';
      }
    }
  });

  // Quick Macros
  macroButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-send');
      if (cmd) sendData(cmd);
    });
  });

  // Hardware Signal Toggles
  dtrBtn.addEventListener('click', () => {
    dtrState = !dtrState;
    dtrBtn.classList.toggle('active', dtrState);
    dtrBtn.querySelector('.sig-status').textContent = dtrState ? 'ON' : 'OFF';
    setControlSignals();
  });

  rtsBtn.addEventListener('click', () => {
    rtsState = !rtsState;
    rtsBtn.classList.toggle('active', rtsState);
    rtsBtn.querySelector('.sig-status').textContent = rtsState ? 'ON' : 'OFF';
    setControlSignals();
  });

  espResetBtn.addEventListener('click', resetMCU);

  // Settings Modal Handlers
  configureBtn.addEventListener('click', () => {
    document.getElementById('modal-baudrate').value = serialConfig.baudRate;
    document.getElementById('modal-databits').value = serialConfig.dataBits;
    document.getElementById('modal-stopbits').value = serialConfig.stopBits;
    document.getElementById('modal-parity').value = serialConfig.parity;
    document.getElementById('modal-flowcontrol').value = serialConfig.flowControl;
    configModal.classList.add('open');
  });

  function closeConfigModal() {
    configModal.classList.remove('open');
  }

  closeConfig.addEventListener('click', closeConfigModal);
  cancelConfigBtn.addEventListener('click', closeConfigModal);

  configForm.addEventListener('submit', (e) => {
    e.preventDefault();
    serialConfig.baudRate = parseInt(document.getElementById('modal-baudrate').value, 10);
    serialConfig.dataBits = parseInt(document.getElementById('modal-databits').value, 10);
    serialConfig.stopBits = parseInt(document.getElementById('modal-stopbits').value, 10);
    serialConfig.parity = document.getElementById('modal-parity').value;
    serialConfig.flowControl = document.getElementById('modal-flowcontrol').value;

    quickBaudrate.value = serialConfig.baudRate;
    closeConfigModal();
    appendOutputLine(`Config updated: ${serialConfig.baudRate} bps, ${serialConfig.dataBits} bits, parity: ${serialConfig.parity}, flow: ${serialConfig.flowControl}`, 'sys');
  });
});
