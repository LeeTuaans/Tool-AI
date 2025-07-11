import os
import tkinter as tk
from tkinter import messagebox, ttk, scrolledtext, filedialog
import requests
import google.generativeai as genai
from googletrans import Translator
import ffmpeg
import subprocess
import re
from datetime import datetime
import threading
from pydub import AudioSegment
import time
from pathlib import Path
from ttkthemes import ThemedTk
import markdown
from bs4 import BeautifulSoup
import spacy
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
import torch
import nvidia_smi

# Cấu hình API Key
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")
GENAI_API_KEY = os.getenv("GENAI_API_KEY")
genai.configure(api_key=GENAI_API_KEY)

# Tạo thư mục output và temp
OUTPUT_DIR = Path(__file__).parent / "output"
TEMP_DIR = Path(__file__).parent / "temp"
for dir in [OUTPUT_DIR, TEMP_DIR]:
    dir.mkdir(exist_ok=True)

class VideoGenerator:
    def __init__(self):
        self.translator = Translator()
        self.session = requests.Session()
        self.session.headers.update({"Authorization": PEXELS_API_KEY})

        # Load mô hình NLP
        self.nlp = spacy.load("en_core_web_sm")

        # Khởi tạo thread pool
        self.executor = ThreadPoolExecutor(max_workers=4)  # Điều chỉnh số workers nếu cần

        # Biến để kiểm soát việc dừng
        self.stop_flag = False

        # Tạo giao diện
        self.window = ThemedTk(theme="arc")
        self.window.title("Tạo Video Tự Động")
        self.window.geometry("800x650")  # Tăng kích thước một chút

        # Frame nhập tiêu đề
        title_frame = ttk.Frame(self.window)
        title_frame.pack(pady=10, padx=10, fill="x")

        ttk.Label(title_frame, text="Tiêu đề video:").pack(side="left")
        self.title_entry = ttk.Entry(title_frame)
        self.title_entry.pack(side="left", fill="x", expand=True, padx=(5, 0))

        # Frame nhập kịch bản
        script_frame = ttk.Frame(self.window)
        script_frame.pack(pady=5, padx=10, fill="x")

        ttk.Label(script_frame, text="Kịch bản:").pack(side="left")
        self.script_text = scrolledtext.ScrolledText(script_frame, height=10)
        self.script_text.pack(fill="x", expand=True, padx=(5, 0))

        # Frame chọn giọng đọc (từ file)
        voice_file_frame = ttk.Frame(self.window)
        voice_file_frame.pack(pady=5, padx=10, fill="x")

        ttk.Label(voice_file_frame, text="Chọn file giọng đọc:").pack(side="left")
        self.voice_file_path = tk.StringVar()
        self.voice_file_entry = ttk.Entry(voice_file_frame, textvariable=self.voice_file_path, state="readonly")
        self.voice_file_entry.pack(side="left", fill="x", expand=True, padx=(5, 5))
        self.voice_file_button = ttk.Button(voice_file_frame, text="Chọn file", command=self.choose_voice_file)
        self.voice_file_button.pack(side="left")

        # Frame chọn nhạc nền
        bgm_frame = ttk.Frame(self.window)
        bgm_frame.pack(pady=5, padx=10, fill="x")

        ttk.Label(bgm_frame, text="Nhạc nền:").pack(side="left")
        self.bgm_path = tk.StringVar()
        self.bgm_entry = ttk.Entry(bgm_frame, textvariable=self.bgm_path, state="readonly")
        self.bgm_entry.pack(side="left", fill="x", expand=True, padx=(5, 5))
        self.bgm_button = ttk.Button(bgm_frame, text="Chọn file", command=self.choose_bgm)
        self.bgm_button.pack(side="left")

        # Frame điều chỉnh âm lượng
        volume_frame = ttk.Frame(self.window)
        volume_frame.pack(pady=5, padx=10, fill="x")

        # Âm lượng giọng nói
        ttk.Label(volume_frame, text="Âm lượng giọng nói:").pack(side="left")
        self.voice_volume = tk.IntVar(value=100)
        self.voice_volume_slider = ttk.Scale(volume_frame, from_=0, to=100, variable=self.voice_volume, orient="horizontal", length=200)
        self.voice_volume_slider.pack(side="left", padx=(5, 10))
        ttk.Label(volume_frame, textvariable=self.voice_volume, width=3).pack(side="left")
        ttk.Label(volume_frame, text="%").pack(side="left")

        # Âm lượng nhạc nền
        ttk.Label(volume_frame, text="Âm lượng nhạc nền:").pack(side="left", padx=(10, 0))
        self.bgm_volume = tk.IntVar(value=20)  # Âm lượng mặc định
        self.bgm_volume_slider = ttk.Scale(volume_frame, from_=0, to=100, variable=self.bgm_volume, orient="horizontal", length=200)
        self.bgm_volume_slider.pack(side="left", padx=(5, 10))
        ttk.Label(volume_frame, textvariable=self.bgm_volume, width=3).pack(side="left")
        ttk.Label(volume_frame, text="%").pack(side="left")

        # Frame chứa nút Tạo Video và Dừng
        button_frame = ttk.Frame(title_frame)
        button_frame.pack(side="left", padx=(5, 0))

        self.create_btn = ttk.Button(button_frame, text="Tạo Video", command=self.start_create_video)
        self.create_btn.pack(side="left", padx=(0, 5))

        self.stop_btn = ttk.Button(button_frame, text="Dừng", command=self.stop_process, state="disabled")
        self.stop_btn.pack(side="left")

        # Frame chọn chế độ xử lý
        processing_mode_frame = ttk.Frame(self.window)
        processing_mode_frame.pack(pady=5, padx=10, fill="x")

        ttk.Label(processing_mode_frame, text="Chế độ xử lý:").pack(side="left")
        self.processing_mode = tk.StringVar(value="Tăng tốc")  # Mặc định là chế độ tăng tốc

        # Tạo style cho combobox
        style = ttk.Style()
        style.configure(
            "Normal.TCombobox",
            fieldbackground="#FFFFFF",
            background="#FFFFFF",
            foreground="#000000",
            arrowcolor="#000000",
            selectbackground="#4CAF50",  # Xanh lá cho chế độ thường
            selectforeground="#FFFFFF",
        )

        style.configure(
            "Fast.TCombobox",
            fieldbackground="#FFFFFF",
            background="#FFFFFF",
            foreground="#000000",
            arrowcolor="#000000",
            selectbackground="#2196F3",  # Xanh dương cho chế độ tăng tốc
            selectforeground="#FFFFFF",
        )

        self.processing_mode_combobox = ttk.Combobox(
            processing_mode_frame,
            textvariable=self.processing_mode,
            values=["Thường", "Tăng tốc"],
            state="readonly",
            style="Normal.TCombobox",  # Mặc định style thường
            width=15,
        )

        # Cập nhật style dựa trên giá trị được chọn
        def update_style(*args):
            if self.processing_mode.get() == "Thường":
                self.processing_mode_combobox.configure(style="Normal.TCombobox")
            else:
                self.processing_mode_combobox.configure(style="Fast.TCombobox")

        self.processing_mode.trace_add("write", update_style)
        self.processing_mode_combobox.pack(side="left", padx=(5, 0))

        # Checkbox sử dụng GPU
        self.use_gpu = tk.BooleanVar(value=False)  # Mặc định không dùng GPU
        self.gpu_checkbox = ttk.Checkbutton(
            processing_mode_frame, text="Dùng GPU", variable=self.use_gpu
        )
        self.gpu_checkbox.pack(side="left", padx=(10, 0))

        # Thanh tiến trình
        style = ttk.Style()
        style.configure("Colorful.Horizontal.TProgressbar",
                        troughcolor='#E0E0E0',
                        background='#4CAF50',
                        thickness=20,
                        borderwidth=0)

        progress_frame = ttk.Frame(self.window)
        progress_frame.pack(pady=10, padx=10, fill="x")

        self.progress = ttk.Progressbar(progress_frame,
                                        style="Colorful.Horizontal.TProgressbar",
                                        mode="determinate")
        self.progress.pack(side="left", fill="x", expand=True)

        self.progress_label = ttk.Label(progress_frame, text="0%")
        self.progress_label.pack(side="left", padx=(5, 0))

        # Khung log
        self.log_area = scrolledtext.ScrolledText(self.window, height=8)
        self.log_area.pack(pady=10, padx=10, fill="both", expand=True)

        # Danh sách các controls cần disable khi tạo video
        self.controls = [
            self.title_entry,
            self.script_text,
            self.voice_file_button,
            self.bgm_button,
            self.voice_volume_slider,
            self.bgm_volume_slider,
            self.processing_mode_combobox,
            self.gpu_checkbox,
        ]

    def choose_voice_file(self):
        """Chọn file âm thanh giọng đọc."""
        file_path = filedialog.askopenfilename(
            title="Chọn file giọng đọc",
            filetypes=[("Audio Files", "*.mp3 *.wav *.m4a *.aac")]  # Hỗ trợ nhiều định dạng
        )
        if file_path:
            self.voice_file_path.set(str(Path(file_path)))  # Chuyển đổi và lưu đường dẫn

    def choose_bgm(self):
        """Chọn file nhạc nền"""
        file_path = filedialog.askopenfilename(
            title="Chọn file nhạc nền",
            filetypes=[("Audio Files", "*.mp3 *.wav *.m4a *.aac")]
        )
        if file_path:
            self.bgm_path.set(str(Path(file_path)))

    def stop_process(self):
        """Dừng quá trình tạo video"""
        self.stop_flag = True
        self.log("Đang dừng quá trình tạo video...")
        self.stop_btn.config(state="disabled")
        self.create_btn.config(state="normal")

    def update_progress(self, value):
        """Cập nhật thanh tiến trình"""
        self.progress["value"] = value
        self.progress_label.config(text=f"{int(value)}%")

        # Thay đổi màu dựa trên tiến trình
        if value < 30:
            color = '#FF9800'  # Cam
        elif value < 60:
            color = '#2196F3'  # Xanh dương
        else:
            color = '#4CAF50'  # Xanh lá

        style = ttk.Style()
        style.configure("Colorful.Horizontal.TProgressbar",
                        background=color)

        self.window.update()

    def log(self, message):
        """Ghi log và cập nhật giao diện"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_area.insert("end", f"[{timestamp}] {message}\n")
        self.log_area.see("end")
        self.window.update()

    def start_create_video(self):
        """Bắt đầu tạo video trong thread riêng"""
        title = self.title_entry.get().strip()
        script = self.script_text.get("1.0", "end").strip()
        voice_file = self.voice_file_path.get().strip()

        if not title:
            messagebox.showerror("Lỗi", "Vui lòng nhập tiêu đề video!")
            return

        if not script:
            messagebox.showerror("Lỗi", "Vui lòng nhập kịch bản!")
            return

        if not voice_file:
            messagebox.showerror("Lỗi", "Vui lòng chọn file giọng đọc!")
            return

        self.create_btn.config(state="disabled")
        self.stop_btn.config(state="normal")
        self.stop_flag = False
        self.update_progress(0)
        self.log("Bắt đầu tạo video...")
        self.log(f"Chế độ xử lý: {self.processing_mode.get()}")

        thread = threading.Thread(target=self.create_video, args=(title,))
        thread.start()

    def clean_markdown(self, text):
        """Loại bỏ markdown từ text"""
        html = markdown.markdown(text)
        soup = BeautifulSoup(html, "html.parser")
        return soup.get_text()

    def get_audio_duration(self, audio_path):
        """Lấy độ dài file âm thanh (dùng pydub)"""
        audio = AudioSegment.from_file(audio_path)
        return len(audio) / 1000.0

    def split_script_by_sentences(self, script):
        """Chia script thành các câu và tính thời lượng (ước lượng)"""
        doc = self.nlp(script)
        sentences = list(doc.sents)

        durations = []
        for sent in sentences:
            words = len([token for token in sent if not token.is_punct])
            duration = max(words * 0.3, 2.0)  # Tối thiểu 2 giây
            durations.append(duration)

        return [sent.text for sent in sentences], durations

    def generate_keywords(self, script, num_keywords):
        """Tạo từ khóa để tìm video stock."""
        max_retries = 3
        retry_count = 0

        while retry_count < max_retries:
            try:
                if self.stop_flag:
                    return

                self.log(f"Đang tạo từ khóa tìm kiếm... (lần thử {retry_count + 1})")
                # Sử dụng gemini-pro cho an toàn hơn
                model = genai.GenerativeModel("gemini-2.0-flash")  # Đổi model
                prompt = f"""Từ bài thuyết trình sau, hãy đưa ra {num_keywords} từ khóa tiếng Anh để tìm video stock minh họa:
    {script}
    Yêu cầu:
    - Từ khóa phải mô tả được hình ảnh/video cụ thể
    - Ưu tiên các từ khóa về cảnh quay, hoạt động, sự vật
    - Không dùng từ khóa trừu tượng
    - Từ khóa phải là Tiếng Anh
    Chỉ trả về danh sách từ khóa, phân tách bằng dấu phẩy.
    """
                response = model.generate_content(prompt)
                keywords = [k.strip() for k in self.clean_markdown(response.text).split(",")]

                if keywords:
                    self.log(f"Đã tạo {len(keywords)} từ khóa")
                    self.update_progress(45)  # Cập nhật tiến trình
                    return keywords[:num_keywords]
                else:
                    raise Exception("Không nhận được từ khóa")

            except Exception as e:
                self.log(f"Lỗi khi tạo từ khóa: {e}")
                retry_count += 1
                if retry_count < max_retries:
                    self.log("Đang thử lại...")
                    time.sleep(2)  # Đợi một chút trước khi thử lại
                else:
                    self.log("Không thể tạo từ khóa sau nhiều lần thử.")
                    messagebox.showerror("Lỗi", "Không thể tạo từ khóa. Vui lòng thử lại hoặc kiểm tra kịch bản.")
                    return

    def download_videos(self, keywords, durations):
        """Tải video từ Pexels"""
        video_paths = []
        total_duration = sum(durations)
        downloaded_duration = 0

        # Tính số lượng video cần tải dựa vào số lượng phân cảnh
        num_videos_to_download = min(len(keywords), len(durations))

        for i in range(num_videos_to_download):
            if self.stop_flag:
                return

            keyword = keywords[i]
            duration = durations[i]
            self.log(f"Đang tìm video cho từ khóa '{keyword}'...")

            try:
                url = f"https://api.pexels.com/videos/search?query={keyword}&per_page=15&min_duration={int(duration)}&max_duration={int(duration) + 5}"
                response = self.session.get(url)
                response.raise_for_status()
                data = response.json()

                if not data["videos"]:
                    self.log(f"Không tìm thấy video phù hợp cho từ khóa '{keyword}'.")
                    continue

                # Chọn video có độ phân giải, tỉ lệ khung hình tốt
                best_video = None
                for video in data["videos"]:
                    for file in video["video_files"]:
                        if file["quality"] == "hd" and file["width"] >= 1280:
                            best_video = file
                            break
                    if best_video:
                        break

                if not best_video:
                    self.log(f"Không tìm thấy video chất lượng HD cho '{keyword}'.")
                    continue  # Không tìm thấy video chất lượng tốt, bỏ qua

                video_url = best_video["link"]
                video_file_name = f"video_{i}.{best_video['file_type'].split('/')[-1]}"  # Lấy đuôi file
                video_path = str(TEMP_DIR / video_file_name)

                if self.download_file(video_url, video_path):
                    video_paths.append(video_path)
                    downloaded_duration += duration
                    progress = 50 + (downloaded_duration / total_duration) * 20  # Cập nhật tiến trình
                    self.update_progress(min(progress, 70))  # Tránh vượt quá 70% ở bước này

            except requests.exceptions.RequestException as e:
                self.log(f"Lỗi khi tải video: {e}")
                return

        return video_paths

    def download_file(self, url, file_path, chunk_size=8192):
        """Tải file với kiểm tra dừng."""
        try:
            with self.session.get(url, stream=True) as response:
                response.raise_for_status()
                with open(file_path, "wb") as file:
                    for chunk in response.iter_content(chunk_size=chunk_size):
                        if self.stop_flag:
                            return False
                        file.write(chunk)
            return True
        except requests.exceptions.RequestException as e:
            self.log(f"Lỗi: {e}")
            return False

    def create_video(self, title):
        """Hàm chính tạo video"""
        try:
            for control in self.controls:
                control.config(state="disabled")

            # 1. Chuẩn bị dữ liệu
            script = self.script_text.get("1.0", "end").strip()
            sentences, durations = self.split_script_by_sentences(script)
            total_video_duration = sum(durations)
            self.update_progress(5)  # Cập nhật progress

            # 2. Tạo từ khóa tìm kiếm (Gemini)
            num_keywords = min(len(sentences), 10)  # Tối đa 10 từ khóa/video
            keywords = self.generate_keywords(script, num_keywords)

            if not keywords:
                return  # Thoát nếu không tạo được từ khóa

            # 3. Tải video (Pexels)
            video_paths = self.download_videos(keywords, durations)
            if not video_paths:
                self.log("Không tải được đủ video. Vui lòng thử lại hoặc thay đổi kịch bản.")
                return

            # 4. Chuẩn bị file âm thanh
            voice_file = self.voice_file_path.get()
            bgm_file = self.bgm_path.get()

            voice_audio = AudioSegment.from_file(voice_file)
            voice_audio = voice_audio - (100 - self.voice_volume.get())  # Điều chỉnh âm lượng

            # Cắt/lặp audio cho khớp với kịch bản (quan trọng)
            if voice_audio.duration_seconds < total_video_duration:
                # Lặp lại nếu giọng đọc ngắn hơn
                repeat_times = int(total_video_duration // voice_audio.duration_seconds) + 1
                voice_audio = voice_audio * repeat_times
            voice_audio = voice_audio[:int(total_video_duration * 1000)]  # Cắt theo độ dài video

            # Load và điều chỉnh âm lượng nhạc nền
            if bgm_file:
                bgm_audio = AudioSegment.from_file(bgm_file)
                bgm_audio = bgm_audio - (100 - self.bgm_volume.get())  # Giảm âm lượng
                if bgm_audio.duration_seconds < total_video_duration:
                    repeat_times = int(total_video_duration // bgm_audio.duration_seconds) + 1
                    bgm_audio = bgm_audio * repeat_times  # Lặp nhạc nền
                bgm_audio = bgm_audio[:int(total_video_duration * 1000)]  # Cắt nhạc nền cho vừa video
                final_audio = voice_audio.overlay(bgm_audio)  # Trộn âm thanh
            else:
                final_audio = voice_audio

            audio_path = str(TEMP_DIR / "final_audio.mp3")
            final_audio.export(audio_path, format="mp3")  # Xuất file audio đã trộn
            self.update_progress(75)

            # 5. Ghép video và âm thanh
            output_file = str(OUTPUT_DIR / f"{title}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4")
            self.concatenate_videos(video_paths, audio_path, output_file)

            # Xóa file tạm (nếu muốn)
            for file in TEMP_DIR.glob("*"):
                try:
                    file.unlink()
                except Exception as e:
                    self.log(f"Không thể xóa file tạm: {e}")

        except Exception as e:
            self.log(f"Có lỗi xảy ra: {e}")
            messagebox.showerror("Lỗi", f"Đã xảy ra lỗi: {e}")
        finally:
            self.create_btn.config(state="normal")
            self.stop_btn.config(state="disabled")
            for control in self.controls:
                control.config(state="normal")  # Kích hoạt lại controls
            if self.stop_flag:
                self.log("Quá trình tạo video đã bị dừng.")
                self.stop_flag = False  # Reset lại cờ
                self.update_progress(0)
            else:
                self.log("Video đã được tạo thành công!")
                self.update_progress(100)
                messagebox.showinfo("Hoàn thành", f"Video đã được lưu tại: {output_file}")

    def concatenate_videos(self, video_paths, audio_path, output_path):
        """Ghép các video và âm thanh, xử lý bằng GPU nếu có"""

        #video_clips = [ffmpeg.input(path) for path in video_paths]
        video_clips = [ffmpeg.input(path).filter('scale', 1280, 720).filter('setsar', 1) for path in video_paths]
        audio_clip = ffmpeg.input(audio_path)

        # Kiểm tra chế độ xử lý
        if self.processing_mode.get() == "Tăng tốc":
            video_stream = ffmpeg.concat(*video_clips, v=1, a=0)
            audio_stream = audio_clip.audio
            stream = ffmpeg.concat(video_stream, audio_stream, v=1, a=1)
        else:  # Chế độ thường, ghép lần lượt video và audio
            concatenated_video = ffmpeg.concat(*video_clips, v=1, a=0)
            stream = ffmpeg.output(concatenated_video, audio_clip, output_path, vcodec="libx264", acodec="aac")

        # Kiểm tra và sử dụng GPU nếu có
        if self.use_gpu.get() and self.check_gpu():
            self.log("Sử dụng GPU để tăng tốc xử lý...")
            # Với NVIDIA, thêm option '-hwaccel cuda -hwaccel_output_format cuda'
            stream = ffmpeg.output(stream, output_path, vcodec="h264_nvenc", acodec="aac")
        else:
            self.log("Sử dụng CPU để xử lý...")
            # Chế độ thường (hoặc không hỗ trợ GPU), dùng libx264
            stream = ffmpeg.output(stream, output_path, vcodec="libx264", acodec="aac")

        try:
            # Chạy ffmpeg với kiểm tra dừng
            process = ffmpeg.run_async(stream, overwrite_output=True)
            while process.poll() is None:  # Kiểm tra process còn chạy không
                if self.stop_flag:
                    process.terminate()  # Dừng process nếu bị stop
                    self.log("Đã dừng quá trình ghép video.")
                    return
                time.sleep(0.5)  # Ngủ một chút để tránh lặp quá nhanh
            self.log("Hoàn tất ghép video và âm thanh.")

        except ffmpeg.Error as e:
            self.log(f"Lỗi ffmpeg: {e.stderr.decode()}")  # Ghi log lỗi chi tiết hơn
            messagebox.showerror("Lỗi", f"FFmpeg gặp lỗi: {e.stderr.decode()}")

    def check_gpu(self):
        """Kiểm tra xem có GPU NVIDIA và driver phù hợp không."""
        try:
            if torch.cuda.is_available():
                nvidia_smi.nvmlInit()
                handle = nvidia_smi.nvmlDeviceGetHandleByIndex(0)
                info = nvidia_smi.nvmlDeviceGetMemoryInfo(handle)
                self.log(f"Phát hiện GPU: {torch.cuda.get_device_name(0)}")
                self.log(f"Tổng bộ nhớ GPU: {info.total / (1024 ** 3):.2f} GB")  # Chuyển sang GB
                self.log(f"Phiên bản CUDA: {torch.version.cuda}")
                return True
            else:
                self.log("Không tìm thấy GPU hoặc driver CUDA không tương thích.")
                return False

        except Exception as e:
            self.log(f"Lỗi khi kiểm tra GPU: {e}")
            return False

if __name__ == "__main__":
    args = json.loads(sys.argv[1])  # Nhận dữ liệu từ Electron

    # Khởi tạo app
    app = VideoGenerator()

    # Thiết lập giá trị từ GUI gửi sang
    app.title_entry.insert(0, args["title"])
    app.script_text.insert("1.0", args["script"])
    app.voice_file_path.set(args["voicePath"])
    if args.get("bgmPath"):
        app.bgm_path.set(args["bgmPath"])
    app.voice_volume.set(int(args.get("voiceVolume", 100)))
    app.bgm_volume.set(int(args.get("bgmVolume", 20)))
    app.use_gpu.set(args.get("useGPU", False))
    app.processing_mode.set(args.get("mode", "Thường"))

    # Gọi tạo video trực tiếp (không dùng GUI)
    app.create_video(args["title"])