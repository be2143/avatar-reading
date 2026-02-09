'use client';
import React, { useState, useEffect } from 'react';
import { User, Plus } from 'lucide-react';

const MainStudentsGrid = ({ onStudentSelect, selectedStudentId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students/my-students');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to fetch students');
      }

      const data = await response.json();

      if (Array.isArray(data.students)) {
        setStudents(data.students);

        if (data.students.length > 0 && !selectedStudentId) {
          onStudentSelect(data.students[0]);
        }
      } else {
        console.error("API response 'students' field is not an array:", data);
        throw new Error("Invalid data format received for students.");
      }

    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student) => {
    onStudentSelect(student);
  };

  const handleAddStudent = () => {
    window.location.href = '/dashboard/students/add';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-600" />
          Your Students
        </h2>
        <div className="animate-pulse">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-2 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-600" />
          Your Students
        </h2>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Error loading students</div>
          <div className="text-gray-500 text-sm mb-4">{error}</div>
          <button
            onClick={fetchStudents}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
      <User className="w-5 h-5 text-purple-600" />
        Your Students
      </h2>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-4">
        {students.map((student) => (
          <div
            key={student._id}
            className={`flex flex-col items-center space-y-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedStudentId === student._id ? 'opacity-100' : 'opacity-80 hover:opacity-100'
            }`}
            onClick={() => handleStudentClick(student)}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden transition-all duration-200 ${
              selectedStudentId === student._id
                ? 'border-3 border-purple-500 bg-purple-50'
                : 'border-2 border-purple-200 bg-purple-50 hover:border-purple-300'
            }`}>
              {student.image ? (
                <img
                  src={student.image}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-purple-600">
                  {student.name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="text-xs text-center">
              <div className="font-semibold text-gray-700">
                {student.name || 'Unknown'} - Age {student.age || '?'}
              </div>
              <div className="text-gray-500">
                {student.personalizedStories?.length || 0} Stories
              </div>
            </div>
          </div>
        ))}

{students.length > 0 && (
        <div
          className="flex flex-col items-center space-y-2 cursor-pointer hover:scale-105 transition-transform duration-200"
          onClick={handleAddStudent}
        >
          <div className="w-16 h-16 border-2 border-dashed border-purple-300 rounded-full flex items-center justify-center text-purple-400 hover:border-purple-500 hover:text-purple-600 transition-colors duration-200">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-xs text-center text-purple-600 font-medium">Add Student</div>
        </div>
      )}
      </div>

      {students.length === 0 && (
        <div className="text-center py-8">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Students Yet</h3>
          <p className="text-gray-500 mb-4">Add your first student to get started with personalized stories.</p>
          <button
            onClick={handleAddStudent}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Add First Student
          </button>
        </div>
      )}
    </div>
  );
};

export default MainStudentsGrid;