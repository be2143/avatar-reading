"use client"; 
import { useDrop } from "react-dnd";
import ActivityCard from './ActivityCard';

const RoutineBar = ({ activities, setActivities }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: "ACTIVITY",
        drop: (item) => handleDrop(item),
        hover: (item, monitor) => handleHover(item, monitor), // Track hover state
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    const handleDrop = (item) => {
        // Mark the activity as planned when it is dropped inside the RoutineBar
        setActivities((prevActivities) => {
            return prevActivities.map((activity) => {
                if (activity.title === item.title) {
                    return { ...activity, planned: true, state: "not done" }; // Mark as planned
                }
                return activity;
            });
        });
    };

    const handleHover = (item, monitor) => {
        // Check if the item is hovered outside the drop area (when isOver is false)
        if (!monitor.isOver()) {
            setActivities((prevActivities) => {
                return prevActivities.map((activity) => {
                    if (activity.title === item.title) {
                        return { ...activity, planned: false }; // Unmark as planned if outside
                    }
                    return activity;
                });
            });
        }
    };

    const handleCardClick = (activity) => {
        // Toggle the 'state' between 'done' and 'not done' when the card is clicked
        setActivities((prevActivities) => {
            return prevActivities.map((act) => {
                if (act.title === activity.title) {
                    // Toggle between 'done' and 'not done'
                    return {
                        ...act,
                        state: act.state === "done" ? "not done" : "done",
                    };
                }
                return act;
            });
        });
    };

    return (
        <>
            {/* RoutineBar */}
            <div
                ref={drop}
                className={`w-full bg-gray-200 h-45 flex items-center justify-start transition-all ${isOver ? 'bg-blue-100 border-2 border-purple-500' : ''}`}
            >
                {activities.filter((activity) => activity.planned).map((activity, index) => (
                    <div key={index}>
                        <ActivityCard
                            imageSrc={activity.imageSrc}
                            title={activity.title}
                            color={activity.color}
                            planned={activity.planned}
                            state={activity.state}
                            onClick={() => handleCardClick(activity)}
                        />
                    </div>
                ))}
            </div>
        </>
    );
    
};

export default RoutineBar;