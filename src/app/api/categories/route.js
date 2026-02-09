import { Category } from "@/app/lib/schemas";
import connectToDatabase from "@/app/lib/mongo";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');

        if (!name) {
            // Return all category names
            const categories = await Category.find({}, "name");
            return NextResponse.json(categories);
        }

        // Fetch category by name and return its card IDs
        const category = await Category.findOne({ name: name });

        if (!category) {
            return NextResponse.json(
                { message: "Category not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ name: category.name, cards: category.cards });
    } catch (error) {
        console.error("Error in GET /api/categories:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
