// script.js
import { auth, database } from "./firebaseConfig.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";

// ===================== XỬ LÝ SỰ KIỆN =====================
document.addEventListener("DOMContentLoaded", () => {
  // Xử lý Đăng Nhập
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const email = document.getElementById("email-login").value.trim();
      const password = document.getElementById("password-login").value;

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        alert(`Chào mừng, ${email}`);
        window.location.href = "menu.html";
      } catch (error) {
        alert("Đăng nhập thất bại: Bạn sai gmail hoặc mật khẩu");
      }
    });
  }

  // Xử lý Đăng Ký
  const registerBtn = document.getElementById("register-btn");
  if (registerBtn) {
    registerBtn.addEventListener("click", async () => {
      const fullName = document.getElementById("fullname").value.trim();
      const email = document.getElementById("email-register").value.trim();
      const password = document.getElementById("password-register").value;
      const confirmPassword = document.getElementById("confirm-password").value;

      if (!fullName || !email || !password || !confirmPassword) {
        return alert("Vui lòng điền đầy đủ thông tin.");
      }

      if (password !== confirmPassword) {
        return alert("Mật khẩu xác nhận không khớp.");
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Lưu vào Realtime Database
        await set(ref(database, "users/" + user.uid), {
          fullName: fullName,
          email: email,
          password: password
        });

        alert(`Đăng ký thành công! Chào mừng, ${fullName}`);
        window.location.href = "login.html";
      } catch (error) {
        alert("Lỗi đăng ký: " + error.message);
      }
    });
  }
});
