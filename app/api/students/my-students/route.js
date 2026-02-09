// app/api/students/me/route.js
import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Student from '@/models/student'; // Your Student model
import User from '@/models/user';     // Import your User model
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request) {
  try {

    const session = await getServerSession(authOptions);


    // 1. Authenticate: Ensure user is logged in and their ID is available
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Authentication required or user ID not found." }, { status: 401 });
    }

    await connectMongoDB();

    const userId = session.user.id;

    // 2. Find the current user's document to get their list of student IDs
    // Select only the 'students' field for efficiency
    const user = await User.findById(userId).select('students').lean();

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Ensure the 'students' field exists and is an array
    const studentIds = user.students || [];

    // 3. If there are student IDs, fetch the corresponding student documents
    let students = [];
    if (studentIds.length > 0) {
      // Use $in operator to find all students whose _id is in the studentIds array
      students = await Student.find({ _id: { $in: studentIds } }).lean();
    }


    // 4. Return the fetched students
    return NextResponse.json(
      {
        message: 'Students fetched successfully.',
        students: students
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching students:', error);

    return NextResponse.json(
      { error: 'Failed to fetch students.' },
      { status: 500 }
    );
  }
}