"use client";

import { useState } from "react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardMobileNav from "@/components/dashboard/DashboardMobileNav";
import PilotFloatingHelp from "@/components/dashboard/PilotFloatingHelp";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  canAccessProfessional: boolean;
};

export default function DashboardShell({
  children,
  canAccessProfessional,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar
        canAccessProfessional={canAccessProfessional}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
      />

      <div className="min-h-screen lg:pl-[280px]">
        <DashboardHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:pb-8 xl:px-10">
          <div className="mx-auto w-full max-w-[1320px]">{children}</div>
        </main>
      </div>

      <PilotFloatingHelp />
      <DashboardMobileNav />
    </div>
  );
}
