import styled from "@emotion/styled";
import {
  CloseRounded,
  DownloadDoneRounded,
  InstallDesktopRounded,
  InstallMobileRounded,
  IosShareRounded,
  PhoneIphoneRounded,
} from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogContent, IconButton, Slide } from "@mui/material";
import { useEffect, useState } from "react";
import { CustomDialogTitle } from "./DialogTitle";
import { DialogBtn } from "../styles";
import { showToast, systemInfo } from "../utils";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [openInstalledDialog, setOpenInstalledDialog] = useState<boolean>(false);

  // Check if user has previously dismissed the install prompt
  const [hasUserDismissed, setHasUserDismissed] = useState<boolean>(() => {
    return localStorage.getItem("pwa-install-dismissed") === "true";
  });

  useEffect(() => {
    // Check if app is already installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone === true);

    setIsAppInstalled(isStandalone);

    const beforeInstallPromptHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show prompt after a short delay if not dismissed before
      if (!hasUserDismissed && !isStandalone) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000); // Show after 3 seconds
      }
    };

    const detectAppInstallation = () => {
      window.matchMedia("(display-mode: standalone)").addEventListener("change", (e) => {
        setIsAppInstalled(e.matches);
        if (e.matches) {
          setShowInstallPrompt(false);
        }
      });
    };

    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);
    detectAppInstallation();

    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstallPromptHandler);
    };
  }, [hasUserDismissed]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          setShowInstallPrompt(false);

          // Show success dialog on Windows
          if (systemInfo.os === "Windows") {
            setOpenInstalledDialog(true);
          } else {
            showToast("App installed successfully!");
          }
        } else if (choiceResult.outcome === "dismissed") {
          showToast("Installation dismissed.", { type: "error" });
        }
        setDeferredPrompt(null);
      });
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    setHasUserDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
    showToast("You can still install the app from the menu anytime!", { duration: 5000 });
  };

  const handleIOSInstallClick = () => {
    showToast(
      <div style={{ display: "inline-block" }}>
        To install the app on iOS Safari, click on{" "}
        <IosShareRounded sx={{ verticalAlign: "middle", mb: "4px" }} /> and then{" "}
        <span style={{ fontWeight: "bold" }}>Add to Home Screen</span>.
      </div>,
      { type: "blank", duration: 8000 },
    );
  };

  // Don't render anything if app is installed or no prompt available
  if (isAppInstalled) {
    return null;
  }

  // Handle iOS Safari separately
  const isIOSSafari = systemInfo.browser === "Safari" && systemInfo.os === "iOS";

  if (isIOSSafari && !isAppInstalled) {
    return (
      <>
        <Slide
          direction="up"
          in={showInstallPrompt && !hasUserDismissed}
          mountOnEnter
          unmountOnExit
        >
          <InstallBanner>
            <IconButton
              size="small"
              onClick={handleDismiss}
              sx={{ position: "absolute", right: 8, top: 8 }}
              aria-label="Dismiss"
            >
              <CloseRounded />
            </IconButton>
            <BannerContent>
              <PhoneIphoneRounded sx={{ fontSize: 40 }} />
              <BannerText>
                <BannerTitle>Install Tickbox Therapy</BannerTitle>
                <BannerDescription>
                  Get quick access and work offline by installing the app!
                </BannerDescription>
              </BannerText>
            </BannerContent>
            <InstallButton variant="contained" onClick={handleIOSInstallClick}>
              <PhoneIphoneRounded />
              Install App
            </InstallButton>
          </InstallBanner>
        </Slide>
      </>
    );
  }

  // For other browsers with beforeinstallprompt support
  if (!deferredPrompt) {
    return null;
  }

  return (
    <>
      <Slide direction="up" in={showInstallPrompt && !hasUserDismissed} mountOnEnter unmountOnExit>
        <InstallBanner>
          <IconButton
            size="small"
            onClick={handleDismiss}
            sx={{ position: "absolute", right: 8, top: 8 }}
            aria-label="Dismiss"
          >
            <CloseRounded />
          </IconButton>
          <BannerContent>
            {systemInfo.os === "Android" ? (
              <InstallMobileRounded sx={{ fontSize: 40 }} />
            ) : (
              <InstallDesktopRounded sx={{ fontSize: 40 }} />
            )}
            <BannerText>
              <BannerTitle>Install Tickbox Therapy</BannerTitle>
              <BannerDescription>
                Get quick access and work offline by installing the app!
              </BannerDescription>
            </BannerText>
          </BannerContent>
          <InstallButton variant="contained" onClick={handleInstallClick}>
            {systemInfo.os === "Android" ? <InstallMobileRounded /> : <InstallDesktopRounded />}
            Install App
          </InstallButton>
        </InstallBanner>
      </Slide>

      <Dialog open={openInstalledDialog} onClose={() => setOpenInstalledDialog(false)}>
        <CustomDialogTitle
          title="App installed successfully!"
          subTitle="The app is now running as a PWA."
          icon={<DownloadDoneRounded />}
          onClose={() => setOpenInstalledDialog(false)}
        />
        <DialogContent>
          You can access it from your home screen, with offline support and features like shortcuts
          and badges.
        </DialogContent>
        <DialogActions>
          <DialogBtn onClick={() => setOpenInstalledDialog(false)}>Got it</DialogBtn>
        </DialogActions>
      </Dialog>
    </>
  );
};

const InstallBanner = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 600px;
  background: ${({ theme }) => (theme.darkmode ? "#1e1e1e" : "#ffffff")};
  border: 2px solid ${({ theme }) => theme.primary};
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 768px) {
    bottom: 70px;
    width: calc(100% - 24px);
    padding: 16px;
  }

  @media print {
    display: none;
  }
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const BannerText = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const BannerTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => (theme.darkmode ? "#ffffff" : "#000000")};

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const BannerDescription = styled.p`
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
  color: ${({ theme }) => (theme.darkmode ? "#ffffff" : "#000000")};

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const InstallButton = styled(Button)`
  background: ${({ theme }) => theme.primary};
  color: white;
  padding: 10px 24px;
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.primary};
    opacity: 0.9;
    transform: scale(1.02);
  }

  @media (max-width: 768px) {
    padding: 8px 20px;
    font-size: 14px;
  }
`;
