const Qrious = require('qrious');
const { DigitalLink, Utils } = require('digital-link.js');
const { getElement, setVisible, setRowVisible } = require('./util');

const AI_LIST = require('../data/ai-list.json');
const ALPHA_MAP = require('../data/alpha-map.json');
const DOMAINS = require('../data/domains.json');
const QR_CODE_CONFIGS = require('../data/qr-code-configs.json');
const IDENTIFIER_LIST = require('../data/identifier-list.json');
const KEY_QUALIFIERS_LIST = require('../data/key-qualifier-list.json');

const MAX_LENGTH = 48;
const DEFAULT_GTIN_VALUE = '9780345418913';
const QR_SIZE = 180;

const UI = {
  aQrCodeGenerate: getElement('a_qrcode_generate'),
  aRunVerifier: getElement('a_run_verifier'),
  canvasQRCode: getElement('canvas_qr_code'),
  checkCustomAttributes: getElement('check_custom_data_attributes'),
  checkFormatAlphanumeric: getElement('check_format_alphanumeric'),
  checkFormatNumeric: getElement('check_format_numeric'),
  checkGS1Attributes: getElement('check_gs1_data_attributes'),
  checkQualifiers: getElement('check_key_qualifiers'),
  divCustomAttributesGroup: getElement('div_custom_attributes_group'),
  divDomainWrapper: getElement('div_domain_wrapper'),
  divGs1AttributesGroup: getElement('div_gs1_data_attributes_group'),
  divQualifiersGroup: getElement('div_key_qualifiers_group'),
  imgDigitalLinkVerdict: getElement('img_digital_link_verdict'),
  imgIdentifierVerdict: getElement('img_identifier_verdict'),
  inputDomainValue: getElement('input_domain_value'),
  inputIdentifierValue: getElement('input_identifier_value'),
  inputSearchAiList: getElement('input_search_ai_list'),
  selectDomain: getElement('select_domain'),
  selectIdentifier: getElement('select_identifier'),
  selectQrCodeStyle: getElement('select_qr_code_style'),
  spanIdentifierLabel: getElement('span_identifier_label'),
  tableCustomAttributes: getElement('table_custom_attributes'),
  tableGS1Attribute: getElement('table_gs1_data_attributes'),
  tableKeyQualifier: getElement('table_key_qualifiers'),
  textareaDigitalLink: getElement('textarea_digital_link'),
};

// [{ key, value, row }]
const customAttributes = [];
let qrCode;
let digitalLink = DigitalLink();

const truncate = str => (str.length < MAX_LENGTH) ? str : `${str.substring(0, MAX_LENGTH - 2)}...`;

const mapAIInputId = code => `input_gs1_attribute_${code}`;

const mapKeyQualifierInputId = code => `input_key_qualifier_${code}`;

const mapKeyQualifierIconId = code => `img_key_qualifier_${code}`;

const mapAlphaNumeric = code => (UI.checkFormatAlphanumeric.checked && ALPHA_MAP[`${code}`]) || code;

const generateClassicQrCode = () => {
  if (!qrCode) {
    qrCode = new Qrious({
      element: UI.canvasQRCode,
      size: QR_SIZE,
      value: digitalLink.toWebUriString(),
      level: 'L',
      foreground: '#000000',
      background: '#FFFFFF',
    });
  }

  qrCode.value = digitalLink.toWebUriString();
};

const updateQrCode = () => {
  const key = UI.selectQrCodeStyle.value;
  const map = {
    default: generateClassicQrCode,
  };

  if (map[key]) map[key]();
};

const updateDigitalLink = () => {
  digitalLink = DigitalLink();

  // Domain
  const domainKey = Object.keys(DOMAINS)
    .find(item => DOMAINS[item].value === UI.selectDomain.value);
  const domain = DOMAINS[domainKey];

  // Identifier
  const identifier = IDENTIFIER_LIST.find(item => item.code === UI.selectIdentifier.value);
  const identifierValue = UI.inputIdentifierValue.value;
  digitalLink.setDomain(`https://${domain.url}`);
  digitalLink.setIdentifier(mapAlphaNumeric(identifier.code), identifierValue);

  // Key qualifiers
  KEY_QUALIFIERS_LIST.forEach((item) => {
    const input = getElement(mapKeyQualifierInputId(item.code));
    if (input.value) {
      digitalLink.setKeyQualifier(mapAlphaNumeric(item.code), input.value);
    }
  });

  // GS1 Data Attributes
  AI_LIST.filter(item => item.value)
    .forEach(item => digitalLink.setAttribute(item.code, item.value));

  // Custom Data Attributes
  customAttributes
    .filter(item => item.key && item.value)
    .forEach(item => digitalLink.setAttribute(item.key, item.value));

  const isValid = digitalLink.isValid();
  UI.imgDigitalLinkVerdict.src = `./assets/${isValid ? '' : 'in'}valid.svg`;

  // Update UI
  UI.textareaDigitalLink.innerHTML = digitalLink.toWebUriString();
  updateQrCode();
};

