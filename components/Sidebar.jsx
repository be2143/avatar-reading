"use client";

import { useRouter, usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";
import Image from 'next/image';

const navItems = [
  { imgSrc: "/overview.png", label: "Overview", path: "/dashboard" },
  { imgSrc: "/lessons.png", label: "Social Stories", path: "/dashboard/social-stories" },
  { imgSrc: "/analysis.png", label: "AI Analysis", path: "/dashboard/ai-analysis" },
  { imgSrc: "/students.png", label: "Students", path: "/dashboard/students" },
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
      <div className="mb-6">
        <button
          className="text-red-500 text-xs hover:underline"
          onClick={() => signOut()}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
