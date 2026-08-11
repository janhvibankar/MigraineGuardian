import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { ScrollToTop } from '../components/common/ScrollToTop';
import { FloatingChatBot } from '../components/common/FloatingChatBot';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-brand-dark selection:bg-brand-sage/30">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <FloatingChatBot />
      <Footer />
    </div>
  );
}
