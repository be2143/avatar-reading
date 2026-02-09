import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import cloudinary from "@/lib/cloudinary";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    await connectMongoDB();
    const user = await User.findById(session.user.id).select("name email image").lean();
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image || null,
    });
  } catch (error) {
    console.error("GET /api/user/me error:", error);
    return NextResponse.json({ message: "Failed to fetch user." }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    await connectMongoDB();

    let name = null;
    let imageUrl = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      name = form.get("name") || null;
      const imageFile = form.get("image");
      if (imageFile && typeof imageFile.arrayBuffer === "function") {
        try {
          const buffer = Buffer.from(await imageFile.arrayBuffer());
          const base64Image = `data:${imageFile.type};base64,${buffer.toString("base64")}`;
          const uploadResult = await cloudinary.uploader.upload(base64Image, {
            folder: "user_profiles",
            resource_type: "auto",
          });
          imageUrl = uploadResult.secure_url;
        } catch (err) {
          console.error("Cloudinary upload failed:", err);
          return NextResponse.json({ message: "Image upload failed" }, { status: 500 });
        }
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      name = body.name || null;
      imageUrl = body.image || null; // optional direct URL update
    } else {
      return NextResponse.json({ message: "Unsupported content type" }, { status: 400 });
    }

    const update = {};
    if (name !== null) update.name = name;
    if (imageUrl !== null) update.image = imageUrl;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: "No changes provided" }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(session.user.id, update, { new: true }).select("name email image");
    if (!updated) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: updated._id.toString(),
      name: updated.name,
      email: updated.email,
      image: updated.image || null,
    });
  } catch (error) {
    console.error("PUT /api/user/me error:", error);
    return NextResponse.json({ message: "Failed to update user." }, { status: 500 });
  }
}





















