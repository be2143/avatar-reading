// app/api/bot/route.js
import { OpenAI } from "openai";

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const openai = new OpenAI({
      apiKey: process.env.GROQ_CLOUD_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const completion = await openai.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "system",
          content:
            "You are an AI chatbot integrated into a website designed for kids with autism. The website includes AAC (Augmentative and Alternative Communication) tools for communication, interactive routine organizers, and other features to help children and their caregivers. Your role is to provide helpful, empathetic, and simple responses based on the conversation context. Always keep your language child-friendly and supportive.", // Keep your system prompt
        },
        ...messages,
      ],
      temperature: 0.5,
      max_tokens: 150,
    });

    return Response.json({
      message: completion.choices[0].message.content?.trim(),
    });
  } catch (error) {
    console.error("API error:", error);
    return Response.json(
      {
        error: error.message || "API request failed",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
