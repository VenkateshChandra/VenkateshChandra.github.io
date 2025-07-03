const connectBtn = document.getElementById('connect-btn');
const sendBtn = document.getElementById('send-btn');
const inputBox = document.getElementById('input-box');
const output = document.getElementById('output');
const autoscrollBtn = document.getElementById('autoscroll-btn');
const configureBtn = document.getElementById('configure-btn');
const configModal = document.getElementById('config-modal');
const closeConfig = document.getElementById('close-config');
const configForm = document.getElementById('config-form');
const outputElem = document.getElementById('output');
const outputScrollContainer = document.querySelector('.output-console-content'); // Add this

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
        if (reader) {
          reader.releaseLock();
          reader = null;
        }
      }
      // Only now close the port
      await port.close();
      appendOutputLine(`[${getTimestamp()}] Serial port closed`);
    } catch (e) {
      console.log(`[${getTimestamp()}] Error closing port: ${e}`);
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
      appendOutputLine(`[${getTimestamp()}] [Info]: Serial port connected!`);
      textEncoder = new TextEncoderStream();
      writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
      writer = textEncoder.writable.getWriter();
      receive();
      connectBtn.textContent = 'Disconnect';
    } catch (error) {
      appendOutputLine(`[${getTimestamp()}] Error: ${error}`);
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
      appendOutputLine(`[${getTimestamp()}] [TX]: ${data}`);
    } else {
      appendOutputLine(`[${getTimestamp()}] Error: Serial port is not open or writable`);
    }
  } catch (error) {
    output.textContent += `[${getTimestamp()}] Error: ${error}\n`;
  }
}

autoscrollBtn.addEventListener('click', function () {
  autoScroll = !autoScroll;
  autoscrollBtn.classList.toggle('active', autoScroll);
  autoscrollBtn.classList.toggle('inactive', !autoScroll);
  autoscrollBtn.textContent = autoScroll ? 'Manual Scroll' : 'Auto Scroll';
  if (autoScroll) {
    scrollOutputToBottom();
  }
});

outputElem.addEventListener('scroll', function () {
  if (autoScroll && (outputElem.scrollTop + outputElem.clientHeight < outputElem.scrollHeight - 5)) {
    autoScroll = false;
    autoscrollBtn.classList.remove('active');
    autoscrollBtn.classList.add('inactive');
    autoscrollBtn.textContent = 'Auto Scroll';
  }
});

outputScrollContainer.addEventListener('scroll', function () {
  if (
    autoScroll &&
    (outputScrollContainer.scrollTop + outputScrollContainer.clientHeight < outputScrollContainer.scrollHeight - 5)
  ) {
    autoScroll = false;
    autoscrollBtn.classList.remove('active');
    autoscrollBtn.classList.add('inactive');
    autoscrollBtn.textContent = 'Auto Scroll';
  }
});

function scrollOutputToBottom() {
  if (outputScrollContainer) {
    outputScrollContainer.scrollTop = outputScrollContainer.scrollHeight;
  } else {
    outputElem.scrollTop = outputElem.scrollHeight;
  }
}

async function receive() {
  try {
    reader = port.readable.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        closePortIfOpen(); 
        reader = null;
        break;
      }
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          appendOutputLine(`[${getTimestamp()}] [RX]: ${line}`);
        }
        if (autoScroll) {
          scrollOutputToBottom();
        }
      }
    }
  } catch (error) {
    output.textContent += `[${getTimestamp()}] Error: ${error}\n`;
    if (autoScroll) {
      scrollOutputToBottom();
    }
  }
}

document.getElementById('clear-btn').addEventListener('click', function () {
  document.getElementById('output').innerHTML = '';
});

// Hamburger and side nav logic
const hamburgerMenu = document.getElementById('hamburger-menu');
const sideNav = document.getElementById('side-nav');
const closeSideNav = document.getElementById('close-side-nav');

hamburgerMenu.addEventListener('click', function () {
  hamburgerMenu.classList.toggle('active');
  if (sideNav.style.width === '260px') {
    sideNav.style.width = '0';
  } else {
    sideNav.style.width = '260px';
  }
});
closeSideNav.addEventListener('click', function () {
  sideNav.style.width = '0';
  hamburgerMenu.classList.remove('active');
});
// Optional: close side nav when clicking outside
window.addEventListener('click', function (e) {
  if (
    sideNav.style.width === '260px' &&
    !sideNav.contains(e.target) &&
    e.target !== hamburgerMenu &&
    !hamburgerMenu.contains(e.target)
  ) {
    sideNav.style.width = '0';
    hamburgerMenu.classList.remove('active');
  }
});

// User profile slider logic
document.getElementById('user-profile-icon').addEventListener('click', function () {
  document.getElementById('profile-nav').style.width = '240px';
});
document.getElementById('close-profile-nav').addEventListener('click', function () {
  document.getElementById('profile-nav').style.width = '0';
});
window.addEventListener('click', function (e) {
  const nav = document.getElementById('profile-nav');
  if (nav.style.width === '240px' && !nav.contains(e.target) && e.target.id !== 'user-profile-icon') {
    nav.style.width = '0';
  }
});

window.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('.ser_term_header');
  if (header) {
    const headerHeight = header.offsetHeight + 'px';
    document.documentElement.style.setProperty('--header-height', headerHeight);
  }
});

const themeToggle = document.getElementById('theme-toggle');
const themeToggleIcon = document.getElementById('theme-toggle-icon');

function setTheme(mode) {
  if (mode === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggleIcon.src = '../common_artifacts/logo/sun_icon.png'; // Sun icon for dark mode
    themeToggleIcon.alt = 'Switch to Light Mode';
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark-mode');
    themeToggleIcon.src = '../common_artifacts/logo/moon_icon.png'; // Moon icon for light mode
    themeToggleIcon.alt = 'Switch to Dark Mode';
    localStorage.setItem('theme', 'light');
  }
}

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  setTheme(isDark ? 'dark' : 'light');
});

themeToggle.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    themeToggle.click();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  setTheme(savedTheme === 'dark' ? 'dark' : 'light');
});

document.getElementById('savelog-btn').addEventListener('click', function () {
  const text = document.getElementById('output').textContent;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'serial_output_log.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Instead of output.textContent += line + '\n';
function appendOutputLine(line) {
  const lineDiv = document.createElement('div');
  lineDiv.className = 'output-line';
  lineDiv.textContent = line;
  document.getElementById('output').appendChild(lineDiv);
}
