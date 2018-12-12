/* eslint new-cap: 0 */

const { getElement } = require('./util');
const { DigitalLink, Utils } = require('digital-link.js');

const UI = {
  divResults: getElement('div_results'),
  divStats: getElement('div_stats'),
  divTrace: getElement('div_trace'),
  imgVerdict: getElement('img_verdict'),
  spanVerdictResult: getElement('span_verdict_result'),
};

// Validate an arbitrary rule
const validate = (inputStr, startRule) => {
  return Utils.testRule(startRule, inputStr);
};

const generateReport = (inputStr, startRule) => {
  try {
    UI.divStats.innerHTML = Utils.generateStatsHtml(inputStr);
    UI.divResults.innerHTML = Utils.generateResultsHtml(inputStr);
    UI.divTrace.innerHTML = Utils.generateTraceHtml(inputStr)
      .replace('display mode: ASCII', '');

    const isValid = DigitalLink(inputStr).isValid();
    UI.spanVerdictResult.innerHTML = `<strong>${isValid ? 'VALID' : 'INVALID'}</strong>`;
    UI.imgVerdict.src = `./assets/${isValid ? '' : 'in'}valid.svg`;

  } catch (e) {
    console.log(e);
    UI.divResults.innerHTML = `EXCEPTION THROWN: ${e.message || e}`;
  }
};

module.exports = {
  generateReport,
  validate,
};
