const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('transcriber', {
    startTranscription: async (youtubeUrl) => {
        try {
            return await ipcRenderer.invoke('start-transcription', youtubeUrl);
        } catch (error) {
            throw error;
        }
    }
});