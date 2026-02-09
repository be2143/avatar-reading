// app/api/students/[id]/stories/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Student from '@/models/student'; // Adjust path as needed
import Story from "@/models/story";

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    // Find student and populate their personalized stories
    console.log('Fetching student with ID:', id);
    const student = await Student.findById(id).populate('personalizedStories');
    
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Also fetch stories directly from Story collection where student field matches
    const stories = await Story.find({ 
      $or: [
        { student: id },
        { _id: { $in: student.personalizedStories } }
      ]
    }).sort({ createdAt: -1 });
    console.log('Fetched stories for student:', stories.length);
    return NextResponse.json({
      student: {
        _id: student._id,
        name: student.name,
        age: student.age,
        image: student.image
      },
      stories: stories
    });

  } catch (error) {
    console.error('Error fetching student stories:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );
  }
}

// Optional: Update student's personalized stories
export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const { storyId } = await request.json();
    
    if (!id || !storyId) {
      return NextResponse.json({ error: 'Student ID and Story ID are required' }, { status: 400 });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(storyId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Add story to student's personalized stories if not already there
    const student = await Student.findByIdAndUpdate(
      id,
      { $addToSet: { personalizedStories: storyId } },
      { new: true }
    ).populate('personalizedStories');

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Also update the story to reference this student
    await Story.findByIdAndUpdate(storyId, { 
      student: id,
      isPersonalized: true 
    });

    return NextResponse.json({
      message: 'Story added to student successfully',
      student: student
    });

  } catch (error) {
    console.error('Error adding story to student:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message }, 
      { status: 500 }
    );
  }
}