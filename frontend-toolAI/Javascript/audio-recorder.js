// // Javascript/audio-recorder.js

// class AudioRecorder {
//   constructor() {
//       this.mediaRecorder = null;
//       this.audioChunks = [];
//       this.stream = null;
//       this.isRecording = false;
//       this.audioContext = null;
//       this.destination = null;
//   }

//   async startRecording(format = 'webm') {
//       try {
//           // Tạo AudioContext
//           this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
//           // Tạo destination stream
//           this.destination = this.audioContext.createMediaStreamDestination();
//           this.stream = this.destination.stream;

//           // Thiết lập MediaRecorder với format phù hợp
//           const mimeType = this.getMimeType(format);
          
//           this.mediaRecorder = new MediaRecorder(this.stream, {
//               mimeType: mimeType,
//               audioBitsPerSecond: 128000
//           });

//           this.audioChunks = [];
//           this.isRecording = true;

//           this.mediaRecorder.ondataavailable = (event) => {
//               if (event.data.size > 0) {
//                   this.audioChunks.push(event.data);
//               }
//           };

//           this.mediaRecorder.start(100); // Collect data every 100ms
          
//           return true;
//       } catch (error) {
//           console.error('Lỗi khi bắt đầu ghi âm:', error);
//           throw error;
//       }
//   }

//   async stopRecording() {
//       return new Promise((resolve, reject) => {
//           if (!this.mediaRecorder || !this.isRecording) {
//               reject(new Error('Không có recording nào đang chạy'));
//               return;
//           }

//           this.mediaRecorder.onstop = () => {
//               try {
//                   const blob = new Blob(this.audioChunks, { 
//                       type: this.mediaRecorder.mimeType 
//                   });
                  
//                   this.isRecording = false;
//                   this.cleanup();
//                   resolve(blob);
//               } catch (error) {
//                   reject(error);
//               }
//           };

//           this.mediaRecorder.stop();
//       });
//   }

//   getMimeType(format) {
//       const mimeTypes = {
//           'webm': 'audio/webm;codecs=opus',
//           'wav': 'audio/wav',
//           'mp3': 'audio/mpeg'
//       };

//       // Kiểm tra support
//       for (const [fmt, mime] of Object.entries(mimeTypes)) {
//           if (format === fmt && MediaRecorder.isTypeSupported(mime)) {
//               return mime;
//           }
//       }

//       // Fallback
//       if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
//           return 'audio/webm;codecs=opus';
//       } else if (MediaRecorder.isTypeSupported('audio/webm')) {
//           return 'audio/webm';
//       } else {
//           return 'audio/wav';
//       }
//   }

//   cleanup() {
//       if (this.audioContext) {
//           this.audioContext.close();
//           this.audioContext = null;
//       }
//       this.destination = null;
//       this.stream = null;
//       this.mediaRecorder = null;
//   }

//   // Phương thức để capture TTS audio
//   async captureTTSAudio(utterance) {
//       return new Promise((resolve, reject) => {
//           try {
//               // Tạo audio context để capture
//               const audioContext = new (window.AudioContext || window.webkitAudioContext)();
//               const destination = audioContext.createMediaStreamDestination();
              
//               // Tạo MediaRecorder
//               const mediaRecorder = new MediaRecorder(destination.stream, {
//                   mimeType: 'audio/webm;codecs=opus'
//               });
              
//               const chunks = [];
              
//               mediaRecorder.ondataavailable = (event) => {
//                   if (event.data.size > 0) {
//                       chunks.push(event.data);
//                   }
//               };
              
//               mediaRecorder.onstop = () => {
//                   const blob = new Blob(chunks, { type: 'audio/webm' });
//                   audioContext.close();
//                   resolve(blob);
//               };
              
//               // Bắt đầu recording
//               mediaRecorder.start();
              
//               // Thiết lập sự kiện cho utterance
//               utterance.onstart = () => {
//                   console.log('TTS started, recording...');
//               };
              
//               utterance.onend = () => {
//                   console.log('TTS ended, stopping recording...');
//                   setTimeout(() => {
//                       mediaRecorder.stop();
//                   }, 500); // Đợi một chút để đảm bảo capture hết
//               };
              
//               utterance.onerror = (error) => {
//                   mediaRecorder.stop();
//                   audioContext.close();
//                   reject(error);
//               };
              
//               // Phát TTS
//               speechSynthesis.speak(utterance);
              
//           } catch (error) {
//               reject(error);
//           }
//       });
//   }
// }

// // Export instance
// const audioRecorder = new AudioRecorder();
