let currentAudioBuffer = null;

document.getElementById("speakBtn").addEventListener("click", async () => {
  const text = document.getElementById("text").value.trim();
  const voice = document.getElementById("voice").value;
  const speed = parseFloat(document.getElementById("speed").value);

  if (!text) return Toastify({ text: "Nhập văn bản trước!", style: { background: "#f00" }, duration: 3000 }).showToast();

  try {
    const buffer = await window.electronAPI.generateBufferOnly(text, voice, speed);
    if (!buffer) throw new Error("Không tạo được âm thanh");

    currentAudioBuffer = buffer;

    const blob = new Blob([buffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = document.getElementById("audioPreview");

    audio.pause();
    audio.src = url;
    await audio.load();
    audio.play();

    Toastify({ text: "Đã tạo giọng nói!", style: { background: "#4CAF50" }, duration: 3000 }).showToast();
  } catch (err) {
    console.error("Lỗi tạo âm thanh:", err);
    Toastify({ text: "Lỗi tạo âm thanh!", style: { background: "#f00" }, duration: 3000 }).showToast();
  }
});

document.getElementById("download").addEventListener("click", async () => {
  if (!currentAudioBuffer) {
    Toastify({ text: "Chưa có âm thanh để tải!", style: { background: "#f00" }, duration: 3000 }).showToast();
    return;
  }

  const success = await window.electronAPI.saveBuffer(currentAudioBuffer);
  Toastify({
    text: success ? "Đã tải file!" : "Hủy tải file!",
    style: { background: success ? "#4CAF50" : "#999" },
    duration: 3000
  }).showToast();
});






// document.getElementById('speakBtn').addEventListener('click', async () => {
//   const text = document.getElementById('text').value;
//   const voice = document.getElementById('voice').value;
//   const speed = document.getElementById('speed').value;

//   Toastify({
//     text: 'Đang tạo giọng nói...',
//     duration: 2000,
//     grativy: 'top',
//     position: 'right',
//     style: {backgroundColor: '#3498db'}
//   }).showToast();

//   const tempPath = await window.electronAPI.generateTTS(text, voice, speed);
//   if(tempPath){
//     document.getElementById('audioPreview').src = `file://${tempPath}`;
//     document.getElementById('audioPreview').play();
//     Toastify({
//       text: 'Phát giọng nói thành công! 🎉',
//           duration: 3000,
//           gravity: 'top',
//           position: 'right',
//           style: {backgroundColor: '#2ecc71'}
//     }).showToast();
//   }
//   else{
//     Toastify({
//       text: 'Thao tác bị huỷ hoặc lỗi!',
//       duration: 3000,
//       gravity: 'top',
//       position: 'right',
//       style: {backgroundColor: '#e74c3c'}
//     }).showToast();
//   }
// });

// document.getElementById('download').addEventListener('click', async () => {
//   const text = document.getElementById('text').value;
//   const voice = document.getElementById('voice').value;
//   const speed = document.getElementById('speed').value;

//   Toastify({
//     text: 'Đang tải về...',
//     duration: 2000,
//     gravity: 'top',
//     position: 'right',
//     style:{backgroundColor: '#9b59b6'}
//   }).showToast();

//   const path = await window.electronAPI.generateTTS(text, voice, speed);
//   if(path){
//     Toastify({
//       text: 'Tải thành công 🎧',
//       duration: 3000,
//       gravity: 'top',
//       position: 'right',
//       style: {backgroundColor: '#2ecc71'}
//     }).showToast();
//   }
//   else{
//     Toastify({
//       text: 'Tải thất bại hoặc huỷ bỏ!',
//       duration: 3000,
//       gravity: 'top',
//       position: 'right',
//       style: {backgroundColor: '#e74c3c'}
//     }).showToast();
//   }
// });