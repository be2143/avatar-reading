// app/api/recommendations/route.js
import { OpenAI } from "openai";
import { Card, User, Category } from "@/app/lib/schemas";
import connectToDatabase from "@/app/lib/mongo";

export async function POST(req) {
  try {
    await connectToDatabase();
    
    // 1. Get selected words from request body
    const { selectedWords } = await req.json();
    if (!Array.isArray(selectedWords)) {
      return Response.json({ error: "selectedWords must be an array" }, { status: 400 });
    }

    // 2. Get user profile - assuming "Test Child" for now
    const user = await User.findOne({ name: "Test Child" });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Get all cards and organize them by category
    const cards = await Card.find().populate('category');
    const cardsByCategory = {};
    
    // Create a Set of all available words for faster lookup
    const availableWords = new Set();
    
    for (const card of cards) {
      const categoryName = card.category ? card.category.name : 'uncategorized';
      if (!cardsByCategory[categoryName]) {
        cardsByCategory[categoryName] = [];
      }
      cardsByCategory[categoryName].push(card.word);
      availableWords.add(card.word);
    }
  

    // 4. Format past interactions
    const pastInteractions = user.past_interactions.map(interaction => 
      interaction.sentence.join(" ")
    );


    const openai = new OpenAI({
      apiKey: process.env.GROQ_CLOUD_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const completion = await openai.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping a non-verbal child communicate. 
          User Profile:
          - Age: ${user.age}
          - Diagnosis: ${user.diagnosis}
          - Preferred words: ${user.preferred_words.join(", ")}
          - Past interactions: ${pastInteractions.join(", ")}

          The child has selected these words: ${selectedWords.join(", ")}.
          
          Available cards by category:
          ${Object.entries(cardsByCategory)
            .map(([category, words]) => `${category}: ${words.join(", ")}`)
            .join("\n")}

          Suggest 6 words from the available cards that would most likely complete the child's thought or intention.

          Guidelines:
          1. ONLY use words from the provided available cards
          2. Consider the context implied by the selected words
          3. Prioritize words from the user's preferred words list when appropriate
          4. Consider past interactions for frequently used words
          5. Adjust suggestions based on the user's age and diagnosis
          6. Avoid repeating words already selected
          7. Return ONLY a JSON array of 6 suggested words, no explanations`,
        },
      ],
      temperature: 0.4,
      max_tokens: 100,
      response_format: { type: "json_object" },
    });

    console.log('Message content:', completion.choices[0].message.content);

    // Parse the response and handle both possible formats
    let suggestions;
    try {
      const content = completion.choices[0].message.content;
      const parsedContent = JSON.parse(content);
      
      if (parsedContent.suggestions) {
        // If model returned the correct format
        suggestions = parsedContent.suggestions;
      } else {
        // If model returned categorized format, flatten it
        suggestions = Object.values(parsedContent)
          .flat()
          .slice(0, 6); // Ensure we only take 6 words
      }

      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('No valid suggestions found');
      }

      suggestions = suggestions.filter(word => availableWords.has(word));

    } catch (parseError) {
      console.error('Error parsing suggestions:', parseError);
      return Response.json({ error: "Failed to parse suggestions" }, { status: 500 });
    }

    // 5. Save this interaction to user's past_interactions
    // await User.findByIdAndUpdate(user._id, {
    //   $push: {
    //     past_interactions: {
    //       sentence: selectedWords,
    //       timestamp: new Date()
    //     }
    //   }
    // });

    return Response.json({ suggestions });
  } catch (error) {
    console.error("API error:", error);
    return Response.json({ error: "API request failed" }, { status: 500 });
  }
}