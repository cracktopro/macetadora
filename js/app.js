(function () {
  'use strict';

  const PI = Math.PI;

  const POT_TYPES = {
    terracota: {
      name: 'Macetas Terracota',
      exteriorFactor: 0.875,
      interiorFactor: 0.63
    },
    plasticforte: {
      name: 'Macetas decorativas (Plasticforte)',
      exteriorFactor: 1,
      interiorFactor: 0.656
    }
  };

  const shapeSelect = document.getElementById('shapeSelect');
  const potTypeSelect = document.getElementById('potTypeSelect');
  const inputFields = document.getElementById('inputFields');
  const calcForm = document.getElementById('calcForm');
  const calcBtn = document.getElementById('calcBtn');
  const resultPanel = document.getElementById('resultPanel');
  const resultLiters = document.getElementById('resultLiters');
  const resultDetail = document.getElementById('resultDetail');

  function getSelectedShape() {
    return shapeSelect.value;
  }

  function getSelectedPotType() {
    return potTypeSelect.value;
  }

  function canCalculate() {
    return getSelectedShape() !== '' && getSelectedPotType() !== '';
  }

  function updateCalcButton() {
    calcBtn.disabled = !canCalculate();
  }

  function createInputField(id, label, icon, placeholder) {
    return `
      <div class="col-sm-6 field-row">
        <label for="${id}" class="form-label kawaii-label">
          <span class="label-icon">${icon}</span> ${label}
        </label>
        <div class="kawaii-input-group">
          <input
            type="number"
            id="${id}"
            class="form-control kawaii-input"
            min="0.01"
            step="0.1"
            placeholder="${placeholder}"
            required
          >
          <span class="input-suffix">cm</span>
        </div>
      </div>
    `;
  }

  function renderInputFields() {
    const shape = getSelectedShape();
    const potType = getSelectedPotType();

    if (!shape || !potType) {
      inputFields.innerHTML = `
        <p class="text-muted small mb-0 placeholder-hint">
          <span class="hint-icon">✨</span> Selecciona forma y tipo de maceta para ver los campos
        </p>
      `;
      return;
    }

    let fieldsHtml = '<div class="row g-3 field-row">';
    let potInfo = '';

    if (shape === 'rectangular') {
      fieldsHtml += createInputField('length', 'Longitud', '📏', 'Ej: 60');
      fieldsHtml += createInputField('width', 'Anchura', '↔️', 'Ej: 30');
      fieldsHtml += createInputField('depth', 'Profundidad', '⬇️', 'Ej: 25');
    } else if (shape === 'truncated-cone') {
      fieldsHtml += createInputField('diameter', 'Diámetro superior', '⭕', 'Ej: 70');
      fieldsHtml += createInputField('height', 'Profundidad', '⬇️', 'Ej: 51,5');

      const config = POT_TYPES[potType];
      const extPct = config.exteriorFactor * 100;
      const intPct = config.interiorFactor * 100;

      if (potType === 'terracota') {
        potInfo = `
          <div class="col-12 field-row">
            <span class="pot-info-badge">
              🏺 Sup. real: ${extPct}% del introducido · Inf.: ${intPct}% del superior real
            </span>
          </div>
        `;
      } else {
        potInfo = `
          <div class="col-12 field-row">
            <span class="pot-info-badge">
              ✨ Inf.: ${intPct}% del diámetro superior introducido
            </span>
          </div>
        `;
      }
    } else {
      fieldsHtml += createInputField('diameter', 'Diámetro exterior', '⭕', 'Ej: 40');
      fieldsHtml += createInputField('height', 'Altura', '⬇️', 'Ej: 35');

      const config = POT_TYPES[potType];
      const extPct = config.exteriorFactor * 100;
      const intPct = config.interiorFactor * 100;

      if (potType === 'terracota') {
        potInfo = `
          <div class="col-12 field-row">
            <span class="pot-info-badge">
              🏺 Diámetro real: ${extPct}% del introducido · Interior: ${intPct}% del real
            </span>
          </div>
        `;
      } else {
        potInfo = `
          <div class="col-12 field-row">
            <span class="pot-info-badge">
              ✨ Interior: ${intPct}% del diámetro exterior introducido
            </span>
          </div>
        `;
      }
    }

    fieldsHtml += potInfo + '</div>';
    inputFields.innerHTML = fieldsHtml;
  }

  function parsePositiveNumber(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const value = parseFloat(el.value);
    if (isNaN(value) || value <= 0) return null;
    return value;
  }

  function getInteriorDiameter(userDiameter, potType) {
    const config = POT_TYPES[potType];
    const realExterior = userDiameter * config.exteriorFactor;
    const interior = realExterior * config.interiorFactor;
    return { realExterior, interior };
  }

  function getConeDiameters(userTopDiameter, potType) {
    const config = POT_TYPES[potType];
    const topDiameter = userTopDiameter * config.exteriorFactor;
    const bottomDiameter = topDiameter * config.interiorFactor;
    return { topDiameter, bottomDiameter };
  }

  function truncatedConeVolume(topDiameter, bottomDiameter, height) {
    const R = topDiameter / 2;
    const r = bottomDiameter / 2;
    return (1 / 3) * PI * height * (r * r + r * R + R * R);
  }

  function cm3ToLiters(cm3) {
    return cm3 / 1000;
  }

  function formatLiters(liters) {
    if (liters < 1) return liters.toFixed(2);
    if (liters < 100) return liters.toFixed(1);
    return Math.round(liters).toLocaleString('es-ES');
  }

  function calculateRectangular() {
    const length = parsePositiveNumber('length');
    const width = parsePositiveNumber('width');
    const depth = parsePositiveNumber('depth');

    if (length === null || width === null || depth === null) {
      return { error: 'Introduce longitud, anchura y profundidad válidas (mayores que 0).' };
    }

    const volumeCm3 = length * width * depth;
    const detail = `Rectangular: ${length} × ${width} × ${depth} cm`;

    return { volumeCm3, detail };
  }

  function calculateRound(potType) {
    const diameter = parsePositiveNumber('diameter');
    const height = parsePositiveNumber('height');

    if (diameter === null || height === null) {
      return { error: 'Introduce diámetro y altura válidos (mayores que 0).' };
    }

    const { realExterior, interior } = getInteriorDiameter(diameter, potType);
    const radius = interior / 2;
    const volumeCm3 = PI * radius * radius * height;

    const detail = buildRoundDetail(diameter, realExterior, interior, height, potType);

    return { volumeCm3, detail };
  }

  function calculateTruncatedCone(potType) {
    const diameter = parsePositiveNumber('diameter');
    const height = parsePositiveNumber('height');

    if (diameter === null || height === null) {
      return { error: 'Introduce diámetro superior y profundidad válidos (mayores que 0).' };
    }

    const { topDiameter, bottomDiameter } = getConeDiameters(diameter, potType);
    const volumeCm3 = truncatedConeVolume(topDiameter, bottomDiameter, height);

    const detail =
      `Diámetro superior: ${topDiameter.toFixed(1)} cm · ` +
      `Diámetro inferior: ${bottomDiameter.toFixed(1)} cm · ` +
      `Profundidad: ${height} cm`;

    return { volumeCm3, detail };
  }

  function buildRoundDetail(userDiameter, realExterior, interior, height, potType) {
    if (potType === 'terracota') {
      return `Exterior real: ${realExterior.toFixed(1)} cm · Interior: ${interior.toFixed(1)} cm · Altura: ${height} cm`;
    }
    return `Diámetro exterior: ${userDiameter} cm · Interior: ${interior.toFixed(1)} cm · Altura: ${height} cm`;
  }

  function calculate() {
    const shape = getSelectedShape();
    const potType = getSelectedPotType();

    if (!shape || !potType) {
      return { error: 'Selecciona la forma del contenedor y el tipo de maceta.' };
    }

    switch (shape) {
      case 'rectangular':
        return calculateRectangular();
      case 'round':
        return calculateRound(potType);
      case 'truncated-cone':
        return calculateTruncatedCone(potType);
      default:
        return { error: 'Forma no reconocida.' };
    }
  }

  function showResult(liters, detail) {
    resultLiters.textContent = formatLiters(liters);
    resultDetail.textContent = detail;
    resultPanel.classList.remove('d-none');
  }

  function hideResult() {
    resultPanel.classList.add('d-none');
  }

  function onSelectionChange() {
    updateCalcButton();
    renderInputFields();
    hideResult();
  }

  shapeSelect.addEventListener('change', onSelectionChange);
  potTypeSelect.addEventListener('change', onSelectionChange);

  calcForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!canCalculate()) return;

    const result = calculate();

    if (result.error) {
      hideResult();
      alert(result.error);
      return;
    }

    const liters = cm3ToLiters(result.volumeCm3);
    showResult(liters, result.detail);
  });

  updateCalcButton();
})();
