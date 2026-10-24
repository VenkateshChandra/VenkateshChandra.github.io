/* ===================================================================
   TRENDS FOR SALE (TFS) - HOME PAGE INTERACTIVE SANDBOX
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const sandboxOutput = document.getElementById('sandbox-term-output');
  const sandboxInput = document.getElementById('sandbox-input');
  const sandboxSendBtn = document.getElementById('sandbox-send-btn');
  const macroChips = document.querySelectorAll('.macro-chip');

  function getTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;
  }

  function appendLine(text, type = 'rx') {
    if (!sandboxOutput) return;
    const line = document.createElement('div');
    line.className = `term-line ${type}`;
    line.textContent = `[${getTimestamp()}] ${text}`;
    sandboxOutput.appendChild(line);
    sandboxOutput.scrollTop = sandboxOutput.scrollHeight;
  }

  function processCommand(cmd) {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    appendLine(`[TX]: ${trimmed}`, 'tx');

    setTimeout(() => {
      const lower = trimmed.toLowerCase();
      if (lower === 'at+status?' || lower === 'status') {
        appendLine(`[RX]: +STATUS: READY, TEMP: 28.4C, VCC: 3.31V, HEAP: 248KB`, 'rx');
      } else if (lower === 'ping') {
        appendLine(`[RX]: PONG! (RTT = 1.2ms, SNR = 14dB)`, 'rx');
      } else if (lower === 'led_toggle' || lower === 'led_on') {
        appendLine(`[RX]: GPIO2 (USER_LED) state set to HIGH [OK]`, 'rx');
      } else if (lower === 'help') {
        appendLine(`[RX]: Supported Demo Commands: status, ping, led_toggle, reset, scan, help`, 'info');
      } else if (lower === 'reset') {
        appendLine(`[SYS]: Triggering soft reset...`, 'sys');
        setTimeout(() => {
          appendLine(`[RX]: ESP32-S3 ready! Booting firmware v4.4.2`, 'rx');
        }, 500);
      } else if (lower === 'scan') {
        appendLine(`[RX]: Scanning I2C Bus: Found device at 0x3C (OLED) and 0x68 (MPU6050)`, 'rx');
      } else {
        appendLine(`[RX]: +ECHO: "${trimmed}" (ACK)`, 'rx');
      }
    }, 250);
  }

  if (sandboxSendBtn && sandboxInput) {
    sandboxSendBtn.addEventListener('click', () => {
      processCommand(sandboxInput.value);
      sandboxInput.value = '';
    });

    sandboxInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        processCommand(sandboxInput.value);
        sandboxInput.value = '';
      }
    });
  }

  macroChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const cmd = chip.getAttribute('data-cmd');
      if (cmd) {
        processCommand(cmd);
      }
    });
  });
});