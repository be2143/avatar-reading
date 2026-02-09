import SideBar from '../components/SideBar';
import LessonsMain from './lessons-main';

export default function Home() {
  return (
    <div className="flex">
      <SideBar />
      <main className="ml-20 w-full">
        <LessonsMain />
      </main>
    </div>
  );
}
