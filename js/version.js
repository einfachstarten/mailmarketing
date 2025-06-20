
document.addEventListener('DOMContentLoaded', () => {
  fetch('version.txt')
    .then(res => res.text())
    .then(text => {
      const el = document.getElementById('version');
      if (el) {
        const raw = text.trim();
        const match = raw.match(/^(\S+)\s+\((.+)\)$/);
        if (match) {
          el.textContent = match[1];
          el.title = match[2];
        } else {
          el.textContent = raw;
        }
      }
    })
    .catch(err => console.error('Failed to load version', err));
});


