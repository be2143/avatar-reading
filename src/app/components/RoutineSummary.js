"use client";
import React, { useState, useEffect } from 'react';

const RoutineSummary = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch("/api/activities");
        if (!res.ok) throw new Error("Failed to fetch activities");
        const data = await res.json();
        // Filter activities with planned: true
        const plannedActivities = data.filter((activity) => activity.planned);
        setActivities(plannedActivities); // Store fetched activities
      } catch (error) {
        console.error(error);
      }
    };
    fetchActivities();
  }, []);

  const removeActivity = (title) => {
    setActivities((prevActivities) =>
      prevActivities.filter((activity) => activity.title !== title)
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Routine Progress</h2>
      
      {/* Check if there are no planned activities */}
      {activities.length === 0 ? (
        <div className="text-gray-600">No routine is planned.</div>
      ) : (
        <div className="space-y-4">
          {activities.map((item) => (
            <div
              key={item._id}
              className="flex items-start space-x-3 p-3 bg-gray-100 rounded-lg shadow-sm"
            >
              {/* Icon */}
              <span className="text-2xl">{item.icon}</span>

              {/* Text container (Title & State in separate rows) */}
              <div className="flex flex-col">
                <div className="text-gray-700 text-sm font-medium">{item.title}</div>
                <div>
                  <span
                    className={`text-sm px-2 py-1 rounded-md mt-1 inline-block ${
                      item.state === "done"
                        ? "bg-green-200 text-green-700"
                        : "bg-yellow-200 text-yellow-700"
                    }`}
                  >
                    {item.state}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoutineSummary;
