require('dotenv').config();
// const apiKey = process.env.OPENAI_API_KEY;
const apiKey = process.env.GOOGLE_API_KEY;

// ====== GẮN SỰ KIỆN CHO CÁC TRANG KHÁC NHAU ======
window.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generate-btn");
  const generateScriptBtn = document.getElementById("generate-script-btn");

  if (generateBtn) {
    setupTitleGenerator();
  }

  if (generateScriptBtn) {
    setupScriptGenerator();
  }
});


// ====== HÀM DÙNG CHUNG ======
function getCheckedOptions() {
  const checkboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => cb.value).join(", ");
}
//funtion của ChatGPT
// async function fetchGPTResponse(prompt) {
//   const response = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer ${apiKey}`
//     },
//     body: JSON.stringify({
//       model: "gpt-4o",
//       messages: [{ role: "user", content: prompt }]
//     })
//   });

//   if (!response.ok) {
//     const error = await response.text();
//     throw new Error(`Lỗi API: ${response.status}\n${error}`);
//   }

//   const data = await response.json();
//   return data.choices[0].message.content;
// }

async function fetchGPTResponse(prompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Lỗi API Gemini: ${response.status}\n${error}`);
  }

  const data = await response.json();
  const candidates = data.candidates;

  if (!candidates || candidates.length === 0) {
    throw new Error("Không có phản hồi từ Gemini.");
  }

  return candidates[0].content.parts[0].text;
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
          .replace(/[*_~`#>]+/g, '') // Xóa tất cả ký tự markdown như **, __, ~~, ``, #,...
          .replace(/^[-•"“”'•\d.|\s]+/, '') // Xóa các ký tự đầu dòng như số thứ tự, gạch đầu dòng
          .replace(/\s*\|?\s*SEO Optimized"?$/i, '') // Xóa phần đuôi SEO
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
  
        let cleaned = line
          .replace(/[*_~`#>]+/g, '') // Xóa tất cả ký tự markdown như **, __, ~~, ``, #,...
          .replace(/^[-•"“”'•\d.|\s]+/, '') // Xóa các ký tự đầu dòng như số thứ tự, gạch đầu dòng
          .replace(/\s*\|?\s*SEO Optimized"?$/i, '') // Xóa phần đuôi SEO
          .trim();
        li.textContent = cleaned;
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