import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Student from "@/models/student";

export async function PUT(request) {
  const startTime = Date.now();
  console.log('🎨 [UPDATE-CARTOON] Starting cartoon image update process...');
  
  try {
    // Note: This API is called internally by the server, so we skip authentication
    // The authentication is already handled in the student add process

    const { studentId, cartoonImageUrl } = await request.json();
    console.log(`🎨 [UPDATE-CARTOON] Received update request for student ID: ${studentId}`);
    console.log(`🎨 [UPDATE-CARTOON] Cartoon URL: ${cartoonImageUrl.substring(0, 50)}...`);

    if (!studentId || !cartoonImageUrl) {
      console.error('🎨 [UPDATE-CARTOON] Missing required fields:', {
        hasStudentId: !!studentId,
        hasCartoonUrl: !!cartoonImageUrl
      });
      return NextResponse.json({ 
        error: 'Student ID and cartoon image URL are required.' 
      }, { status: 400 });
    }

    console.log('🎨 [UPDATE-CARTOON] Connecting to MongoDB...');
    await connectMongoDB();
    console.log('🎨 [UPDATE-CARTOON] MongoDB connected successfully');

    // Update the student's cartoon image
    console.log(`🎨 [UPDATE-CARTOON] Updating student ${studentId} with cartoon image...`);
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { cartoonImage: cartoonImageUrl },
      { new: true }
    );

    if (!updatedStudent) {
      console.error(`🎨 [UPDATE-CARTOON] Student not found with ID: ${studentId}`);
      return NextResponse.json({ 
        error: 'Student not found.' 
      }, { status: 404 });
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎨 [UPDATE-CARTOON] ✅ SUCCESS: Cartoon image updated for student: ${updatedStudent.name} in ${totalTime}ms`);
    console.log(`🎨 [UPDATE-CARTOON] Updated student ID: ${updatedStudent._id}`);

    return NextResponse.json({ 
      message: 'Cartoon image updated successfully',
      student: updatedStudent,
      updateTime: totalTime
    }, { status: 200 });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`🎨 [UPDATE-CARTOON] ❌ ERROR after ${totalTime}ms:`, error);
    console.error('🎨 [UPDATE-CARTOON] Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to update cartoon image.' 
    }, { status: 500 });
  }
} 