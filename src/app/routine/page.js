import SideBar from '../components/SideBar';
import RoutineMain from './routine-main';

export default function Home() {
  return (
    <div className="flex">
      <SideBar />
      <main className="ml-20 w-full">
        <RoutineMain />
      </main>
    </div>
  );
}
