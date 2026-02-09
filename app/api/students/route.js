// app/api/students/route.js
import { connectMongoDB } from "@/lib/mongodb";
import Student from "@/models/student";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    let { image, ...otherStudentData } = body; 
    if (image && typeof image === 'string' && image.trim() !== '') {

      if (image.startsWith('iVBORw0KGgo') && !image.startsWith('data:')) {
        image = `data:image/png;base64,${image}`;
      }
    } else {
      image = "";
    }

    await connectMongoDB();

    const student = await Student.create({ ...otherStudentData, image });

    return new Response(JSON.stringify({ message: "Student added", student }), { status: 201 });
  } catch (error) {
    console.error("Error adding student:", error); 
    return new Response(JSON.stringify({ error: error.message || "An unknown error occurred while adding student" }), { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectMongoDB();
    
    const { searchParams } = new URL(req.url);
    const recent = searchParams.get('recent');
    const createdBy = searchParams.get('createdBy');

    let query = {};

    if (createdBy) {
      query.createdBy = createdBy;
    }

    if (recent === 'true') {
      // Get students created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    }

    const students = await Student.find(query).sort({ createdAt: -1 });
    console.log('Student fetched from db: ', students);
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ message: "Failed to load students" }, { status: 500 });
  }
}