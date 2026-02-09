'use client';

import React, { useState } from 'react';
import MainStudentsGrid from '@/components/MainStudentsGrid';
import StudentStories from '@/components/StudentStories';

export default function StudentsPage() {
  const [selectedStudent, setSelectedStudent] = useState(null);

  return (
    <div className="space-y-6 p-6">
      <div>
        <MainStudentsGrid 
          onStudentSelect={setSelectedStudent} 
          selectedStudentId={selectedStudent?._id} 
        />
      </div>
      <div>
        <StudentStories student={selectedStudent} />
      </div>
    </div>
  );
}
