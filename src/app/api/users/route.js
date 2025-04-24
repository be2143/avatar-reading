import connectToDatabase from "@/app/lib/mongo";
import { NextResponse } from 'next/server';
import { User } from "../../lib/schemas"

export async function GET(request) {
    try {
      const name = request.headers.get('name');

      if (!name) {
          return NextResponse.json({ message: 'Name header is required' }, { status: 400 });
      }

      await connectToDatabase();
      const user = await User.findOne({ name: name });

      
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
  
      return NextResponse.json(user, { status: 200 });

    } catch (error) {
      return NextResponse.json({ message: 'Error fetching goals', error: error.message }, { status: 500 });
    }
  }

export async function POST(request) {
    try {
        await connectToDatabase();
        const data = await request.json();
        
        // Create new user using Mongoose model
        const newUser = new User(data);
        await newUser.save();

        return NextResponse.json(
            { message: 'User created successfully', user: newUser },
            { status: 201 }
        );
    } catch (error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            return NextResponse.json(
                { message: 'Validation error', errors: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}