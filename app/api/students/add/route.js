// app/api/students/add/route.js
import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Student from "@/models/student";
import User from "@/models/user";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { v2 as cloudinary } from 'cloudinary'; // Import Cloudinary

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Authentication required or user ID not found." }, { status: 401 });
    }

    const {
      name,
      age,
      diagnosis,
      birthday,
      guardian,
      contact,
      comprehensionLevel,
      preferredStoryLength,
      preferredSentenceLength,
      learningPreferences,
      interests,
      challenges,
      goals,
      notes,
      image, // This will now be the base64 string from the client
    } = await request.json();

    const authenticatedUserId = session.user.id;

    await connectMongoDB();

    let imageUrl = ""; // Variable to store Cloudinary image URL

    // If an image (base64 string) is provided, upload it to Cloudinary
    if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(`data:image/jpeg;base64,${image}`, {
            folder: "student_images", // Optional: organize your uploads in a specific folder
        });
        imageUrl = uploadResponse.secure_url; // Get the secure URL of the uploaded image
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        // Decide how to handle upload error: return an error or proceed without image
        return NextResponse.json({ message: "Failed to upload image to Cloudinary.", error: uploadError.message }, { status: 500 });
      }
    }

    // Create a new student document and store the result
    const newStudent = await Student.create({
      name,
      age: age ? Number(age) : undefined,
      diagnosis,
      birthday,
      guardian,
      contact,
      comprehensionLevel,
      preferredStoryLength,
      preferredSentenceLength,
      learningPreferences,
      interests,
      challenges,
      goals,
      notes,
      image: imageUrl, // Store the Cloudinary URL
      userId: authenticatedUserId
    });

    // After successfully creating the student, add the student's ID to the user's students array
    await User.findByIdAndUpdate(
      authenticatedUserId,
      { $push: { students: newStudent._id } },
      { new: true, upsert: false }
    );

    // Generate cartoon character asynchronously (don't wait for it)
    if (imageUrl) {
      console.log(`🎨 [STUDENT-ADD] Starting async cartoon generation for student: ${name}`);
      console.log(`🎨 [STUDENT-ADD] Student ID: ${newStudent._id}`);
      console.log(`🎨 [STUDENT-ADD] Image URL: ${imageUrl.substring(0, 50)}...`);
      
      // Call the cartoon generation API asynchronously
      fetch(`${request.nextUrl.origin}/api/students/generate-cartoon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentImageUrl: imageUrl,
          studentName: name,
          studentId: newStudent._id.toString()
        }),
      }).then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          console.log(`🎨 [STUDENT-ADD] Cartoon generation successful for ${name}, updating student record...`);
          console.log(`🎨 [STUDENT-ADD] Generated cartoon URL: ${data.cartoonImageUrl.substring(0, 50)}...`);
          
          // Update the student with the cartoon image URL
          const updateResponse = await fetch(`${request.nextUrl.origin}/api/students/update-cartoon`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentId: newStudent._id.toString(),
              cartoonImageUrl: data.cartoonImageUrl
            }),
          });
          
          if (updateResponse.ok) {
            console.log(`🎨 [STUDENT-ADD] ✅ SUCCESS: Cartoon image updated for ${name}`);
          } else {
            console.error(`🎨 [STUDENT-ADD] ❌ FAILED: Could not update cartoon image for ${name}`);
          }
        } else {
          console.error(`🎨 [STUDENT-ADD] ❌ FAILED: Cartoon generation failed for student: ${name}`);
          const errorData = await response.json().catch(() => ({}));
          console.error(`🎨 [STUDENT-ADD] Error details:`, errorData);
        }
      }).catch((error) => {
        console.error(`🎨 [STUDENT-ADD] ❌ ERROR: Cartoon generation process failed for ${name}:`, error);
      });
    } else {
      console.log(`🎨 [STUDENT-ADD] No image provided for ${name}, skipping cartoon generation`);
    }

    return NextResponse.json({ message: "Student added successfully and linked to user. Cartoon character generation started." }, { status: 201 });

  } catch (error) {
    console.error("Error adding student:", error);
    return NextResponse.json({ message: "Failed to add student.", error: error.message || "An unknown error occurred." }, { status: 500 });
  }
}