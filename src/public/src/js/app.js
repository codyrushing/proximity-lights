import 'whatwg-fetch';

const select = document.querySelector('select[name="routine"]');

console.log(fetch);

select.addEventListener(
  'change',
  e => {
    fetch(`/set-routine/${e.target.value}`);
  }
)
