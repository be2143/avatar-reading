// pages/api/comprehension-chart.js (or app/api/comprehension-chart/route.js in app dir)
import { connectMongoDB } from '@/lib/mongodb';
import Story from '@/models/story';
import { getServerSession } from 'next-auth';
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        await connectMongoDB();

        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ message: "Authentication required" }, { status: 401 });
        }

        const userId = session.user.id;

        // Query stories created by the user
        const storiesWithSessions = await Story.find({ createdBy: userId }).lean();

        // Collect all sessions with valid comprehensionScore and storyLength
        const allSessions = [];

        storiesWithSessions.forEach(story => {
            if (story.sessions && Array.isArray(story.sessions) && story.storyLength) {
                story.sessions.forEach(session => {
                    let comprehensionScoreInt = parseInt(session.comprehensionScore);
                        allSessions.push({
                            storyLength: story.storyLength,
                            sessionNum: session.sessionNum || 0,
                            comprehensionScore: comprehensionScoreInt,
                        });
                });
            }
        });

        if (allSessions.length === 0) {
            return NextResponse.json({ chartData: [] });
        }

        // Group sessions by storyLength, then by sessionNum
        const lengthGroups = {};

        allSessions.forEach(({ storyLength, sessionNum, comprehensionScore }) => {
            if (!lengthGroups[storyLength]) lengthGroups[storyLength] = {};
            if (!lengthGroups[storyLength][sessionNum]) lengthGroups[storyLength][sessionNum] = [];
            lengthGroups[storyLength][sessionNum].push(comprehensionScore);
        });

        // Collect all unique session numbers across all lengths
        const sessionNumsSet = new Set();
        Object.values(lengthGroups).forEach(sessionMap => {
            Object.keys(sessionMap).forEach(sn => sessionNumsSet.add(Number(sn)));
        });
        const sessionNums = Array.from(sessionNumsSet).sort((a, b) => a - b);

        // Helper to map length keys to nicer labels (optional)
        const lengthLabels = {
            very_short: "Very Short (~50 words)",
            short: "Short (~100 words)",
            medium: "Medium (~200 words)",
            long: "Long (~300 words)"
        };

        // Build chart data: each data point is a session, each key is a story length with average comprehension score scaled 0-100
        const chartData = sessionNums.map(sessionNum => {
            const dataPoint = { session: `Session ${sessionNum}` };

            Object.keys(lengthGroups).forEach(lengthKey => {
                const scores = lengthGroups[lengthKey][sessionNum];
                if (scores && scores.length > 0) {
                    // Average the scores for this sessionNum and length
                    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                    dataPoint[lengthLabels[lengthKey] || lengthKey] = avgScore;
                }
            });

            return dataPoint;
        });

        return NextResponse.json({ chartData });

    } catch (error) {
        console.error('Error in comprehension-chart API:', error);
        return NextResponse.json({ message: 'Error fetching data', chartData: [] }, { status: 500 });
    }
}
