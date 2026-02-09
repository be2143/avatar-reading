// app/api/students/[id]/route.js
import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Student from '@/models/student'; // Your Student model

export async function GET(request, { params }) {
  try {
    await connectMongoDB();
    const { id } = await params; // Get the student ID from the URL parameter

    if (!id) {
      return NextResponse.json({ message: "Student ID is required" }, { status: 400 });
    }

    // Find the student by ID and populate their personalized stories
    const student = await Student.findById(id).populate('personalizedStories');

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ student }, { status: 200 });

  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json({ message: "Error fetching student" }, { status: 500 });
  }
}

// PUT or PATCH handler for updating student data
export async function PUT(request, context) {
  try {
    const { id: studentId } = await context.params; // Await params
    const body = await request.json();

    await connectMongoDB();

    // Find the student by ID and update
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $set: body }, // Use $set to update only provided fields
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedStudent) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Student updated successfully', student: updatedStudent.toObject() },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating student:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return NextResponse.json(
            { error: 'Invalid student ID format.' },
            { status: 400 }
        );
    }
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}