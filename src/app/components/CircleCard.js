"use client"; // Add this if you're using Next.js App Router (for Next.js 13+)
import { useState } from "react";
import Image from "next/image";

const CircleCard = ({ imageSrc, title, color, onClick }) => {
  return (
    <div 
      className="rounded-full shadow-lg p-4 flex flex-col items-center h-32 w-32 cursor-pointer"
      style={{ backgroundColor: color }}
      onClick={() => onClick(title)}  
    >
      <Image 
        src={imageSrc} 
        alt={title} 
        width={80} 
        height={80} 
        className="rounded-lg object-cover"
      />
      <p className="mt-1 text-lg font-semibold text-gray-700">{title}</p>
    </div>
  );
};

export default CircleCard;
