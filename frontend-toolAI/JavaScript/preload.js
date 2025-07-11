window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
})

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  goToPage: (page) => ipcRenderer.send('navigate-to', page)
});

// const { contextBridge } = require('electron');
const dotenv = require('dotenv');
dotenv.config();

contextBridge.exposeInMainWorld('electronAPI', {
  getApiKey: () => Promise.resolve(process.env.OPENAI_API_KEY)
});

contextBridge.exposeInMainWorld('transcriber', {
    startTranscription: async (youtubeUrl) => {
        return await ipcRenderer.invoke('start-transcription', youtubeUrl);
    }
});

contextBridge.exposeInMainWorld("electronAPI", {
    createVideo: (data) => ipcRenderer.send("create-video", data)
});