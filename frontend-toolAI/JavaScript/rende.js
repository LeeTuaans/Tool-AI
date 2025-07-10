const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('videoUrl');
    const btn = document.getElementById('generateScriptBtn2');
    const output = document.getElementById('output');

    btn.addEventListener('click', async () => {
        const url = input.value.trim();
        if (!url) {
            output.textContent = 'Thiếu link video!';
            return;
        }

        output.textContent = '⏳ Đang xử lý...';

        try {
            let script = await ipcRenderer.invoke('start-transcription', url);
            script = script.replace(/^\s*Kịch bản:\s*/i, '');
            output.textContent = script.trim();
        } catch (err) {
            const errMsg = (typeof err === 'string' ? err : (err.message || err.toString()));

            if (errMsg.includes('Thiếu link video')) {
                output.textContent = 'Thiếu link video!';
            } else if (errMsg.includes('Link không hợp lệ') || errMsg.includes('not a valid URL')) {
                output.textContent = 'Link của bạn không đúng!';
            } else {
                output.textContent = '❌ Lỗi không xác định!';
                console.error('Chi tiết lỗi:', errMsg);
            }
        }
    });
});
