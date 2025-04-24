import React from 'react';
import { Circle } from 'lucide-react';
import { Chewy } from "next/font/google";
import { Star } from 'lucide-react';

import { Clock } from "lucide-react";

const skillData = [
    { name: "New Words Learned", context: 35, color: 'rgb(255, 149, 128)' },
    { name: "Total Words Per Day", context: 120, color: 'rgb(198, 176, 255)' },
    { name: "Avg. Sentence Length", context: '6 words', color: 'rgb(255, 223, 128)' },
    { name: "Session Duration", context: '62 sec', color: 'rgb(128, 206, 255)' },
];


const chewy = Chewy({ weight: "400", subsets: ["latin"] });


const progressData = {
    weeklyRoutine: [
        { name: 'Monday', planned: 8, completed: 8, color: 'rgb(255, 149, 128)' },
        { name: 'Tuesday', planned: 7, completed: 6, color: 'rgb(198, 176, 255)' },
        { name: 'Wednesday', planned: 5, completed: 5, color: 'rgb(152, 255, 183)' },
        { name: 'Thursday', planned: 6, completed: 6, color: 'rgb(128, 206, 255)' },
        { name: 'Friday', planned: 8, completed: 6, color: 'rgb(255, 223, 128)' },
        { name: 'Saturday', planned: 7, completed: 6, color: 'rgb(255, 185, 185)' },
        { name: 'Sunday', planned: 8, completed: 8, color: 'rgb(182, 255, 182)' },
    ]
};

const recentLessons = [
    { image: '/mp1.png', color: 'bg-orange-200' },
    { image: '/mp2.png' },
    { image: '/mp3.png', color: 'bg-yellow-100' }
];

const reports = [
    { title: 'Communication Report: Active!', img: '/active.png' },
    { title: 'Emotional Pattern: Happy!', img: '/happy.png' }
];

const AnalysisMain = () => {
    return (
        <div className="ml-20 p-20 bg-[url('/bg.png')] min-h-screen flex flex-col">
            {/* Profile Section */}
            <div className='max-w-5xl mx-auto'>

            </div>
            <div className="flex justify-between items-start gap-10">
                <div className="h-48 w-48 bg-white rounded-full overflow-hidden">
                    <img src="girl-char.png" alt="User Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-yellow-200 p-6 rounded-lg h-48 relative">
                        <img src="info.png" className="h-20 w-20 object-cover absolute top-6 right-6" />
                        <div className="absolute bottom-4 left-4 p-4">
                            <h3 className="text-xl font-bold text-black">Aigyr</h3>
                            <p className="text-black">7 years old</p>
                        </div>
                    </div>
                    <div className="bg-blue-200 p-6 rounded-lg h-48 relative">
                        <img src="interest.png" className="h-20 w-20 object-cover absolute top-6 right-6" />
                        <div className="absolute bottom-4 left-4 p-4">
                            <h3 className="text-xl font-bold text-black">Interests</h3>
                            <p className="text-black">Chess, Math</p>
                        </div>
                    </div>
                    <div className="bg-purple-200 p-6 rounded-lg h-48 relative">
                        <img src="activity.png" className="h-20 w-20 object-cover absolute top-6 right-6" />
                        <div className="absolute bottom-4 left-4 p-4">
                            <h3 className="text-xl font-bold text-black">Recent Activity</h3>
                            <p className="text-black">Gardening</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Parent Insights - Horizontal Layout */}
            <div className="bg-blue-300 p-8 mt-10 rounded-lg">
                <h1 className="text-2xl font-semibold mb-6 text-white">Parent's Insight</h1>
                <div className="flex gap-6 flex-wrap">
                    {/* Insights Panel */}
                    <section className="bg-white p-6 rounded-lg shadow-md flex-1.5 min-w-[300px]">
                        <h2 className="text-lg text-black font-semibold mb-4">Routine Achievement</h2>
                        <div className="grid grid-cols-7 gap-4">
                            {progressData.weeklyRoutine.map((skill) => {
                                const isAchieved = skill.completed >= skill.planned;

                                return (
                                    <div key={skill.name} className="text-center text-black">
                                        <div className="relative inline-block">
                                            <Circle size={64} className="text-gray-200" />
                                            <div
                                                className="absolute top-0 left-0 w-16 h-16"
                                                style={{
                                                    background: `conic-gradient(${skill.color} ${((skill.completed / skill.planned) * 100)}%, transparent 0)`,
                                                    borderRadius: '50%'
                                                }}
                                            />
                                            {isAchieved && (
                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-400">
                                                    <Star size={24} className="fill-current" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            <div className="font-medium">{skill.name}</div>
                                            <div className="text-sm text-gray-500">{skill.completed}/{skill.planned}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <h2 className="text-lg text-black font-semibold mt-6">Learning Progress</h2>

                        <div className="flex justify-between items-center">
                            <h2 className="text-gray-500 text-sm">3/6 lessons completed</h2>
                            <div className="flex items-center text-gray-500 text-sm">
                                <Clock className="w-4 h-4 mr-1" />
                                15 mins per day
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="relative w-full h-4 bg-gray-200 rounded-md overflow-hidden my-4">
                            <div className="absolute top-0 left-0 h-full bg-orange-300" style={{ width: "50%" }}></div>
                        </div>
                    </section>

                    {/* Reports Section */}
                    <section className="grid grid-cols-1 gap-4 flex-1 min-w-[300px] text-black">
                        {reports.map((card, index) => (
                            <div key={index} className="bg-white p-6 rounded-lg shadow-md flex items-center">
                                <img
                                    src={card.img}
                                    alt={card.title}
                                    className="w-16 h-16 mr-4 rounded-md object-cover"
                                />
                                <h4 className="text-lg">{card.title}</h4>
                            </div>
                        ))}
                    </section>
                    <section className="bg-white p-6 rounded-lg shadow-md  ">
                    <h2 className="text-lg text-black font-semibold">Overall Communication Progress</h2>
                        <div className="flex justify-around gap-6 mt-6">
                            {skillData.map((skill, index) => (
                                <div key={index} className="flex flex-col items-center text-center">
                                    <div className="relative w-20 h-20">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            {/* Background Circle */}
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="16"
                                                stroke="gray"
                                                strokeWidth="4"
                                                fill="none"
                                                opacity="0.2"
                                            />
                                            {/* Static Circle */}
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="16"
                                                stroke={skill.color}  // Directly applying color for stroke
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                        </svg>
                                        {/* Display the number */}
                                        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-black">
                                            {skill.context}
                                        </div>
                                    </div>
                                    {/* Label */}
                                    <p className="mt-3 text-sm font-medium text-black">{skill.name}</p>
                                </div>
                            ))}
                        </div>
                    </section>


                </div>
            </div>
        </div>
    );
};

export default AnalysisMain;
