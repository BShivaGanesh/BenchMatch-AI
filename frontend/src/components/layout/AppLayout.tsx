import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <TopBar />

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
};


export default AppLayout;