const validateKeyQualifier = ({ code, value, ruleName }) => {
  const iconId = mapKeyQualifierIconId(code);
  if (!ruleName || !value) {
    setVisible(iconId, false);
    return;
  }

  setVisible(iconId, true);
  getElement(iconId).src = `./assets/${Utils.testRule(ruleName, value) ? '' : 'in'}valid.svg`;
};

const setupKeyQualifierRow = (table, item) => {
  const { label, code, ruleName } = item;
  const newRow = table.insertRow(table.rows.length);
  const labelCell = newRow.insertCell(0);
  const valueCell = newRow.insertCell(1);
  const iconCell = newRow.insertCell(2);

  const inputId = mapKeyQualifierInputId(code);
  labelCell.innerHTML = `<span>${truncate(label)}</span><span class="italic light-grey"> (${code})</span>`;
  valueCell.innerHTML = `<input id="${inputId}" type="text" class="form-control ml-2">`;
  if (ruleName) {
    iconCell.innerHTML = `<img id="${mapKeyQualifierIconId(code)}" class="verdict-icon-small ml-2 mt-2" src="./assets/blank.png">`;
  }

  const rowInput = getElement(inputId);
  rowInput.oninput = () => {
    item.value = rowInput.value;
    updateDigitalLink();
    validateKeyQualifier(item);
  };

  // Start hidden and save a reference to table row and value container
  newRow.style.display = 'none';
  item.row = newRow;
};

const setupAttributeRow = (table, item) => {
  const { label, code } = item;
  const inputId = mapAIInputId(code);

  const newRow = table.insertRow(table.rows.length);
  const labelCell = newRow.insertCell(0);
  const valueCell = newRow.insertCell(1);

  labelCell.innerHTML = `<span>${truncate(label)}</span><span class="italic light-grey"> (${code})</span>`;
  valueCell.innerHTML = `<input id="${inputId}" type="text" class="form-control ml-2">`;

  const rowInput = getElement(inputId);
  rowInput.oninput = () => {
    item.value = rowInput.value;
    updateDigitalLink();
  };

  // Start hidden and save a reference to table row and value container
  newRow.style.display = 'none';
  item.row = newRow;
};

const searchAiList = query => query
  ? AI_LIST.filter(n => n.label.toLowerCase().includes(query) || n.code === query)
  : [];

const tableHasEmptyRows = (table) => {
  for (let i = 0; i < table.rows.length; i += 1) {
    const row = table.rows[i];
    const inputKey = row.querySelector('#input_custom_attribute_row_key');
    const inputValue = row.querySelector('#input_custom_attribute_row_value');

    if (!inputKey.value && !inputValue.value) return true;
  }

  return false;
};

const updateCustomAttributeRows = () => {
  for (let i = 0; i < UI.tableCustomAttributes.rows.length; i += 1) {
    const row = UI.tableCustomAttributes.rows[i];
    const inputKey = row.querySelector('#input_custom_attribute_row_key');
    const inputValue = row.querySelector('#input_custom_attribute_row_value');

    // Delete empty rows
    if (!inputKey.value && !inputValue.value) UI.tableCustomAttributes.deleteRow(i);
  }

  // No rows left?
  // No empty rows?
  if (!UI.tableCustomAttributes.rows.length || !tableHasEmptyRows(UI.tableCustomAttributes)) {
    setupCustomAttributeRow();
  }
};

const setupCustomAttributeRow = () => {
  const nextIndex = UI.tableCustomAttributes.rows.length;
  const row = UI.tableCustomAttributes.insertRow(nextIndex);
  const cell = row.insertCell(0);
  cell.innerHTML = `<div class="input-group">
    <input id="input_custom_attribute_row_key" type="text" class="form-control" placeholder="Key...">
    <input id="input_custom_attribute_row_value" type="text" class="form-control" placeholder="Value...">
  </div>`;

  // Add data model item
  const attributeModel = { key: '', value: '', row };
  customAttributes.push(attributeModel);

  // Add listeners
  const inputKey = cell.querySelector('#input_custom_attribute_row_key');
  inputKey.oninput = () => {
    attributeModel.key = inputKey.value;

    updateCustomAttributeRows();
    updateDigitalLink();
  };
  const inputValue = cell.querySelector('#input_custom_attribute_row_value');
  inputValue.oninput = () => {
    attributeModel.value = inputValue.value;

    updateCustomAttributeRows();
    updateDigitalLink();
  };
};

