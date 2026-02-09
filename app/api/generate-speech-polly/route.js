import { NextResponse } from 'next/server';
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

const polly = new PollyClient({
  region: "us-east-1", 
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Arabic voice detection
const ARABIC_VOICES = ['Hala', 'Zayd'];

/**
 * Detect if text is primarily Arabic
 */
function isArabicText(text) {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g; // global to count all
  const matches = text.match(arabicPattern) || [];
  const ratio = matches.length / Math.max(1, text.length);
  return ratio > 0.1; // consider Arabic if >10% chars are Arabic
}

/**
 * Convert text to dialect using OpenAI
 */
async function convertWithOpenAI(text, dialect) {
  const OPENAI_API_KEY = process.env.GPT_API_KEY;
  const OPENAI_MODEL = process.env.OPENAI_DIALECT_MODEL || 'gpt-4o-mini';
  if (!OPENAI_API_KEY) {
    console.warn('[Polly] GPT_API_KEY missing; skipping conversion');
    return text;
  }

  const dialectName = dialect === 'gulf' ? 'الخليجية' : 'المصرية';
  const systemInstruction = 'أنت مساعد لغوي عربي محترف، وظيفتك تحويل النص العربي الفصيح إلى لهجات عربية محددة بدقة وبأسلوب طبيعي. أعد فقط النص المحول بدون أي شروحات أو مقدمات أو تنسيق إضافي.';
  const userPrompt = `حوّل النص التالي من العربية الفصحى إلى اللهجة ${dialectName}. أعد فقط النص المحول بدون أي إضافات:\n\n"""${text}"""`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.3,
        max_tokens: 512,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    if (!response.ok) {
      const err = await response.text();
      console.warn('[Polly] OpenAI error:', response.status, err);
      return text;
    }
    const data = await response.json();
    const converted = data?.choices?.[0]?.message?.content?.trim();
    if (converted && converted !== text) {
      console.log(`[Polly] Converted dialect text:\n${converted}`);
    } else {
      console.log('[Polly] Conversion returned empty or same text; using original');
    }
    return converted || text;
  } catch (e) {
    console.error('[Polly] OpenAI request failed:', e);
    return text;
  }
}

/**
 * Convert Arabic text to dialect before speech generation
 */
async function convertToDialectIfNeeded(text, voiceId) {
  // Only convert if voice is Arabic
  if (!ARABIC_VOICES.includes(voiceId)) {
    return text;
  }

  // If text doesn't look Arabic, skip
  if (!isArabicText(text)) {
    return text;
  }

  try {
    const dialect = 'gulf';
    console.log(`🔄 [Polly] Converting Arabic text to ${dialect} for voice: ${voiceId}`);
    const converted = await convertWithOpenAI(text, dialect);
    console.log('✅ [Polly] Dialect conversion successful');
    return converted || text;
  } catch (error) {
    console.error('❌ Error calling dialect conversion:', error);
    return text; // Fallback to original text
  }
}

export async function POST(request) {
  try {
    const { text, voiceId, speed, isArabic } = await request.json();

    if (!text || !voiceId) {
      return NextResponse.json({ error: 'Text and voiceId are required.' }, { status: 400 });
    }

    const validVoices = ['Ivy', 'Justin', 'Hala', 'Zayd']; 
    if (!validVoices.includes(voiceId)) {
      return NextResponse.json({ error: `Invalid voiceId. Must be one of: ${validVoices.join(', ')}` }, { status: 400 });
    }

    console.log(`[Polly] isArabic flag:`, isArabic, `voice:`, voiceId);
    // Convert to dialect if needed (use explicit isArabic flag)
    const processedText = isArabic ? await convertToDialectIfNeeded(text, voiceId) : text;
    if (processedText !== text) {
      console.log(`[Polly] Using converted text for TTS:\n${processedText}`);
    }

    console.log(`Generating speech for text (first 50 chars): "${processedText.substring(0, 50)}..." with voice: ${voiceId}, speed: ${speed || 'normal'}`);

    let rate = "85%";
    if (speed && !isNaN(speed)) {
      rate = `${Math.round(speed * 100)}%`;
    }

    const ssmlText = `<speak>
                        <prosody rate="${rate}">
                          ${processedText}
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