// Modules to control application life and create native browser window
// require('dotenv').config(); 
const { spawn } = require('child_process');

const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const { ipcMain } = require('electron');
let mainWindow; // Cần nâng scope lên toàn cục để load lại file

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width:1000,
    height: 900,
    title: "Tool AI",
    show: false, // <- Quan trọng để đợi tới khi sẵn sàng
    webPreferences: {
      nodeIntegration: true, 
      contextIsolation: false,
      // preload: path.join(__dirname, 'preload.js')
    }
  })
  
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'src', 'login.html'))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();   // Hiển thị đúng lúc
    mainWindow.focus();  // Lấy focus để textarea hoạt động
  });
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
} 
// Lắng nghe yêu cầu điều hướng từ renderer (menu.html)
ipcMain.on('navigate-to', (event, targetHtml) => {
  const filePath = path.join(__dirname, 'src', targetHtml);
  if (mainWindow) {
    mainWindow.loadFile(filePath).then(() => {
      mainWindow.focus(); // <-- ép cửa sổ lấy lại focus sau khi load
    });
  }
});

// IPC từ renderer.js
ipcMain.handle('generate-title', async (event, prompt) => {
  const result = await generateTitle(prompt);
  return result;
});

// Gửi API key cho renderer
// ipcMain.handle('get-api-key', () => {
//   return process.env.OPENAI_API_KEY;
// });
require('dotenv').config();
ipcMain.handle('get-api-key', () => {
  return process.env.GOOGLE_API_KEY;
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

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle('start-transcription', async (event, youtubeUrl) => {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'JavaScript', 'transcribe_and_create_script.js');
        const py = spawn('node', [pythonScript, youtubeUrl], {
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        py.stdout.on('data', (data) => {
            // Lọc bỏ các dòng log không mong muốn như [dotenv@...]
            let text = data.toString();
            text = text.replace(/\[dotenv@.*?\][^\n]*\n?/g, '');
            output += text;
        });

        py.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        py.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(errorOutput || 'Unknown error');
            }
        });
    });
});
ipcMain.handle('get-gemini-key', () => {
  return process.env.GEMINI_API_KEY;
});