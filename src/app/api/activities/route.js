// src/app/api/activities/route.js
import { Activity } from "@/app/lib/schemas";
import connectToDatabase from "@/app/lib/mongo";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request) {
    try {
        await connectToDatabase();
        console.log("Activity model:", Activity);
        const activities = await Activity.find();
        console.log("Activities:", activities);
        return NextResponse.json(activities, { status: 200 });
    } catch (error) {
        console.error("Error in GET /api/activities:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
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

