import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const imageFile = formData.get("image");

    // ✅ DEBUGGING OUTPUT
    console.log("imageFile type:", typeof imageFile);
    console.log("imageFile instanceof File:", imageFile instanceof File);
    console.log("imageFile name:", imageFile?.name);

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json({ message: "Image is required." }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    const hashedPassword = await bcrypt.hash(password, 10);

    await connectMongoDB();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      image: base64Image,
    });

    console.log("User saved with image size:", base64Image.length);

    return NextResponse.json({ message: "User registered." }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred while registering the user." },
      { status: 500 }
    );
  }
}
