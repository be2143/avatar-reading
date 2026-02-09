// components/DayTabs.js
const DayTabs = ({ activeDay, setActiveDay, progress }) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
    return (
      <div className="flex space-x-4 mb-4">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeDay === day ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {day} 
          </button>
        ))}
      </div>
    );
  };
  
  export default DayTabs;