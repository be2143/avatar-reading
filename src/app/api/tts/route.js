// app/api/tts/route.js
import { ElevenLabsClient } from "elevenlabs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' }, 
        { status: 400 }
      );
    }

    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY
    });

    const audio = await client.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
      text: text,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
    });

    return new Response(audio, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="speech.mp3"'
        }
      });

  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json(
      { error: 'Failed to convert text to speech' }, 
      { status: 500 }
    );
  }
}

// You can also set config if needed
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // If you need Node.js runtime