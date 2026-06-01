import { ChatPanel } from '@/components/chat/ChatPanel';
import { Sidebar } from '@/components/layout/Sidebar';

export default function HomePage() {
  return (
    <div className="flex">
      <Sidebar />
      <ChatPanel />
    </div>
  );
}
