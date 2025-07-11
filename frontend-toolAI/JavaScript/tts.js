
class TTSManager {
  constructor() {
      this.synthesis = window.speechSynthesis;
      this.currentUtterance = null;
      this.voices = [];
      this.isInitialized = false;
  }

  async initialize() {
      return new Promise((resolve) => {
          if (this.synthesis.getVoices().length > 0) {
              this.voices = this.synthesis.getVoices();
              this.isInitialized = true;
              resolve(this.voices);
          } else {
              this.synthesis.onvoiceschanged = () => {
                  this.voices = this.synthesis.getVoices();
                  this.isInitialized = true;
                  resolve(this.voices);
              };
          }
      });
  }

  getVoices() {
      return this.voices;
  }

  speak(text, options = {}) {
      if (!this.isInitialized) {
          throw new Error('TTS chưa được khởi tạo');
      }

      // Dừng giọng nói hiện tại
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Thiết lập các tùy chọn
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;

      // Chọn giọng nói
      if (options.voiceName) {
          const selectedVoice = this.voices.find(voice => voice.name === options.voiceName);
          if (selectedVoice) {
              utterance.voice = selectedVoice;
          }
      }

      // Thiết lập các sự kiện
      utterance.onstart = () => {
          console.log('Bắt đầu phát giọng nói');
          if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
          console.log('Kết thúc phát giọng nói');
          if (options.onEnd) options.onEnd();
      };

      utterance.onerror = (event) => {
          console.error('Lỗi TTS:', event.error);
          if (options.onError) options.onError(event.error);
      };

      utterance.onpause = () => {
          console.log('Tạm dừng giọng nói');
          if (options.onPause) options.onPause();
      };

      utterance.onresume = () => {
          console.log('Tiếp tục giọng nói');
          if (options.onResume) options.onResume();
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
      
      return utterance;
  }

  pause() {
      if (this.synthesis.speaking && !this.synthesis.paused) {
          this.synthesis.pause();
      }
  }

  resume() {
      if (this.synthesis.paused) {
          this.synthesis.resume();
      }
  }

  stop() {
      this.synthesis.cancel();
      this.currentUtterance = null;
  }

  isSpeaking() {
      return this.synthesis.speaking;
  }

  isPaused() {
      return this.synthesis.paused;
  }
}

// Tạo instance global
const ttsManager = new TTSManager();

// Export các function để tương thích với code cũ
async function getAvailableVoices() {
  return await ttsManager.initialize();
}

function speakText(text, voiceName = '', rate = 1, pitch = 1, volume = 1) {
  return ttsManager.speak(text, {
      voiceName,
      rate,
      pitch,
      volume
  });
}

function pauseSpeech() {
  ttsManager.pause();
}

function resumeSpeech() {
  ttsManager.resume();
}

function stopSpeech() {
  ttsManager.stop();
}
const { ipcRenderer } = require('electron');
document.getElementById("speakBtn").addEventListener("click", async () => {
  const selectedVoice = document.getElementById("voice").value;
  const text = document.getElementById("text").value;
  const speed = parseFloat(document.getElementById("speed").value);
  const pitch = parseFloat(document.getElementById("pitch").value);

  if (selectedVoice === "__google__") {
    try {
      const urls = await ipcRenderer.invoke("google-tts-get-all", text);
        playAudioSequentially(urls.map(u => u.url));
      const audio = new Audio(url);
      audio.play();
    } catch (error) {
      console.error("Google TTS Error:", error);
    }
  } else {
    ttsManager.speak(text, {
      voiceName: selectedVoice,
      rate: speed,
      pitch: pitch
    });
  }
});

function playAudioSequentially(urls) {
  if (!urls || urls.length === 0) return;

  let index = 0;
  const audio = new Audio(urls[index]);

  audio.addEventListener("ended", () => {
    index++;
    if (index < urls.length) {
      audio.src = urls[index];
      audio.play();
    }
  });

  audio.play();
}
