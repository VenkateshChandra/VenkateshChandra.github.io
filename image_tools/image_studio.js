/* ===================================================================
   TRENDS FOR SALE (TFS) - IMAGE & EMBEDDED ASSET STUDIO CONTROLLER
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------------------------------------------
  // 1. Tab Navigation
  // -----------------------------------------------------------------
  const tabs = document.querySelectorAll('.img-tab');
  const panes = document.querySelectorAll('.img-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.getElementById(`pane-${target}`)?.classList.add('active');
    });
  });

  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // -----------------------------------------------------------------
  // TAB 1: FORMAT TRANSCODER & RESIZER
  // -----------------------------------------------------------------
  const transDropzone = document.getElementById('trans-dropzone');
  const transFileInput = document.getElementById('trans-file-input');
  const transStudio = document.getElementById('trans-studio-wrap');
  const transPreviewImg = document.getElementById('trans-preview-img');
  const transFormatSelect = document.getElementById('trans-format');
  const transWidthInput = document.getElementById('trans-width');
  const transHeightInput = document.getElementById('trans-height');
  const transLockRatio = document.getElementById('trans-lock-ratio');
  const transQualitySlider = document.getElementById('trans-quality');
  const transQualityVal = document.getElementById('trans-quality-val');
  const transOrigMeta = document.getElementById('trans-orig-meta');
  const transNewMeta = document.getElementById('trans-new-meta');
  const transDownloadBtn = document.getElementById('trans-download-btn');

  let transLoadedImg = null;
  let transOrigWidth = 0;
  let transOrigHeight = 0;
  let transOrigSize = 0;
  let transFileName = 'image';
  let transAspectRatio = 1;

  if (transDropzone && transFileInput) {
    transDropzone.addEventListener('click', () => transFileInput.click());
    transDropzone.addEventListener('dragover', (e) => { e.preventDefault(); transDropzone.classList.add('dragover'); });
    transDropzone.addEventListener('dragleave', () => transDropzone.classList.remove('dragover'));
    transDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      transDropzone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadTransImage(e.dataTransfer.files[0]);
    });
    transFileInput.addEventListener('change', () => {
      if (transFileInput.files[0]) loadTransImage(transFileInput.files[0]);
    });
  }

  function loadTransImage(file) {
    if (!file.type.startsWith('image/')) return;
    transFileName = file.name.substring(0, file.name.lastIndexOf('.')) || 'image';
    transOrigSize = file.size;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        transLoadedImg = img;
        transOrigWidth = img.naturalWidth;
        transOrigHeight = img.naturalHeight;
        transAspectRatio = transOrigWidth / transOrigHeight;

        transWidthInput.value = transOrigWidth;
        transHeightInput.value = transOrigHeight;

        transOrigMeta.textContent = `Original: ${transOrigWidth}x${transOrigHeight} (${formatBytes(transOrigSize)})`;
        transStudio.style.display = 'grid';
        updateTransOutput();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Dimension ratio lock
  transWidthInput.addEventListener('input', () => {
    if (transLockRatio.checked && transAspectRatio > 0) {
      const w = parseInt(transWidthInput.value, 10);
      if (!isNaN(w) && w > 0) transHeightInput.value = Math.round(w / transAspectRatio);
    }
    updateTransOutput();
  });

  transHeightInput.addEventListener('input', () => {
    if (transLockRatio.checked && transAspectRatio > 0) {
      const h = parseInt(transHeightInput.value, 10);
      if (!isNaN(h) && h > 0) transWidthInput.value = Math.round(h * transAspectRatio);
    }
    updateTransOutput();
  });

  transQualitySlider.addEventListener('input', () => {
    transQualityVal.textContent = transQualitySlider.value + '%';
    updateTransOutput();
  });

  transFormatSelect.addEventListener('change', updateTransOutput);

  function updateTransOutput() {
    if (!transLoadedImg) return;
    const targetW = Math.max(1, parseInt(transWidthInput.value, 10) || transOrigWidth);
    const targetH = Math.max(1, parseInt(transHeightInput.value, 10) || transOrigHeight);
    const targetFormat = transFormatSelect.value;
    const quality = parseInt(transQualitySlider.value, 10) / 100;

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // Fill white background for JPEG
    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    }

    ctx.drawImage(transLoadedImg, 0, 0, targetW, targetH);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const previewUrl = URL.createObjectURL(blob);
      transPreviewImg.src = previewUrl;

      const sizeDiff = blob.size - transOrigSize;
      const pct = Math.round((blob.size / transOrigSize) * 100);
      transNewMeta.textContent = `New: ${targetW}x${targetH} &bull; ${formatBytes(blob.size)} (${pct}% of orig)`;

      transDownloadBtn.onclick = () => {
        const ext = targetFormat === 'image/png' ? 'png' : targetFormat === 'image/webp' ? 'webp' : 'jpg';
        triggerDownload(blob, `${transFileName}_optimized.${ext}`);
      };
    }, targetFormat, quality);
  }

  // -----------------------------------------------------------------
  // TAB 2: EMBEDDED C-ARRAY & BITMAP GENERATOR
  // -----------------------------------------------------------------
  const embedDropzone = document.getElementById('embed-dropzone');
  const embedFileInput = document.getElementById('embed-file-input');
  const embedStudio = document.getElementById('embed-studio-wrap');
  const embedCanvas = document.getElementById('embed-preview-canvas');
  const embedWidthInput = document.getElementById('embed-width');
  const embedHeightInput = document.getElementById('embed-height');
  const embedModeSelect = document.getElementById('embed-mode');
  const embedThresholdRow = document.getElementById('embed-threshold-row');
  const embedThresholdSlider = document.getElementById('embed-threshold');
  const embedThresholdVal = document.getElementById('embed-threshold-val');
  const embedInvertToggle = document.getElementById('embed-invert');
  const embedByteSwapToggle = document.getElementById('embed-byteswap');
  const embedByteSwapRow = document.getElementById('embed-byteswap-row');
  const embedCodeBox = document.getElementById('embed-code-box');
  const embedCopyBtn = document.getElementById('embed-copy-btn');
  const embedDownloadHBtn = document.getElementById('embed-download-h-btn');
  const embedPresetBtns = document.querySelectorAll('.embed-preset-btn');

  let embedLoadedImg = null;
  let embedOrigName = 'icon';

  if (embedDropzone && embedFileInput) {
    embedDropzone.addEventListener('click', () => embedFileInput.click());
    embedDropzone.addEventListener('dragover', (e) => { e.preventDefault(); embedDropzone.classList.add('dragover'); });
    embedDropzone.addEventListener('dragleave', () => embedDropzone.classList.remove('dragover'));
    embedDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      embedDropzone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadEmbedImage(e.dataTransfer.files[0]);
    });
    embedFileInput.addEventListener('change', () => {
      if (embedFileInput.files[0]) loadEmbedImage(embedFileInput.files[0]);
    });
  }

  function loadEmbedImage(file) {
    if (!file.type.startsWith('image/')) return;
    embedOrigName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9_]/g, '_') || 'icon';

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        embedLoadedImg = img;
        embedWidthInput.value = img.naturalWidth > 128 ? 128 : img.naturalWidth;
        embedHeightInput.value = img.naturalHeight > 64 ? 64 : img.naturalHeight;
        embedStudio.style.display = 'grid';
        processEmbeddedArray();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Quick Preset Buttons (128x64 OLED, 160x128 TFT, 240x240 Round)
  embedPresetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const w = parseInt(btn.getAttribute('data-w'), 10);
      const h = parseInt(btn.getAttribute('data-h'), 10);
      const mode = btn.getAttribute('data-mode');
      if (w && h) {
        embedWidthInput.value = w;
        embedHeightInput.value = h;
      }
      if (mode && embedModeSelect) {
        embedModeSelect.value = mode;
      }
      processEmbeddedArray();
    });
  });

  embedWidthInput.addEventListener('input', processEmbeddedArray);
  embedHeightInput.addEventListener('input', processEmbeddedArray);
  embedModeSelect.addEventListener('change', () => {
    const isMono = embedModeSelect.value === 'mono1';
    const isRgb = embedModeSelect.value === 'rgb565';
    if (embedThresholdRow) embedThresholdRow.style.display = isMono ? 'flex' : 'none';
    if (embedByteSwapRow) embedByteSwapRow.style.display = isRgb ? 'flex' : 'none';
    processEmbeddedArray();
  });

  embedThresholdSlider.addEventListener('input', () => {
    embedThresholdVal.textContent = embedThresholdSlider.value;
    processEmbeddedArray();
  });

  embedInvertToggle.addEventListener('change', processEmbeddedArray);
  embedByteSwapToggle.addEventListener('change', processEmbeddedArray);

  function processEmbeddedArray() {
    if (!embedLoadedImg) return;
    const w = Math.max(1, parseInt(embedWidthInput.value, 10) || 128);
    const h = Math.max(1, parseInt(embedHeightInput.value, 10) || 64);
    const mode = embedModeSelect.value;
    const threshold = parseInt(embedThresholdSlider.value, 10);
    const invert = embedInvertToggle.checked;
    const byteSwap = embedByteSwapToggle.checked;

    embedCanvas.width = w;
    embedCanvas.height = h;
    const ctx = embedCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(embedLoadedImg, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const pixels = imgData.data;

    let codeOutput = '';
    const arrayName = `${embedOrigName}_${w}x${h}`;

    if (mode === 'mono1') {
      // 1-Bit Monochrome (Horizontal Scan, 8 pixels per byte)
      const bytes = [];
      for (let y = 0; y < h; y++) {
        let currentByte = 0;
        let bitIndex = 0;
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const a = pixels[idx + 3];

          // Luminance
          let lum = (r * 0.299 + g * 0.587 + b * 0.114) * (a / 255);
          let isWhite = lum >= threshold;
          if (invert) isWhite = !isWhite;

          // Paint preview
          pixels[idx] = isWhite ? 255 : 0;
          pixels[idx + 1] = isWhite ? 255 : 0;
          pixels[idx + 2] = isWhite ? 255 : 0;
          pixels[idx + 3] = 255;

          if (isWhite) {
            currentByte |= (1 << (7 - bitIndex));
          }

          bitIndex++;
          if (bitIndex === 8 || x === w - 1) {
            bytes.push('0x' + currentByte.toString(16).padStart(2, '0').toUpperCase());
            currentByte = 0;
            bitIndex = 0;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);

      // Format code
      codeOutput = `// Generated by Trends For Sale (TFS) Embedded Asset Studio
// Dimensions: ${w} x ${h} pixels | Format: 1-Bit Monochrome Bitmap (Horizontal)
// Target: SSD1306, SH1106 OLED, e-Paper, Adafruit GFX

#ifndef ${arrayName.toUpperCase()}_H
#define ${arrayName.toUpperCase()}_H

#include <stdint.h>
#ifdef __AVR__
  #include <avr/pgmspace.h>
#else
  #define PROGMEM
#endif

#define ${arrayName.toUpperCase()}_WIDTH  ${w}
#define ${arrayName.toUpperCase()}_HEIGHT ${h}

static const uint8_t ${arrayName}[] PROGMEM = {\n`;

      for (let i = 0; i < bytes.length; i += 16) {
        codeOutput += '  ' + bytes.slice(i, i + 16).join(', ') + ',\n';
      }
      codeOutput += '};\n\n#endif // ' + arrayName.toUpperCase() + '_H\n';

    } else if (mode === 'rgb565') {
      // 16-Bit RGB565 TFT Format
      const words = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let r = pixels[idx];
          let g = pixels[idx + 1];
          let b = pixels[idx + 2];

          if (invert) {
            r = 255 - r;
            g = 255 - g;
            b = 255 - b;
          }

          // RGB565: 5 bits red, 6 bits green, 5 bits blue
          let r5 = (r >> 3) & 0x1F;
          let g6 = (g >> 2) & 0x3F;
          let b5 = (b >> 3) & 0x1F;
          let rgb565 = (r5 << 11) | (g6 << 5) | b5;

          if (byteSwap) {
            rgb565 = ((rgb565 & 0xFF) << 8) | ((rgb565 >> 8) & 0xFF);
          }

          words.push('0x' + rgb565.toString(16).padStart(4, '0').toUpperCase());

          // Paint preview back to canvas
          pixels[idx] = (r5 * 255) / 31;
          pixels[idx + 1] = (g6 * 255) / 63;
          pixels[idx + 2] = (b5 * 255) / 31;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      codeOutput = `// Generated by Trends For Sale (TFS) Embedded Asset Studio
// Dimensions: ${w} x ${h} pixels | Format: 16-bit RGB565 Color
// Target: ST7789, ILI9341, ST7735 TFT Displays (TFT_eSPI, Adafruit_GFX)

#ifndef ${arrayName.toUpperCase()}_H
#define ${arrayName.toUpperCase()}_H

#include <stdint.h>

#define ${arrayName.toUpperCase()}_WIDTH  ${w}
#define ${arrayName.toUpperCase()}_HEIGHT ${h}

static const uint16_t ${arrayName}[] = {\n`;

      for (let i = 0; i < words.length; i += 8) {
        codeOutput += '  ' + words.slice(i, i + 8).join(', ') + ',\n';
      }
      codeOutput += '};\n\n#endif // ' + arrayName.toUpperCase() + '_H\n';

    } else if (mode === 'gray8') {
      // 8-bit Grayscale
      const bytes = [];
      for (let i = 0; i < pixels.length; i += 4) {
        let lum = Math.round(pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
        if (invert) lum = 255 - lum;
        pixels[i] = lum;
        pixels[i + 1] = lum;
        pixels[i + 2] = lum;
        bytes.push('0x' + lum.toString(16).padStart(2, '0').toUpperCase());
      }
      ctx.putImageData(imgData, 0, 0);

      codeOutput = `// Generated by Trends For Sale (TFS) Embedded Asset Studio
// Dimensions: ${w} x ${h} pixels | Format: 8-Bit Grayscale

#ifndef ${arrayName.toUpperCase()}_H
#define ${arrayName.toUpperCase()}_H

#include <stdint.h>

#define ${arrayName.toUpperCase()}_WIDTH  ${w}
#define ${arrayName.toUpperCase()}_HEIGHT ${h}

static const uint8_t ${arrayName}[] = {\n`;

      for (let i = 0; i < bytes.length; i += 16) {
        codeOutput += '  ' + bytes.slice(i, i + 16).join(', ') + ',\n';
      }
      codeOutput += '};\n\n#endif // ' + arrayName.toUpperCase() + '_H\n';
    }

    embedCodeBox.textContent = codeOutput;

    // Copy C Array
    embedCopyBtn.onclick = () => {
      navigator.clipboard.writeText(codeOutput).then(() => {
        embedCopyBtn.textContent = '✓ Copied!';
        setTimeout(() => { embedCopyBtn.textContent = 'Copy C Array'; }, 1600);
      });
    };

    // Download .h header file
    embedDownloadHBtn.onclick = () => {
      const blob = new Blob([codeOutput], { type: 'text/x-c' });
      triggerDownload(blob, `${arrayName}.h`);
    };
  }
});
