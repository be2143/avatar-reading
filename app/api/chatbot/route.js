import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import { STATIC_KNOWLEDGE_BASE } from '../../../lib/staticKnowledgeBase';

const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

// DEBUG: Helper function to extract JSON from markdown code blocks
function extractJsonFromMarkdown(text) {
  // Remove markdown code block formatting
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  let jsonString = jsonMatch ? jsonMatch[1] : text;
  
  // If no code blocks found, try to find JSON object directly
  if (!jsonMatch) {
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    jsonString = jsonObjectMatch ? jsonObjectMatch[0] : text;
  }
  
  // Fix unquoted MongoDB operators (common issue with AI responses)
  // This handles cases like {$regex: "value", $options: "i"}
  // Match pattern: {, or , followed by optional whitespace, then $word, then :
  jsonString = jsonString.replace(/([{\[,]\s*)(\$\w+)(\s*):/g, '$1"$2"$3:');
  
  return jsonString;
}

// DEBUG: Database connection helper
async function connectToDatabase() {
  console.log('🔄 [DEBUG] Checking database connection...');
  if (mongoose.connection.readyState >= 1) {
    console.log('✅ [DEBUG] Database already connected');
    return;
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ [DEBUG] Database connection established');
  } catch (error) {
    console.error('❌ [DEBUG] Database connection failed:', error.message);
    throw error;
  }
}

// DEBUG: Phase 1 - Check if question can be answered from static knowledge
async function canAnswerFromStaticKnowledge(userQuestion, userId) {
  console.log('🔍 [DEBUG] Phase 1: Checking static knowledge base...');
  
  const systemPrompt = `
You are a classifier for an educational platform. Determine if the user's question can be answered using ONLY the static knowledge base without querying the database.

STATIC KNOWLEDGE BASE:
${JSON.stringify(STATIC_KNOWLEDGE_BASE.faqs, null, 2)}

USER QUESTION: "${userQuestion}"

CRITERIA FOR STATIC ANSWER:
✅ CAN be answered from static knowledge if:
- It's a general "how to" question about platform features
- It's about platform capabilities or workflows  
- It's a technical question about system functionality
- It's asking about definitions or explanations
- It's a FAQ about common processes

❌ CANNOT be answered from static knowledge if:
- It asks for specific data about stories (e.g., "my stories", "show me stories")
- It asks if there is a story about a specific topic (e.g., "Is there a story about supermarket?")
- It asks "do you have a story about X?" or "are there stories about Y?"
- It searches for stories by content, title, or topic
- It asks for specific student information (e.g., "students in my class")
- It requests personalized recommendations for a specific student
- It asks to recommend stories for a student (requires student profile and database)
- It asks what stories are best for a specific student
- It needs current system statistics
- It requires querying actual database records
- It asks about availability of specific content in the library

CRITICAL: Your response MUST be valid JSON with ALL keys properly quoted.

Respond with ONLY JSON format:
{
  "canAnswerFromStatic": true/false,
  "reasoning": "brief explanation",
  "suggestedAnswer": "if true, provide the answer from knowledge base"
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }],
      max_tokens: 500,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    console.log('🤖 [DEBUG] Static knowledge classification:', response);
    
    const jsonString = extractJsonFromMarkdown(response);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ [DEBUG] Static knowledge check failed:', error);
    return { canAnswerFromStatic: false, reasoning: "Classification failed" };
  }
}

// DEBUG: Phase 2 - Determine what database queries are needed
async function determineRequiredQueries(userQuestion, userId) {
  console.log('🔍 [DEBUG] Phase 2: Determining required database queries...');
  
  const systemPrompt = `
You are a database query analyzer for a social stories application. Analyze the user's question and determine what database queries are needed while respecting privacy rules.

USER QUESTION: "${userQuestion}"
USER ID: "${userId}"

═══════════════════════════════════════════════════════════════════
AVAILABLE DATA MODELS:
═══════════════════════════════════════════════════════════════════

1. STORY MODEL:
   Core Fields:
   - title (String, required): Story title
   - description (String): Story description/purpose
   - story_content (String, required): Main story text in English
   - story_content_arabic (String): Arabic translation of story
   - category (String): e.g., "social", "routine", "emotions", "community", "school"
   - ageGroup (String): e.g., "3-5", "6-8", "9-12", "13+"
   - storyLength (String): e.g., "short", "medium", "long"
   
   Visual & Metadata:
   - visualScenes (Array): [{id, text, image}] - scenes with images
   - emoji (String): Story emoji icon
   - hasImages (Boolean): Whether story has visual scenes
   
   Source & Ownership:
   - source (String, required): "system" | "generated" | "uploaded"
   - visibility (String, required): "private" | "public"
   - createdBy (ObjectId): User who created the story
   - authorName (String): Original author name (for uploaded stories)
   
   Personalization:
   - isPersonalized (Boolean): Whether story is personalized for a student
   - student (ObjectId): Reference to Student if personalized
   - sessions (Array): [{sessionNum, sessionDate, timeSpent, sessionNotes, comprehensionScore}]
   
   Timestamps: createdAt, updatedAt

2. STUDENT MODEL:
   Basic Info:
   - name (String, required): Student name
   - age (Number, required): Student age
   - birthday (String): Birth date
   - diagnosis (String, required): Student diagnosis
   - guardian (String): Guardian name
   - contact (String): Contact information
   
   Learning Profile:
   - comprehensionLevel (String, required): Student's comprehension level
   - preferredStoryLength (String, required): Preferred story length
   - preferredSentenceLength (String, required): Preferred sentence complexity
   - learningPreferences (String): How student learns best
   - interests (String): Student interests and hobbies
   - challenges (String): Learning challenges
   - goals (String): Learning goals
   - notes (String): Additional notes
   
   Progress Tracking:
   - currentBehavioralScore (Number, 0-10): Current behavioral score
   - behavioralScoreHistory (Array): [{score, date}] - historical scores
   - personalizedStories (Array): [ObjectId] - references to personalized stories
   
   Media:
   - image (String): Student photo URL
   - cartoonImage (String): Cartoon avatar URL
   
   Ownership:
   - userId (ObjectId, required): User who owns this student profile
   - openAiFileId (String): OpenAI file ID for personalization
   
   Timestamps: createdAt, updatedAt, startedDate

═══════════════════════════════════════════════════════════════════
PRIVACY & ACCESS RULES:
═══════════════════════════════════════════════════════════════════

STUDENTS:
✓ Can ONLY query students where userId = "${userId}"
✗ Cannot access other users' students under any circumstances

STORIES:
✓ System stories (source = "system"): Accessible to ALL users
✓ Public stories (visibility = "public"): Accessible to ALL users  
✓ Own stories (createdBy = "${userId}"): Always accessible
✗ Private stories from other users: NOT accessible

QUERY LOGIC:
For stories: (source = "system") OR (visibility = "public") OR (createdBy = "${userId}")

═══════════════════════════════════════════════════════════════════
QUERY PATTERNS FOR COMMON QUESTIONS:
═══════════════════════════════════════════════════════════════════

1. "Stories for [student name]":
   Step 1: Query students: {userId: "${userId}", name: {"$regex": "student_name", "$options": "i"}}
   Step 2: Query stories: {student: student_id, "$or": [{source: "system"}, {visibility: "public"}, {createdBy: "${userId}"}]}

2. "Personalized stories for [student]":
   Step 1: Query students: {userId: "${userId}", name: {"$regex": "student_name", "$options": "i"}}
   Step 2: Query stories: {student: student_id, isPersonalized: true}

3. "Show me [student]'s progress":
   Step 1: Query students: {userId: "${userId}", name: {"$regex": "student_name", "$options": "i"}}
   Step 2: Query stories: {student: student_id, sessions: {"$exists": true, "$ne": []}}
   (Include sessions array to analyze progress)

4. "Stories about [topic/category]":
   Query stories: {category: "topic", "$or": [{source: "system"}, {visibility: "public"}, {createdBy: "${userId}"}]}

5. "Stories for age [X-Y]":
   Query stories: {ageGroup: "X-Y", "$or": [{source: "system"}, {visibility: "public"}, {createdBy: "${userId}"}]}

6. "Story about [specific topic]" (e.g., "supermarket", "doctor", "school", "communication"):
   Query stories: {
     "$and": [
       {
         "$or": [
           {"title": {"$regex": "topic_keyword", "$options": "i"}},
           {"description": {"$regex": "topic_keyword", "$options": "i"}},
           {"story_content": {"$regex": "topic_keyword", "$options": "i"}}
         ]
       },
       {
         "$or": [
           {"source": "system"},
           {"visibility": "public"},
           {"createdBy": "${userId}"}
         ]
       }
     ]
   }
   (Search in title, description, and story_content for the topic keyword while respecting privacy)
   IMPORTANT: Extract the key topic word from the question:
   - "Is there any stories about communication?" → topic_keyword = "communication"
   - "stories about going to the supermarket" → topic_keyword = "supermarket"
   - "Do you have stories about emotions?" → topic_keyword = "emotions"
   
   Example for "stories about communication":
   {
     "$and": [
       {
         "$or": [
           {"title": {"$regex": "communication", "$options": "i"}},
           {"description": {"$regex": "communication", "$options": "i"}},
           {"story_content": {"$regex": "communication", "$options": "i"}}
         ]
       },
       {
         "$or": [
           {"source": "system"},
           {"visibility": "public"},
           {"createdBy": "${userId}"}
         ]
       }
     ]
   }

7. "My students" or "List students":
   Query students: {userId: "${userId}"}

8. "Student behavioral progress":
   Query students: {userId: "${userId}", behavioralScoreHistory: {"$exists": true}}

9. "Stories I created":
   Query stories: {createdBy: "${userId}"}

10. "Public stories":
    Query stories: {visibility: "public"}

11. "System library stories":
    Query stories: {source: "system"}

12. "[Student]'s reading sessions" or "session notes for [student]":
    Step 1: Query students: {userId: "${userId}", name: {"$regex": "student_name", "$options": "i"}}
    Step 2: Query stories: {student: student_id, sessions: {"$exists": true, "$ne": []}}
    (Include full sessions array with sessionNum, sessionDate, timeSpent, sessionNotes, comprehensionScore)

13. "Recent reading sessions" or "Latest sessions":
    Step 1: Query students: {userId: "${userId}"}
    Step 2: Query stories: {student: {"$in": student_ids}, sessions: {"$exists": true, "$ne": []}}
    (Sort by sessions.sessionDate descending to get most recent)

14. "Session notes for [story title]":
    Query stories: {title: {"$regex": "story_title", "$options": "i"}, "$or": [{source: "system"}, {visibility: "public"}, {createdBy: "${userId}"}], sessions: {"$exists": true}}

15. "How much time did [student] spend reading?":
    Step 1: Query students: {userId: "${userId}", name: {"$regex": "student_name", "$options": "i"}}
    Step 2: Query stories: {student: student_id, sessions: {"$exists": true, "$ne": []}}
    (Sum up timeSpent from all sessions)

16. "Comprehension scores for [student]":
    Step 1: Query students: {userId: "${userId}", name: {"$regex": "student_name", "$options": "i"}}
    Step 2: Query stories: {student: student_id, sessions: {"$exists": true, "$ne": []}}
    (Extract comprehensionScore from sessions array)

17. "Recommend stories for [student]" or "Story recommendations for [student]":
    Step 1: Query students: {userId: "${userId}", name: {"$regex": "student_name", "$options": "i"}}
    (Include goals, interests, challenges, comprehensionLevel, preferredStoryLength fields)
    Step 2: Query stories: {"$or": [{source: "system"}, {visibility: "public"}, {createdBy: "${userId}"}]}
    (Get all accessible stories to match against student's goals and interests)

18. "What stories should I use for [student]?" or "Best stories for [student]":
    Step 1: Query students: {userId: "${userId}", name: {"$regex": "student_name", "$options": "i"}}
    (Include goals, interests, challenges, comprehensionLevel, preferredStoryLength, ageGroup fields)
    Step 2: Query stories: {"$or": [{source: "system"}, {visibility: "public"}, {createdBy: "${userId}"}]}
    (Match stories by category, ageGroup, and content relevance to student profile)

19. "Is there any stories about [topic] that I can use for my student?" or "Stories about [topic] for student":
    Query stories: Use pattern #6 (topic search with $and structure)
    (This is a topic search question, NOT a student-specific query. Search all accessible stories by topic.)
    Do NOT query students unless a specific student name is mentioned.

═══════════════════════════════════════════════════════════════════
IMPORTANT GUIDELINES:
═══════════════════════════════════════════════════════════════════

✓ Always query students FIRST when a student name is mentioned
✓ Use case-insensitive regex matching for student names: {"$regex": "name", "$options": "i"}
✓ Use student ObjectId (not name) in story queries after retrieving student
✓ For personalized stories, always include isPersonalized: true
✓ For progress analysis, ensure sessions array is included in story queries
✓ When analyzing behavioral progress, include behavioralScoreHistory
✓ For Arabic content, check story_content_arabic field availability
✓ Consider visualScenes when user asks about "visual stories" or "picture stories"
✓ For session-related queries, ALWAYS include sessions array in story queries
✓ Session data includes: sessionNum, sessionDate, timeSpent, sessionNotes, comprehensionScore
✓ When asked about "reading time" or "time spent", sum up timeSpent from all sessions
✓ When asked about "notes" or "session notes", include full sessionNotes field
✓ When asked about "comprehension", extract comprehensionScore from sessions
✓ Sessions are stored as an array within each story document, not as separate records
✓ When user asks "Is there a story about X?" or "Do you have a story about X?", search title, description, and story_content
✓ When user asks "stories about [topic]" or "any stories about [topic]", this is a TOPIC SEARCH - use pattern #6
✓ For topic searches (e.g., "communication", "supermarket", "doctor", "dentist"), use "$and" with nested "$or" for text search AND privacy
✓ Extract key topic words from user questions: 
   - "stories about communication" → search for "communication"
   - "going to the supermarket" → search for "supermarket"
   - "Is there any stories about emotions?" → search for "emotions"
✓ Use "$and" structure combining text search "$or" with privacy "$or" (see pattern #6 example)
✓ Always include privacy filters in story searches - NEVER return stories the user doesn't have access to
✓ For story recommendations, query student to get goals, interests, challenges, comprehensionLevel, and preferredStoryLength
✓ When recommending stories, retrieve ALL accessible stories (not just student-specific) to match against student profile
✓ Include student goals field to enable goal-based story matching and new story topic suggestions
✓ IMPORTANT: Always use properly quoted JSON keys, especially for MongoDB operators like "$regex", "$options", "$or", "$and", "$in", "$exists", "$ne"

═══════════════════════════════════════════════════════════════════
RESPONSE FORMAT:
═══════════════════════════════════════════════════════════════════

CRITICAL: Your response MUST be valid JSON with ALL keys properly quoted, including MongoDB operators.
CORRECT: {"$regex": "value", "$options": "i"}
INCORRECT: {$regex: "value", $options: "i"}

Respond with JSON format:
{
  "needsDatabase": true/false,
  "requiredQueries": {
    "stories": {
      "needed": true/false,
      "filters": {
        "student": "student_id_if_needed",
        "isPersonalized": true_if_needed,
        "category": "category_if_specified",
        "ageGroup": "ageGroup_if_specified",
        "source": "source_if_specified",
        "visibility": "visibility_if_specified",
        "$or": [{"source": "system"}, {"visibility": "public"}, {"createdBy": "${userId}"}]
      },
      "fields": ["title", "description", "story_content", "story_content_arabic", "category", "ageGroup", "source", "visibility", "isPersonalized", "student", "createdBy", "sessions", "visualScenes", "emoji", "hasImages"],
      "reason": "Clear explanation of why this query is needed"
    },
    "students": {
      "needed": true/false,
      "filters": {
        "userId": "${userId}",
        "name": {"$regex": "student_name_if_specified", "$options": "i"}
      },
      "fields": ["name", "age", "diagnosis", "comprehensionLevel", "preferredStoryLength", "preferredSentenceLength", "learningPreferences", "interests", "challenges", "goals", "notes", "personalizedStories", "currentBehavioralScore", "behavioralScoreHistory", "image", "cartoonImage", "startedDate"],
      "reason": "Clear explanation of why this query is needed"
    }
  },
  "queryDescription": "Natural language description of what data will be queried and why"
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }],
      max_tokens: 500,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    console.log('🤖 [DEBUG] Query determination:', response);
    
    const jsonString = extractJsonFromMarkdown(response);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('❌ [DEBUG] Query determination failed:', error);
    return { needsDatabase: false, requiredQueries: {} };
  }
}

// DEBUG: Phase 3 - Execute database queries with privacy filters
async function executeDatabaseQueries(queryPlan, userId) {
  console.log('🔄 [DEBUG] Phase 3: Executing database queries...');
  
  await connectToDatabase();
  const Story = mongoose.models.Story || mongoose.model('Story', require('../../../models/story').schema);
  const Student = mongoose.models.Student || mongoose.model('Student', require('../../../models/student').schema);

  let results = {};

  try {
    // DEBUG: Query students first (needed for student-specific story queries)
    if (queryPlan.requiredQueries.students?.needed) {
      console.log('👤 [DEBUG] Querying students with privacy filters...');
      
      const studentFilters = { userId: userId };
      
      // Add additional filters from AI if provided
      if (queryPlan.requiredQueries.students.filters) {
        Object.assign(studentFilters, queryPlan.requiredQueries.students.filters);
      }

      results.students = await Student.find(studentFilters)
        .select(queryPlan.requiredQueries.students.fields?.join(' ') || 'name age comprehensionLevel')
        .limit(10)
        .lean();
      
      console.log(`✅ [DEBUG] Found ${results.students.length} students`);
    }

    // DEBUG: Query stories with privacy filters
    if (queryPlan.requiredQueries.stories?.needed) {
      console.log('📚 [DEBUG] Querying stories with privacy filters...');
      
      const storyFilters = {
        $or: [
          { visibility: 'public' },
          { createdBy: userId }
        ]
      };

      // Add additional filters from AI if provided
      if (queryPlan.requiredQueries.stories.filters) {
        const additionalFilters = queryPlan.requiredQueries.stories.filters;
        
        // Handle student-specific queries
        if (additionalFilters.student && additionalFilters.student !== 'student_id_if_needed') {
          // If we have a specific student ID, use it directly
          storyFilters.student = additionalFilters.student;
        } else if (results.students && results.students.length > 0) {
          // If we queried students and need student-specific stories, use the student IDs
          const studentIds = results.students.map(s => s._id);
          storyFilters.student = { $in: studentIds };
        }
        
        // Handle other filters (excluding student and $or/$and since we handle them specially)
        Object.keys(additionalFilters).forEach(key => {
          if (key !== 'student' && key !== '$or' && key !== '$and' && additionalFilters[key] !== 'student_id_if_needed') {
            storyFilters[key] = additionalFilters[key];
          }
        });

        // Handle $and structure (for complex queries like text search + privacy)
        if (additionalFilters.$and && Array.isArray(additionalFilters.$and)) {
          // AI provided a complete $and structure, use it directly
          delete storyFilters.$or;
          storyFilters.$and = additionalFilters.$and;
        }
        // Handle text search with $or (for title, description, story_content)
        else if (additionalFilters.$or && Array.isArray(additionalFilters.$or)) {
          // Check if this is a text search $or (has title/description/story_content regex)
          const isTextSearch = additionalFilters.$or.some(condition => 
            condition.title?.$regex || condition.description?.$regex || condition.story_content?.$regex
          );
          
          if (isTextSearch) {
            // Combine text search with privacy filters using $and
            const privacyOr = storyFilters.$or;
            delete storyFilters.$or;
            storyFilters.$and = [
              { $or: privacyOr },
              { $or: additionalFilters.$or }
            ];
          }
        }
      }

      console.log('🔍 [DEBUG] Final story filters:', JSON.stringify(storyFilters, null, 2));

      results.stories = await Story.find(storyFilters)
        .select(queryPlan.requiredQueries.stories.fields?.join(' ') || 'title source visibility')
        .populate('student', 'name age')
        .limit(10)
        .lean();
      
      console.log(`✅ [DEBUG] Found ${results.stories.length} stories`);
    }

    return results;
  } catch (error) {
    console.error('❌ [DEBUG] Database query execution failed:', error);
    return {};
  }
}

// DEBUG: Phase 4 - Generate final response with context
async function generateFinalResponse(userQuestion, contextData, userId, conversationHistory = []) {
  console.log('🔄 [DEBUG] Phase 4: Generating final response...');

  const systemPrompt = `
You are a helpful AI assistant for AdaptED Stories. Answer the user's question using the provided context data.

USER QUESTION: "${userQuestion}"

CONTEXT DATA:
${JSON.stringify(contextData, null, 2)}

STATIC KNOWLEDGE BASE (for reference):
${JSON.stringify(STATIC_KNOWLEDGE_BASE.faqs, null, 2)}

PRIVACY NOTE: Remember that users can only see their own students and public stories or stories they created.

Guidelines:
- Be specific and reference actual data when available
- If no relevant data found, suggest what user can do to get that information
- Maintain educational and supportive tone
- Keep responses concise but informative
- DO NOT use markdown formatting like asterisks (*), bold (**text**), or italics (_text_)
- Use plain text with line breaks and indentation for formatting
- Use hyphens (-) for bullet points but avoid any asterisk characters
- Use emojis for visual elements when appropriate

SESSION DATA HANDLING:
- When discussing reading sessions, reference specific session numbers and dates
- Format session dates in a user-friendly way (e.g., "January 15, 2024")
- When showing time spent, convert seconds to minutes/hours (e.g., "300 seconds = 5 minutes")
- Include session notes verbatim when asked about notes
- Present comprehension scores clearly (e.g., "Score: 4/5")
- When analyzing progress, compare sessions chronologically
- If multiple sessions exist, summarize trends (improving, consistent, needs attention)
- Highlight any notable patterns in session notes or comprehension scores

STORY RECOMMENDATION HANDLING:
When recommending stories for a student:
1. ANALYZE STUDENT PROFILE:
   - Review the student's goals, interests, challenges, and learning preferences
   - Consider their comprehensionLevel, preferredStoryLength, and age
   - Identify key themes and topics from their goals

2. RECOMMEND EXISTING STORIES:
   - Match stories from the database to the student's goals and interests
   - Look for stories that address their challenges (e.g., social skills, routines, emotions)
   - Consider story category, ageGroup, and storyLength alignment
   - Explain WHY each story is recommended (e.g., "This story helps with social interaction, which aligns with [student]'s goal of...")
   - Prioritize stories that haven't been read yet or had low comprehension scores

3. SUGGEST NEW STORY TOPICS:
   - Based on the student's goals that aren't covered by existing stories
   - Propose specific story topics that could be created from scratch
   - Examples: "A story about sharing toys at school", "Going to a birthday party", "Trying new foods"
   - Make suggestions specific and actionable (e.g., "Create a story about visiting the dentist to help with [student]'s anxiety about medical visits")
   - Focus on practical scenarios that support their learning goals

4. FORMAT RECOMMENDATIONS:
   - Structure response clearly with two sections:
     * "📚 Existing Stories I Recommend:" (list stories from database with explanations)
     * "✨ New Story Topics to Create:" (list suggested topics based on unmet goals)
   - Be specific about how each recommendation addresses the student's needs
   - Keep recommendations practical and actionable
   - DO NOT use asterisks for bold or emphasis, use plain text only
`;

  // Build full messages list for chat memory
  const messages = [
    { role: 'system', content: systemPrompt },
    // Append prior conversation turns, if any
    ...conversationHistory.map(turn => ({
      role: turn.role,
      content: turn.content
    })),
    // Current user message
    { role: 'user', content: userQuestion }
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    let response = completion.choices[0]?.message?.content;
    
    // Post-process: Remove markdown asterisks for bold/italic formatting
    // Remove bold: **text** -> text
    response = response.replace(/\*\*([^*]+)\*\*/g, '$1');
    // Remove italic: *text* -> text
    response = response.replace(/\*([^*]+)\*/g, '$1');
    // Remove any remaining standalone asterisks
    response = response.replace(/\*/g, '');
    
    return response;
  } catch (error) {
    console.error('❌ [DEBUG] Final response generation failed:', error);
    return "I apologize, but I'm having trouble generating a response right now. Please try again.";
  }
}

// DEBUG: Main API endpoint with optimized workflow
export async function POST(request) {
  console.log('🚀 [DEBUG] Chatbot API called with optimized workflow');
  
  try {
    const { message, conversationHistory = [], userId } = await request.json();
    
    console.log(`📨 [DEBUG] User message: "${message}"`);
    console.log(`👤 [DEBUG] User ID: ${userId}`);

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required for privacy' }, { status: 400 });
    }

    // DEBUG: Phase 1 - Check static knowledge first
    console.log('🔄 [DEBUG] Starting Phase 1: Static Knowledge Check');
    const staticCheck = await canAnswerFromStaticKnowledge(message, userId);
    
    if (staticCheck.canAnswerFromStatic) {
      console.log('✅ [DEBUG] Question answered from static knowledge - skipping database');
      
      // Remove markdown asterisks from static response
      let cleanResponse = staticCheck.suggestedAnswer;
      cleanResponse = cleanResponse.replace(/\*\*([^*]+)\*\*/g, '$1');
      cleanResponse = cleanResponse.replace(/\*([^*]+)\*/g, '$1');
      cleanResponse = cleanResponse.replace(/\*/g, '');
      
      return NextResponse.json({
        response: cleanResponse,
        source: 'static_knowledge',
        timestamp: new Date().toISOString()
      });
    }

    // DEBUG: Phase 2 - Determine if database queries are needed
    console.log('🔄 [DEBUG] Starting Phase 2: Query Determination');
    const queryPlan = await determineRequiredQueries(message, userId);
    
    if (!queryPlan.needsDatabase) {
      console.log('✅ [DEBUG] No database queries needed - using AI only');
      const aiResponse = await generateFinalResponse(message, {}, userId, conversationHistory);
      
      return NextResponse.json({
        response: aiResponse,
        source: 'ai_only',
        timestamp: new Date().toISOString()
      });
    }

    // DEBUG: Phase 3 - Execute database queries
    console.log('🔄 [DEBUG] Starting Phase 3: Database Query Execution');
    const contextData = await executeDatabaseQueries(queryPlan, userId);
    
    // DEBUG: Phase 4 - Generate final response
    console.log('🔄 [DEBUG] Starting Phase 4: Final Response Generation');
    const finalResponse = await generateFinalResponse(message, contextData, userId, conversationHistory);

    return NextResponse.json({
      response: finalResponse,
      source: 'ai_with_data',
      dataContext: Object.keys(contextData).length > 0 ? contextData : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [DEBUG] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DEBUG: Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    workflow: 'optimized_4_phase',
    timestamp: new Date().toISOString()
  });
}