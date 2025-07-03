const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const routes = {
    'goto-create-title': 'create_title.html',
    'goto-create_script': 'create_script.html',
    'goto-transcript': 'transcript.html',
    'goto-TTS': 'TTS.html'
  };

  for (const id in routes) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', () => {
        ipcRenderer.send('navigate-to', routes[id]);
      });
    }
  }
});
