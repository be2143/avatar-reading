import React from 'react';
import { Circle } from 'lucide-react';
import { Chewy } from "next/font/google";

const chewy = Chewy({ weight: "400", subsets: ["latin"] });

const progressData = {
    total: 36,
    completed: 12,
    skills: [
        { name: 'Listening', level: 'Intermediate', progress: 75, color: 'rgb(255, 149, 128)' },
        { name: 'Cognitive', level: 'Intermediate', progress: 60, color: 'rgb(198, 176, 255)' },
        { name: 'Vocabulary', level: 'Beginner', progress: 40, color: 'rgb(152, 255, 183)' },
        { name: 'Social', level: 'Intermediate', progress: 65, color: 'rgb(128, 206, 255)' }
    ]
};

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
                    <section className="bg-blue-50 p-6 rounded-lg shadow-md flex-1 min-w-[300px]">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-black">Overall Progress</h3>
                        </div>

                        {/* Progress Bar */}
                        <p className="text-sm text-gray-600">
                            {progressData.completed}/{progressData.total} words used
                        </p>
                        <div className="h-4 bg-gray-200 rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-orange-300 rounded-full transition-all duration-300"
                                style={{ width: `${(progressData.completed / progressData.total) * 100}%` }}
                            />
                        </div>

                        {/* Skill Progress */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                            {progressData.skills.map((skill) => (
                                <div key={skill.name} className="text-center">
                                    <div className="relative inline-block w-16 h-16">
                                        <Circle size={64} className="text-gray-200" aria-hidden="true" />
                                        <div
                                            className="absolute top-0 left-0 w-full h-full rounded-full"
                                            style={{ background: `conic-gradient(${skill.color} ${skill.progress}%, transparent 0)` }}
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <h4 className="font-medium">{skill.name}</h4>
                                        <p className="text-sm text-gray-500">{skill.level}</p>
                                    </div>
                                </div>
                            ))}
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

                </div>
            </div>
        </div>
    );
};

export default AnalysisMain;
