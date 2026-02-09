import { NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const polly = new PollyClient({
  region: "us-east-1", 
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const { text, voiceId, speed } = await request.json();

    if (!text || !voiceId) {
      return NextResponse.json({ error: 'Text and voiceId are required.' }, { status: 400 });
    }

    const validVoices = ['Ivy', 'Justin']; 
    if (!validVoices.includes(voiceId)) {
      return NextResponse.json({ error: `Invalid voiceId. Must be one of: ${validVoices.join(', ')}` }, { status: 400 });
    }

    console.log(`Generating speech for text (first 50 chars): "${text.substring(0, 50)}..." with voice: ${voiceId}, speed: ${speed || 'normal'}`);

    let rate = "85%";
    if (speed && !isNaN(speed)) {
      rate = `${Math.round(speed * 100)}%`;
    }

    const ssmlText = `<speak>
                        <prosody rate="${rate}">
                          ${text}
                        </prosody>
                      </speak>`;

    const command = new SynthesizeSpeechCommand({
      OutputFormat: "mp3",
      Text: ssmlText,
      TextType: "ssml",   
      VoiceId: voiceId,
      Engine: "neural",
    });

    const { AudioStream } = await polly.send(command);

    // Convert stream to buffer
    const audioBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      AudioStream.on('data', (chunk) => chunks.push(chunk));
      AudioStream.once('end', () => resolve(Buffer.concat(chunks)));
      AudioStream.once('error', reject);
    });

    const base64Audio = audioBuffer.toString('base64');

    return NextResponse.json({ audio: `data:audio/mp3;base64,${base64Audio}` }, { status: 200 });

  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: 'Failed to generate speech. An internal server error occurred.' },
      { status: 500 }
    );
  }
}