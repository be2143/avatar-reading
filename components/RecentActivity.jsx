const activities = [
  {
    student: "Alex Chen",
    age: 8,
    story: "Playground Rules",
    date: "Today",
    tag: "Excellent",
    tagColor: "bg-green-200 text-green-800",
    icon: "🛝",
  },
  {
    student: "Emma Rodriguez",
    age: 6,
    story: "Asking for Help",
    date: "3 days ago",
    tag: "Needs Review",
    tagColor: "bg-yellow-200 text-yellow-800",
    icon: "✋",
  },
  {
    student: "Emma Rodriguez",
    age: 6,
    story: "Morning Routine",
    date: "12 days ago",
    tag: "Good",
    tagColor: "bg-orange-200 text-orange-800",
    icon: "⏰",
  },
];

export default function RecentActivity() {
  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <h2 className="font-semibold text-lg">Recent Activity</h2>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
            <div className="text-2xl">{activity.icon}</div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{activity.student} - Age {activity.age}</div>
              <div className="text-xs text-gray-600">"{activity.story}" ({activity.date})</div>
            </div>
            <div className={`text-xs font-medium px-2 py-1 rounded ${activity.tagColor}`}>
              {activity.tag}
            </div>
          </div>
        ))}
      </div>
      <button className="text-sm text-blue-600 underline">See more...</button>
    </div>
  );
}