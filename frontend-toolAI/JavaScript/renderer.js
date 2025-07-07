window.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('videoUrl');
    const btn = document.getElementById('generateScriptBtn');
    const output = document.getElementById('output');
    btn.addEventListener('click', async () => {
        output.textContent = 'Đang xử lý...';
        try {
            let script = await window.transcriber.startTranscription(input.value.trim());
            
            script = script.replace(/^\s*Kịch bản:\s*/i, '');
            output.textContent = script.trim();
        } catch (err) {
            output.textContent = '❌ Lỗi: ' + err;
        }
    });
});