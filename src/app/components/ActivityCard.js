"use client";
import { useState, useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import Image from "next/image";

const ActivityCard = ({ imageSrc, title, color, planned, state, onClick, onDelete }) => {
  const [showDelete, setShowDelete] = useState(false);
  const [holdTimeout, setHoldTimeout] = useState(null);
  const cardRef = useRef(null); // Ref for detecting outside clicks

  // Drag functionality
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "ACTIVITY",
    item: { title, imageSrc, color, planned, state },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Handle long press
  const handleMouseDown = () => {
    if (isDragging) return; // Prevent long press detection while dragging

    const timeout = setTimeout(() => {
      setShowDelete(true);
    }, 1000); // Show delete button after 3 seconds

    setHoldTimeout(timeout);
  };

  // Cancel the delete button if the user releases early
  const handleMouseUp = () => {
    clearTimeout(holdTimeout);
  };

  // Hide delete button when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setShowDelete(false); // Hide the button if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={(node) => {
        drag(node);
        cardRef.current = node;
      }}
      className={`relative rounded-2xl shadow-lg p-4 flex flex-col items-center justify-between w-32 h-40 cursor-pointer transition-transform hover:scale-105 ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
      style={{ backgroundColor: color }}
      onClick={onClick} // Pass the click handler
      onMouseDown={handleMouseDown} // Start hold timer
      onMouseUp={handleMouseUp} // Cancel hold timer
      onMouseLeave={handleMouseUp} // Cancel if user moves away
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

      {/* Show delete button only if activity is not planned AND user long-pressed */}
      {!planned && showDelete && (
        <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent accidental clicks on the card itself
          onDelete();
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
        w-32 h-40 rounded-2xl bg-gray-100 text-gray-700 shadow-lg 
        opacity-90 text-4xl hover:text-6xl transition-all"    
     >
        ❌
      </button>      
      )}

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
