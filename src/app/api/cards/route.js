// app/api/cards/route.js
import { Card, Category } from "@/app/lib/schemas";
import connectToDatabase from "@/app/lib/mongo";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const word = searchParams.get('word');

        // Return all cards if no parameters provided
        if (!id && !word) {
            const cards = await Card.find();
            return NextResponse.json(cards);
        }

        // Search by MongoDB ID
        if (id) {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return NextResponse.json(
                    { message: 'Invalid ID format' },
                    { status: 400 }
                );
            }
            const card = await Card.findById(id);
            if (!card) {
                return NextResponse.json(
                    { message: 'Card not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json(card);
        }

        // Search by word
        if (word) {
            const card = await Card.findOne({ word: word });
            if (!card) {
                return NextResponse.json(
                    { message: 'Card not found' },
                    { status: 404 }
                );
            }
            return NextResponse.json(card);
        }

    } catch (error) {
        console.error('Error in GET /api/cards:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        const data = await request.json();

        // Validate required field
        if (!data.word) {
            return NextResponse.json(
                { message: 'Word is required' },
                { status: 400 }
            );
        }

        // If category name is provided, find or create the category
        if (data.category) {
            // First try to find the category
            let category = await Category.findOne({ name: data.category });
            
            // If category doesn't exist, create it
            if (!category) {
                category = new Category({ name: data.category });
                await category.save();
            }
            
            // Replace category name with category ObjectId
            data.category = category._id;
        }

        const newCard = new Card(data);
        await newCard.save();

        // If category exists, add this card to category's cards array
        if (data.category) {
            await Category.findByIdAndUpdate(
                data.category,
                { $addToSet: { cards: newCard._id } }
            );
        }

        return NextResponse.json(
            { message: 'Card created successfully', card: newCard },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error in POST /api/cards:', error);
        
        // Handle duplicate word error
        if (error.code === 11000) {
            return NextResponse.json(
                { message: 'Card with this word already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}