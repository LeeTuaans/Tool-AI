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
    const status = document.getElementById("status");
    const voiceInfo = document.getElementById("voiceInfo");

    // Hiển thị trạng thái
    function showStatus(message, type = 'success') {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
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
            volume: volumeSelect.value
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
            }
        } catch (error) {
            console.log('Không thể tải cài đặt:', error);
        }
    }

    // Save settings when changed
    [voiceSelect, speedSelect, pitchSelect, volumeSelect].forEach(element => {
        element.addEventListener('change', saveSettings);
    });

    // Load settings on startup
    setTimeout(loadSettings, 1000); // Đợi voices load xong

    // Hiển thị thông tin hệ thống
    console.log(`
    🎤 TEXT TO SPEECH TOOL
    =====================
    📱 TRẠNG THÁI:
    - Voices loaded: ${ttsManager.getVoices().length}
    - Web Speech API: ${window.speechSynthesis ? 'Supported' : 'Not supported'}
    `);
});

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
