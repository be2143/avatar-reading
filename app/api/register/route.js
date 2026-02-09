import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import cloudinary from "@/lib/cloudinary"; 

export async function POST(req) {
  try {
    const formData = await req.formData();

    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const imageFile = formData.get("image"); 


    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json({ message: "Image is required." }, { status: 400 });
    }

    let imageUrl = null; 

    // Upload image to Cloudinary
    try {
      // Convert imageFile to ArrayBuffer
      const arrayBuffer = await imageFile.arrayBuffer();
      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(arrayBuffer);
      // Convert Buffer to Base64 string for Cloudinary upload
      const base64Image = `data:${imageFile.type};base64,${buffer.toString("base64")}`;

      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: "user_profiles", 
        resource_type: "auto" // Automatically determine the resource type (image, video, raw)
      });
      imageUrl = uploadResult.secure_url; // Get the secure URL from Cloudinary
      console.log("Cloudinary upload successful. Image URL:", imageUrl);
    } catch (uploadError) {
      console.error("Cloudinary image upload error:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload image to Cloudinary." },
        { status: 500 }
      );
    }

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
      image: imageUrl, // Save the Cloudinary image URL
    });

    console.log("Registered user ID:", user._id);
    console.log("User saved with Cloudinary image URL:", imageUrl);


    return NextResponse.json({ message: "User registered." }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000 && error.keyPattern && error.keyPattern.email === 1) {
      return NextResponse.json({ message: "User with this email already exists." }, { status: 409 });
    }

    return NextResponse.json(
      { message: "An error occurred while registering the user." },
      { status: 500 }
    );
  }
}