const injectTableRows = () => {
  KEY_QUALIFIERS_LIST.forEach(item => setupKeyQualifierRow(UI.tableKeyQualifier, item));
  AI_LIST.forEach(item => setupAttributeRow(UI.tableGS1Attribute, item));
  setupCustomAttributeRow();
};

const updateVisibleKeyQualifiers = () => {
  // Hide all, unless they have a value
  KEY_QUALIFIERS_LIST.forEach(item => setRowVisible(item.row, item.value));

  // Show relevant key qualifiers for this identifier
  const identifier = IDENTIFIER_LIST.find(item => item.code === UI.selectIdentifier.value);
  const visibleRows = KEY_QUALIFIERS_LIST.filter(item => identifier.keyQualifiers.includes(item.code));
  visibleRows.forEach(item => setRowVisible(item.row, true));
};

const updateIdentifierValueLabel = () => {
  const { code } = IDENTIFIER_LIST.find(item => item.code === UI.selectIdentifier.value);
  UI.spanIdentifierLabel.innerHTML = `(${code})`;
};

const validateIdentifier = () => {
  const { ruleName } = IDENTIFIER_LIST.find(item => item.code === UI.selectIdentifier.value);
  if (!ruleName) {
    setVisible(UI.imgIdentifierVerdict, false);
    return;
  }

  setVisible(UI.imgIdentifierVerdict, true);
  const valid = Utils.testRule(ruleName, UI.inputIdentifierValue.value);
  UI.imgIdentifierVerdict.src = `./assets/${valid ? '' : 'in'}valid.svg`;
};

const setupUI = () => {
  // Domain
  UI.selectDomain.onchange = () => {
    setVisible(UI.divDomainWrapper, UI.selectDomain.value === DOMAINS.CUSTOM.value);
    updateDigitalLink();
  };

  UI.inputDomainValue.value = DOMAINS.CUSTOM.url;
  UI.inputDomainValue.oninput = () => {
    DOMAINS.CUSTOM.url = UI.inputDomainValue.value;
    updateDigitalLink();
  };

  // Format options
  UI.checkFormatAlphanumeric.onchange = updateDigitalLink;
  UI.checkFormatNumeric.onchange = updateDigitalLink;

  // Set identifier options
  UI.inputIdentifierValue.oninput = () => {
    validateIdentifier();
    updateDigitalLink();
  };
  UI.inputIdentifierValue.value = DEFAULT_GTIN_VALUE;

  UI.selectIdentifier.options.length = 0;
  IDENTIFIER_LIST.forEach((item) => {
    UI.selectIdentifier.options.add(new Option(item.label, item.code));
  });
  UI.selectIdentifier.value = IDENTIFIER_LIST[1].code;
  UI.selectIdentifier.onchange = () => {
    validateIdentifier();
    updateDigitalLink();
    updateVisibleKeyQualifiers();
    updateIdentifierValueLabel();
  };

  // Data qualifiers
  UI.checkQualifiers.onclick = () => setVisible(UI.divQualifiersGroup, UI.checkQualifiers.checked);

  // GS1 Attributes
  UI.checkGS1Attributes.onclick = () => {
    setVisible(UI.divGs1AttributesGroup, UI.checkGS1Attributes.checked);
  };

  // Setup attribute search
  UI.inputSearchAiList.oninput = () => {
    // Hide all, unless they have a value
    AI_LIST.forEach(item => setRowVisible(item.row, item.value));

    // Show those that matched the query
    const results = searchAiList(UI.inputSearchAiList.value);
    results.forEach(item => setRowVisible(item.row, true));
  };

  // Custom Attributes
  UI.checkCustomAttributes.onclick = () => {
    setVisible(UI.divCustomAttributesGroup, UI.checkCustomAttributes.checked);
  };

  // Run Verifier button
  UI.aRunVerifier.onclick = () => {
    window.open(`${document.location.origin}/verifier.html?url=${digitalLink.toWebUriString()}`, '_blank');
  };

  // QR Code Style
  UI.selectQrCodeStyle.options.length = 0;
  Object.keys(QR_CODE_CONFIGS).forEach((item) => {
    UI.selectQrCodeStyle.options.add(new Option(QR_CODE_CONFIGS[item].label, item));
  });
  UI.selectQrCodeStyle.value = 'default';
  UI.selectQrCodeStyle.onchange = () => {
    const key = UI.selectQrCodeStyle.value;
    setVisible(UI.aQrCodeGenerate, key !== 'default');
  };

  UI.aQrCodeGenerate.onclick = updateQrCode;
  setVisible(UI.aQrCodeGenerate, false);
};

(() => {
  injectTableRows();
  setupUI();
  updateDigitalLink();
  updateVisibleKeyQualifiers();
  updateIdentifierValueLabel();
  validateIdentifier();

  console.log('Script loaded!');
})();
