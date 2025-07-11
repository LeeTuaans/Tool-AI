document.getElementById("createBtn").addEventListener("click", async () => {
    const log = document.getElementById("log");
    log.textContent = "⏳ Đang gửi dữ liệu...";

    const voiceFile = document.getElementById("voice").files[0];
    const bgmFile = document.getElementById("bgm").files[0];

    const voicePath = voiceFile?.path;
    const bgmPath = bgmFile?.path;

    const data = {
        title: document.getElementById("title").value,
        script: document.getElementById("script").value,
        voicePath: voicePath,
        bgmPath: bgmPath,
        voiceVolume: document.getElementById("voiceVolume").value,
        bgmVolume: document.getElementById("bgmVolume").value,
        mode: document.getElementById("mode").value,
        useGPU: document.getElementById("useGPU").checked
    };

    window.electronAPI.createVideo(data);
});
