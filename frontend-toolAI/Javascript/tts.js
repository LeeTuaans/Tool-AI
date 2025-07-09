// Javascript/tts.js

class TTSManager {
  constructor() {
      this.synthesis = window.speechSynthesis;
      this.currentUtterance = null;
      this.voices = [];
      this.isInitialized = false;
      this.isRecording = false;
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

  // Phương thức mới để tạo audio file
  async generateAudioFile(text, options = {}) {
      if (!this.isInitialized) {
          throw new Error('TTS chưa được khởi tạo');
      }

      return new Promise((resolve, reject) => {
          try {
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

              // Sử dụng Web Audio API để capture
              this.captureAudioFromTTS(utterance, options)
                  .then(resolve)
                  .catch(reject);

          } catch (error) {
              reject(error);
          }
      });
  }

  async captureAudioFromTTS(utterance, options = {}) {
      return new Promise((resolve, reject) => {
          // Tạo một cách workaround để capture TTS audio
          // Vì Web Speech API không cho phép capture trực tiếp
          
          const chunks = [];
          let mediaRecorder;
          
          // Tạo silent audio stream để MediaRecorder có thể hoạt động
          navigator.mediaDevices.getUserMedia({ 
              audio: {
                  echoCancellation: false,
                  noiseSuppression: false,
                  autoGainControl: false
              } 
          }).then(stream => {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const source = audioContext.createMediaStreamSource(stream);
              const destination = audioContext.createMediaStreamDestination();
              
              // Tạo gain node để control volume
              const gainNode = audioContext.createGain();
              gainNode.gain.value = 0; // Mute microphone
              
              source.connect(gainNode);
              gainNode.connect(destination);
              
              mediaRecorder = new MediaRecorder(destination.stream, {
                  mimeType: 'audio/webm;codecs=opus'
              });
              
              mediaRecorder.ondataavailable = (event) => {
                  if (event.data.size > 0) {
                      chunks.push(event.data);
                  }
              };
              
              mediaRecorder.onstop = () => {
                  const blob = new Blob(chunks, { type: 'audio/webm' });
                  stream.getTracks().forEach(track => track.stop());
                  audioContext.close();
                  resolve(blob);
              };
              
              // Bắt đầu recording
              mediaRecorder.start(100);
              
              // Thiết lập TTS events
              utterance.onstart = () => {
                  if (options.onStart) options.onStart();
              };
              
              utterance.onend = () => {
                  setTimeout(() => {
                      mediaRecorder.stop();
                  }, 500);
                  if (options.onEnd) options.onEnd();
              };
              
              utterance.onerror = (error) => {
                  mediaRecorder.stop();
                  stream.getTracks().forEach(track => track.stop());
                  audioContext.close();
                  reject(error);
              };
              
              // Phát TTS
              this.synthesis.speak(utterance);
              
          }).catch(reject);
      });
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

// Hàm mới để tạo file audio
async function generateTTSAudio(text, options = {}) {
  return await ttsManager.generateAudioFile(text, options);
}
