'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentsGrid() {
  const [students, setStudents] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/students');
        const data = await res.json();
        setStudents(data);
      } catch (err) {
        console.error("Failed to fetch students:", err);
      }
    };

    fetchStudents();
  }, []);

  const handleAddStudentClick = () => {
    router.push("/dashboard/students/add");
  };

  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <h2 className="font-semibold text-lg">Your Students</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
        {students.map((student, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 border-2 border-purple-300 rounded-full flex items-center justify-center overflow-hidden bg-purple-50">
              {student.image ? (
                <img
                  src={`data:image/jpeg;base64,${student.image}`}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-purple-600">
                  {student.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-xs text-center">
              <div className="font-semibold">
                {student.name} - Age {student.age}
              </div>
              <div className="text-gray-500">
                {student.personalizedStories?.length || 0} Stories
              </div>
            </div>
          </div>
        ))}

        {/* Add student button */}
        <div
          className="flex flex-col items-center space-y-2 cursor-pointer hover:opacity-80"
          onClick={handleAddStudentClick}
        >
          <div className="w-16 h-16 border-2 border-dashed border-purple-300 rounded-full flex items-center justify-center text-purple-400 text-2xl hover:border-purple-500 hover:text-purple-600">
            +
          </div>
          <div className="text-xs text-center text-purple-600 font-medium">Add Student</div>
        </div>
      </div>
    </div>
  );
}
