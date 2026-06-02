import { Navbar } from "@/components/layout/navbar";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — hidden on mobile, shown on md+ */}
        <aside className="hidden md:flex w-72 shrink-0">
          <ConversationSidebar />
        </aside>
        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
