const fs = require('fs');
const path = require('path');
const youtubedl = require('youtube-dl-exec');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

// === Cấu hình ===
// Đặt key trực tiếp ở đây nếu muốn
const AUDIO_DIR = path.join(__dirname, '../audio');

async function downloadAudio(youtubeUrl, audioPath) {
    try {
        await youtubedl(youtubeUrl, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: audioPath,
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: [
                'referer:youtube.com',
                'user-agent:googlebot'
            ]
        });
    } catch (err) {
        throw err;
    }
}

async function transcribeWhisper(audioPath) {
    const url = 'https://api.openai.com/v1/audio/transcriptions';
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioPath));
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders()
    };
    const response = await axios.post(url, formData, { headers });
    return response.data;
}

async function createScriptWithGPT(transcript, title = "") {
    const url = 'https://api.openai.com/v1/chat/completions';
    let prompt = "";
    if (title && title.trim()) {
        prompt = `Hãy tái tạo lại kịch bản hội thoại sáng tạo, mạch lạc từ nội dung transcript và tiêu đề video sau (giữ đúng ý, có thể diễn đạt lại cho hấp dẫn và chuyên nghiệp):\n\nTiêu đề: ${title}\n\nTranscript:\n${transcript}`;
    } else {
        prompt = `Hãy tái tạo lại kịch bản hội thoại sáng tạo, mạch lạc từ nội dung transcript sau (giữ đúng ý, có thể diễn đạt lại cho hấp dẫn và chuyên nghiệp):\n\nTranscript:\n${transcript}`;
    }
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
    };
    const data = {
        model: 'gpt-4',
        messages: [
            { role: 'system', content: 'Bạn là biên kịch chuyên nghiệp.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0.7
    };
    const response = await axios.post(url, data, { headers });
    return response.data.choices[0].message.content;
}

async function translateToVietnamese(text) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const prompt = `Dịch đoạn văn sau sang tiếng Việt một cách tự nhiên và chính xác nhất:\n\n${text}`;
    const headers = {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
    };
    const data = {
        model: 'gpt-4',
        messages: [
            { role: 'system', content: 'Bạn là một dịch giả chuyên nghiệp.' },
            { role: 'user', content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0.3
    };
    const response = await axios.post(url, data, { headers });
    return response.data.choices[0].message.content;
}

async function main() {
    const youtubeUrl = process.argv[2];
    const videoTitle = process.argv[3] || "";
    if (!youtubeUrl) {
        console.error('Thiếu link video!');
        process.exit(1);
    }
    if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
    const audioId = uuidv4();
    const audioPath = path.join(AUDIO_DIR, `${audioId}.mp3`);
    try {
        await downloadAudio(youtubeUrl, audioPath);
    } catch (e) {
        console.error('Không tải được audio:', e);
        process.exit(2);
    }
    let transcript = '';
    try {
        transcript = await transcribeWhisper(audioPath);
        // Dịch transcript sang tiếng Việt
        const transcriptVi = await translateToVietnamese(transcript);
        fs.writeFileSync(path.join(__dirname, '../transcript.txt'), transcriptVi, 'utf8');
    } catch (e) {
        console.error('Lỗi Whisper hoặc dịch:', e.response?.data || e);
        process.exit(3);
    }
    // try {
    //     fs.unlinkSync(audioPath);
    // } catch {}
    let script = '';
    try {
        script = await createScriptWithGPT(transcript, videoTitle);
        process.stdout.write(script);
    } catch (e) {
        console.error('Lỗi gọi OpenAI:', e.response?.data || e);
        process.exit(4);
    }
}

if (require.main === module) {
    main();
}
