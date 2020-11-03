const { DigitalLink, Utils } = require('digital-link.js');
const { grammarObject: GrammarObject } = require('./grammar');
const { getElement } = require('./util');
const ALPHA_MAP = require('../data/alpha-map.json');

const DEFAULT_QUERY = 'https://gs1.example.org/gtin/9780345418913';

const UI = {
  aVerify: getElement('a_verify'),
  divGrammar: getElement('div_grammar'),
  divResults: getElement('div_results'),
  divStats: getElement('div_stats'),
  divTrace: getElement('div_trace'),
  imgVerdict: getElement('img_verdict'),
  inputVerifierQuery: getElement('input_verifier_query'),
  spanVerdictResult: getElement('span_verdict_result'),
  divDeprecatedMessage: getElement('div_deprecated_message'),
};

const getQueryParam = name => new URLSearchParams(window.location.search).get(name);

/**
 * Check if the digital link passed in parameter contains deprecated syntax such as alphanumeric
 * identifier for example
 *
 * @param dl - The Digital Link instance
 * @returns {boolean} - true if the URI is deprecated, false otherwise.
 */
const checkIfUriIsDeprecated = (dl) => {
  let hasDeprecatedTerms = false;

  Object.keys(ALPHA_MAP)
    .forEach((key) => {
      if (Object.keys(dl.getIdentifier())[0] === ALPHA_MAP[key]) {
        hasDeprecatedTerms = true;
      }
    });

  if (dl.getKeyQualifiers()) {
    Object.keys(ALPHA_MAP)
      .forEach((key) => {
        Object.keys(dl.getKeyQualifiers())
          .forEach((keyQualifier) => {
            if (keyQualifier === ALPHA_MAP[key]) {
              hasDeprecatedTerms = true;
            }
          });
      });
  }

  return hasDeprecatedTerms;
};

const onVerifyClicked = () => {
  try {
    const inputStr = UI.inputVerifierQuery.value;

    // Decompress if required
    const dl = DigitalLink(inputStr);
    const finalUri = dl.toWebUriString();

    const hasDeprecatedTerms = checkIfUriIsDeprecated(dl);

    // If my DL is something like this :
    // https://example.com/my/custom/path/01/01234567890128/21/12345/10/4512
    // I need to transform it into this :
    // https://example.com/01/01234567890128/21/12345/10/4512
    // Since the custom path (/my/custom/path) is not handled by the grammar file. And all
    // the traces will be wrong.
    const finalUriWithoutCustomPath = Utils.removeCustomPath(finalUri, dl.getDomain());

    UI.divStats.innerHTML =
      Utils.generateStatsHtml(finalUriWithoutCustomPath);
    UI.divResults.innerHTML =
      Utils.generateResultsHtml(finalUriWithoutCustomPath);
    UI.divTrace.innerHTML =
      Utils.generateTraceHtml(finalUriWithoutCustomPath).replace('display mode: ASCII', '');

    const isValid = dl.isValid() && dl.getValidationTrace().success;
    UI.spanVerdictResult.innerHTML = `<strong>${isValid ? 'VALID' : 'INVALID'}</strong>`;
    UI.imgVerdict.src = `./assets/${isValid ? '' : 'in'}valid.svg`;
    UI.inputVerifierQuery.value = finalUri;
    if (hasDeprecatedTerms) {
      UI.divDeprecatedMessage.style.visibility = 'visible';
    } else {
      UI.divDeprecatedMessage.style.visibility = 'hidden';
    }
  } catch (e) {
    console.log(e);
    UI.divResults.innerHTML = `Error: ${e.message || e}`;
    UI.imgVerdict.src = './assets/invalid.svg';
    UI.spanVerdictResult.innerHTML = '<strong>ERROR</strong>';
  }
};

const main = () => {
  UI.inputVerifierQuery.value = getQueryParam('url') || DEFAULT_QUERY;
  UI.aVerify.onclick = onVerifyClicked;
  UI.divGrammar.innerHTML = new GrammarObject().toString();
};

main();
