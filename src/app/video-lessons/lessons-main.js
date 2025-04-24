import React from "react";
import { Chewy } from "next/font/google";
import { Clock } from "lucide-react";


const chewy = Chewy({ weight: "400", subsets: ["latin"] });

const lessons = [
  { imageSrc: "/mp1.png", title: "Healthy Sleep Habits" },
  { imageSrc: "/mp2.png", title: "Building Social Confidence" },
  { imageSrc: "/mp3.png", title: "Managing Stress and Anxiety" },
  { imageSrc: "/1.png", title: "How to Build a Routine" },
  { imageSrc: "/2.png", title: "How to Recognize and Express Emotions" },
  { imageSrc: "/3.png", title: "Improving Concentration" },
];

const LessonsMain = () => {
  return (
    <div className="ml-20 p-10 bg-[url('/bg.png')] min-h-screen flex flex-col">
      <h1 className={`text-6xl mb-3 text-[#680A76] ${chewy.className}`}>
        Video Lessons
      </h1>

      {/* Lesson Progress */}
      <div className="bg-white p-4 mb-6 rounded-lg shadow">
        <h2 className="text-lg text-black font-semibold mb-4">Your Learning Progress</h2>
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
      </div>


      {/* Video Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-lg shadow hover:bg-purple-100 transition-transform transform hover:scale-105"
          >
            <div className="w-full h-40 bg-gray-300 rounded-lg mb-4 overflow-hidden">
              <img
                src={lesson.imageSrc}
                alt={lesson.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <h3 className="font-medium text-lg text-black">{lesson.title}</h3>
            <p className="text-sm text-gray-600">
              Description of the lesson
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonsMain;