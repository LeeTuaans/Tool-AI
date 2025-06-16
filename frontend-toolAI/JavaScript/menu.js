const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('goto-create-title');
  if (button) {
    button.addEventListener('click', () => {
      ipcRenderer.send('navigate-to', 'create_title.html');
    });
  }
});
