// document.getElementById("generate-btn").addEventListener("click", async () => {
//   const videoContent = document.getElementById("video-title").value.trim();
//   const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');

//   if (!videoContent) {
//     alert("Vui lòng nhập nội dung video.");
//     return;
//   }

//   // Tạo prompt cho ChatGPT
//   let options = Array.from(checkboxes).map(cb => cb.value).join(", ");
//   let prompt = `Tạo tiêu đề video YouTube hấp dẫn, chuẩn SEO cho nội dung sau: "${videoContent}".`;
//   if (options) {
//     prompt += ` Yêu cầu thêm: ${options}.`;
//   }
// console.log("Đang gửi prompt:", prompt);

//   // Gửi API request
//   try {
//     const response = await fetch("https://api.openai.com/v1/chat/completions", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${apiKey}`
//       },
//       body: JSON.stringify({
//         model: "gpt-4", // hoặc gpt-3.5-turbo nếu bạn không có quyền GPT-4
//         messages: [{ role: "user", content: prompt }]
//       })
//     });

//     if (!response.ok) {
//       const error = await response.text();
//       alert(`Lỗi API: ${response.status}\n${error}`);
//       return;
//     }

//     const data = await response.json();
//     console.log("Kết quả trả về:", data);
//     const content = data.choices[0].message.content;

//     // Phân tách nội dung theo dòng và hiển thị
//     const lines = content.split('\n').filter(line => line.trim() !== '');
//     const suggestions = document.getElementById("suggested-titles");
//     const others = document.getElementById("other-suggestions");
//     suggestions.innerHTML = "";
//     others.innerHTML = "";

// lines.forEach((line, index) => {
//   const li = document.createElement("li");
//   li.textContent = line.replace(/^[-•"“”'•\d.|\s]+/, '').trim();

//   if (index === 0) {
//     // Gợi ý đầu tiên → Tiêu đề chính
//     suggestions.appendChild(li);
//   } else {
//     // Các dòng sau → Gợi ý khác
//     others.appendChild(li);
//   }
// });



//   } catch (error) {
//     alert("Đã xảy ra lỗi khi gọi API.\n" + error);
//     console.error(error);
//   }
// });
//-----------------------------------------------------------------------------------------------------
// renderer.js
require('dotenv').config();
const apiKey = process.env.OPENAI_API_KEY;

// ====== GẮN SỰ KIỆN CHO CÁC TRANG KHÁC NHAU ======
window.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname;

  if (currentPage.includes("create_title.html")) {
    setupTitleGenerator();
  } else if (currentPage.includes("create_script.html")) {
    setupScriptGenerator();
  }
});

// ====== HÀM DÙNG CHUNG ======
function getCheckedOptions() {
  const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => cb.value).join(", ");
}

async function fetchGPTResponse(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Lỗi API: ${response.status}\n${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}



// ====== CHỨC NĂNG TẠO TIÊU ĐỀ ======
function setupTitleGenerator() {
  const btn = document.getElementById("generate-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const content = document.getElementById("video-title")?.value.trim();
    if (!content) return alert("Vui lòng nhập nội dung video.");

    let prompt = `Tạo tiêu đề video YouTube hấp dẫn, chuẩn SEO cho nội dung sau: "${content}".`;
    const options = getCheckedOptions();
    if (options) prompt += ` Yêu cầu thêm: ${options}.`;

    try {
      const responseText = await fetchGPTResponse(prompt);
      const lines = responseText.split("\n").filter(l => l.trim());

      const suggested = document.getElementById("suggested-titles");
      const others = document.getElementById("other-suggestions");
      if (!suggested || !others) throw new Error("Không tìm thấy vùng hiển thị.");

      suggested.innerHTML = "";
      others.innerHTML = "";

      lines.forEach((line, index) => {
        const li = document.createElement("li");
      let cleaned = line
        .replace(/^[-•"“”'•\d.|\s]+/, '')
        .replace(/\s*\|?\s*SEO Optimized"?$/i, '') 
        .trim();
      li.textContent = cleaned;
        (index === 0 ? suggested : others).appendChild(li);
      });

    } catch (err) {
      alert("Đã xảy ra lỗi khi gọi API.\n" + err.message);
    }
  });
}

// ====== CHỨC NĂNG TẠO KỊCH BẢN ======
function setupScriptGenerator() {
  const btn = document.getElementById("generate-script-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const title = document.getElementById("video-title")?.value.trim();
    if (!title) return alert("Vui lòng nhập tiêu đề video.");

    let prompt = `Viết kịch bản chi tiết, hấp dẫn cho video YouTube với tiêu đề: "${title}".`;
    const options = getCheckedOptions();
    if (options) prompt += ` Yêu cầu thêm: ${options}.`;

    try {
      const result = await fetchGPTResponse(prompt);
      const lines = result.split('\n').filter(line => line.trim());

      const main = document.getElementById("suggested-script");
      const others = document.getElementById("other-script-suggestions");
      if (!main || !others) throw new Error("Không tìm thấy vùng hiển thị kịch bản.");

      main.innerHTML = "";
      others.innerHTML = "";

      lines.forEach((line, index) => {
        const li = document.createElement("li");
        li.textContent = line.replace(/^[-•"“”'•\d.|\s]+/, '').trim();
        (index === 0 ? main : others).appendChild(li);
      });

    } catch (err) {
      alert("Đã xảy ra lỗi khi gọi API.\n" + err.message);
    }
  });
}

//code dưới là thử focus nội dung trên chức năng
const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  // Gửi yêu cầu focus từ renderer
  ipcRenderer.send('request-window-focus');
});
ipcMain.on('request-window-focus', () => {
  if (mainWindow) {
    mainWindow.focus(); // ép cửa sổ lấy lại quyền nhập liệu
  }
});