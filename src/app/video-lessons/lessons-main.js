import React from "react";
import { Chewy } from "next/font/google";

const chewy = Chewy({ weight: "400", subsets: ["latin"] });

const LessonsMain = () => {
  return (
    <div className="ml-20 p-10 bg-[url('/bg.png')] min-h-screen flex flex-col">
      <h1 className={`text-6xl mb-3  text-[#680A76] ${chewy.className}`}>Video Lessons</h1>
    
      {/* Lesson Progress */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium text-black mb-4">Your Learning Progress</h2>
        <div className="mb-4">
          <div className="text-sm text-black mb-2">
            8/12 lessons completed
          </div>
          <div className="h-4 bg-black-200 rounded-full">
            <div
              className="h-full bg-orange-300 rounded-full"
              style={{ width: "67%" }} // Adjust percentage based on actual progress
            />
          </div>
        </div>
      </div>

      {/* Video Lessons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sample video lessons (replace with actual lesson data) */}
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="bg-gray-100 p-4 rounded-lg shadow hover:bg-purple-100 transition-transform transform hover:scale-105"
          >
            <div className="w-full h-40 bg-gray-300 rounded-lg mb-4"></div>
            <h3 className="font-medium text-lg text-black">Lesson {idx + 1}</h3>
            <p className="text-sm text-gray-600">Description of the lesson</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LessonsMain;
