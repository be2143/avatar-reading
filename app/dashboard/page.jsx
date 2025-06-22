// app/dashboard/page.jsx
'use client';
import { useSession } from "next-auth/react";
import SystemInsights from '@/components/SystemInsights';
import RecentActivity from '@/components/RecentActivity';
import StudentsGrid from '@/components/StudentsGrid';

export default function OverviewPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "there";
  const userImage = session?.user?.image;

  console.log("User image found:", userImage);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        {/* User Profile Picture */}
        <div className="w-32 h-32 rounded-full border-2 border-purple-300 overflow-hidden bg-purple-100">
          {userImage ? (
            <img
              src={`data:image/jpeg;base64,${userImage}`}
              alt={`${userName}'s profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-purple-600 font-bold text-xl">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="text-5xl font-bold text-purple-700">Hello Dr. {userName}!</h1>
      </div>
      {/* Main layout with sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left side - 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Actions and System Insights in same row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-white p-4 rounded shadow space-y-4">
              <h2 className="font-semibold text-lg">Quick Actions</h2>
              <div className="flex flex-col space-y-3">
                <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded shadow">
                  + Create New Story
                </button>
                <button className="bg-white border border-purple-400 hover:bg-purple-100 text-purple-600 font-semibold py-2 px-4 rounded shadow">
                  + Add Student
                </button>
              </div>
            </div>

            {/* System Insights - spans 2 columns */}
            <div className="md:col-span-2">
              <SystemInsights />
            </div>
          </div>

          {/* Students Grid */}
          <StudentsGrid />
        </div>

        {/* Right sidebar - Recent Activity */}
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}