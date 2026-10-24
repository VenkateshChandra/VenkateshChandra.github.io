/* ===================================================================
   TRENDS FOR SALE (TFS) - TOOLS DASHBOARD CONTROLLER
   Search, Category Filtering, and Live Radix Base Converter
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Elements for Search & Filter
  const searchInput = document.getElementById('tool-search');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const filterPills = document.querySelectorAll('#filter-pills .pill');
  const toolCards = document.querySelectorAll('.tool-dir-card');
  const noToolsFound = document.getElementById('no-tools-found');
  const resetSearchBtn = document.getElementById('reset-search-btn');

  // Elements for Radix Converter Widget
  const inputDec = document.getElementById('conv-dec');
  const inputHex = document.getElementById('conv-hex');
  const inputBin = document.getElementById('conv-bin');
  const inputAscii = document.getElementById('conv-ascii');
  const resetConvBtn = document.getElementById('reset-converter-btn');

  let activeCategory = 'all';

  // -----------------------------------------------------------------
  // 1. Search & Category Filter Logic
  // -----------------------------------------------------------------
  function filterTools() {
    const query = searchInput.value.toLowerCase().trim();
    let visibleCount = 0;

    if (query.length > 0) {
      clearSearchBtn.style.display = 'block';
    } else {
      clearSearchBtn.style.display = 'none';
    }

    toolCards.forEach(card => {
      const category = card.getAttribute('data-category');
      const keywords = card.getAttribute('data-keywords') || '';
      const title = card.querySelector('.tool-title')?.textContent.toLowerCase() || '';
      const summary = card.querySelector('.tool-summary')?.textContent.toLowerCase() || '';

      const matchesCategory = (activeCategory === 'all' || category === activeCategory);
      const matchesSearch = !query || 
        title.includes(query) || 
        summary.includes(query) || 
        keywords.toLowerCase().includes(query);

      if (matchesCategory && matchesSearch) {
        card.style.display = 'flex';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noToolsFound) {
      noToolsFound.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterTools);
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      filterTools();
      searchInput.focus();
    });
  }

  if (resetSearchBtn) {
    resetSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      activeCategory = 'all';
      filterPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-filter') === 'all'));
      filterTools();
    });
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-filter');
      filterTools();
    });
  });

  // Dynamically count tools per category
  function updateCategoryCounts() {
    const counts = { all: toolCards.length, hardware: 0, calculators: 0, converters: 0, media: 0 };
    toolCards.forEach(card => {
      const cat = card.getAttribute('data-category');
      if (counts[cat] !== undefined) counts[cat]++;
    });
    Object.keys(counts).forEach(cat => {
      const el = document.getElementById(`count-${cat}`);
      if (el) el.textContent = counts[cat];
    });
  }
  updateCategoryCounts();

  // -----------------------------------------------------------------
  // 2. Live Radix & Base Converter Engine
  // -----------------------------------------------------------------
  let isConverting = false;

  function formatBinary(binStr) {
    const clean = binStr.replace(/\s+/g, '');
    // Group into 4-bit nibbles from right to left
    return clean.replace(/\B(?=(\d{4})+(?!\d))/g, ' ');
  }

  function updateFromDecimal(valStr) {
    const clean = valStr.trim();
    if (!clean || isNaN(clean)) return;

    try {
      const bigVal = BigInt(clean);
      inputHex.value = bigVal.toString(16).toUpperCase();
      inputBin.value = formatBinary(bigVal.toString(2));
      
      const num = Number(bigVal);
      if (num >= 32 && num <= 126) {
        inputAscii.value = String.fromCharCode(num);
      } else if (num >= 160 && num <= 255) {
        inputAscii.value = String.fromCharCode(num);
      } else {
        inputAscii.value = num < 32 ? `[0x${num.toString(16).padStart(2, '0')}]` : '[Extended]';
      }
    } catch (e) {}
  }

  function updateFromHex(hexStr) {
    const clean = hexStr.replace(/0x|\s+|,/gi, '');
    if (!clean || !/^[0-9a-fA-F]+$/.test(clean)) return;

    try {
      const bigVal = BigInt('0x' + clean);
      inputDec.value = bigVal.toString(10);
      inputBin.value = formatBinary(bigVal.toString(2));

      const num = Number(bigVal);
      if (num >= 32 && num <= 126) {
        inputAscii.value = String.fromCharCode(num);
      } else {
        inputAscii.value = `[0x${clean.toUpperCase()}]`;
      }
    } catch (e) {}
  }

  function updateFromBinary(binStr) {
    const clean = binStr.replace(/\s+/g, '');
    if (!clean || !/^[01]+$/.test(clean)) return;

    try {
      const bigVal = BigInt('0b' + clean);
      inputDec.value = bigVal.toString(10);
      inputHex.value = bigVal.toString(16).toUpperCase();

      const num = Number(bigVal);
      if (num >= 32 && num <= 126) {
        inputAscii.value = String.fromCharCode(num);
      } else {
        inputAscii.value = `[ASCII]`;
      }
    } catch (e) {}
  }

  function updateFromAscii(asciiStr) {
    if (!asciiStr) return;
    const charCode = asciiStr.charCodeAt(0);
    inputDec.value = charCode.toString(10);
    inputHex.value = charCode.toString(16).toUpperCase().padStart(2, '0');
    inputBin.value = formatBinary(charCode.toString(2).padStart(8, '0'));
  }

  if (inputDec && inputHex && inputBin && inputAscii) {
    inputDec.addEventListener('input', () => {
      if (isConverting) return;
      isConverting = true;
      updateFromDecimal(inputDec.value);
      isConverting = false;
    });

    inputHex.addEventListener('input', () => {
      if (isConverting) return;
      isConverting = true;
      updateFromHex(inputHex.value);
      isConverting = false;
    });

    inputBin.addEventListener('input', () => {
      if (isConverting) return;
      isConverting = true;
      updateFromBinary(inputBin.value);
      isConverting = false;
    });

    inputAscii.addEventListener('input', () => {
      if (isConverting) return;
      isConverting = true;
      updateFromAscii(inputAscii.value);
      isConverting = false;
    });

    if (resetConvBtn) {
      resetConvBtn.addEventListener('click', () => {
        inputDec.value = '255';
        inputHex.value = 'FF';
        inputBin.value = '1111 1111';
        inputAscii.value = 'ÿ';
      });
    }
  }
});
