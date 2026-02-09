// app/api/students/[id]/behavioral-score/route.js
import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Student from '@/models/student';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { newScore } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    if (newScore === undefined || newScore === null) {
      return NextResponse.json({ error: "New score is required" }, { status: 400 });
    }

    // Validate score range (0-100)
    if (newScore < 0 || newScore > 100) {
      return NextResponse.json({ error: "Score must be between 0 and 100" }, { status: 400 });
    }

    await connectMongoDB();

    // Update the student's behavioral score
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { 
        $set: { currentBehavioralScore: Number(newScore) },
        $push: { 
          behavioralScoreHistory: {
            score: Number(newScore),
            date: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Behavioral score updated successfully", 
      student: updatedStudent.toObject() 
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating behavioral score:", error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return NextResponse.json({ error: 'Invalid student ID format.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update behavioral score' }, { status: 500 });
  }
} 