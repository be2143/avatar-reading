"use client";
import { useState } from "react";
import Image from "next/image";

const AddActivityCard = ({ onAdd }) => {
  const [title, setTitle] = useState("");
  const [imageSrc, setImageSrc] = useState(null);
  const [icon, setIcon] = useState("");
  const [step, setStep] = useState(1);

  // Handle file upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result);
        setStep(3); // Move to icon selection step
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async () => {
    if (!title || !imageSrc || !icon) {
      alert("Please fill out all fields.");
      return;
    }
    const newActivity = { title, imageSrc, icon };

    try {
      const response = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newActivity),
      });

      if (!response.ok) {
        throw new Error(`Failed to add activity: ${response.status}`);
      }

      const data = await response.json();
      alert("Activity saved successfully!");

      onAdd(data);  // Update UI with new activity
      resetForm();
    } catch (error) {
      alert("Failed to save activity. Please try again.");
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle("");
    setImageSrc(null);
    setIcon("");
    setStep(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col items-center justify-between w-32 h-40 cursor-pointer transition-transform hover:scale-105 border-2 border-dashed border-purple-300">
      {step === 1 && (
        <div className="w-full space-y-3">
          <input
            type="text"
            placeholder="Enter Activity"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 rounded-md border border-grey-300 text-sm 
            focus:border-purple-500 focus:ring-black-300 
            focus:font-semibold focus:text-purple-800 focus:bg-purple-50 
            transition duration-200 placeholder-gray-400"          />
          <button
            onClick={() => title && setStep(2)}
            className={`w-full p-2 rounded-md ${title ? "bg-purple-500 text-white hover:bg-purple-600" : "bg-gray-300 text-gray-500"
              } transition duration-300`}
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="w-full space-y-3">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-2 rounded-md border border-gray-300 text-sm"
          />
        </div>
      )}

      {step === 3 && (
        <div className="w-full space-y-3 flex flex-col items-center">
          <p>Select Icon</p>
          <div className="flex space-x-2">
            {["😊", "⚽", "📚"].map((em) => (
              <button
                key={em}
                onClick={() => setIcon(em)}
                className={`text-2xl p-2 rounded-md ${icon === em ? "bg-purple-500 text-white" : "bg-gray-200"
                  }`}
              >
                {em}
              </button>
            ))}
          </div>
          <button
            onClick={handleAdd}
            className={`w-full p-2 rounded-md ${icon ? "bg-purple-500 text-white hover:bg-purple-600" : "bg-gray-300 text-gray-500"
              } transition duration-300`}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
};

export default AddActivityCard;