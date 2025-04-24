// ./profile/main.js
import SideBar from '../components/SideBar';
import ProfileMain from './profile-main';

export default function Home() {
  return (
    <div className="flex">
      <SideBar />
      <main className="ml-20 w-full">
        <ProfileMain />
      </main>
    </div>
  );
}
