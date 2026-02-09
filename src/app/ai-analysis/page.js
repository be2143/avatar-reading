import SideBar from "../components/SideBar";
import AnalysisMain from "./ai-analysis-main";
import FloatingChatbot from "../components/FloatingChatbot";

export default function Home() {
  return (
    <div className="flex">
      <SideBar />
      <main className="ml-20 w-full">
        <AnalysisMain />
        {/* Your existing content */}
        <FloatingChatbot />
      </main>
    </div>
  );
}
