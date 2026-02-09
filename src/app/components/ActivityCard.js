"use client"; // Add this if you're using Next.js App Router (for Next.js 13+)
import { useDrag } from "react-dnd";
import Image from "next/image";

const ActivityCard = ({ imageSrc, title, color, planned, state, onClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ACTIVITY",
    item: { title, imageSrc, color, planned, state },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`rounded-2xl shadow-lg p-4 flex flex-col items-center justify-between w-32 h-40 cursor-pointer transition-transform hover:scale-105 ${isDragging ? "opacity-50" : "opacity-100"}`}
      style={{ backgroundColor: color }}
      onClick={onClick}  // Pass the click handler
    >
      {imageSrc && (
        <Image
          src={imageSrc}
          alt={title}
          width={80} // Consistent size
          height={80}
          className="rounded-lg object-cover"
        />
      )}
      <p className="text-sm font-semibold text-gray-700 text-center break-words leading-tight">
        {title}
      </p>
      {planned && (
        <span
          className={`text-sm px-2 py-1 rounded-md mt-1 inline-block ${
            state === "done"
              ? "bg-green-200 text-green-700"
              : "bg-yellow-200 text-yellow-700"
          }`}
        >
          {state}
        </span>
      )}
    </div>
  );
};

export default ActivityCard;
