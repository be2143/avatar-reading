import SideBar from '../components/SideBar';
import CommunicationMain from './communication-main';

export default function Home() {
  return (
    <div className="flex">
      <SideBar />
      <main className="ml-20 w-full">
        <CommunicationMain />
      </main>
    </div>
  );
}
