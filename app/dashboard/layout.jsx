import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-dashboard">
      <Sidebar />
      <main className="flex-1 ml-[120px] overflow-auto">
        {children}
      </main>
    </div>
  );
}
