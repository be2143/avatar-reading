import { NextResponse } from 'next/server';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const voiceIds = { 
  'Youssef': 'gsfVl491E84oyzvx65hk',
  'Alia' : 'pb3Afpsi0HMTahFIDh3t'
};

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

// Arabic voices (limited to Egyptian voices for ElevenLabs)
const ARABIC_VOICES = ['Youssef', 'Alia'];

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
    console.warn('[ElevenLabs] GPT_API_KEY missing; skipping conversion');
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
      console.warn('[ElevenLabs] OpenAI error:', response.status, err);
      return text;
    }
    const data = await response.json();
    const converted = data?.choices?.[0]?.message?.content?.trim();
    if (converted && converted !== text) {
      console.log(`[ElevenLabs] Converted dialect text:\n${converted}`);
    } else {
      console.log('[ElevenLabs] Conversion returned empty or same text; using original');
    }
    return converted || text;
  } catch (e) {
    console.error('[ElevenLabs] OpenAI request failed:', e);
    return text;
  }
}

/**
 * Convert Arabic text to dialect before speech generation
 */
async function convertToDialectIfNeeded(text, voiceId) {
  // Only convert if voice is Arabic and text is Arabic
  if (!ARABIC_VOICES.includes(voiceId)) {
    return text;
  }

  if (!isArabicText(text)) {
    return text;
  }

  try {
    const dialect = 'egyptian';
    console.log(`🔄 [ElevenLabs] Converting Arabic text to ${dialect} for voice: ${voiceId}`);
    const converted = await convertWithOpenAI(text, dialect);
    console.log('✅ [ElevenLabs] Dialect conversion successful');
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

    const validVoices = ['Youssef', 'Alia'];
    if (!validVoices.includes(voiceId)) {
      return NextResponse.json({ error: `Invalid voiceId. Must be one of: ${validVoices.join(', ')}` }, { status: 400 });
    }

    console.log(`[ElevenLabs] isArabic flag:`, isArabic, `voice:`, voiceId);
    // Convert to dialect if needed (use explicit isArabic flag)
    const processedText = isArabic ? await convertToDialectIfNeeded(text, voiceId) : text;
    if (processedText !== text) {
      console.log(`[ElevenLabs] Using converted text for TTS:\n${processedText}`);
    }

    // Default speed is 0.8, validate range (0.25 to 4.0 for ElevenLabs)
    const speechSpeed = speed !== undefined ? Math.max(0.25, Math.min(4.0, speed)) : 0.8;

    console.log(`Generating speech with ElevenLabs for text (first 50 chars): "${processedText.substring(0, 50)}..." with voice: ${voiceId}, speed: ${speechSpeed}`);

    const audio = await elevenlabs.textToSpeech.convert(voiceIds[voiceId], {
      text: processedText,
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        speed: speechSpeed,
      },
    });

    // Convert stream to buffer
    const audioBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      const reader = audio.getReader();
      
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              resolve(Buffer.concat(chunks));
              break;
            }
            chunks.push(Buffer.from(value));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      pump();
    });

    const base64Audio = audioBuffer.toString('base64');

    return NextResponse.json({ audio: `data:audio/mp3;base64,${base64Audio}` }, { status: 200 });

  } catch (error) {
    console.error("Error generating speech with ElevenLabs:", error);
    return NextResponse.json(
      { error: 'Failed to generate speech. An internal server error occurred.' },
      { status: 500 }
    );
  }
}