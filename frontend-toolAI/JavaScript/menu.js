// const { ipcRenderer } = require('electron');

// window.addEventListener('DOMContentLoaded', () => {
//   const routes = {
//     'goto-create-title': 'create_title.html',
//     'goto-create_script': 'create_script.html',
//     'goto-transcript': 'transcript.html',
//     'goto-TTS': 'TTS.html',
//     'goto-create-video': 'create_video.html'
//   };

//   for (const id in routes) {
//     const element = document.getElementById(id);
//     if (element) {
//       element.addEventListener('click', () => {
//         ipcRenderer.send('navigate-to', routes[id]);
//       });
//     }
//   }
// });


const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const routes = {
    'goto-create-title': 'create_title.html',
    'goto-create_script': 'create_script.html',
    'goto-transcript': 'transcript.html',
    'goto-TTS': 'TTS.html',
    // 'goto-create-video' không đưa vào đây
  };

  // Xử lý các mục còn lại
  for (const id in routes) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('click', () => {
        ipcRenderer.send('navigate-to', routes[id]);
      });
    }
  }

  // 👉 Bắt riêng cho nút tạo video
  const createVideoBtn = document.getElementById('goto-create-video');
  if (createVideoBtn) {
    createVideoBtn.addEventListener('click', () => {
      ipcRenderer.send('run-createvideo-python'); // Gửi tín hiệu tới main.js
    });
  }
});
