// src/app/api/tts/route.js
import fs from 'fs';
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize the Groq client with the API key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, 
});

const speechFilePath = '/tmp/speech.wav'; // Temp location for the speech file
const model = 'playai-tts';
const voice = 'Deedee-PlayAI';

// Handle POST request
export async function POST(req) {
  const { text } = await req.json(); // Get the text from the request body

  if (!text) {
    return NextResponse.json({ error: 'Text is required for speech synthesis' }, { status: 400 });
  }

  try {
    // Request the speech from Groq API
    const response = await groq.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
      response_format: 'wav', // Return the response as a .wav file
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    // Save the file temporarily (you can choose to return it directly)
    await fs.promises.writeFile(speechFilePath, buffer);

    // Send the file as a response
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': 'attachment; filename=speech.wav',
      },
      status: 200,
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}

// export async function GET(req) {
//   return NextResponse.json({ error: 'GET method not allowed for this endpoint' }, { status: 405 });
// }

// // app/api/tts/route.js
// import { ElevenLabsClient } from "elevenlabs";
// import { NextResponse } from "next/server";

// export async function POST(request) {
//   try {
//     const { text } = await request.json();

//     console.log(process.env.ELEVENLABS_API_KEY);
//     console.log(text);

//     if (!text) {
//       return NextResponse.json({ error: "Text is required" }, { status: 400 });
//     }

//     if (!process.env.ELEVENLABS_API_KEY) {
//       return NextResponse.json(
//         { error: "Missing ElevenLabs API Key" },
//         { status: 500 }
//       );
//     }

//     console.log('Before client');

//     const client = new ElevenLabsClient({
//       apiKey: process.env.ELEVENLABS_API_KEY,
//     });

//     console.log('Before response');

//     // Convert text to speech
//     const response = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
//       text: text,
//       model_id: "eleven_multilingual_v2",
//       output_format: "mp3_44100_128",
//     });

//     // Ensure proper handling of response stream
//     const audioBuffer = await response.arrayBuffer();

//     console.log(audioBuffer);

//     return new Response(Buffer.from(audioBuffer), {
//       headers: {
//         "Content-Type": "audio/mpeg",
//         "Content-Disposition": 'attachment; filename="speech.mp3"',
//       },
//     });
//   } catch (error) {
//     console.error("Text-to-speech error:", error);
//     return NextResponse.json(
//       { error: "Failed to convert text to speech" },
//       { status: 500 }
//     );
//   }
// }

// // Force dynamic route handling if needed
// export const dynamic = "force-dynamic";
// export const runtime = "nodejs";

