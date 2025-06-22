import { connectMongoDB } from "@/lib/mongodb";
import Student from "@/models/student";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    await connectMongoDB();

    const student = await Student.create(body);

    return new Response(JSON.stringify({ message: "Student added", student }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
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

