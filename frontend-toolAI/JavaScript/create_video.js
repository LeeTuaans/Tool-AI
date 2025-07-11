document.addEventListener("DOMContentLoaded", () => {
  const voiceSlider = document.getElementById("voice-volume");
  const voiceValue = document.getElementById("voice-volume-value");
  const bgmSlider = document.getElementById("bgm-volume");
  const bgmValue = document.getElementById("bgm-volume-value");

  voiceSlider.addEventListener("input", () => {
    voiceValue.textContent = voiceSlider.value;
  });

  bgmSlider.addEventListener("input", () => {
    bgmValue.textContent = bgmSlider.value;
  });

  document.getElementById("start-video-btn").addEventListener("click", async () => {
    const title = document.getElementById("title-input").value;
    const script = document.getElementById("script-input").value;
    const voicePath = document.getElementById("voice-file").files[0]?.path;
    const bgmPath = document.getElementById("bgm-file").files[0]?.path;
    const voiceVolume = voiceSlider.value;
    const bgmVolume = bgmSlider.value;
    const useGPU = document.getElementById("gpu-checkbox").checked;
    const mode = document.getElementById("processing-mode").value;

    if (!title || !script || !voicePath) {
      alert("Vui lòng nhập tiêu đề, kịch bản và chọn file giọng đọc!");
      return;
    }

    const data = {
      title,
      script,
      voicePath,
      bgmPath,
      voiceVolume,
      bgmVolume,
      useGPU,
      mode,
    };

    try {
      const result = await window.api.startVideoGenerator(data);
      alert(result);
    } catch (error) {
      alert("Lỗi khi tạo video: " + error);
    }
  });
});
