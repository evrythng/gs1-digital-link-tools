const { DigitalLink, Utils } = require('digital-link.js');
const { grammarObject: GrammarObject } = require('./grammar');
const { getElement } = require('./util');

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
};

const getQueryParam = name => new URLSearchParams(window.location.search).get(name);

const onVerifyClicked = () => {
  try {
    const inputStr = UI.inputVerifierQuery.value;

    UI.divStats.innerHTML = Utils.generateStatsHtml(inputStr);
    UI.divResults.innerHTML = Utils.generateResultsHtml(inputStr);
    UI.divTrace.innerHTML = Utils.generateTraceHtml(inputStr).replace('display mode: ASCII', '');

    const isValid = DigitalLink(inputStr).isValid();
    UI.spanVerdictResult.innerHTML = `<strong>${isValid ? 'VALID' : 'INVALID'}</strong>`;
    UI.imgVerdict.src = `./assets/${isValid ? '' : 'in'}valid.svg`;
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
