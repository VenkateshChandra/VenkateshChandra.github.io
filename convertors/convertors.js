/* ===================================================================
   TRENDS FOR SALE (TFS) - UNIT & DATA CONVERTERS CONTROLLER
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------------------------------------------
  // 0. Domain Category Filtering & Tab Navigation
  // -----------------------------------------------------------------
  const categoryPills = document.querySelectorAll('.cat-pill');
  const tabs = document.querySelectorAll('.conv-tab');
  const panes = document.querySelectorAll('.conv-pane');

  categoryPills.forEach(pill => {
    pill.addEventListener('click', () => {
      categoryPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const selectedCat = pill.getAttribute('data-cat');
      let firstVisibleTab = null;

      tabs.forEach(tab => {
        const tabCat = tab.getAttribute('data-cat');
        if (selectedCat === 'all' || tabCat === selectedCat) {
          tab.classList.remove('hidden');
          if (!firstVisibleTab) firstVisibleTab = tab;
        } else {
          tab.classList.add('hidden');
        }
      });

      // If active tab is now hidden, activate the first visible tab
      const activeTab = document.querySelector('.conv-tab.active');
      if (activeTab && activeTab.classList.contains('hidden') && firstVisibleTab) {
        firstVisibleTab.click();
      }
    });
  });

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
  // 1. Automotive Fuel Economy & Consumption Studio
  // Units: KMPL, MPL, MPG (US), MPG (UK), L/100KM
  // -----------------------------------------------------------------
  const fuelKmpl = document.getElementById('fuel-kmpl');
  const fuelMpl = document.getElementById('fuel-mpl');
  const fuelMpgUs = document.getElementById('fuel-mpgus');
  const fuelMpgUk = document.getElementById('fuel-mpguk');
  const fuelLp100km = document.getElementById('fuel-lp100km');

  // Exact Conversion Factors relative to base: km/L (KMPL)
  // 1 mile = 1.609344 km
  // 1 US gallon = 3.785411784 liters
  // 1 UK (Imperial) gallon = 4.54609 liters
  const MI_TO_KM = 1.609344;
  const US_GAL_TO_L = 3.785411784;
  const UK_GAL_TO_L = 4.54609;

  let isFuelMatrixUpdating = false;

  function formatFuelVal(num) {
    if (isNaN(num) || !isFinite(num)) return '';
    return parseFloat(num.toFixed(3)).toString();
  }

  function updateFuelMatrix(sourceUnit, val) {
    if (isFuelMatrixUpdating) return;
    isFuelMatrixUpdating = true;

    if (isNaN(val) || val <= 0) {
      if (sourceUnit !== 'kmpl' && fuelKmpl) fuelKmpl.value = '';
      if (sourceUnit !== 'mpl' && fuelMpl) fuelMpl.value = '';
      if (sourceUnit !== 'mpgus' && fuelMpgUs) fuelMpgUs.value = '';
      if (sourceUnit !== 'mpguk' && fuelMpgUk) fuelMpgUk.value = '';
      if (sourceUnit !== 'lp100km' && fuelLp100km) fuelLp100km.value = '';
      isFuelMatrixUpdating = false;
      return;
    }

    // Step 1: Compute base KMPL (km/L)
    let kmpl = 0;
    switch (sourceUnit) {
      case 'kmpl':
        kmpl = val;
        break;
      case 'mpl':
        kmpl = val * MI_TO_KM;
        break;
      case 'mpgus':
        kmpl = val * (MI_TO_KM / US_GAL_TO_L);
        break;
      case 'mpguk':
        kmpl = val * (MI_TO_KM / UK_GAL_TO_L);
        break;
      case 'lp100km':
        kmpl = 100 / val;
        break;
    }

    // Step 2: Update all matrix fields
    if (sourceUnit !== 'kmpl' && fuelKmpl) fuelKmpl.value = formatFuelVal(kmpl);
    if (sourceUnit !== 'mpl' && fuelMpl) fuelMpl.value = formatFuelVal(kmpl / MI_TO_KM);
    if (sourceUnit !== 'mpgus' && fuelMpgUs) fuelMpgUs.value = formatFuelVal(kmpl * (US_GAL_TO_L / MI_TO_KM));
    if (sourceUnit !== 'mpguk' && fuelMpgUk) fuelMpgUk.value = formatFuelVal(kmpl * (UK_GAL_TO_L / MI_TO_KM));
    if (sourceUnit !== 'lp100km' && fuelLp100km) fuelLp100km.value = formatFuelVal(100 / kmpl);

    isFuelMatrixUpdating = false;
  }

  // Matrix Event Listeners
  if (fuelKmpl) {
    fuelKmpl.addEventListener('input', () => updateFuelMatrix('kmpl', parseFloat(fuelKmpl.value)));
    if (fuelMpl) fuelMpl.addEventListener('input', () => updateFuelMatrix('mpl', parseFloat(fuelMpl.value)));
    if (fuelMpgUs) fuelMpgUs.addEventListener('input', () => updateFuelMatrix('mpgus', parseFloat(fuelMpgUs.value)));
    if (fuelMpgUk) fuelMpgUk.addEventListener('input', () => updateFuelMatrix('mpguk', parseFloat(fuelMpgUk.value)));
    if (fuelLp100km) fuelLp100km.addEventListener('input', () => updateFuelMatrix('lp100km', parseFloat(fuelLp100km.value)));

    // Initialize default matrix values from 15 KMPL
    updateFuelMatrix('kmpl', 15);
  }

  // Direct 2-Way Calculator
  const fuelCalcInput = document.getElementById('fuel-calc-input');
  const fuelFromUnit = document.getElementById('fuel-from-unit');
  const fuelCalcOutput = document.getElementById('fuel-calc-output');
  const fuelToUnit = document.getElementById('fuel-to-unit');
  const swapFuelBtn = document.getElementById('swap-fuel-btn');

  function convertFuelDirect() {
    if (!fuelCalcInput || !fuelCalcOutput || !fuelFromUnit || !fuelToUnit) return;
    const val = parseFloat(fuelCalcInput.value);
    if (isNaN(val) || val <= 0) {
      fuelCalcOutput.value = '';
      return;
    }

    const from = fuelFromUnit.value;
    const to = fuelToUnit.value;

    // Convert from -> base KMPL
    let kmpl = 0;
    switch (from) {
      case 'kmpl': kmpl = val; break;
      case 'mpl': kmpl = val * MI_TO_KM; break;
      case 'mpgus': kmpl = val * (MI_TO_KM / US_GAL_TO_L); break;
      case 'mpguk': kmpl = val * (MI_TO_KM / UK_GAL_TO_L); break;
      case 'lp100km': kmpl = 100 / val; break;
    }

    // Convert base KMPL -> to
    let result = 0;
    switch (to) {
      case 'kmpl': result = kmpl; break;
      case 'mpl': result = kmpl / MI_TO_KM; break;
      case 'mpgus': result = kmpl * (US_GAL_TO_L / MI_TO_KM); break;
      case 'mpguk': result = kmpl * (UK_GAL_TO_L / MI_TO_KM); break;
      case 'lp100km': result = 100 / kmpl; break;
    }

    fuelCalcOutput.value = formatFuelVal(result);
  }

  if (fuelCalcInput) {
    fuelCalcInput.addEventListener('input', convertFuelDirect);
    fuelFromUnit?.addEventListener('change', convertFuelDirect);
    fuelToUnit?.addEventListener('change', convertFuelDirect);

    if (swapFuelBtn) {
      swapFuelBtn.addEventListener('click', () => {
        const temp = fuelFromUnit.value;
        fuelFromUnit.value = fuelToUnit.value;
        fuelToUnit.value = temp;
        convertFuelDirect();
      });
    }

    convertFuelDirect();
  }

  // Quick Preset Buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const kmplVal = parseFloat(btn.getAttribute('data-kmpl'));
      if (!isNaN(kmplVal)) {
        if (fuelKmpl) fuelKmpl.value = kmplVal;
        updateFuelMatrix('kmpl', kmplVal);
        if (fuelCalcInput && fuelFromUnit) {
          fuelCalcInput.value = kmplVal;
          fuelFromUnit.value = 'kmpl';
          convertFuelDirect();
        }
      }
    });
  });

  // -----------------------------------------------------------------
  // 2. Multi-Base Radix Converter
  // -----------------------------------------------------------------
  const radixDec = document.getElementById('radix-dec');
  const radixHex = document.getElementById('radix-hex');
  const radixBin = document.getElementById('radix-bin');
  const radixOct = document.getElementById('radix-oct');
  const radixBits = document.getElementById('radix-bits');
  const radixSigned = document.getElementById('radix-signed');
  const radixEndian = document.getElementById('radix-endian');
  const radixChar = document.getElementById('radix-char');

  let isRadixUpdating = false;

  function getBitMask(bits) {
    if (bits === 8) return 0xFFn;
    if (bits === 16) return 0xFFFFn;
    if (bits === 32) return 0xFFFFFFFFn;
    return 0xFFFFFFFFFFFFFFFFn;
  }

  function formatBinaryChunk(binStr, bits) {
    const padded = binStr.padStart(bits, '0');
    // Group into 4-bit nibbles
    return padded.replace(/(.{4})/g, '$1 ').trim();
  }

  function swapEndian(valBig, bits) {
    const hex = valBig.toString(16).padStart(bits / 4, '0');
    const bytes = hex.match(/.{1,2}/g) || [];
    return '0x' + bytes.reverse().join('').toUpperCase();
  }

  function updateRadixFromBigInt(valBig) {
    const bits = parseInt(radixBits.value, 10);
    const mask = getBitMask(bits);
    const maskedVal = valBig & mask;

    radixDec.value = maskedVal.toString(10);
    radixHex.value = '0x' + maskedVal.toString(16).toUpperCase();
    radixBin.value = formatBinaryChunk(maskedVal.toString(2), bits);
    radixOct.value = maskedVal.toString(8);

    // Two's complement signed calculation
    const signBit = 1n << BigInt(bits - 1);
    let signedVal = maskedVal;
    if (maskedVal >= signBit) {
      signedVal = maskedVal - (1n << BigInt(bits));
    }
    if (radixSigned) radixSigned.textContent = signedVal.toString(10);

    // Endian swap
    if (radixEndian) radixEndian.textContent = swapEndian(maskedVal, bits);

    // ASCII representation
    if (radixChar) {
      const hex = maskedVal.toString(16).padStart(bits / 4, '0');
      const bytes = hex.match(/.{1,2}/g) || [];
      const ascii = bytes.map(b => {
        const c = parseInt(b, 16);
        return (c >= 32 && c <= 126) ? String.fromCharCode(c) : '.';
      }).join('');
      radixChar.textContent = ascii || '.';
    }
  }

  radixDec.addEventListener('input', () => {
    if (isRadixUpdating) return;
    const clean = radixDec.value.trim();
    if (!clean || isNaN(clean)) return;
    isRadixUpdating = true;
    try {
      updateRadixFromBigInt(BigInt(clean));
    } catch (e) {}
    isRadixUpdating = false;
  });

  radixHex.addEventListener('input', () => {
    if (isRadixUpdating) return;
    const clean = radixHex.value.replace(/0x|\s+|,/gi, '');
    if (!clean || !/^[0-9a-fA-F]+$/.test(clean)) return;
    isRadixUpdating = true;
    try {
      updateRadixFromBigInt(BigInt('0x' + clean));
    } catch (e) {}
    isRadixUpdating = false;
  });

  radixBin.addEventListener('input', () => {
    if (isRadixUpdating) return;
    const clean = radixBin.value.replace(/\s+/g, '');
    if (!clean || !/^[01]+$/.test(clean)) return;
    isRadixUpdating = true;
    try {
      updateRadixFromBigInt(BigInt('0b' + clean));
    } catch (e) {}
    isRadixUpdating = false;
  });

  radixOct.addEventListener('input', () => {
    if (isRadixUpdating) return;
    const clean = radixOct.value.trim();
    if (!clean || !/^[0-7]+$/.test(clean)) return;
    isRadixUpdating = true;
    try {
      updateRadixFromBigInt(BigInt('0o' + clean));
    } catch (e) {}
    isRadixUpdating = false;
  });

  radixBits.addEventListener('change', () => {
    const clean = radixDec.value.trim();
    if (clean && !isNaN(clean)) {
      updateRadixFromBigInt(BigInt(clean));
    }
  });

  // -----------------------------------------------------------------
  // 3. IEEE-754 Floating-Point Converter (32-bit Single)
  // -----------------------------------------------------------------
  const ieeeFloat = document.getElementById('ieee-float');
  const ieeeHex = document.getElementById('ieee-hex');
  const ieeeSignBit = document.getElementById('ieee-sign-bit');
  const ieeeSignDesc = document.getElementById('ieee-sign-desc');
  const ieeeExpBits = document.getElementById('ieee-exp-bits');
  const ieeeExpDesc = document.getElementById('ieee-exp-desc');
  const ieeeMantissaBits = document.getElementById('ieee-mantissa-bits');
  const ieeeMantissaDesc = document.getElementById('ieee-mantissa-desc');
  const ieeeFormulaEval = document.getElementById('ieee-formula-eval');

  let isIeeeUpdating = false;

  function updateIeeeFromFloat(fVal) {
    const buf = new ArrayBuffer(4);
    const fView = new Float32Array(buf);
    const uView = new Uint32Array(buf);

    fView[0] = fVal;
    const u32 = uView[0];

    ieeeHex.value = '0x' + u32.toString(16).padStart(8, '0').toUpperCase();
    renderIeeeDetails(u32, fVal);
  }

  function updateIeeeFromHex(hexVal) {
    const clean = hexVal.replace(/0x|\s+|,/gi, '');
    if (!clean || !/^[0-9a-fA-F]{1,8}$/.test(clean)) return;

    const u32 = parseInt(clean, 16);
    const buf = new ArrayBuffer(4);
    const uView = new Uint32Array(buf);
    const fView = new Float32Array(buf);

    uView[0] = u32;
    const fVal = fView[0];

    ieeeFloat.value = fVal.toString();
    renderIeeeDetails(u32, fVal);
  }

  function renderIeeeDetails(u32, fVal) {
    const sign = (u32 >>> 31) & 1;
    const exp = (u32 >>> 23) & 0xFF;
    const mantissa = u32 & 0x7FFFFF;

    ieeeSignBit.textContent = sign.toString();
    ieeeSignDesc.textContent = sign === 1 ? 'Negative (-)' : 'Positive (+)';

    ieeeExpBits.textContent = exp.toString(2).padStart(8, '0');
    const trueExp = exp - 127;
    ieeeExpDesc.textContent = `Dec: ${exp} &rarr; 2^(${exp}-127) = 2^${trueExp}`;

    const mantissaBin = mantissa.toString(2).padStart(23, '0');
    ieeeMantissaBits.textContent = mantissaBin;

    // Calculate fraction value
    let fraction = 0;
    for (let i = 0; i < 23; i++) {
      if (mantissaBin[i] === '1') {
        fraction += Math.pow(2, -(i + 1));
      }
    }
    const fullMantissa = 1 + fraction;
    ieeeMantissaDesc.textContent = `1 + ${fraction.toFixed(6)} = ${fullMantissa.toFixed(6)}`;

    ieeeFormulaEval.textContent = `(-1)^${sign} × 2^${trueExp} × ${fullMantissa.toFixed(6)} = ${fVal}`;
  }

  ieeeFloat.addEventListener('input', () => {
    if (isIeeeUpdating) return;
    const val = parseFloat(ieeeFloat.value);
    if (isNaN(val)) return;
    isIeeeUpdating = true;
    updateIeeeFromFloat(val);
    isIeeeUpdating = false;
  });

  ieeeHex.addEventListener('input', () => {
    if (isIeeeUpdating) return;
    isIeeeUpdating = true;
    updateIeeeFromHex(ieeeHex.value);
    isIeeeUpdating = false;
  });

  // Initialize IEEE with default -12.375
  updateIeeeFromFloat(-12.375);

  // -----------------------------------------------------------------
  // 4. Length & PCB Mils Converter
  // -----------------------------------------------------------------
  const lenInput = document.getElementById('len-input');
  const lenFromUnit = document.getElementById('len-from-unit');
  const lenOutput = document.getElementById('len-output');
  const lenToUnit = document.getElementById('len-to-unit');
  const swapLenBtn = document.getElementById('swap-len-btn');

  // Conversion rates to meters
  const lengthToMeters = {
    mil: 0.0000254,
    mm: 0.001,
    cm: 0.01,
    m: 1.0,
    in: 0.0254,
    ft: 0.3048
  };

  function convertLength() {
    const val = parseFloat(lenInput.value);
    if (isNaN(val)) {
      lenOutput.value = '';
      return;
    }
    const fromRate = lengthToMeters[lenFromUnit.value];
    const toRate = lengthToMeters[lenToUnit.value];
    const result = (val * fromRate) / toRate;
    lenOutput.value = parseFloat(result.toFixed(6)).toString();
  }

  lenInput.addEventListener('input', convertLength);
  lenFromUnit.addEventListener('change', convertLength);
  lenToUnit.addEventListener('change', convertLength);

  swapLenBtn.addEventListener('click', () => {
    const temp = lenFromUnit.value;
    lenFromUnit.value = lenToUnit.value;
    lenToUnit.value = temp;
    convertLength();
  });

  document.querySelectorAll('.chip-preset').forEach(chip => {
    chip.addEventListener('click', () => {
      lenInput.value = chip.getAttribute('data-val');
      lenFromUnit.value = chip.getAttribute('data-unit');
      lenToUnit.value = 'mm';
      convertLength();
    });
  });

  convertLength();

  // -----------------------------------------------------------------
  // 5. Data Rate & Frequency / Clock Period Solver
  // -----------------------------------------------------------------
  const freqInput = document.getElementById('freq-input');
  const freqUnit = document.getElementById('freq-unit');
  const periodOutput = document.getElementById('period-output');
  const periodDesc = document.getElementById('period-desc');

  const freqMultipliers = {
    hz: 1,
    khz: 1e3,
    mhz: 1e6,
    ghz: 1e9
  };

  function convertFrequency() {
    const val = parseFloat(freqInput.value);
    if (isNaN(val) || val <= 0) {
      periodOutput.value = 'Invalid';
      return;
    }

    const hz = val * freqMultipliers[freqUnit.value];
    const periodSeconds = 1 / hz;

    // Format human-friendly time unit
    let formatted = '';
    if (periodSeconds >= 1) formatted = `${periodSeconds.toFixed(3)} s`;
    else if (periodSeconds >= 1e-3) formatted = `${(periodSeconds * 1e3).toFixed(3)} ms`;
    else if (periodSeconds >= 1e-6) formatted = `${(periodSeconds * 1e6).toFixed(3)} µs`;
    else if (periodSeconds >= 1e-9) formatted = `${(periodSeconds * 1e9).toFixed(3)} ns`;
    else formatted = `${(periodSeconds * 1e12).toFixed(3)} ps`;

    periodOutput.value = formatted;
    if (periodDesc) periodDesc.textContent = `T = 1 / ${hz.toLocaleString()} Hz = ${periodSeconds.toExponential(4)} s`;
  }

  freqInput.addEventListener('input', convertFrequency);
  freqUnit.addEventListener('change', convertFrequency);

  document.querySelectorAll('.chip-preset-freq').forEach(chip => {
    chip.addEventListener('click', () => {
      freqInput.value = chip.getAttribute('data-val');
      freqUnit.value = chip.getAttribute('data-unit');
      convertFrequency();
    });
  });

  convertFrequency();

  // -----------------------------------------------------------------
  // 6. Pressure Converter (PSI, Bar, kPa)
  // -----------------------------------------------------------------
  const pressInput = document.getElementById('press-input');
  const pressFromUnit = document.getElementById('press-from-unit');
  const pressOutput = document.getElementById('press-output');
  const pressToUnit = document.getElementById('press-to-unit');
  const swapPressBtn = document.getElementById('swap-press-btn');

  // Rates to Pascals (Pa)
  const pressureToPa = {
    psi: 6894.757,
    bar: 100000,
    kpa: 1000,
    pa: 1,
    atm: 101325
  };

  function convertPressure() {
    const val = parseFloat(pressInput.value);
    if (isNaN(val)) {
      pressOutput.value = '';
      return;
    }
    const fromPa = pressureToPa[pressFromUnit.value];
    const toPa = pressureToPa[pressToUnit.value];
    const result = (val * fromPa) / toPa;
    pressOutput.value = parseFloat(result.toFixed(4)).toString();
  }

  pressInput.addEventListener('input', convertPressure);
  pressFromUnit.addEventListener('change', convertPressure);
  pressToUnit.addEventListener('change', convertPressure);

  swapPressBtn.addEventListener('click', () => {
    const temp = pressFromUnit.value;
    pressFromUnit.value = pressToUnit.value;
    pressToUnit.value = temp;
    convertPressure();
  });

  convertPressure();

  // -----------------------------------------------------------------
  // 7. Temperature Converter (C, F, K)
  // -----------------------------------------------------------------
  const tempInput = document.getElementById('temp-input');
  const tempFromUnit = document.getElementById('temp-from-unit');
  const tempOutput = document.getElementById('temp-output');
  const tempToUnit = document.getElementById('temp-to-unit');
  const swapTempBtn = document.getElementById('swap-temp-btn');

  function convertTemperature() {
    const val = parseFloat(tempInput.value);
    if (isNaN(val)) {
      tempOutput.value = '';
      return;
    }

    // Convert to Celsius first
    let celsius = 0;
    const from = tempFromUnit.value;
    if (from === 'c') celsius = val;
    else if (from === 'f') celsius = (val - 32) * (5 / 9);
    else if (from === 'k') celsius = val - 273.15;

    // Convert from Celsius to Target
    let result = 0;
    const to = tempToUnit.value;
    if (to === 'c') result = celsius;
    else if (to === 'f') result = (celsius * (9 / 5)) + 32;
    else if (to === 'k') result = celsius + 273.15;

    tempOutput.value = parseFloat(result.toFixed(2)).toString();
  }

  tempInput.addEventListener('input', convertTemperature);
  tempFromUnit.addEventListener('change', convertTemperature);
  tempToUnit.addEventListener('change', convertTemperature);

  swapTempBtn.addEventListener('click', () => {
    const temp = tempFromUnit.value;
    tempFromUnit.value = tempToUnit.value;
    tempToUnit.value = temp;
    convertTemperature();
  });

  convertTemperature();

  // -----------------------------------------------------------------
  // 8. Mass & Weight Converter
  // -----------------------------------------------------------------
  const massInput = document.getElementById('mass-input');
  const massFromUnit = document.getElementById('mass-from-unit');
  const massOutput = document.getElementById('mass-output');
  const massToUnit = document.getElementById('mass-to-unit');
  const swapMassBtn = document.getElementById('swap-mass-btn');

  const massToKg = {
    kg: 1.0,
    g: 0.001,
    mg: 0.000001,
    lb: 0.45359237,
    oz: 0.02834952
  };

  function convertMass() {
    const val = parseFloat(massInput.value);
    if (isNaN(val)) {
      massOutput.value = '';
      return;
    }
    const fromKg = massToKg[massFromUnit.value];
    const toKg = massToKg[massToUnit.value];
    const result = (val * fromKg) / toKg;
    massOutput.value = parseFloat(result.toFixed(5)).toString();
  }

  massInput.addEventListener('input', convertMass);
  massFromUnit.addEventListener('change', convertMass);
  massToUnit.addEventListener('change', convertMass);

  swapMassBtn.addEventListener('click', () => {
    const temp = massFromUnit.value;
    massFromUnit.value = massToUnit.value;
    massToUnit.value = temp;
    convertMass();
  });

  convertMass();

  // -----------------------------------------------------------------
  // 9. Copy to Clipboard Toast
  // -----------------------------------------------------------------
  const toast = document.getElementById('copy-toast');
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input && input.value) {
        navigator.clipboard.writeText(input.value).then(() => {
          if (toast) {
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 1800);
          }
        });
      }
    });
  });
});
