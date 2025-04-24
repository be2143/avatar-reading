"use client"; // Add this if you're using Next.js App Router (for Next.js 13+)

import { useRouter } from "next/navigation"; // Use Next.js built-in router
import Image from "next/image";

const SideBar = () => {
  const router = useRouter();

  const navItems = [
    { imgSrc: "/overview.png", label: "Overview", path: "/" },
    { imgSrc: "/routine.png", label: "Routine", path: "/routine" },
    { imgSrc: "/communication.png", label: "Communication", path: "/communication" },
    { imgSrc: "/lessons.png", label: "Video Lessons", path: "/video-lessons" },
    { imgSrc: "/analysis.png", label: "AI Analysis", path: "/ai-analysis" },
  ];

  return (
    <div className="w-40 bg-white h-screen fixed left-0 top-0 flex flex-col">
      <div className="flex flex-col justify-between h-full"> {/* This ensures it fits the screen */}
        {/* Logo */}
        <div className="flex justify-center p-4">
          <Image
            src="/logo.png"
            alt="logo"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col justify-between flex-grow">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.path)} // Navigate on click
              className="w-full flex flex-col items-center p-8 transition-colors hover:bg-purple-300 hover:bg-opacity-30"
            >
              <Image
                src={item.imgSrc}
                alt={item.label}
                width={40}
                height={40}
                className="object-contain mt-5"
              />
              <span className="text-sm mt-1 text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SideBar;
