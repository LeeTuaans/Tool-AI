const fs = require('fs');
const path = require('path');
const youtubedl = require('youtube-dl-exec');
const { v4: uuidv4 } = require('uuid');
const { execFileSync } = require('child_process');
const axios = require('axios');

const AUDIO_DIR = path.resolve(__dirname, '../audio');
  // Thay bằng API thật
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function downloadAudio(youtubeUrl, audioPath) {
    await youtubedl(youtubeUrl, {
        extractAudio: true,
        audioFormat: 'mp3',
        output: audioPath
    });
}

async function createScriptWithGemini(transcript) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    // Bước 1: Tạo tiêu đề tự động từ transcript
    const titlePrompt = `Dựa trên đoạn transcript sau, hãy đặt một tiêu đề ngắn gọn, hấp dẫn, phản ánh đúng nội dung:\n\n${transcript}`;
    const titleData = { contents: [{ parts: [{ text: titlePrompt }] }] };
    const titleRes = await axios.post(url, titleData);
    const generatedTitle = titleRes.data.candidates[0].content.parts[0].text.trim();

    // Bước 2: Tạo kịch bản dựa vào transcript + tiêu đề
    const scriptPrompt = `Dựa trên transcript và tiêu đề sau, hãy viết một kịch bản hội thoại ngắn. 
Kịch bản phải rõ ràng, hấp dẫn, có nhân vật cụ thể và tình huống cụ thể. 
⚠️ Không được viết phần giới thiệu, hãy bắt đầu trực tiếp bằng **Bối cảnh** và **Nhân vật**.

Tiêu đề: ${generatedTitle}

Transcript:
${transcript}`;

    const scriptData = { contents: [{ parts: [{ text: scriptPrompt }] }] };
    const scriptRes = await axios.post(url, scriptData);
    return scriptRes.data.candidates[0].content.parts[0].text;
}


async function main() {
    const youtubeUrl = process.argv[2];
    if (!youtubeUrl) {
        console.error("Thiếu link video!");
        process.exit(1);
    }
    if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

    const audioId = uuidv4();
    const audioPath = path.join(AUDIO_DIR, `${audioId}.mp3`);

    try 
    {
        await downloadAudio(youtubeUrl, audioPath);
    } 
    catch (err) {
        if (err.stderr && err.stderr.includes('is not a valid URL')) {
            console.error("Link không hợp lệ");
        } else {
            console.error("Không tải được audio:", err.message || err);
        }
        process.exit(2);
    }


    try {
        execFileSync('python', ['whisper_transcribe.py', audioPath], { stdio: 'inherit' });
    } catch (err) {
        console.error("Lỗi khi chạy Whisper:", err.message);
        process.exit(3);
    }

    const transcriptPath = path.resolve(__dirname, '../transcript/transcript.txt');
    const transcript = fs.readFileSync(transcriptPath, 'utf8');

    try {
        const script = await createScriptWithGemini(transcript);
        process.stdout.write(script);
    } catch (err) {
        console.error("Lỗi gọi Gemini:", err.response?.data || err);
        process.exit(4);
    }
}

if (require.main === module) {
    main();
}
const TRANSCRIPT_DIR = path.resolve(__dirname, '');

if (!fs.existsSync(TRANSCRIPT_DIR)) {
    fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true });
}