const connectBtn = document.getElementById('connect-btn');
const sendBtn = document.getElementById('send-btn');
const inputBox = document.getElementById('input-box');
const output = document.getElementById('output');
const autoscrollBtn = document.getElementById('autoscroll-btn');
const configureBtn = document.getElementById('configure-btn');
const configModal = document.getElementById('config-modal');
const closeConfig = document.getElementById('close-config');
const configForm = document.getElementById('config-form');
const outputElem = output;

let textEncoder;
let writableStreamClosed;
let writer;
let port = null;
let availablePorts = [];
let selectedPort = null;
let autoScroll = true; // <-- Add this line
let reader = null;

let serialConfig = {
  baudRate: 9600,
  parity: 'none',
  portIndex: 0
};

function getTimestamp() {
  const now = new Date();
  const time = now.getHours().toString().padStart(2, '0') + ':' +
    now.getMinutes().toString().padStart(2, '0') + ':' +
    now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  const us = Math.floor(performance.now() % 1 * 1000).toString().padStart(3, '0');
  return `${time}.${ms}${us}`;
}

async function closePortIfOpen() {
  if (port && port.readable) {
    try {
      if (reader) {
        try {
          await reader.cancel(); // Cancel any pending read
        } catch (e) {}
        if (reader) { // Only release if not already released
          reader.releaseLock();
          reader = null;
        }
      }
      await port.close();
      output.textContent += `[${getTimestamp()}] Serial port closed\n`;
    } catch (e) {
      output.textContent += `[${getTimestamp()}] Error closing port: ${e}\n`;
    }
  }
}

async function listSerialPorts() {
  const portSelect = document.getElementById('port-number');
  portSelect.innerHTML = '';
  availablePorts = await navigator.serial.getPorts();

  if (availablePorts.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No ports found';
    portSelect.appendChild(opt);
    selectedPort = null;
    return;
  }

  availablePorts.forEach((p, idx) => {
    const info = p.getInfo();
    let label = `Port ${idx + 1}`;
    if (info.usbVendorId && info.usbProductId) {
      label += ` (VID: ${info.usbVendorId.toString(16)}, PID: ${info.usbProductId.toString(16)})`;
    }
    const opt = document.createElement('option');
    opt.value = idx;
    opt.textContent = label;
    portSelect.appendChild(opt);
  });

  // Restore previous selection if possible
  if (serialConfig.portIndex !== undefined && availablePorts[serialConfig.portIndex]) {
    portSelect.value = serialConfig.portIndex;
    selectedPort = availablePorts[serialConfig.portIndex];
  } else {
    portSelect.selectedIndex = 0;
    selectedPort = availablePorts[0];
    serialConfig.portIndex = 0;
  }
}

document.getElementById('port-number').addEventListener('change', function () {
  const idx = parseInt(this.value, 10);
  selectedPort = availablePorts[idx] || null;
  serialConfig.portIndex = idx;
});

configureBtn.addEventListener('click', async () => {
  await listSerialPorts();
  configModal.style.display = 'block';
  document.getElementById('baudrate').value = serialConfig.baudRate;
  document.getElementById('parity').value = serialConfig.parity;
  document.getElementById('port-number').value = serialConfig.portIndex;
});

closeConfig.addEventListener('click', () => {
  configModal.style.display = 'none';
});

window.onclick = function (event) {
  if (event.target == configModal) {
    configModal.style.display = 'none';
  }
};

const portSelectBtn = document.getElementById('port-select-btn');
const selectedPortInfo = document.getElementById('selected-port-info');

portSelectBtn.addEventListener('click', async () => {
  try {
    // Show the browser's serial port picker
    const port = await navigator.serial.requestPort();
    selectedPort = port;
    const info = port.getInfo();
    let label = '';
    if (info.usbVendorId && info.usbProductId) {
      label = `VID: ${info.usbVendorId.toString(16).toUpperCase()}, PID: ${info.usbProductId.toString(16).toUpperCase()}`;
    } else {
      label = 'Serial port selected';
    }
    selectedPortInfo.textContent = label;
  } catch (err) {
    selectedPortInfo.textContent = 'No port selected';
    selectedPort = null;
  }
});

configForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  serialConfig.baudRate = parseInt(document.getElementById('baudrate').value, 10);
  serialConfig.parity = document.getElementById('parity').value;
  configModal.style.display = 'none';
  await closePortIfOpen();
  port = null;
});

connectBtn.addEventListener('click', async function () {
  if (!selectedPort) {
    alert('Please select a COM port in the Configure popup first.');
    return;
  }
  if (!port) {
    port = selectedPort;
    try {
      if (!port.readable && !port.writable) {
        await port.open({
          baudRate: serialConfig.baudRate,
          parity: serialConfig.parity,
          dataBits: 8,
          stopBits: 1,
          flowControl: 'none'
        });
      }
      output.textContent += `[${getTimestamp()}] Serial port connected!\n`;
      textEncoder = new TextEncoderStream();
      writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
      writer = textEncoder.writable.getWriter();
      receive();
      connectBtn.textContent = 'Disconnect';
    } catch (error) {
      output.textContent += `[${getTimestamp()}] Error: ${error}\n`;
    }
  } else {
    await closePortIfOpen();
    port = null;
    connectBtn.textContent = 'Connect';
  }
});

sendBtn.addEventListener('click', send);

async function send() {
  try {
    const data = inputBox.value;
    if (port && port.writable) {
      await writer.write(data);
      output.textContent += `[${getTimestamp()}] [TX]: ${data}\n`;
    } else {
      output.textContent += `[${getTimestamp()}] Error: Serial port is not open or writable\n`;
    }
  } catch (error) {
    output.textContent += `[${getTimestamp()}] Error: ${error}\n`;
  }
}

autoscrollBtn.addEventListener('click', function () {
  autoScroll = !autoScroll;
  autoscrollBtn.classList.toggle('active', autoScroll);
  autoscrollBtn.classList.toggle('inactive', !autoScroll);
  autoscrollBtn.textContent = autoScroll ? 'Auto-Scroll' : 'Manual Scroll';
  if (autoScroll) {
    outputElem.scrollTop = outputElem.scrollHeight;
  }
});

outputElem.addEventListener('scroll', function () {
  if (autoScroll && (outputElem.scrollTop + outputElem.clientHeight < outputElem.scrollHeight - 5)) {
    autoScroll = false;
    autoscrollBtn.classList.remove('active');
    autoscrollBtn.classList.add('inactive');
    autoscrollBtn.textContent = 'Manual Scroll';
  }
});

async function receive() {
  try {
    reader = port.readable.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        output.textContent += `[${getTimestamp()}] Serial port closed\n`;
        reader.releaseLock();
        reader = null;
        break;
      }
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          output.textContent += `[${getTimestamp()}] [RX]: ${line}\n`;
        }
        if (autoScroll) {
          output.scrollTop = output.scrollHeight;
        }
      }
    }
  } catch (error) {
    output.textContent += `[${getTimestamp()}] Error: ${error}\n`;
    if (autoScroll) {
      output.scrollTop = output.scrollHeight;
    }
  }
}

document.getElementById('clear-btn').addEventListener('click', function () {
  document.getElementById('output').textContent = '';
});
