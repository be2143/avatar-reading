// app/api/register/route.js
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
    const imageFile = formData.get("image"); // This is a File object

    // ✅ DEBUGGING OUTPUT (keep these for development)
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Password (length):", password ? password.length : 'N/A');
    console.log("imageFile type:", typeof imageFile);
    console.log("imageFile instanceof File:", imageFile instanceof File);
    console.log("imageFile name:", imageFile?.name);
    console.log("imageFile MIME type:", imageFile?.type); // Log the MIME type


    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json({ message: "Image is required." }, { status: 400 });
    }

    // Convert imageFile to ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();
    // Convert ArrayBuffer to raw Base64 string
    const rawBase64Image = Buffer.from(arrayBuffer).toString("base64");

    // --- CRITICAL CHANGE HERE: Prepend the data URI prefix ---
    // Use the actual MIME type from the File object
    const fullBase64Image = `data:${imageFile.type};base64,${rawBase64Image}`;
    // ---------------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 10);

    await connectMongoDB();

    // Check if user with this email already exists before trying to create
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn("Attempted registration with existing email:", email);
      return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      image: fullBase64Image, // Save the full data URI string
    });

    console.log("User saved with image size:", fullBase64Image.length);
    console.log("Registered user ID:", user._id);

    return NextResponse.json({ message: "User registered." }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);

    // More specific error message for the duplicate key error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email === 1 && error.keyValue && error.keyValue.email === null) {
      return NextResponse.json({ message: "Cannot register multiple users without an email address (duplicate null email)." }, { status: 400 });
    }

    return NextResponse.json(
      { message: "An error occurred while registering the user." },
      { status: 500 }
    );
  }
}