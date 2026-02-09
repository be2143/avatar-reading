"use client";
import { useState, useEffect } from "react";
import DayTabs from "../components/DayTabs";
import ActivityCard from "../components/ActivityCard";
import AddActivityCard from "../components/AddActivityCard";
import RoutineBar from "../components/RoutineBar";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Chewy } from "next/font/google";

const chewy = Chewy({ weight: "400", subsets: ["latin"] });

const RoutineMain = () => {
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const res = await fetch("/api/activities");
                if (!res.ok) throw new Error("Failed to fetch activities");
                const data = await res.json();
                setActivities(data); // Store fetched activities
            } catch (error) {
                console.error(error);
            }
        };
        fetchActivities();
    }, []);

    const [{ isOver }, drop] = useDrop(() => ({
        accept: "ACTIVITY",
        drop: (item) => handleDrop(item),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    const handleDrop = (item) => {
        setActivities((prevActivities) => {
            return prevActivities.map((activity) => {
                if (activity.title === item.title) {
                    return { ...activity, planned: true, state: "not done" }; // Mark this item as planned
                }
                return activity;
            });
        });
    };

    const handleSave = async () => {
        const plannedActivities = activities.filter((activity) => activity.planned);

        // Send a POST request to save all planned activities
        try {
            const response = await fetch('/api/activities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ activities: plannedActivities }), // Sending all activities with planned: true
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save activities');
            }

            console.log('Activities saved successfully:', data);
            alert('Activities saved successfully!');
        } catch (error) {
            console.error('Error saving activities:', error);
            alert('Failed to save activities. Please try again later.');
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="p-6 bg-[url('/bg.png')] min-h-screen">
                <div className="mt-5 ml-20">
                    <h1 className={`text-6xl mb-10 text-[#680A76] ${chewy.className}`}>
                        Let's build our schedule together!
                    </h1>
                    <div className="flex flex-wrap gap-4 mb-10">
                        {activities.filter((activity) => !activity.planned).map((activity, index) => (
                            <ActivityCard
                                key={activity._id || index}
                                imageSrc={activity.imageSrc}
                                title={activity.title}
                                color={activity.color}
                                onDrop={() => { }}
                                isDraggable={true}  // Ensure activity cards are draggable
                            />
                        ))}
                        <AddActivityCard onAdd={(newActivity) => setActivities([...activities, newActivity])} />
                    </div>
                    <p className="text-gray-500">Drag and drop your routine below!</p>
                    <div ref={drop} className={`w-full bg-gray-200 h-48 flex items-center justify-start transition-all ${isOver ? 'bg-blue-100' : ''}`}>
                        <RoutineBar activities={activities} setActivities={setActivities} />
                    </div>
                    <div className="mt-3">
                        <button
                            onClick={handleSave} // Save all planned activities
                            className="w-50 px-6 py-3 text-white bg-purple-500 rounded-md hover:bg-purple-600 transition duration-300"
                        >
                            Save Routine
                        </button>
                    </div>
                </div>
            </div>
        </DndProvider>
    );
};

export default RoutineMain;
