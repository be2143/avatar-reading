// components/SystemInsights.jsx
export default function SystemInsights() {
  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <h2 className="font-semibold text-lg">System Insights</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-100 p-4 rounded text-center">
          <div className="text-3xl font-bold text-gray-800">8</div>
          <div className="text-sm text-gray-600">Active Students</div>
        </div>
        <div className="bg-blue-100 p-4 rounded text-center">
          <div className="text-3xl font-bold text-gray-800">7</div>
          <div className="text-sm text-gray-600">Stories Created</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded text-center">
          <div className="text-3xl font-bold text-gray-800">85%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
      </div>
    </div>
  );
}
