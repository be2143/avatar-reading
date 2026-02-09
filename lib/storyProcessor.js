import mongoose from 'mongoose';
import Story from '../models/story.js';

const MONGODB_URI = 'mongodb+srv://be2143:HbnUc1DeihKQ0lUG@cluster0.enjzhry.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function updateMissingVisibility() {
  try {
    console.log('Starting visibility field update for stories...');
    
    // Find stories that are missing the visibility field or have it as null/undefined
    const stories = await Story.find({
      $or: [
        { visibility: { $exists: false } },
        { visibility: null },
        { visibility: { $eq: undefined } },
        { visibility: '' }
      ]
    });
    
    console.log(`Found ${stories.length} stories with missing visibility field`);
    
    let updatedCount = 0;
    let errors = [];
    
    // Process each story
    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];
      
      console.log(`Processing ${i + 1}/${stories.length}: "${story.title}" (Source: ${story.source})`);
      
      try {
        let newVisibility;
        
        // Determine visibility based on source
        switch (story.source) {
          case 'system':
            newVisibility = 'public';
            break;
          case 'generated':
            newVisibility = 'private';
            break;
          case 'uploaded':
            newVisibility = 'private';
            break;
          default:
            // If source is not set or unknown, default to private
            newVisibility = 'private';
            console.log(`⚠️  Unknown source "${story.source}" for story "${story.title}", defaulting to private`);
        }
        
        // Update the story
        story.visibility = newVisibility;
        await story.save();
        
        updatedCount++;
        console.log(`✅ Updated: "${story.title}" → visibility: ${newVisibility}`);
        
      } catch (error) {
        console.error(`❌ Failed to update: "${story.title}"`, error.message);
        errors.push({
          title: story.title,
          id: story._id,
          source: story.source,
          error: error.message
        });
      }
    }
    
    console.log('\n=== Visibility Update Summary ===');
    console.log(`Total stories processed: ${stories.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Failed: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n=== Update Errors ===');
      errors.forEach(error => {
        console.log(`- "${error.title}" (Source: ${error.source}): ${error.error}`);
      });
    }
    
    return { updatedCount, errorCount: errors.length };
    
  } catch (error) {
    console.error('Error updating visibility fields:', error);
    throw error;
  }
}

async function verifyVisibilityUpdate() {
  try {
    console.log('\nVerifying visibility field updates...');
    
    // Count stories by source and visibility
    const stats = await Story.aggregate([
      {
        $group: {
          _id: {
            source: '$source',
            visibility: '$visibility'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.source': 1, '_id.visibility': 1 }
      }
    ]);
    
    console.log('\n=== Current Story Distribution ===');
    stats.forEach(stat => {
      console.log(`Source: ${stat._id.source}, Visibility: ${stat._id.visibility}, Count: ${stat.count}`);
    });
    
    // Check if any stories are still missing visibility
    const missingVisibility = await Story.countDocuments({
      $or: [
        { visibility: { $exists: false } },
        { visibility: null },
        { visibility: { $eq: undefined } },
        { visibility: '' }
      ]
    });
    
    console.log(`\nStories still missing visibility: ${missingVisibility}`);
    
    return { stats, missingVisibility };
    
  } catch (error) {
    console.error('Error verifying updates:', error);
    throw error;
  }
}

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Step 1: Update missing visibility fields
    const updateResult = await updateMissingVisibility();
    
    // Step 2: Verify the updates
    const verifyResult = await verifyVisibilityUpdate();
    
    console.log('\n🎉 === VISIBILITY UPDATE COMPLETE === 🎉');
    console.log(`Updated: ${updateResult.updatedCount} stories`);
    console.log(`Failed: ${updateResult.errorCount} stories`);
    console.log(`Remaining missing visibility: ${verifyResult.missingVisibility} stories`);
    
    if (verifyResult.missingVisibility === 0) {
      console.log('\n✅ All stories now have proper visibility fields!');
    } else {
      console.log('\n⚠️  Some stories still missing visibility fields');
    }
    
  } catch (error) {
    console.error('Visibility update failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
main();