const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

function createWindow() {
    const win = new BrowserWindow({
        width: 700,
        height: 500,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        }
    });

    // Sửa đường dẫn để load giao diện transcript.html
    win.loadFile(path.join(__dirname, 'src', 'transcript.html'));
}

app.whenReady().then(createWindow);

ipcMain.handle('start-transcription', async (event, youtubeUrl) => {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'scripts', 'transcribe_and_create_script.js');
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