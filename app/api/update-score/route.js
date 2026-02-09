import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Student from '@/models/student';

export async function POST(request) {
  try {
    // Get the id from the URL
    const id = request.nextUrl.pathname.split('/')[3];
    const { newScore } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Rest of your validation and logic...
    if (newScore === undefined || newScore === null) {
      return NextResponse.json({ error: "New score is required" }, { status: 400 });
    }

    if (newScore < 0 || newScore > 10) {
      return NextResponse.json({ error: "Score must be between 0 and 10" }, { status: 400 });
    }

    await connectMongoDB();

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