
document.addEventListener('DOMContentLoaded', () => {
  fetch('version.txt')
    .then(res => res.text())
    .then(text => {
      const el = document.getElementById('version');
      if (el) {
        el.textContent = text.trim();
      }
    })
    .catch(err => console.error('Failed to load version', err));
});


