'use client';

import { useSession } from "next-auth/react";
import { Plus, User, Upload, Sparkles, Shield, BookOpen, Filter, Search } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import SystemInsights from '@/components/SystemInsights';
import RecentActivity from '@/components/RecentActivity';
import FloatingHelp from '@/components/FloatingHelp';
import AIRecommendations from '@/components/AIRecommendations';
import Image from 'next/image';
import StudentsGrid from '@/components/StudentsGrid';
import { useRouter } from 'next/navigation';
import DashboardTour from '@/components/DashboardTour';

export default function OverviewPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dbUser, setDbUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [students, setStudents] = useState([]);
  const [stories, setStories] = useState([]);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch('/api/user/me');
          if (!res.ok) {
            throw new Error(`Failed to fetch user data: ${res.statusText}`);
          }
          const data = await res.json();
          setDbUser(data);
        } catch (error) {
          setDbUser(null);
        } finally {
          setIsLoadingUser(false);
        }
      } else {
        setIsLoadingUser(false);
      }
    };
    fetchUserData();
  }, [session?.user?.id]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!session?.user?.id) return;
      setIsLoadingCounts(true);
      try {
        // Fetch students
        const studentsRes = await fetch('/api/students/my-students');
        const studentsData = await studentsRes.json();
        setStudents(Array.isArray(studentsData.students) ? studentsData.students : []);
        // Fetch all stories created by the user
        const storiesRes = await fetch(`/api/stories?createdBy=${session.user.id}`);
        const storiesData = await storiesRes.json();
        setStories(Array.isArray(storiesData) ? storiesData : []);
        // Fetch metrics including behaviorSuccessRate
        const metricsRes = await fetch('/api/ai-analysis/metrics');
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics);
      } catch (err) {
        setStudents([]);
        setStories([]);
        setMetrics(null);
      } finally {
        setIsLoadingCounts(false);
      }
    };
    if (!isLoadingUser) {
      fetchCounts();
    }
  }, [session?.user?.id, isLoadingUser]);

  if (status === 'loading') {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading user session...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-6 text-center text-red-600">
        You must be logged in to view this page.
      </div>
    );
  }

  const handleCreateStory = () => {
    router.push(`/dashboard/social-stories/create`);
  };

  const handleAddStudent = () => {
    router.push(`/dashboard/social-stories/upload`);
  };

  const userName = dbUser?.name || session?.user?.name || "there";
  const userImage = dbUser?.image;

  // Handler to navigate to student profile page
  const handleStudentSelect = (student) => {
    if (!student) return;
    router.push(`/dashboard/students/${student._id || student.id}`);
  };

  if (isLoadingUser) {
    return (
      <div className="p-6 text-center text-gray-600">
        Fetching user details...
      </div>
    );
  }

  const finalUserImageSrc = userImage && (userImage.startsWith('http://') || userImage.startsWith('https://'))
    ? userImage
    : null;

  return (
    <div className="p-12 space-y-6">
            <DashboardTour />
      <div className="flex items-center space-x-4">
        <div className="w-32 h-32 rounded-full border-2 border-purple-300 overflow-hidden bg-purple-100 flex items-center justify-center">
          {finalUserImageSrc ? (
            <img
              src={finalUserImageSrc}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold text-xl">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-800 to-pink-600 bg-clip-text text-transparent">
          Hello, {userName}!
        </h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded shadow space-y-4">
              <h2 className="font-semibold text-lg">Quick Actions</h2>
              <div className="flex flex-col space-y-3">
                <button
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  id="btn-generate-story"
                  onClick={handleCreateStory}
                >
                  <Sparkles size={20} />
                  Generate New Story
                </button>
                <button
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                id="btn-upload-story"
                onClick={handleAddStudent}
              >
                <Upload size={20} />
                Upload Story
              </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <SystemInsights 
                activeStudents={students.length} 
                storiesCreated={stories.length} 
                successRate={metrics ? metrics.find(m => m.title === 'Behavior Success')?.value : '0%'} 
              />
            </div>
          </div>
          <div id="students-section">
            <StudentsGrid
              onStudentSelect={handleStudentSelect}
              selectedStudentId={null}
            />
          </div>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <RecentActivity />
          {/* {students.length > 0 && (
            <AIRecommendations studentId={students[0]._id} />
          )} */}
        </div>
        <FloatingHelp />
      </div>
    </div>
  );
}