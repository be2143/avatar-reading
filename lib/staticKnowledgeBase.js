// Static Knowledge Base for AdaptED Stories Chatbot
// Contains FAQs and platform information that don't require database queries

export const STATIC_KNOWLEDGE_BASE = {
  platform: {
    name: "AdaptED Stories",
    purpose: "Educational platform for creating and managing social stories for students with special needs",
    features: [
      "Generate social stories with AI",
      "Personalize stories for individual students",
      "Track student progress and behavior",
      "View analytics and reports",
      "Use text-to-speech to hear stories read aloud",
      "Create and manage students",
    ]
  },
  
  // Comprehensive FAQs that don't require database queries
  faqs: {
      "general": {
        "how to create a story": "1. Use the 'Generate New Story' button to create stories with AI. 2. Fill out the required fields and click 'Generate Story Text' button. 3. The system will generate a new story text (in both English and Arabic). If you want to use the text story directly, click 'Save Text Story' button. If you want to generate visuals for the story click 'Generate Visual Scenes' button. 4. Review the story and save the story. 5. The story will be saved to your stories library.",
        "how to personalize a story": "1. Select a story to personalize from the Social Stories Library Page and click 'Personalize'. 2. Choose your student from the dropdown menu and click 'Customize Text'. 3. Review the customized text and click 'Generate Visuals'. 4. Wait for visuals to finish generating then review and save the story.",
        "how to upload a story": "Use the 'Upload Story' button to add your own stories. Provide title, category, age group, and story content. Stories are automatically translated to Arabic or English depending on the language you chose to upload.",
        "what are visibility settings": "Stories can be private (only visible to creator) or public (visible to all users). System stories are always public, generated stories default to private. You can choose to upload your stories either in public or private.",
        "how to manage students": "Go to the Students page to add new students, update their profiles, and view their progress.",
        "what is the difference between story sources": "System stories are pre-made content available to all users. Generated stories are created by AI based on your inputs. Uploaded stories are user-created content.",
        "What is Behavioral Survey": "Popped up on the personalized story page before reading session starts. This is a 0-100 score system to track the student behavior success. You can find the score trend on the student profile.",
        "What is Behavioral score": "The score is to track the student behavior success over time. You can find the score trend on the student profile.",
        "What is session notes": "Session notes are your notes during the reading session of what happened during the reading session. It is saved and later used for AI to make suggestions for the future reading session. You can find the session notes on the student profile and the AI suggestion on the student profile as well.",
        "How to find session notes": "Session notes can be found on the student profile page.",
        "How to find AI suggestions": "AI suggestions can be found on the student profile page.",
        "What is student comprehension score": "Student comprehension score measures how well the student understood the story content during reading sessions.",
        "What is Comprehension Check & Activity": "Comprehension Check & Activity are exercises and questions to assess student understanding of the story content.",
        "How to print story": "Go to story read page, click on the three dots next to the story title and choose print story.",
        "How to edit story": "Go to story read page, click on the three dots next to the story title and choose edit story.",
        "how to track student progress": "Use the story reading sessions to track comprehension scores, time spent, and behavioral progress. View student specific analytics on the student profile which you can find by choosing your student and clicking 'See Profile' button.",
        "What are the voices": "The system has two child voices 'Ivy and Justin'. But if you are reading the story in Arabic then use 'Hala or Zayd' voices."
      },
      "technical": {
        "scene numbers": "Scene numbers can be adjusted by editing the story text before moving on to the visual scenes generation. One paragraph story text (seperate by a new line in between paragraphs) would correspond to one scene.",
        "how to fix missing arabic translation": "Arabic translation is automatic. But if missing, you can go to edit story and add the Arabic translation text and save the story.",
        "how to edit story": "Go to the story read page and click on the three dots next to the story title. Choose Edit the story and make your changes then save. You can only make edits to your stories.",
        "how to change story visibility": "Go to the story read page and click on the three dots next to the story title. Choose Edit the story and change the visibility setting from private to public or vice versa. Only non-personalized stories allow visibility changes.",
        "how to generate visual scenes": "Visual scenes are automatically generated during story creation/personalization. You can regenerate individual scenes or all scenes using the regenerate options when creating a new story or personalizing. A new story at the last step before saving the story.",
        "Why student personalize fails": "You might see 'No cartoon image available for [Student Name]. Please try again after some time.' This is because after adding a new student to the system, it takes some time to generate a cartoon image for the student to create personalized visuals for the personalized stories. Make sure the student profile displays a green dot on the student image on overview or students page. If not then the cartoon image is unavailable and you won't be able to personalize a story for this student for now. Wait for a few minutes until this green dot appears. If not, try creating a new student again."
      }
  },
  
  storyTypes: {
    sources: {
      system: "Pre-made stories available to all users in the system library",
      generated: "AI-created stories based on user inputs", 
      uploaded: "User-created stories uploaded to the platform"
    },
    categories: {
      social: "Social Skills - interpersonal interactions and social behavior",
      routine: "Routines - daily activities and structured schedules", 
      community: "Community - public spaces and community interactions",
      emotions: "Emotions - emotional regulation and understanding feelings",
      digital: "Digital world/Technology - online safety and technology use"
    },
    ageGroups: {
      "3-5": "Early childhood (3-5 years)",
      "6-8": "Primary school (6-8 years)", 
      "9-12": "Elementary school (9-12 years)",
      "13+": "Teenagers and adults (13+ years)"
    }
  },
  
  analytics: {
    metrics: [
      "Stories created this month",
      "Personalization rate vs library stories", 
      "Average comprehension scores",
      "Behavior success rate",
      "Feature usage statistics",
      "Story topic distribution",
      "Student progress tracking"
    ],
    charts: [
      "Comprehension score trends",
      "Story length distribution", 
      "Category popularity",
      "Student engagement metrics"
    ]
  },
  
  dataModels: {
    Story: {
      description: "Stores story content, metadata, translations, and visual scenes",
      fields: {
        title: "Story title",
        description: "Story description/purpose",
        story_content: "Main English story text", 
        story_content_arabic: "Arabic translation",
        source: "system, generated, or uploaded",
        visibility: "public or private",
        category: "social, routine, community, emotions, digital",
        ageGroup: "3-5, 6-8, 9-12, 13+",
        storyLength: "short, medium, long",
        specificScenarios: "Custom scenarios and guidelines",
        mainCharacterDescription: "Character details",
        otherCharacters: "Additional character names",
        visualScenes: "Array of scenes with images and text",
        sessions: "Reading session data and scores",
        isGenerated: "Whether story was AI-generated",
        hasImages: "Whether story has visual scenes",
        isPersonalized: "Whether story is personalized for a student",
        student: "Associated student ID",
        createdBy: "User who created the story",
        emoji: "Story emoji representation"
      }
    },
    Student: {
      description: "Tracks student information, learning progress, and behavioral data",
      fields: {
        name: "Student name",
        age: "Student age",
        diagnosis: "Medical diagnosis or condition",
        comprehensionLevel: "Learning and comprehension level",
        interests: "Student interests for personalization",
        learningPreferences: "Preferred learning methods",
        challenges: "Specific challenges or difficulties",
        goals: "Learning and behavioral goals",
        notes: "General notes about the student",
        personalizedStories: "Stories personalized for this student",
        startedDate: "When student was added to platform",
        image: "Student profile image",
        cartoonImage: "Student cartoon/avatar image",
        userId: "Associated user/teacher ID",
        openAiFileId: "OpenAI file ID for AI features",
        currentBehavioralScore: "Current behavioral assessment score",
        behavioralScoreHistory: "Historical behavioral scores",
        challenge: "Primary challenge area",
        goals: "Specific goals for the student"
      }
    }
  }
};
