const getElement = id => document.getElementById(id);

const setVisible = (el, state) => {
  let element = el;
  if (typeof el === 'string') {
    element = getElement(el);
  }

  element.style.display = state ? 'block' : 'none';
};

const setRowVisible = (row, state) => {
  row.style.display = state ? 'block' : 'none';
};

module.exports = {
  getElement,
  setVisible,
  setRowVisible,
};
