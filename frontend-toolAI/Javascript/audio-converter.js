// Javascript/audio-converter.js

class AudioConverter {
  constructor() {
      this.audioContext = null;
  }

  async convertToWAV(audioBlob) {
      try {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          
          const wavBuffer = this.audioBufferToWav(audioBuffer);
          const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
          
          this.audioContext.close();
          return wavBlob;
          
      } catch (error) {
          console.error('Lỗi chuyển đổi WAV:', error);
          throw error;
      }
  }

  audioBufferToWav(buffer) {
      const length = buffer.length;
      const numberOfChannels = buffer.numberOfChannels;
      const sampleRate = buffer.sampleRate;
      const bitsPerSample = 16;
      const bytesPerSample = bitsPerSample / 8;
      const blockAlign = numberOfChannels * bytesPerSample;
      const byteRate = sampleRate * blockAlign;
      const dataSize = length * blockAlign;
      const bufferSize = 44 + dataSize;
      
      const arrayBuffer = new ArrayBuffer(bufferSize);
      const view = new DataView(arrayBuffer);
      
      // WAV header
      const writeString = (offset, string) => {
          for (let i = 0; i < string.length; i++) {
              view.setUint8(offset + i, string.charCodeAt(i));
          }
      };
      
      writeString(0, 'RIFF');
      view.setUint32(4, bufferSize - 8, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numberOfChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);
      writeString(36, 'data');
      view.setUint32(40, dataSize, true);
      
      // Convert audio data
      let offset = 44;
      for (let i = 0; i < length; i++) {
          for (let channel = 0; channel < numberOfChannels; channel++) {
              const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
              view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
              offset += 2;
          }
      }
      
      return arrayBuffer;
  }

  async convertToMP3(audioBlob) {
      // Note: MP3 encoding requires external library like lamejs
      // For now, return the original blob
      console.warn('MP3 conversion not implemented. Returning original format.');
      return audioBlob;
  }

  async getAudioInfo(audioBlob) {
      try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const info = {
              duration: audioBuffer.duration,
              sampleRate: audioBuffer.sampleRate,
              numberOfChannels: audioBuffer.numberOfChannels,
              length: audioBuffer.length,
              size: audioBlob.size
          };
          
          audioContext.close();
          return info;
          
      } catch (error) {
          console.error('Lỗi lấy thông tin audio:', error);
          return null;
      }
  }
}

// Export instance
const audioConverter = new AudioConverter();
