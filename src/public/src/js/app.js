import 'whatwg-fetch';

const select = document.querySelector('select[name="routine"]');

select.addEventListener(
  'change',
  e => {
    fetch(`/set-routine/${e.target.value}`);
  }
)
