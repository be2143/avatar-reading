import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import User from "@/models/user";
import Student from "@/models/student";

export async function GET(req) {
  try {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Authentication required." }, { status: 401 });
    }

    const loggedInUserId = session.user.id;
    const user = await User.findById(loggedInUserId).select('students').lean();

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const userStudentIds = user.students || [];
    
    if (userStudentIds.length === 0) {
      return NextResponse.json([]);
    }

    // For now, we'll simulate reading sessions by using the students' data
    // In a real implementation, you'd have a separate Session model
    const students = await Student.find({ _id: { $in: userStudentIds } })
      .select('name createdAt')
      .lean();

    // Create mock session data (replace with actual session data when available)
    const sessions = students.map(student => ({
      _id: `session_${student._id}`,
      studentName: student.name,
      createdAt: student.createdAt,
      type: 'session'
    }));

    return NextResponse.json(sessions);

  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ message: "Error fetching sessions" }, { status: 500 });
  }
} 