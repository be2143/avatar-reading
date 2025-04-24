// src/app/api/activities/route.js
import { Activity } from "@/app/lib/schemas";
import connectToDatabase from "@/app/lib/mongo";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request) {
    try {
        await connectToDatabase();
        const activities = await Activity.find();
        return NextResponse.json(activities, { status: 200 });
    } catch (error) {
        console.error("Error in GET /api/activities:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}

// To update the state
export async function PATCH(request) {
    try {
        // Connect to the database
        await connectToDatabase();

        // Parse the incoming request body (ensure it's JSON)
        const { activities } = await request.json();

        // Update each activity in the list to set 'planned' to true and maintain its current state
        const updatedActivities = [];
        for (let activity of activities) {
            const updatedActivity = await Activity.findByIdAndUpdate(
                activity._id,
                {
                    planned: true,  // Set 'planned' to true for each activity
                    state: activity.state,  // Keep the current state of the activity (either "done" or "not done")
                },
                { new: true } // Return the updated document
            );
            if (updatedActivity) {
                updatedActivities.push(updatedActivity);
            } else {
                console.error(`Activity with ID ${activity._id} not found`);
            }
        }

        // Set other activities planned to false
        const otherActivities = await Activity.updateMany(
            { _id: { $nin: activities.map((activity) => activity._id) } },
            { planned: false }
        );

        // Return the updated activities
        return NextResponse.json(updatedActivities, { status: 200 });
    } catch (error) {
        console.error("Error in POST /api/activities:", error.message);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}

// To add a new activity to the db
export async function POST(request) {
    try {
        await connectToDatabase();
        const body = await request.json();

        // Validate required fields
        if (!body.title || !body.imageSrc || !body.icon) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const activity = new Activity({
            title: body.title,
            imageSrc: body.imageSrc,
            icon: body.icon,
            color: "#ffffff",
            planned: false,
            state: "not done"
        });

        await activity.save();
        return NextResponse.json(activity, { status: 201 });

    } catch (error) {
        console.error("Error in POST /api/activities:", error.message);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}


// To delete an activity
export async function DELETE(request) {
    try {
        await connectToDatabase();
        const { title } = await request.json(); // Extract title from request body

        if (!title) {
            return NextResponse.json(
                { message: "Missing activity title" },
                { status: 400 }
            );
        }

        // Find and delete the activity by title
        const activity = await Activity.findOneAndDelete({ title });

        if (!activity) {
            return NextResponse.json(
                { message: `Activity with title "${title}" not found` },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Activity deleted successfully!", activity },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in DELETE /api/activities:", error.message);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
