import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-dashboard">
      <Sidebar />
      {/* Add left margin equal to sidebar width to prevent overlap */}
      <main className="flex-1 p-6 ml-[120px] overflow-auto">
        {children}
      </main>
    </div>
  );
}
