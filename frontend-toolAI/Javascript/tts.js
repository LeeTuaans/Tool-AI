const path = require('path');
const axios = require('axios');
require(`dotenv`).config({path: path.resolve(__dirname, '..', '.env')});


const apiKey = process.env.OPENAI_API_KEY;

async function generateTTSBuffer(text, voice = 'shimmer', speed='1.0') {
  

  const response =await axios.post(
    'https://api.openai.com/v1/audio/speech',
   {
    model: 'tts-1',
    input: text,
    voice: voice,
    speed: parseFloat(speed),
    response_format: 'mp3'
    },
    {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

module.exports = {generateTTSBuffer};


