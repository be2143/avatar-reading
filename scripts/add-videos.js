import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Story from '../models/story.js';
import Student from '../models/student.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function addVideosToStory() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in .env');
    }

    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Story ID from the URL: http://localhost:3000/dashboard/social-stories/692eed03850657763ea4d16d/read
    const storyId = process.argv[2] || '692eed03850657763ea4d16d';
    
    if (!mongoose.Types.ObjectId.isValid(storyId)) {
      throw new Error(`Invalid story ID: ${storyId}`);
    }

    // Find the story by ID
    const story = await Story.findById(storyId);

    if (!story) {
      throw new Error(`Story with ID ${storyId} not found`);
    }
    console.log(`✓ Found story: "${story.title}" (ID: ${story._id})`);
    
    // Get student info if personalized
    if (story.student) {
      const student = await Student.findById(story.student);
      if (student) {
        console.log(`  Student: ${student.name} (ID: ${student._id})`);
      }
    }
    
    console.log(`  Scenes: ${story.visualScenes?.length || 0}`);

    if (!story.visualScenes || story.visualScenes.length === 0) {
      throw new Error('Story has no visual scenes');
    }

    // Path to videos directory
    const videosDir = path.join(process.cwd(), 'public', 'avatar', 'videos');
    
    // Upload each video and update corresponding scene
    const videoFiles = [
      'scene1.mp4',
      'scene2.mp4',
      'scene3.mp4',
      'scene4.mp4',
      'scene5.mp4',
    ];

    console.log('\n📤 Uploading videos to Cloudinary...\n');

    for (let i = 0; i < videoFiles.length; i++) {
      const videoFile = videoFiles[i];
      const videoPath = path.join(videosDir, videoFile);
      
      // Extract scene number from filename (scene1.mp4 -> scene ID 1)
      const sceneNumber = parseInt(videoFile.match(/\d+/)?.[0]);
      if (!sceneNumber) {
        console.log(`⚠️  Skipping ${videoFile} - could not extract scene number`);
        continue;
      }

      // Find scene by ID (scenes typically have id: 1, 2, 3, etc.)
      const sceneIndex = story.visualScenes.findIndex(s => s.id === sceneNumber);
      if (sceneIndex === -1) {
        console.log(`⚠️  Skipping ${videoFile} - no scene with id ${sceneNumber}`);
        continue;
      }

      // Check if video file exists
      if (!fs.existsSync(videoPath)) {
        console.log(`⚠️  Skipping ${videoFile} - file not found`);
        continue;
      }

      const scene = story.visualScenes[sceneIndex];
      console.log(`[${i + 1}/${videoFiles.length}] Processing ${videoFile} for scene ${scene.id}...`);

      // Upload video to Cloudinary
      try {
        const videoBuffer = fs.readFileSync(videoPath);
        
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              folder: 'avatar-videos',
              public_id: `story-${story._id}-scene-${scene.id}`,
              overwrite: true,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(videoBuffer);
        });

        const videoUrl = uploadResult.secure_url;
        console.log(`  ✓ Uploaded: ${videoUrl}`);

        // Update the scene with video URL
        story.visualScenes[sceneIndex].video = videoUrl;
        console.log(`  ✓ Updated scene ${scene.id} with video URL`);

      } catch (uploadError) {
        console.error(`  ✗ Failed to upload ${videoFile}:`, uploadError.message);
        continue;
      }
    }

    // Save the updated story
    story.markModified('visualScenes');
    await story.save();
    console.log('\n✓ Story saved with video URLs');

    // Display summary
    console.log('\n📊 Summary:');
    console.log(`  Story: "${story.title}"`);
    if (story.student) {
      const student = await Student.findById(story.student);
      if (student) {
        console.log(`  Student: ${student.name}`);
      }
    }
    console.log(`  Scenes updated: ${story.visualScenes.filter(s => s.video).length}/${story.visualScenes.length}`);
    
    story.visualScenes.forEach((scene, index) => {
      if (scene.video) {
        console.log(`    Scene ${scene.id}: ✓ Video added`);
      } else {
        console.log(`    Scene ${scene.id}: ✗ No video`);
      }
    });

    console.log('\n✅ Script completed successfully!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  }
}

// Run the script
addVideosToStory();
