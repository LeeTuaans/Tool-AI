// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const {generateTTSBuffer} = require('./Javascript/tts') // Import your TTS service
// require('dotenv').config(); 
let mainWindow; // Cần nâng scope lên toàn cục để load lại file

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width:1000,
    height: 900,
    title: "Tool AI",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true, 
      contextIsolation: false,
      preload: path.join(__dirname,'Javascript', 'preload.js'), // Ensure the preload script is correctly referenced
    }
  })
  
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'src', 'login.html'))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}
// Lắng nghe yêu cầu điều hướng từ renderer (menu.html)
ipcMain.on('navigate-to', (event, targetHtml) => {
  const filePath = path.join(__dirname, 'src', targetHtml);
  if (mainWindow) {
    mainWindow.loadFile(filePath);
  }
});

// IPC từ renderer.js
ipcMain.handle('generate-title', async (event, prompt) => {
  const result = await generateTitle(prompt);
  return result;
});

// Gửi API key cho renderer
ipcMain.handle('get-api-key', () => {
  return process.env.OPENAI_API_KEY;
});
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// generate TTS buffer (chỉ tạo, không lưu)
ipcMain.handle('tts:generate-buffer', async (event, { text, voice, speed }) => {
  try {
    const buffer = await generateTTSBuffer(text, voice, speed);
    return buffer;
  } catch (err) {
    console.error('Lỗi generateBuffer:', err);
    return null;
  }
});

// Lưu buffer thành file
ipcMain.handle('tts:save-buffer', async (event, buffer) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Lưu file âm thanh',
      defaultPath: 'output.mp3',
      filters: [{ name: 'MP3 Files', extensions: ['mp3'] }]
    });
    if (!canceled && filePath) {
      fs.writeFileSync(filePath, Buffer.from(buffer));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Lỗi lưu file:', err);
    return false;
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
