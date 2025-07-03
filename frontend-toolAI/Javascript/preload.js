const { contextBridge, ipcRenderer } = require('electron')
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
});

//tts 
contextBridge.exposeInMainWorld('electronAPI', {
  generateBufferOnly: (text, voice, speed) =>
    ipcRenderer.invoke('tts:generate-buffer', { text, voice, speed }),
  saveBuffer: (buffer) =>
    ipcRenderer.invoke('tts:save-buffer', buffer)
});

// Nam
contextBridge.exposeInMainWorld('electronAPI', {
  goToPage: (page) => ipcRenderer.send('navigate-to', page)
});

// const { contextBridge } = require('electron');
const dotenv = require('dotenv');
dotenv.config();

contextBridge.exposeInMainWorld('electronAPI', {
  getApiKey: () => Promise.resolve(process.env.OPENAI_API_KEY)
});
