import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    await connectMongoDB();

    const user = await User.findById(session.user.id).select('name email image').lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching user data." },
      { status: 500 }
    );
  }
}