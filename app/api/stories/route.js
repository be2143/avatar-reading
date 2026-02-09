import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Story from "@/models/story";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const studentId = searchParams.get('studentId');
    const createdBy = searchParams.get('createdBy');

    // console.log(`--- API CALL: GET /api/stories ---`);
    // console.log(`Query Params: type=${type}, studentId=${studentId}`);

    let query = {};

    if (createdBy) {
      query.createdBy = createdBy;
    } else if (type === 'general') {
      // console.log('Fetching General Stories...');
      query.isPersonalized = false;
      query.student = null;
    } else if (type === 'personalized') {
      // console.log('Fetching Personalized Stories...');

      const session = await getServerSession(authOptions);
      // console.log('Session retrieved:', session ? { user: session.user, expires: session.expires } : 'No session');

      if (!session || !session.user || !session.user.id) {
        console.log('Authentication failed: User not logged in or ID missing.');
        // return NextResponse.json({ message: "Authentication required to fetch personalized stories." }, { status: 401 });
      }

      const loggedInUserId = session.user.id;
      // console.log('Logged In User ID:', loggedInUserId);

      const user = await User.findById(loggedInUserId).select('students').lean();
      // console.log('User found for ID:', loggedInUserId, 'User object (with students):', user);

      if (!user) {
        // console.log('User not found in DB for ID:', loggedInUserId);
        return NextResponse.json({ message: "User not found." }, { status: 404 });
      }

      const userStudentIds = user.students || [];
      // console.log('User has student IDs:', userStudentIds);

      if (userStudentIds.length === 0) {
        // console.log('User has no students. Returning empty array for personalized stories.');
        return NextResponse.json([]);
      }

      query.isPersonalized = true;
      query.student = { $in: userStudentIds };
      // console.log('Base Personalized Query:', query);

      if (studentId) {
        // console.log('Specific studentId filter provided:', studentId);
        if (!mongoose.Types.ObjectId.isValid(studentId)) {
          // console.log('Invalid studentId format:', studentId);
          return NextResponse.json({ message: "Invalid student ID format." }, { status: 400 });
        }

        const isStudentAssociated = userStudentIds.some(id => id.toString() === studentId);
        if (!isStudentAssociated) {
          // console.log(`Security check failed: Student ID ${studentId} is not associated with user ${loggedInUserId}.`);
          return NextResponse.json({ message: "Student not associated with your account." }, { status: 403 });
        }

        query.student = new mongoose.Types.ObjectId(studentId);
        // console.log('Updated Personalized Query for specific student:', query);
      }
    } else if (type === 'all') {
      // Fetch all stories (both personalized and generated) for the logged-in user
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
      
      // Query for both personalized stories (for user's students) and general stories
      query.$or = [
        { isPersonalized: true, student: { $in: userStudentIds } },
        { isPersonalized: false, student: null }
      ];
    } else {
      // console.log('No valid "type" parameter provided. Defaulting to General Stories.');
      query.isPersonalized = false;
      query.student = null;
    }

    // console.log('Final MongoDB Query for Story.find:', query);
    const stories = await Story.find(query).populate('student', 'name age').lean();
    // console.log('Stories found from DB:', stories.length, 'stories. Sample (first 2):', stories.slice(0,2));
    
    return NextResponse.json(stories);

  } catch (error) {
    console.error("Error fetching stories:", error); 
    return NextResponse.json({ message: "Error fetching stories" }, { status: 500 });
  } finally {
    // console.log('--- API CALL END ---');
  }
}