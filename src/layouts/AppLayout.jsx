import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { TopBar } from '../components/common/TopBar';
import { MobileNav } from '../components/common/MobileNav';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { FloatingChatBot } from '../components/common/FloatingChatBot';

export function AppLayout() {
  return (
    <div className="min-h-screen flex bg-canvas text-brand-dark selection:bg-brand-sage/30">
      <ScrollToTop />

      {/* Desktop Sidebar (hidden on mobile/tablet <= 768px) */}
      <Sidebar className="hidden md:flex flex-shrink-0" />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-7xl w-full mx-auto pb-24 md:pb-12 animate-in fade-in duration-200">
          <Outlet />
        </main>
      </div>

      {/* Floating Chat Bot in Bottom-Right Corner */}
      <FloatingChatBot />

      {/* Mobile Bottom Navigation (visible only on <= 768px) */}
      <MobileNav />
    </div>
  );
}

export default AppLayout;
