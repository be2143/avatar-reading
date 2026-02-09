"use client";

import { useRouter, usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";
import Image from 'next/image';

const navItems = [
  { imgSrc: "/overview.png", label: "Overview", path: "/dashboard" },
  { imgSrc: "/lessons.png", label: "Social Stories", path: "/dashboard/social-stories" },
  { imgSrc: "/students.png", label: "Students", path: "/dashboard/students" },
  { imgSrc: "/analysis.png", label: "System Insights", path: "/dashboard/ai-analysis" }
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="fixed top-0 left-0 h-screen w-[120px] bg-white flex flex-col justify-between shadow-md items-center py-8 z-20">
      <div className="flex flex-col items-center space-y-10 w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center space-y-1 focus:outline-none"
            >
              <Image src={item.imgSrc} alt={item.label} width={40} height={40} />
              <span
                className={`text-xs text-center ${isActive ? 'underline font-semibold' : ''
                  }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mb-6 flex flex-col items-center gap-2">
        <button
          className="px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
          onClick={() => router.push('/dashboard/profile')}
        >
          Profile
        </button>
        <button
          className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-900 transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
