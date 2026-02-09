"use client"; // Add this if you're using Next.js App Router (for Next.js 13+)
import { useState } from "react";
import Image from "next/image";

const AddActivityCard = ({ onAdd }) => {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#f3f4f6"); // Default light color
  const [isAdding, setIsAdding] = useState(false);
  const [imageSrc, setImageSrc] = useState("/new.png"); // Default image

  // Handle file upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0]; // Get the first file
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result); // Set imageSrc to the uploaded image's data URL
      };
      reader.readAsDataURL(file); // Read the file as a data URL
    }
  };

  // Handle adding a new activity
  const handleAdd = () => {
    if (title) {
      const newActivity = {
        title,
        color,
        imageSrc, // Use the imageSrc state here
        _id: Date.now(), // Generate a unique ID
      };
      onAdd(newActivity);
      setIsAdding(false); // Hide the form after adding
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center justify-between w-32 h-40 cursor-pointer transition-transform hover:scale-105 border-2 border-dashed ${
        isAdding ? "border-purple-500" : "border-gray-300"
      }`}
      style={{ backgroundColor: color }}
      onClick={() => setIsAdding(true)} // Show input fields when clicked
    >
      {isAdding ? (
        // Show form when adding an activity
        <div className="space-y-3 w-full">
          {/* <input
            type="text"
            placeholder="Activity Icon"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-10 p-2 rounded-md border border-gray-300 text-sm active:border-purple-500"
          /> */}
          <input
            type="text"
            placeholder="Activity Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 text-sm active:border-purple-500"
          />
          {/* <input
            type="file"
            onChange={handleImageUpload} // Handle image file upload
            className="w-full p-2 rounded-md border border-gray-300 text-sm active:border-purple-500"
          /> */}
          <button
            onClick={handleAdd}
            className="w-full p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition duration-300"
          >
            Add
          </button>
        </div>
      ) : (
        // Display the placeholder content when not adding
        <>
          <Image
            src={imageSrc} // Dynamically display the uploaded image or default image
            alt="Add Activity"
            width={80}
            height={80}
            className="rounded-lg object-cover"
          />
          <p className="text-sm font-semibold text-gray-700 text-center">
            Create a New Activity
          </p>
        </>
      )}
    </div>
  );
};

export default AddActivityCard;
