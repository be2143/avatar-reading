import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const formData = await req.formData();

    const name = formData.get("name");
    const email = formData.get("email"); // <--- Problematic variable
    const password = formData.get("password");
    const imageFile = formData.get("image");

    // ✅ DEBUGGING OUTPUT
    console.log("Name:", name);
    console.log("Email:", email); // <<<--- ADD THIS LINE!!!
    console.log("Password (length):", password ? password.length : 'N/A');
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

    // Check if user with this email already exists before trying to create
    // This won't prevent the `null` duplicate error if it's the *first* null,
    // but it's good practice for non-null emails.
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn("Attempted registration with existing email:", email);
      return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
    }


    const user = await User.create({
      name,
      email, // This is where `null` is being passed
      password: hashedPassword,
      image: base64Image,
    });

    console.log("User saved with image size:", base64Image.length);
    console.log("Registered user ID:", user._id); // Log the new user ID

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