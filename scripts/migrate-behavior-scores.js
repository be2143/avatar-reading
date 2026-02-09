import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from '../models/student.js';
import { connectMongoDB } from '../lib/mongodb.js';

dotenv.config();

const convertScore = (value) => {
  if (value === undefined || value === null) return value;
  if (value <= 10) return value;
  const converted = Math.round((value / 10) * 10) / 10;
  return converted > 10 ? 10 : converted;
};

const migrateBehavioralScores = async () => {
  await connectMongoDB();

  const students = await Student.find({});

  let studentsUpdated = 0;
  let totalScoresUpdated = 0;

  for (const student of students) {
    let needsUpdate = false;
    const updatedData = {
      currentBehavioralScore: student.currentBehavioralScore,
      behavioralScoreHistory: student.behavioralScoreHistory
    };

    // Update currentBehavioralScore if required
    const newCurrentScore = convertScore(student.currentBehavioralScore);
    if (newCurrentScore !== student.currentBehavioralScore) {
      updatedData.currentBehavioralScore = newCurrentScore;
      needsUpdate = true;
      totalScoresUpdated += 1;
    }

    // Update history scores if required
    if (student.behavioralScoreHistory && student.behavioralScoreHistory.length > 0) {
      const updatedHistory = student.behavioralScoreHistory.map((entry) => {
        const newScore = convertScore(entry.score);
        if (newScore !== entry.score) {
          needsUpdate = true;
          totalScoresUpdated += 1;
          return {
            ...entry.toObject(),
            score: newScore
          };
        }
        return entry;
      });

      updatedData.behavioralScoreHistory = updatedHistory;
    }

    if (needsUpdate) {
      await Student.findByIdAndUpdate(
        student._id,
        {
          $set: {
            currentBehavioralScore: updatedData.currentBehavioralScore,
            behavioralScoreHistory: updatedData.behavioralScoreHistory
          }
        },
        { new: true }
      );
      studentsUpdated += 1;
      console.log(`Updated student ${student.name} (${student._id})`);
    }
  }

  console.log('Migration summary:');
  console.log(`- Total students scanned: ${students.length}`);
  console.log(`- Students updated: ${studentsUpdated}`);
  console.log(`- Total scores converted: ${totalScoresUpdated}`);
};

(async () => {
  try {
    await migrateBehavioralScores();
  } catch (error) {
    console.error('Error migrating behavioral scores:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
})();











