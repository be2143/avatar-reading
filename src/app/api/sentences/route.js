import OpenAI from "openai";
import { User } from "@/app/lib/schemas";
import connectToDatabase from "@/app/lib/mongo";

export async function POST(req) {
  try {
    await connectToDatabase();

    // Fetch user profile
    const user = await User.findOne({ name: "Test Child" });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }


    // Get the request body and log it
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON format" }),
        { status: 400 }
      );
    }

    const { selectedWords } = body;

    // Check if selectedWords is valid
    if (!selectedWords || !Array.isArray(selectedWords) || selectedWords.length === 0) {
      console.error("Invalid selectedWords:", selectedWords);
      return new Response(
        JSON.stringify({ error: "selectedWords must be a non-empty array" }),
        { status: 400 }
      );
    }

    // Retrieve past interactions
    const pastInteractions = user.past_interactions
      ? user.past_interactions.map((interaction) => interaction.sentence.join(" "))
      : [];

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.GROQ_CLOUD_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // Generate a grammatically correct sentence using OpenAI
    const completion = await openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
        {
          role: "system",
          content: `
            You are an AI assistant helping a non-verbal child communicate.

            User Profile:
            - Age: ${user.age || "unknown"}
            - Diagnosis: ${user.diagnosis || "unknown"}
            - Preferred words: ${
              user.preferred_words ? user.preferred_words.join(", ") : "none"
            }
            - Past interactions: ${
              pastInteractions.length > 0 ? pastInteractions.join(", ") : "none"
            }

            The child has selected these words: ${selectedWords.join(", ")}.

            Please generate a grammatically correct sentence using these words.
            Return ONLY the sentence with no explanation.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 100,
    });

    // Extract and return the sentence
    const generatedSentence = completion.choices?.[0]?.message?.content?.trim();
    if (!generatedSentence) {
      throw new Error("Failed to generate sentence.");
    }

    return new Response(
      JSON.stringify({ sentence: generatedSentence }),
      { status: 200 }
    );
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: "API request failed" }),
      { status: 500 }
    );
  }
}