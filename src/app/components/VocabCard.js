"use client"; // Add this if you're using Next.js App Router (for Next.js 13+)
import { useState } from "react";
import Image from "next/image";

const Card = ({ imageSrc, title, color, onClick }) => {
  return (
    <div 
      className="rounded-2xl shadow-lg p-4 flex flex-col items-center w-40 cursor-pointer"
      style={{ backgroundColor: color }}
      onClick={() => onClick(title)}  
    >
      <Image 
        src={imageSrc} 
        alt={title} 
        width={100} 
        height={100} 
        className="rounded-lg object-cover"
      />
      <p className="mt-3 text-lg font-semibold text-gray-700">{title}</p>
    </div>
  );
};

export default Card;
