// app/dashboard/layout.jsx
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
    return (
        <div className="flex h-screen bg-dashboard">
            <Sidebar />
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}
