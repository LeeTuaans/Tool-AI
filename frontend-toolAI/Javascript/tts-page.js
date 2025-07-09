// Javascript/tts-page.js

document.addEventListener("DOMContentLoaded", async () => {
  const voiceSelect = document.getElementById("voice");
  const speedSelect = document.getElementById("speed");
  const pitchSelect = document.getElementById("pitch");
  const volumeSelect = document.getElementById("volume");
  const textInput = document.getElementById("text");
  const speakBtn = document.getElementById("speakBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resumeBtn = document.getElementById("resumeBtn");
  const stopBtn = document.getElementById("stopBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const audioFormat = document.getElementById("audioFormat");
  const audioQuality = document.getElementById("audioQuality");
  const status = document.getElementById("status");
  const voiceInfo = document.getElementById("voiceInfo");
  const progressBar = document.getElementById("progressBar");
  const progressFill = document.getElementById("progressFill");

  // Hiển thị trạng thái
  function showStatus(message, type = 'success') {
      status.textContent = message;
      status.className = `status ${type}`;
      status.style.display = 'block';
      
      setTimeout(() => {
          status.style.display = 'none';
      }, 5000);
  }

  // Hiển thị progress bar
  function showProgress(percent) {
      progressBar.style.display = 'block';
      progressFill.style.width = percent + '%';
      
      if (percent >= 100) {
          setTimeout(() => {
              progressBar.style.display = 'none';
              progressFill.style.width = '0%';
          }, 2000);
      }
  }

  // Cập nhật trạng thái nút
  function updateButtonStates() {
      const isSpeaking = ttsManager.isSpeaking();
      const isPaused = ttsManager.isPaused();

      speakBtn.disabled = isSpeaking && !isPaused;
      pauseBtn.disabled = !isSpeaking || isPaused;
      resumeBtn.disabled = !isPaused;
      stopBtn.disabled = !isSpeaking;
  }

  // Khởi tạo TTS và load giọng nói
  try {
      showStatus('Đang tải giọng nói...', 'info');
      
      const voices = await getAvailableVoices();
      
      // Xóa option loading
      voiceSelect.innerHTML = '';
      
      if (voices.length === 0) {
          voiceSelect.innerHTML = '<option value="">Không có giọng nói nào</option>';
          showStatus('Không tìm thấy giọng nói nào!', 'error');
          return;
      }

      // Thêm option mặc định
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Chọn giọng nói...";
      voiceSelect.appendChild(defaultOption);

      // Sắp xếp giọng nói theo ngôn ngữ
      const sortedVoices = voices.sort((a, b) => {
          if (a.lang < b.lang) return -1;
          if (a.lang > b.lang) return 1;
          return a.name.localeCompare(b.name);
      });

      // Thêm các giọng nói vào select
      sortedVoices.forEach((voice, index) => {
          const option = document.createElement("option");
          option.value = voice.name;
          option.textContent = `${voice.name} (${voice.lang})`;
          
          // Đánh dấu giọng nói mặc định
          if (voice.default) {
              option.selected = true;
          }
          
          voiceSelect.appendChild(option);
      });

      showStatus(`Đã tải ${voices.length} giọng nói thành công!`, 'success');
      
      // Chọn giọng nói tiếng Việt nếu có
      const vietnameseVoice = voices.find(voice => 
          voice.lang.includes('vi') || voice.lang.includes('VN')
      );
      if (vietnameseVoice) {
          voiceSelect.value = vietnameseVoice.name;
          updateVoiceInfo(vietnameseVoice);
      }

  } catch (error) {
      console.error('Lỗi khởi tạo TTS:', error);
      showStatus('Lỗi khởi tạo Text-to-Speech!', 'error');
  }

  // Cập nhật thông tin giọng nói
  function updateVoiceInfo(voice) {
      if (voice) {
          voiceInfo.innerHTML = `
              <strong>Ngôn ngữ:</strong> ${voice.lang} | 
              <strong>Loại:</strong> ${voice.localService ? 'Cục bộ' : 'Trực tuyến'} |
              <strong>Mặc định:</strong> ${voice.default ? 'Có' : 'Không'}
          `;
      } else {
          voiceInfo.innerHTML = '';
      }
  }

  // Sự kiện thay đổi giọng nói
  voiceSelect.addEventListener('change', () => {
      const selectedVoiceName = voiceSelect.value;
      const selectedVoice = ttsManager.getVoices().find(voice => voice.name === selectedVoiceName);
      updateVoiceInfo(selectedVoice);
  });

  // Sự kiện nút Phát giọng nói
  speakBtn.addEventListener("click", () => {
      const text = textInput.value.trim();
      
      if (!text) {
          showStatus('Vui lòng nhập văn bản cần đọc!', 'error');
          textInput.focus();
          return;
      }

      const voiceName = voiceSelect.value;
      const rate = parseFloat(speedSelect.value);
      const pitch = parseFloat(pitchSelect.value);
      const volume = parseFloat(volumeSelect.value);

      try {
          ttsManager.speak(text, {
              voiceName,
              rate,
              pitch,
              volume,
              onStart: () => {
                  showStatus('Đang phát giọng nói...', 'info');
                  updateButtonStates();
              },
              onEnd: () => {
                  showStatus('Hoàn thành phát giọng nói!', 'success');
                  updateButtonStates();
              },
              onError: (error) => {
                  showStatus(`Lỗi: ${error}`, 'error');
                  updateButtonStates();
              },
              onPause: () => {
                  showStatus('Đã tạm dừng', 'info');
                  updateButtonStates();
              },
              onResume: () => {
                  showStatus('Đã tiếp tục', 'info');
                  updateButtonStates();
              }
          });
          
          updateButtonStates();
          
      } catch (error) {
          console.error('Lỗi phát giọng nói:', error);
          showStatus('Lỗi khi phát giọng nói!', 'error');
      }
  });

  // Sự kiện nút Tạm dừng
  pauseBtn.addEventListener("click", () => {
      try {
          pauseSpeech();
          updateButtonStates();
      } catch (error) {
          console.error('Lỗi tạm dừng:', error);
          showStatus('Lỗi khi tạm dừng!', 'error');
      }
  });

  // Sự kiện nút Tiếp tục
  resumeBtn.addEventListener("click", () => {
      try {
          resumeSpeech();
          updateButtonStates();
      } catch (error) {
          console.error('Lỗi tiếp tục:', error);
          showStatus('Lỗi khi tiếp tục!', 'error');
      }
  });

  // Sự kiện nút Dừng
  stopBtn.addEventListener("click", () => {
      try {
          stopSpeech();
          showStatus('Đã dừng phát giọng nói', 'success');
          updateButtonStates();
      } catch (error) {
          console.error('Lỗi dừng:', error);
          showStatus('Lỗi khi dừng!', 'error');
      }
  });

  // Sự kiện nút Tải xuống
  downloadBtn.addEventListener("click", async () => {
      const text = textInput.value.trim();
      
      if (!text) {
          showStatus('Vui lòng nhập văn bản cần tải xuống!', 'error');
          textInput.focus();
          return;
      }

      const voiceName = voiceSelect.value;
      const rate = parseFloat(speedSelect.value);
      const pitch = parseFloat(pitchSelect.value);
      const volume = parseFloat(volumeSelect.value);
      const format = audioFormat.value;
      const quality = parseInt(audioQuality.value);

      try {
          // Disable nút download
          downloadBtn.disabled = true;
          downloadBtn.textContent = '⏳ Đang tạo file...';
          
          showStatus('Đang tạo file âm thanh...', 'info');
          showProgress(10);

          // Tạo tên file
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `tts-${timestamp}.${format}`;

          // Hiển thị dialog chọn nơi lưu
          const saveResult = await window.electronAPI.showSaveDialog({
              title: 'Lưu file âm thanh',
              defaultPath: fileName,
              filters: [
                  { name: 'Audio Files', extensions: [format] },
                  { name: 'All Files', extensions: ['*'] }
              ]
          });

          if (saveResult.canceled) {
              showStatus('Đã hủy tải xuống', 'info');
              resetDownloadButton();
              return;
          }

          showProgress(30);

          // Tạo audio blob từ TTS
          const audioBlob = await generateTTSAudioBlob(text, {
              voiceName,
              rate,
              pitch,
              volume,
              format,
              quality
          });

          showProgress(70);

          // Chuyển blob thành buffer
          const arrayBuffer = await audioBlob.arrayBuffer();
          const buffer = new Uint8Array(arrayBuffer);

          showProgress(90);

          // Lưu file
          const saveFileResult = await window.electronAPI.saveFile(saveResult.filePath, buffer);

          if (saveFileResult.success) {
              showProgress(100);
              showStatus(`Đã lưu file thành công: ${saveResult.filePath}`, 'success');
          } else {
              throw new Error(saveFileResult.error);
          }

      } catch (error) {
          console.error('Lỗi tải xuống:', error);
          showStatus(`Lỗi khi tải xuống: ${error.message}`, 'error');
      } finally {
          resetDownloadButton();
      }
  });

  // Reset nút download
  function resetDownloadButton() {
      downloadBtn.disabled = false;
      downloadBtn.textContent = '💾 Tải xuống âm thanh';
  }

  // Hàm tạo audio blob từ TTS
  async function generateTTSAudioBlob(text, options) {
      return new Promise((resolve, reject) => {
          try {
              // Tạo utterance
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.rate = options.rate || 1;
              utterance.pitch = options.pitch || 1;
              utterance.volume = options.volume || 1;

              // Chọn giọng nói
              if (options.voiceName) {
                  const selectedVoice = ttsManager.getVoices().find(voice => voice.name === options.voiceName);
                  if (selectedVoice) {
                      utterance.voice = selectedVoice;
                  }
              }

              // Sử dụng workaround để capture audio
              captureSystemAudio(utterance, options.format)
                  .then(resolve)
                  .catch(reject);

          } catch (error) {
              reject(error);
          }
      });
  }

  // Hàm capture system audio (workaround)
  async function captureSystemAudio(utterance, format) {
      return new Promise((resolve, reject) => {
          // Tạo audio context
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
          // Tạo buffer để lưu audio data
          const chunks = [];
          
          // Tạo MediaRecorder với dummy stream
          navigator.mediaDevices.getUserMedia({ 
              audio: {
                  echoCancellation: false,
                  noiseSuppression: false,
                  autoGainControl: false,
                  sampleRate: 44100
              } 
          }).then(stream => {
              // Tạo silent stream
              const source = audioContext.createMediaStreamSource(stream);
              const destination = audioContext.createMediaStreamDestination();
              const gainNode = audioContext.createGain();
              
              gainNode.gain.value = 0; // Mute microphone
              source.connect(gainNode);
              gainNode.connect(destination);

              // Tạo MediaRecorder
              const mimeType = getMediaRecorderMimeType(format);
              const mediaRecorder = new MediaRecorder(destination.stream, {
                  mimeType: mimeType,
                  audioBitsPerSecond: 128000
              });

              mediaRecorder.ondataavailable = (event) => {
                  if (event.data.size > 0) {
                      chunks.push(event.data);
                  }
              };

              mediaRecorder.onstop = () => {
                  const blob = new Blob(chunks, { type: mimeType });
                  
                  // Cleanup
                  stream.getTracks().forEach(track => track.stop());
                  audioContext.close();
                  
                  resolve(blob);
              };

              // Bắt đầu recording
              mediaRecorder.start(100);

              // Setup TTS events
              utterance.onstart = () => {
                  console.log('TTS started for recording');
              };

              utterance.onend = () => {
                  console.log('TTS ended, stopping recording');
                  setTimeout(() => {
                      mediaRecorder.stop();
                  }, 1000); // Đợi 1 giây để đảm bảo capture hết
              };

              utterance.onerror = (error) => {
                  console.error('TTS error:', error);
                  mediaRecorder.stop();
                  stream.getTracks().forEach(track => track.stop());
                  audioContext.close();
                  reject(error);
              };

              // Phát TTS
              speechSynthesis.speak(utterance);

          }).catch(reject);
      });
    }

    // Hàm lấy MIME type cho MediaRecorder
    function getMediaRecorderMimeType(format) {
        const mimeTypes = {
            'webm': 'audio/webm;codecs=opus',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
        };

        const preferredType = mimeTypes[format];
        
        // Kiểm tra support
        if (preferredType && MediaRecorder.isTypeSupported(preferredType)) {
            return preferredType;
        }

        // Fallback options
        const fallbacks = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];

        for (const type of fallbacks) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }

        return 'audio/webm'; // Default fallback
    }

    // Phím tắt
    document.addEventListener('keydown', (e) => {
        // Ctrl + Enter: Phát giọng nói
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (!speakBtn.disabled) {
                speakBtn.click();
            }
        }
        
        // Ctrl + Space: Tạm dừng/Tiếp tục
        if (e.ctrlKey && e.key === ' ') {
            e.preventDefault();
            if (!resumeBtn.disabled) {
                resumeBtn.click();
            } else if (!pauseBtn.disabled) {
                pauseBtn.click();
            }
        }
        
        // Escape: Dừng
        if (e.key === 'Escape') {
            e.preventDefault();
            if (!stopBtn.disabled) {
                stopBtn.click();
            }
        }

        // Ctrl + S: Tải xuống
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (!downloadBtn.disabled) {
                downloadBtn.click();
            }
        }
    });

    // Cập nhật trạng thái nút ban đầu
    updateButtonStates();

    // Kiểm tra định kỳ trạng thái TTS
    setInterval(updateButtonStates, 500);

    // Auto-save settings to localStorage
    function saveSettings() {
        const settings = {
            voice: voiceSelect.value,
            speed: speedSelect.value,
            pitch: pitchSelect.value,
            volume: volumeSelect.value,
            audioFormat: audioFormat.value,
            audioQuality: audioQuality.value
        };
        localStorage.setItem('tts-settings', JSON.stringify(settings));
    }

    // Load settings from localStorage
    function loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('tts-settings'));
            if (settings) {
                if (settings.voice) voiceSelect.value = settings.voice;
                if (settings.speed) speedSelect.value = settings.speed;
                if (settings.pitch) pitchSelect.value = settings.pitch;
                if (settings.volume) volumeSelect.value = settings.volume;
                if (settings.audioFormat) audioFormat.value = settings.audioFormat;
                if (settings.audioQuality) audioQuality.value = settings.audioQuality;
            }
        } catch (error) {
            console.log('Không thể tải cài đặt:', error);
        }
    }

    // Save settings when changed
    [voiceSelect, speedSelect, pitchSelect, volumeSelect, audioFormat, audioQuality].forEach(element => {
        element.addEventListener('change', saveSettings);
    });

    // Load settings on startup
    setTimeout(loadSettings, 1000); // Đợi voices load xong

    // Hiển thị thông tin hệ thống
    console.log(`
    🎤 TEXT TO SPEECH TOOL
    =====================
    
    📋 HƯỚNG DẪN SỬ DỤNG:
    - Nhập văn bản vào ô text
    - Chọn giọng nói, tốc độ, cao độ
    - Nhấn "Phát giọng nói" để nghe
    - Nhấn "Tải xuống âm thanh" để lưu file
    
    ⌨️ PHÍM TẮT:
    - Ctrl + Enter: Phát giọng nói
    - Ctrl + Space: Tạm dừng/Tiếp tục
    - Escape: Dừng phát
    - Ctrl + S: Tải xuống âm thanh
    
    🔧 TÍNH NĂNG:
    - Hỗ trợ nhiều giọng nói
    - Điều chỉnh tốc độ, cao độ, âm lượng
    - Tải xuống file âm thanh (WebM, WAV, MP3)
    - Chọn nơi lưu file
    - Lưu cài đặt tự động
    
    📱 TRẠNG THÁI:
    - Voices loaded: ${ttsManager.getVoices().length}
    - Audio context: ${window.AudioContext ? 'Supported' : 'Not supported'}
    - MediaRecorder: ${window.MediaRecorder ? 'Supported' : 'Not supported'}
    `);
});

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    const status = document.getElementById('status');
    if (status) {
        status.textContent = `Lỗi: ${event.error.message}`;
        status.className = 'status error';
        status.style.display = 'block';
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    const status = document.getElementById('status');
    if (status) {
        status.textContent = `Lỗi: ${event.reason}`;
        status.className = 'status error';
        status.style.display = 'block';
    }
});
