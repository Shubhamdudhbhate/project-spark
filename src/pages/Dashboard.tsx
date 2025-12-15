import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { cn } from "@/lib/utils";
import MyCases from "./MyCases";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background grid-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main
        className={cn(
          "transition-all duration-300 p-6 lg:p-8",
          sidebarCollapsed ? "ml-20" : "ml-64"
        )}
      >
        <Routes>
          <Route index element={<MyCases />} />
          <Route path="upload" element={<MyCases />} />
          <Route path="logs" element={<MyCases />} />
          <Route path="settings" element={<MyCases />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
