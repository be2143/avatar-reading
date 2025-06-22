import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Story from "@/models/story";

export async function GET() {
  try {
    await connectMongoDB();
    const stories = await Story.find(); // Fetch all stories
    return NextResponse.json(stories);
  } catch (error) {
    console.error("Failed to fetch stories:", error);
    return NextResponse.json({ message: "Error fetching stories" }, { status: 500 });
  }
}
