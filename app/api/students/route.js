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

export async function GET() {
  try {
    await connectMongoDB();
    const students = await Student.find();
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ message: "Failed to load students" }, { status: 500 });
  }
}