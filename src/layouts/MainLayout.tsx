import { ReactNode } from "react";
import { BottomNav, ProfileSidebar, PWAInstallPrompt } from "../components";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <>
      <ProfileSidebar />
      {children}
      <div style={{ marginTop: "128px" }} />
      <BottomNav />
      <PWAInstallPrompt />
    </>
  );
};

export default MainLayout;
