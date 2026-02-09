import SideBar from './components/SideBar';
import HomePage from './components/Homepage' 

export default function Home() {
  return (
    <div className="flex">
      <SideBar />
      <main className="ml-20 w-full">
        <HomePage />
      </main>
    </div>
  );
}
