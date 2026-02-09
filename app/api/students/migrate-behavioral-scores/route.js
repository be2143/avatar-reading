// app/api/students/migrate-behavioral-scores/route.js
// Migration script to convert behavioral scores from 0-100 to 0-10 scale
import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Student from '@/models/student';

export async function POST(request) {
  try {
    await connectMongoDB();

    // Find all students
    const students = await Student.find({});

    let updatedCount = 0;
    let totalScoresUpdated = 0;
    const results = [];

    for (const student of students) {
      let needsUpdate = false;
      const updates = {
        currentBehavioralScore: student.currentBehavioralScore,
        behavioralScoreHistory: student.behavioralScoreHistory || []
      };

      // Check and update currentBehavioralScore if > 10
      if (student.currentBehavioralScore !== undefined && student.currentBehavioralScore !== null && student.currentBehavioralScore > 10) {
        const oldScore = student.currentBehavioralScore;
        // Convert from 0-100 to 0-10 scale (divide by 10, round to 1 decimal place)
        let newScore = Math.round((oldScore / 10) * 10) / 10;
        // Cap at 10
        if (newScore > 10) {
          newScore = 10;
        }
        updates.currentBehavioralScore = newScore;
        needsUpdate = true;
      }

      // Check and update behavioralScoreHistory
      if (student.behavioralScoreHistory && student.behavioralScoreHistory.length > 0) {
        const updatedHistory = student.behavioralScoreHistory.map(entry => {
          if (entry.score > 10) {
            // Convert from 0-100 to 0-10 scale (divide by 10, round to 1 decimal place)
            let newScore = Math.round((entry.score / 10) * 10) / 10;
            // Cap at 10
            if (newScore > 10) {
              newScore = 10;
            }
            return {
              ...entry,
              score: newScore
            };
          }
          return entry;
        });

        // Check if any scores were updated
        const hasChanges = updatedHistory.some((entry, index) => 
          entry.score !== student.behavioralScoreHistory[index].score
        );

        if (hasChanges) {
          updates.behavioralScoreHistory = updatedHistory;
          needsUpdate = true;
        }
      }

      // Update student if needed
      if (needsUpdate) {
        // Count how many scores were updated before the update
        let scoresUpdated = 0;
        const oldCurrentScore = student.currentBehavioralScore;
        const oldHistoryScores = student.behavioralScoreHistory || [];
        
        if (oldCurrentScore !== undefined && oldCurrentScore !== null && oldCurrentScore > 10) {
          scoresUpdated++;
        }
        scoresUpdated += oldHistoryScores.filter(e => e.score > 10).length;
        
        // Directly update the database
        const updateResult = await Student.findByIdAndUpdate(
          student._id,
          {
            $set: {
              currentBehavioralScore: updates.currentBehavioralScore,
              behavioralScoreHistory: updates.behavioralScoreHistory
            }
          },
          { new: true, runValidators: false }
        );

        if (!updateResult) {
          console.error(`Failed to update student ${student._id}`);
          continue;
        }

        // Verify the update was successful
        const verifyStudent = await Student.findById(student._id);
        if (verifyStudent) {
          console.log(`✓ Updated student ${student.name} (${student._id}): ${scoresUpdated} score(s) converted`);
        }

        updatedCount++;
        totalScoresUpdated += scoresUpdated;

        results.push({
          studentId: student._id.toString(),
          studentName: student.name,
          scoresUpdated: scoresUpdated,
          oldCurrentScore: oldCurrentScore,
          newCurrentScore: updates.currentBehavioralScore
        });
      }
    }

    return NextResponse.json({
      message: 'Migration completed successfully',
      summary: {
        totalStudents: students.length,
        studentsUpdated: updatedCount,
        totalScoresUpdated: totalScoresUpdated
      },
      details: results
    }, { status: 200 });

  } catch (error) {
    console.error("Error migrating behavioral scores:", error);
    return NextResponse.json({ 
      error: 'Failed to migrate behavioral scores',
      details: error.message 
    }, { status: 500 });
  }
}

