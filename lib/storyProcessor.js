// import mongoose from 'mongoose';
// import Story from '../models/story.js'; // adjust this path

// async function updateComprehensionScores() {
//   try {
//     await mongoose.connect('mongodb+srv://be2143:HbnUc1DeihKQ0lUG@cluster0.enjzhry.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('Connected to MongoDB');

//     const stories = await Story.find({});
//     console.log(`Found ${stories.length} stories.`);

//     for (const story of stories) {
//       let updated = false;

//       story.sessions = story.sessions.map(session => {
//         // Generate a random score 1-5
//         const randomScore = Math.floor(Math.random() * 5) + 1;

//         // Optionally update only if missing:
//         // if (!session.comprehensionScore) { ... }

//         // Or update all sessions regardless:
//         session.comprehensionScore = randomScore;
//         updated = true;
//         return session;
//       });

//       if (updated) {
//         await story.save();
//         console.log(`Updated story ${story._id} with new comprehension scores.`);
//       }
//     }

//     console.log('All sessions updated!');
//     await mongoose.disconnect();
//   } catch (error) {
//     console.error('Error updating comprehension scores:', error);
//   }
// }

// updateComprehensionScores();



import mongoose from 'mongoose';
import Story from '../models/story.js'; // adjust this path
import fs from 'fs';
import path from 'path';

function getStoryLengthCategory(wordCount) {
  if (wordCount <= 50) return 'very_short';
  if (wordCount <= 100) return 'short';
  if (wordCount <= 200) return 'medium';
  return 'long';
}

async function updateStoryLengths() {
  try {
    await mongoose.connect('mongodb+srv://be2143:HbnUc1DeihKQ0lUG@cluster0.enjzhry.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const stories = await Story.find({
      emoji: { $exists: false }
    });
      
    console.log(`Found ${stories} stories.`);


    // for (const story of stories) {
    //   // If storyLength already valid, skip
    //   if (validLengths.includes(story.storyLength)) {
    //     console.log(`Story ${story._id} already has valid length: ${story.storyLength}. Skipping.`);
    //     continue;
    //   }

    //   // Count words in the story text (assuming story.text holds the text)
    //   const wordCount = story.text ? story.text.trim().split(/\s+/).length : 0;

    //   const newLength = getStoryLengthCategory(wordCount);

    //   story.storyLength = newLength;
    //   await story.save();
    //   console.log(`Updated story ${story._id} with length: ${newLength}`);
    // }

    console.log('All stories processed!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error updating story lengths:', error);
  }
}

async function importStoriesFromJson() {
  try {
    await mongoose.connect('mongodb+srv://be2143:HbnUc1DeihKQ0lUG@cluster0.enjzhry.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Read the JSON file
    const jsonPath = path.join(process.cwd(), 'data', 'moreStories.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const stories = JSON.parse(jsonData);

    console.log(`Found ${stories.length} stories in JSON file.`);

    let importedCount = 0;
    let skippedCount = 0;

    for (const storyData of stories) {
      try {
        // Check if story already exists by title
        const existingStory = await Story.findOne({ title: storyData.title });
        
        if (existingStory) {
          console.log(`Story "${storyData.title}" already exists. Skipping.`);
          skippedCount++;
          continue;
        }

        // Create new story document
        const newStory = new Story({
          title: storyData.title,
          story_content: storyData.story_content,
          category: storyData.category,
          storyLength: storyData.storyLength,
          source: storyData.source,
          emoji: storyData.emoji,
          // Add default values for required fields
          isGenerated: false,
          hasImages: false,
          visualScenes: [],
          sessions: []
        });

        await newStory.save();
        console.log(`Imported story: "${storyData.title}"`);
        importedCount++;

      } catch (storyError) {
        console.error(`Error importing story "${storyData.title}":`, storyError);
      }
    }

    console.log(`\nImport completed!`);
    console.log(`Imported: ${importedCount} stories`);
    console.log(`Skipped: ${skippedCount} stories (already existed)`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error importing stories:', error);
  }
}

// Uncomment the function you want to run:
// updateStoryLengths();
importStoriesFromJson();
