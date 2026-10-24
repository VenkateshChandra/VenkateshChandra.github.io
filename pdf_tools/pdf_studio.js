/* ===================================================================
   TRENDS FOR SALE (TFS) - PDF STUDIO CONTROLLER (100% Client-Side)
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Set up PDF.js worker
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../common_js/libs/pdf.worker.min.js';
  }

  // -----------------------------------------------------------------
  // 1. Tab Navigation
  // -----------------------------------------------------------------
  const tabs = document.querySelectorAll('.pdf-tab');
  const panes = document.querySelectorAll('.pdf-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.getElementById(`pane-${target}`)?.classList.add('active');
    });
  });

  // -----------------------------------------------------------------
  // Helper: Processing Overlay
  // -----------------------------------------------------------------
  const overlay = document.getElementById('processing-overlay');
  const overlayText = document.getElementById('processing-text');

  function showProcessing(text = 'Processing PDF in browser...') {
    if (overlayText) overlayText.textContent = text;
    if (overlay) overlay.classList.add('show');
  }

  function hideProcessing() {
    if (overlay) overlay.classList.remove('show');
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

  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // -----------------------------------------------------------------
  // TAB 1: MERGE PDFS
  // -----------------------------------------------------------------
  const mergeDropzone = document.getElementById('merge-dropzone');
  const mergeFileInput = document.getElementById('merge-file-input');
  const mergeFileList = document.getElementById('merge-file-list');
  const mergeBtn = document.getElementById('merge-action-btn');
  const mergeClearBtn = document.getElementById('merge-clear-btn');

  let mergeFiles = []; // Array of { file, name, size, pageCount, bytes }

  if (mergeDropzone && mergeFileInput) {
    mergeDropzone.addEventListener('click', () => mergeFileInput.click());

    mergeDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      mergeDropzone.classList.add('dragover');
    });

    mergeDropzone.addEventListener('dragleave', () => mergeDropzone.classList.remove('dragover'));

    mergeDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      mergeDropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) handleMergeFiles(e.dataTransfer.files);
    });

    mergeFileInput.addEventListener('change', () => {
      if (mergeFileInput.files.length) handleMergeFiles(mergeFileInput.files);
    });
  }

  async function handleMergeFiles(fileList) {
    showProcessing('Loading PDF files...');
    for (const file of Array.from(fileList)) {
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) continue;
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        mergeFiles.push({
          file,
          name: file.name,
          size: file.size,
          pageCount: pdfDoc.getPageCount(),
          bytes: arrayBuffer
        });
      } catch (err) {
        console.error('Error reading PDF:', err);
      }
    }
    hideProcessing();
    renderMergeList();
  }

  function renderMergeList() {
    if (!mergeFileList) return;
    mergeFileList.innerHTML = '';

    if (mergeFiles.length === 0) {
      mergeFileList.innerHTML = '<p class="text-muted" style="text-align: center; padding: 20px;">No PDFs added yet. Drop files above to begin.</p>';
      if (mergeBtn) mergeBtn.disabled = true;
      return;
    }

    if (mergeBtn) mergeBtn.disabled = false;

    mergeFiles.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'file-row';
      row.innerHTML = `
        <div class="file-info">
          <span class="file-icon">📄</span>
          <div>
            <div class="file-name">${item.name}</div>
            <div class="file-meta">${item.pageCount} pages &bull; ${formatBytes(item.size)}</div>
          </div>
        </div>
        <div class="file-actions">
          <button class="action-btn-sm move-up-btn" data-index="${index}" title="Move Up" ${index === 0 ? 'disabled' : ''}>▲</button>
          <button class="action-btn-sm move-down-btn" data-index="${index}" title="Move Down" ${index === mergeFiles.length - 1 ? 'disabled' : ''}>▼</button>
          <button class="action-btn-sm danger remove-btn" data-index="${index}" title="Remove">&times;</button>
        </div>
      `;
      mergeFileList.appendChild(row);
    });

    // Reorder & Remove handlers
    mergeFileList.querySelectorAll('.move-up-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (idx > 0) {
          const temp = mergeFiles[idx];
          mergeFiles[idx] = mergeFiles[idx - 1];
          mergeFiles[idx - 1] = temp;
          renderMergeList();
        }
      });
    });

    mergeFileList.querySelectorAll('.move-down-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (idx < mergeFiles.length - 1) {
          const temp = mergeFiles[idx];
          mergeFiles[idx] = mergeFiles[idx + 1];
          mergeFiles[idx + 1] = temp;
          renderMergeList();
        }
      });
    });

    mergeFileList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        mergeFiles.splice(idx, 1);
        renderMergeList();
      });
    });
  }

  if (mergeClearBtn) {
    mergeClearBtn.addEventListener('click', () => {
      mergeFiles = [];
      renderMergeList();
    });
  }

  if (mergeBtn) {
    mergeBtn.addEventListener('click', async () => {
      if (mergeFiles.length === 0) return;
      showProcessing('Merging documents locally in memory...');
      try {
        const mergedPdf = await PDFLib.PDFDocument.create();
        for (const item of mergeFiles) {
          const donorPdf = await PDFLib.PDFDocument.load(item.bytes);
          const pageIndices = donorPdf.getPageIndices();
          const copiedPages = await mergedPdf.copyPages(donorPdf, pageIndices);
          copiedPages.forEach(page => mergedPdf.addPage(page));
        }
        const mergedBytes = await mergedPdf.save();
        const blob = new Blob([mergedBytes], { type: 'application/pdf' });
        triggerDownload(blob, `TFS_Merged_${Date.now()}.pdf`);
      } catch (err) {
        alert('Failed to merge PDFs: ' + err.message);
      } finally {
        hideProcessing();
      }
    });
  }

  // -----------------------------------------------------------------
  // TAB 2: SPLIT & EXTRACT PAGES
  // -----------------------------------------------------------------
  const splitDropzone = document.getElementById('split-dropzone');
  const splitFileInput = document.getElementById('split-file-input');
  const splitGrid = document.getElementById('split-pages-grid');
  const splitSelectAll = document.getElementById('split-select-all');
  const splitDeselectAll = document.getElementById('split-deselect-all');
  const splitRangeInput = document.getElementById('split-range-input');
  const splitApplyRange = document.getElementById('split-apply-range');
  const extractSelectedBtn = document.getElementById('extract-selected-btn');
  const splitToolbar = document.getElementById('split-toolbar');

  let splitPdfBytes = null;
  let splitTotalPages = 0;
  let splitSelectedPages = new Set(); // 1-based page numbers

  if (splitDropzone && splitFileInput) {
    splitDropzone.addEventListener('click', () => splitFileInput.click());
    splitDropzone.addEventListener('dragover', (e) => { e.preventDefault(); splitDropzone.classList.add('dragover'); });
    splitDropzone.addEventListener('dragleave', () => splitDropzone.classList.remove('dragover'));
    splitDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      splitDropzone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadSplitPdf(e.dataTransfer.files[0]);
    });
    splitFileInput.addEventListener('change', () => {
      if (splitFileInput.files[0]) loadSplitPdf(splitFileInput.files[0]);
    });
  }

  async function loadSplitPdf(file) {
    showProcessing('Rendering page thumbnails...');
    try {
      splitPdfBytes = await file.arrayBuffer();
      const pdfJsDoc = await pdfjsLib.getDocument({ data: splitPdfBytes }).promise;
      splitTotalPages = pdfJsDoc.numPages;
      splitSelectedPages.clear();

      splitGrid.innerHTML = '';
      if (splitToolbar) splitToolbar.style.display = 'flex';

      for (let pageNum = 1; pageNum <= splitTotalPages; pageNum++) {
        const page = await pdfJsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 0.35 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const card = document.createElement('div');
        card.className = 'page-card';
        card.setAttribute('data-page', pageNum);
        card.innerHTML = `
          <div class="page-thumb-wrap"></div>
          <div class="page-card-footer">
            <span class="page-num">Page ${pageNum}</span>
            <input type="checkbox" class="page-select-checkbox" data-page="${pageNum}">
          </div>
        `;
        card.querySelector('.page-thumb-wrap').appendChild(canvas);

        card.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            const cb = card.querySelector('.page-select-checkbox');
            cb.checked = !cb.checked;
          }
          toggleSplitPage(pageNum, card.querySelector('.page-select-checkbox').checked, card);
        });

        splitGrid.appendChild(card);
      }
    } catch (err) {
      alert('Failed to load PDF: ' + err.message);
    } finally {
      hideProcessing();
    }
  }

  function toggleSplitPage(pageNum, isSelected, cardEl) {
    if (isSelected) {
      splitSelectedPages.add(pageNum);
      cardEl.classList.add('selected');
    } else {
      splitSelectedPages.delete(pageNum);
      cardEl.classList.remove('selected');
    }
    if (extractSelectedBtn) {
      extractSelectedBtn.disabled = splitSelectedPages.size === 0;
      extractSelectedBtn.textContent = `Extract ${splitSelectedPages.size} Page(s) &rarr;`;
    }
  }

  if (splitSelectAll) {
    splitSelectAll.addEventListener('click', () => {
      splitGrid.querySelectorAll('.page-card').forEach(card => {
        const num = parseInt(card.getAttribute('data-page'), 10);
        card.querySelector('.page-select-checkbox').checked = true;
        toggleSplitPage(num, true, card);
      });
    });
  }

  if (splitDeselectAll) {
    splitDeselectAll.addEventListener('click', () => {
      splitGrid.querySelectorAll('.page-card').forEach(card => {
        const num = parseInt(card.getAttribute('data-page'), 10);
        card.querySelector('.page-select-checkbox').checked = false;
        toggleSplitPage(num, false, card);
      });
    });
  }

  if (splitApplyRange && splitRangeInput) {
    splitApplyRange.addEventListener('click', () => {
      const text = splitRangeInput.value.trim();
      if (!text) return;

      // Deselect all first
      splitDeselectAll.click();

      // Parse ranges e.g. "1-3, 5, 8-10"
      const parts = text.split(',');
      parts.forEach(p => {
        const clean = p.trim();
        if (clean.includes('-')) {
          const [start, end] = clean.split('-').map(n => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
              const card = splitGrid.querySelector(`.page-card[data-page="${i}"]`);
              if (card) {
                card.querySelector('.page-select-checkbox').checked = true;
                toggleSplitPage(i, true, card);
              }
            }
          }
        } else {
          const single = parseInt(clean, 10);
          const card = splitGrid.querySelector(`.page-card[data-page="${single}"]`);
          if (card) {
            card.querySelector('.page-select-checkbox').checked = true;
            toggleSplitPage(single, true, card);
          }
        }
      });
    });
  }

  if (extractSelectedBtn) {
    extractSelectedBtn.addEventListener('click', async () => {
      if (!splitPdfBytes || splitSelectedPages.size === 0) return;
      showProcessing('Extracting selected pages...');
      try {
        const srcDoc = await PDFLib.PDFDocument.load(splitPdfBytes);
        const outDoc = await PDFLib.PDFDocument.create();

        // Sort selected pages in order
        const sortedPages = Array.from(splitSelectedPages).sort((a, b) => a - b);
        const zeroBasedIndices = sortedPages.map(p => p - 1);

        const copiedPages = await outDoc.copyPages(srcDoc, zeroBasedIndices);
        copiedPages.forEach(p => outDoc.addPage(p));

        const outBytes = await outDoc.save();
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        triggerDownload(blob, `TFS_Extracted_Pages_${Date.now()}.pdf`);
      } catch (err) {
        alert('Extraction failed: ' + err.message);
      } finally {
        hideProcessing();
      }
    });
  }

  // -----------------------------------------------------------------
  // TAB 3: ROTATE & REORGANIZE
  // -----------------------------------------------------------------
  const rotateDropzone = document.getElementById('rotate-dropzone');
  const rotateFileInput = document.getElementById('rotate-file-input');
  const rotateGrid = document.getElementById('rotate-pages-grid');
  const rotateAll90Btn = document.getElementById('rotate-all-90-btn');
  const rotateDownloadBtn = document.getElementById('rotate-download-btn');
  const rotateToolbar = document.getElementById('rotate-toolbar');

  let rotatePdfBytes = null;
  let pageStates = []; // Array of { originalIndex (0-based), rotation: 0|90|180|270, deleted: bool }

  if (rotateDropzone && rotateFileInput) {
    rotateDropzone.addEventListener('click', () => rotateFileInput.click());
    rotateDropzone.addEventListener('dragover', (e) => { e.preventDefault(); rotateDropzone.classList.add('dragover'); });
    rotateDropzone.addEventListener('dragleave', () => rotateDropzone.classList.remove('dragover'));
    rotateDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      rotateDropzone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadRotatePdf(e.dataTransfer.files[0]);
    });
    rotateFileInput.addEventListener('change', () => {
      if (rotateFileInput.files[0]) loadRotatePdf(rotateFileInput.files[0]);
    });
  }

  async function loadRotatePdf(file) {
    showProcessing('Loading pages for rotation...');
    try {
      rotatePdfBytes = await file.arrayBuffer();
      const pdfJsDoc = await pdfjsLib.getDocument({ data: rotatePdfBytes }).promise;
      const count = pdfJsDoc.numPages;

      pageStates = [];
      rotateGrid.innerHTML = '';
      if (rotateToolbar) rotateToolbar.style.display = 'flex';

      for (let i = 1; i <= count; i++) {
        pageStates.push({ originalIndex: i - 1, rotation: 0, deleted: false });

        const page = await pdfJsDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.35 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const card = document.createElement('div');
        card.className = 'page-card';
        card.setAttribute('data-idx', i - 1);
        card.innerHTML = `
          <div class="page-thumb-wrap"></div>
          <div class="page-card-footer">
            <span class="page-num">Page ${i}</span>
            <div class="page-btn-row">
              <button class="page-btn rot-btn" title="Rotate 90° Clockwise">↻</button>
              <button class="page-btn danger del-btn" title="Delete Page">&times;</button>
            </div>
          </div>
        `;
        card.querySelector('.page-thumb-wrap').appendChild(canvas);

        // Rotate individual page
        card.querySelector('.rot-btn').addEventListener('click', () => {
          const state = pageStates[i - 1];
          state.rotation = (state.rotation + 90) % 360;
          canvas.style.transform = `rotate(${state.rotation}deg)`;
        });

        // Delete individual page
        card.querySelector('.del-btn').addEventListener('click', () => {
          pageStates[i - 1].deleted = true;
          card.style.opacity = '0.25';
          card.style.pointerEvents = 'none';
        });

        rotateGrid.appendChild(card);
      }
    } catch (err) {
      alert('Failed to load PDF for rotation: ' + err.message);
    } finally {
      hideProcessing();
    }
  }

  if (rotateAll90Btn) {
    rotateAll90Btn.addEventListener('click', () => {
      pageStates.forEach((state, idx) => {
        if (!state.deleted) {
          state.rotation = (state.rotation + 90) % 360;
          const card = rotateGrid.querySelector(`.page-card[data-idx="${idx}"]`);
          const canvas = card?.querySelector('canvas');
          if (canvas) canvas.style.transform = `rotate(${state.rotation}deg)`;
        }
      });
    });
  }

  if (rotateDownloadBtn) {
    rotateDownloadBtn.addEventListener('click', async () => {
      if (!rotatePdfBytes) return;
      showProcessing('Applying rotations and exporting PDF...');
      try {
        const srcDoc = await PDFLib.PDFDocument.load(rotatePdfBytes);
        const outDoc = await PDFLib.PDFDocument.create();

        for (let i = 0; i < pageStates.length; i++) {
          const state = pageStates[i];
          if (state.deleted) continue;

          const [copiedPage] = await outDoc.copyPages(srcDoc, [state.originalIndex]);
          const currentRot = copiedPage.getRotation().angle;
          copiedPage.setRotation(PDFLib.degrees(currentRot + state.rotation));
          outDoc.addPage(copiedPage);
        }

        const outBytes = await outDoc.save();
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        triggerDownload(blob, `TFS_Rotated_${Date.now()}.pdf`);
      } catch (err) {
        alert('Rotation export failed: ' + err.message);
      } finally {
        hideProcessing();
      }
    });
  }

  // -----------------------------------------------------------------
  // TAB 4: WATERMARK & STAMP
  // -----------------------------------------------------------------
  const wmDropzone = document.getElementById('wm-dropzone');
  const wmFileInput = document.getElementById('wm-file-input');
  const wmText = document.getElementById('wm-text');
  const wmSize = document.getElementById('wm-size');
  const wmOpacity = document.getElementById('wm-opacity');
  const wmColor = document.getElementById('wm-color');
  const wmApplyBtn = document.getElementById('wm-apply-btn');

  let wmPdfBytes = null;

  if (wmDropzone && wmFileInput) {
    wmDropzone.addEventListener('click', () => wmFileInput.click());
    wmDropzone.addEventListener('dragover', (e) => { e.preventDefault(); wmDropzone.classList.add('dragover'); });
    wmDropzone.addEventListener('dragleave', () => wmDropzone.classList.remove('dragover'));
    wmDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      wmDropzone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) loadWmPdf(e.dataTransfer.files[0]);
    });
    wmFileInput.addEventListener('change', () => {
      if (wmFileInput.files[0]) loadWmPdf(wmFileInput.files[0]);
    });
  }

  async function loadWmPdf(file) {
    showProcessing('Loading PDF for watermarking...');
    try {
      wmPdfBytes = await file.arrayBuffer();
      wmDropzone.querySelector('.dropzone-title').textContent = `Loaded: ${file.name}`;
      if (wmApplyBtn) wmApplyBtn.disabled = false;
    } catch (err) {
      alert('Failed to load PDF: ' + err.message);
    } finally {
      hideProcessing();
    }
  }

  if (wmApplyBtn) {
    wmApplyBtn.addEventListener('click', async () => {
      if (!wmPdfBytes) return;
      const text = wmText.value.trim() || 'CONFIDENTIAL';
      const size = parseInt(wmSize.value, 10) || 48;
      const opacity = parseFloat(wmOpacity.value) || 0.25;

      // Hex to RGB
      const hex = wmColor.value;
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      showProcessing('Stamping watermark across all pages...');
      try {
        const pdfDoc = await PDFLib.PDFDocument.load(wmPdfBytes);
        const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
        const pages = pdfDoc.getPages();

        pages.forEach(page => {
          const { width, height } = page.getSize();
          const textWidth = helveticaFont.widthOfTextAtSize(text, size);
          const textHeight = helveticaFont.heightAtSize(size);

          page.drawText(text, {
            x: width / 2 - textWidth / 2,
            y: height / 2 - textHeight / 2,
            size,
            font: helveticaFont,
            color: PDFLib.rgb(r, g, b),
            opacity,
            rotate: PDFLib.degrees(45)
          });
        });

        const outBytes = await pdfDoc.save();
        const blob = new Blob([outBytes], { type: 'application/pdf' });
        triggerDownload(blob, `TFS_Watermarked_${Date.now()}.pdf`);
      } catch (err) {
        alert('Watermark failed: ' + err.message);
      } finally {
        hideProcessing();
      }
    });
  }
});
