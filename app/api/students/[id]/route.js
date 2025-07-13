// app/api/students/[id]/route.js
import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Student from '@/models/student'; // Your Student model

export async function GET(request, { params }) {
  try {
    await connectMongoDB();
    const { id } = params; // Get the student ID from the URL parameter

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