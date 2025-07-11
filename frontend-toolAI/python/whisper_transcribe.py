import whisper
import sys
import os
os.makedirs("transcript", exist_ok=True)

if len(sys.argv) < 2:
    print("Thiếu file âm thanh!")
    sys.exit(1)

file_path = sys.argv[1]
try:
    model = whisper.load_model("small")
    result = model.transcribe(file_path, language="vi")
    with open("transcript/transcript.txt", "w", encoding="utf-8") as f:f.write(result["text"])
except Exception as e:
    print("❌ Lỗi Whisper:", e)
    sys.exit(2)
