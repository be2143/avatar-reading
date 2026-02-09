// components/SystemInsights.jsx
export default function SystemInsights({ activeStudents = 0, storiesCreated = 0, successRate = 0 }) {
  return (
    <div className="h-48 bg-white p-4 rounded shadow space-y-4">
      <h2 className="font-semibold text-lg">System Insights</h2>
      <div className="grid grid-cols-3 gap-4 h-28">
        {/* Active Students Box */}
        <div className="h-full bg-green-100 p-4 rounded flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-800">{activeStudents}</div>
          <div className="text-sm text-gray-600">Active Students</div>
        </div>
        
        {/* Stories Created Box */}
        <div className="h-full bg-blue-100 p-4 rounded flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-800">{storiesCreated}</div>
          <div className="text-sm text-gray-600">Stories Created</div>
        </div>
        
        {/* Success Rate Box */}
        <div className="h-full bg-yellow-100 p-4 rounded flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-gray-800">{successRate}</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
      </div>
    </div>
  );
}
