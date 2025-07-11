// require('dotenv').config(); 
const { spawn } = require('child_process');
const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('fs');
const gtts = require('google-tts-api');
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
      nodeIntegration: true,    //False nếu ko dùng preload
      contextIsolation: false,  //True nếu ko dùng preload
      // preload: path.join(__dirname, 'JavaScript', 'preload.js')
    }
  })
  
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'src', 'menu.html'))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();   // Hiển thị đúng lúc
    mainWindow.focus();  // Lấy focus để textarea hoạt động
  });
} 

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// Lắng nghe yêu cầu điều hướng từ renderer (menu.html)
ipcMain.on('navigate-to', (event, targetHtml) => {
  const filePath = path.join(__dirname, 'src', targetHtml);
  if (mainWindow) {
    mainWindow.loadFile(filePath).then(() => {
      mainWindow.focus(); // <-- ép cửa sổ lấy lại focus sau khi load
    });
  }
});

//Hàm chức năng----------------------------------------------------------------------------------------

// Gửi API key cho renderer
// ipcMain.handle('get-api-key', () => {
//   return process.env.OPENAI_API_KEY;
// });
require('dotenv').config();
ipcMain.handle('get-api-key', () => {
  return process.env.GOOGLE_API_KEY;
});
ipcMain.handle('get-gemini-key', () => {
  return process.env.GEMINI_API_KEY;
});

// IPC từ renderer.js
ipcMain.handle('generate-title', async (event, prompt) => {
  const result = await generateTitle(prompt);
  return result;
});

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

//Xuất mp3 giọng đọc gg tts
ipcMain.handle('generate-mp3', async (event, { text, lang = 'vi', slow = false }) => {
  if (!text.trim()) throw new Error('Text is empty');

  // Sử dụng getAllAudioBase64 để xử lý văn bản dài
  const audioChunks = await gtts.getAllAudioBase64(text, { lang, slow });

  // Tạo buffer từ từng đoạn base64 và nối lại
  const buffers = audioChunks.map(chunk => Buffer.from(chunk.base64, 'base64'));
  const finalBuffer = Buffer.concat(buffers);

  // Tạo tên file duy nhất
  function getFormattedDateTime() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${dd}-${mm}-${yy}_${hh}-${mi}-${ss}`;
  }

  const filename = `giongdoc_${getFormattedDateTime()}.mp3`;

  const audioDir = path.join(__dirname, 'audio');
  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const filepath = path.join(audioDir, filename);
  fs.writeFileSync(filepath, finalBuffer);

  return `file://${filepath}`; // Trả về để phát audio
});

ipcMain.handle('google-tts-play-direct', async (event, { text, lang = 'vi', slow = false }) => {
  if (!text.trim()) throw new Error('Text is empty');

  // Lấy audio dạng base64 từ Google TTS
  const audioChunks = await gtts.getAllAudioBase64(text, { lang, slow });
  const buffers = audioChunks.map(chunk => Buffer.from(chunk.base64, 'base64'));
  const finalBuffer = Buffer.concat(buffers);

  // Trả về dạng base64 để renderer phát
  return finalBuffer.toString('base64');
});


ipcMain.handle("google-tts-get-all", async (event, text) => {
  const urls = await gtts.getAllAudioUrls(text, {
    lang: 'vi',
    slow: false,
    host: 'https://translate.google.com',
  });
  return urls; // trả về mảng { shortText, url }
});

// Nhận từ renderer
ipcMain.on("create-video", (event, args) => {
    const pythonScriptPath = path.join(__dirname, "python", "createvideo.py");
    const jsonArgs = JSON.stringify(args);
    const python = spawn("python", [pythonScriptPath, jsonArgs]);

    python.stdout.on("data", (data) => {
        console.log(`[PYTHON]: ${data}`);
    });

    python.stderr.on("data", (data) => {
        console.error(`[PYTHON-ERROR]: ${data}`);
    });

    python.on("close", (code) => {
        console.log(`Python script kết thúc với mã: ${code}`);
    });
});
