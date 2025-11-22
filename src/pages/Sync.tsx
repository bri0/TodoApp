import styled from "@emotion/styled";
import {
  CloudSyncRounded,
  SyncRounded,
  AccessTimeRounded,
  CheckCircleRounded,
  ErrorRounded,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { TopBar } from "../components";
import { UserContext } from "../contexts/UserContext";
import { showToast, timeAgo } from "../utils";
import {
  sha256,
  deriveKeyFromPassword,
  generateKeyPairFromSeed,
  decryptData,
} from "../utils/crypto";
import { syncData } from "../services/syncApi";
import { mergeTasks, mergeCategories, prepareTasks, prepareCategories } from "../utils/syncMerge";
import type { SyncData } from "../services/syncApi";

type SyncState = "idle" | "syncing" | "success" | "error";

export default function Sync() {
  const { user, setUser } = useContext(UserContext);

  // Form fields
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  // Validation errors
  const [userIdError, setUserIdError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // State
  const [state, setState] = useState<SyncState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [progressMessage, setProgressMessage] = useState("");

  // Stored credentials
  const [storedUserId, setStoredUserId] = useState<string | null>(null);
  const [storedPublicKey, setStoredPublicKey] = useState<string | null>(null);
  const [storedPublicKeyHash, setStoredPublicKeyHash] = useState<string | null>(null);
  const [storedPrivateKey, setStoredPrivateKey] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    document.title = "Todo App - Remote Sync";

    // Check for stored credentials
    const savedUserId = localStorage.getItem("sync_uid");
    const savedPublicKey = localStorage.getItem("sync_public_key");
    const savedPublicKeyHash = localStorage.getItem("sync_public_key_hash");
    const savedPrivateKey = localStorage.getItem("sync_private_key");

    if (savedUserId && savedPublicKey && savedPublicKeyHash && savedPrivateKey) {
      setStoredUserId(savedUserId);
      setStoredPublicKey(savedPublicKey);
      setStoredPublicKeyHash(savedPublicKeyHash);
      setStoredPrivateKey(savedPrivateKey);
      setIsAuthenticated(true);
    }
  }, []);

  // User ID: lowercase alphanumeric only, minimum 8 characters
  const validateUserId = (id: string): string => {
    if (!id) return "";
    if (id.length < 8) return "At least 8 characters required";
    if (!/^[a-z0-9]+$/.test(id)) return "Only lowercase letters and numbers allowed";
    return "";
  };

  // Password: 12+ characters, upper/lower/numbers/symbols
  const validatePassword = (pwd: string): string => {
    if (!pwd) return "";
    if (pwd.length < 12) return "At least 12 characters required";
    if (!/[a-z]/.test(pwd)) return "Must include lowercase letter";
    if (!/[A-Z]/.test(pwd)) return "Must include uppercase letter";
    if (!/[0-9]/.test(pwd)) return "Must include number";
    if (!/[^a-zA-Z0-9]/.test(pwd)) return "Must include symbol";
    return "";
  };

  const handleSync = async () => {
    setState("syncing");
    setErrorMessage("");

    try {
      let publicKey: string;
      let publicKeyHash: string;
      let privateKey: string;
      let currentUserId: string;

      // Use stored credentials or derive from password
      if (
        isAuthenticated &&
        storedUserId &&
        storedPublicKey &&
        storedPublicKeyHash &&
        storedPrivateKey
      ) {
        publicKey = storedPublicKey;
        publicKeyHash = storedPublicKeyHash;
        privateKey = storedPrivateKey;
        currentUserId = storedUserId;
        setProgressMessage("Syncing with server...");
      } else {
        // Validate input fields
        if (!userId.trim() || !password.trim()) {
          showToast("Please enter both User ID and password", { type: "error" });
          setState("idle");
          return;
        }

        setProgressMessage("Deriving encryption keys (this may take a moment)...");
        const seed = await deriveKeyFromPassword(userId.trim(), password);
        const keys = await generateKeyPairFromSeed(seed);
        publicKey = keys.publicKey;
        privateKey = keys.privateKey;
        currentUserId = userId.trim();

        // Calculate public key hash
        publicKeyHash = await sha256(publicKey);
      }

      // Step 2: Prepare data for sync
      setProgressMessage("Preparing data for sync...");
      const preparedTasks = prepareTasks(user.tasks);
      const preparedCategories = prepareCategories(user.categories);

      const localData: SyncData = {
        tasks: preparedTasks,
        categories: preparedCategories,
      };

      // Step 3: Sync with server
      setProgressMessage("Syncing with server...");

      // Step 4: Phase 1 - Send data to server and get response
      const response = await syncData(currentUserId, publicKeyHash, publicKey, localData, false);

      // Step 5: Decrypt response
      setProgressMessage("Decrypting server response...");
      const decryptedData = await decryptData(response.encryptedData, publicKey, privateKey);
      const serverData: SyncData = JSON.parse(decryptedData);

      // Step 6: Check if merge is needed
      if (response.needsMerge) {
        // Merge local and server data
        setProgressMessage("Merging data...");
        const mergedTasks = mergeTasks(user.tasks, serverData.tasks, user.deletedTasks);
        const mergedCategories = mergeCategories(
          user.categories,
          serverData.categories,
          user.deletedCategories,
        );

        const mergedData: SyncData = {
          tasks: prepareTasks(mergedTasks),
          categories: prepareCategories(mergedCategories),
        };

        // Phase 2 - Send merged data back to server
        setProgressMessage("Saving merged data...");
        await syncData(currentUserId, publicKeyHash, publicKey, mergedData, true);

        // Update local state
        setUser((prevUser) => ({
          ...prevUser,
          tasks: mergedTasks,
          categories: mergedCategories,
          lastSyncedAt: new Date(),
        }));
      } else {
        // No merge needed, just update local state with server data
        setUser((prevUser) => ({
          ...prevUser,
          tasks: serverData.tasks,
          categories: serverData.categories,
          lastSyncedAt: new Date(),
        }));
      }

      // Store credentials after successful sync (only if not already stored)
      if (!isAuthenticated) {
        localStorage.setItem("sync_uid", currentUserId);
        localStorage.setItem("sync_public_key", publicKey);
        localStorage.setItem("sync_public_key_hash", publicKeyHash);
        localStorage.setItem("sync_private_key", privateKey);
        setStoredUserId(currentUserId);
        setStoredPublicKey(publicKey);
        setStoredPublicKeyHash(publicKeyHash);
        setStoredPrivateKey(privateKey);
        setIsAuthenticated(true);

        // Notify other components that sync credentials were updated
        window.dispatchEvent(new Event("sync-credentials-updated"));
      }

      setState("success");
      setProgressMessage("Sync completed successfully!");
      showToast("Data synced successfully!", { type: "success" });
    } catch (error) {
      console.error("Sync error:", error);
      setState("error");

      // Use generic error message to prevent user enumeration
      const errorMsg =
        error instanceof Error && error.message.includes("403")
          ? "Invalid user ID or password combination"
          : error instanceof Error
            ? error.message
            : "Sync failed. Please try again.";

      setErrorMessage(errorMsg);
      showToast(errorMsg, { type: "error" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sync_uid");
    localStorage.removeItem("sync_public_key");
    localStorage.removeItem("sync_public_key_hash");
    localStorage.removeItem("sync_private_key");
    setStoredUserId(null);
    setStoredPublicKey(null);
    setStoredPublicKeyHash(null);
    setStoredPrivateKey(null);
    setIsAuthenticated(false);
    setUserId("");
    setPassword("");
    setState("idle");
    setErrorMessage("");
    setProgressMessage("");
    showToast("Credentials cleared", { type: "info" });

    // Notify other components that sync credentials were cleared
    window.dispatchEvent(new Event("sync-credentials-updated"));
  };

  const resetState = () => {
    setState("idle");
    setErrorMessage("");
    setProgressMessage("");
  };

  return (
    <>
      <TopBar title="Remote Sync" />
      <MainContainer>
        <FeatureDescription>
          <CloudSyncRounded sx={{ fontSize: 40, color: (theme) => theme.palette.primary.main }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Remote Sync
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
            Sync your tasks and categories across devices using end-to-end encryption.
          </Typography>
          {user.lastSyncedAt && (
            <Tooltip
              title={new Intl.DateTimeFormat(navigator.language, {
                dateStyle: "long",
                timeStyle: "medium",
              }).format(new Date(user.lastSyncedAt))}
              placement="top"
            >
              <LastSyncedText>
                <AccessTimeRounded /> &nbsp; Last synced {timeAgo(new Date(user.lastSyncedAt))}
              </LastSyncedText>
            </Tooltip>
          )}
        </FeatureDescription>

        <StyledPaper>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            {isAuthenticated ? "Quick Sync" : "Sync Your Data"}
          </Typography>
          <Stack spacing={2}>
            {isAuthenticated ? (
              <>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Synced as: <strong>{storedUserId}</strong>
                </Typography>

                {state === "syncing" && (
                  <LoadingContainer>
                    <CircularProgress size={24} />
                    <LoadingText>{progressMessage}</LoadingText>
                  </LoadingContainer>
                )}

                {state === "error" && (
                  <Alert severity="error" icon={<ErrorRounded />} sx={{ width: "100%" }}>
                    <AlertTitle>Sync Error</AlertTitle>
                    {errorMessage}
                  </Alert>
                )}

                {state === "success" && (
                  <Alert severity="success" icon={<CheckCircleRounded />} sx={{ width: "100%" }}>
                    <AlertTitle>Sync Complete</AlertTitle>
                    {progressMessage}
                  </Alert>
                )}

                <SyncButton
                  variant="contained"
                  onClick={state === "success" || state === "error" ? resetState : handleSync}
                  disabled={state === "syncing"}
                  startIcon={
                    state === "syncing" ? (
                      <CircularProgress size={20} />
                    ) : state === "success" ? (
                      <CheckCircleRounded />
                    ) : (
                      <SyncRounded />
                    )
                  }
                  color={state === "success" ? "success" : "primary"}
                >
                  {state === "syncing"
                    ? "Syncing..."
                    : state === "success" || state === "error"
                      ? "Done"
                      : "Sync Now"}
                </SyncButton>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleLogout}
                  disabled={state === "syncing"}
                  sx={{ mt: 1 }}
                >
                  Change Account
                </Button>
              </>
            ) : (
              <>
                <TextField
                  label="User ID"
                  variant="outlined"
                  fullWidth
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setUserIdError(validateUserId(e.target.value));
                  }}
                  onBlur={() => setUserIdError(validateUserId(userId))}
                  disabled={state === "syncing"}
                  error={!!userIdError}
                  helperText={userIdError || "Lowercase alphanumeric, 8+ characters"}
                />
                <TextField
                  label="Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(validatePassword(e.target.value));
                  }}
                  onBlur={() => setPasswordError(validatePassword(password))}
                  disabled={state === "syncing"}
                  error={!!passwordError}
                  helperText={passwordError || "12+ characters, upper/lower/numbers/symbols"}
                />

                {state === "syncing" && (
                  <LoadingContainer>
                    <CircularProgress size={24} />
                    <LoadingText>{progressMessage}</LoadingText>
                  </LoadingContainer>
                )}

                {state === "error" && (
                  <Alert severity="error" icon={<ErrorRounded />} sx={{ width: "100%" }}>
                    <AlertTitle>Sync Error</AlertTitle>
                    {errorMessage}
                  </Alert>
                )}

                {state === "success" && (
                  <Alert severity="success" icon={<CheckCircleRounded />} sx={{ width: "100%" }}>
                    <AlertTitle>Sync Complete</AlertTitle>
                    {progressMessage}
                  </Alert>
                )}

                <SyncButton
                  variant="contained"
                  onClick={state === "success" || state === "error" ? resetState : handleSync}
                  disabled={
                    state === "syncing" ||
                    !userId.trim() ||
                    !password.trim() ||
                    !!validateUserId(userId) ||
                    !!validatePassword(password)
                  }
                  startIcon={
                    state === "syncing" ? (
                      <CircularProgress size={20} />
                    ) : state === "success" ? (
                      <CheckCircleRounded />
                    ) : (
                      <SyncRounded />
                    )
                  }
                  color={state === "success" ? "success" : "primary"}
                >
                  {state === "syncing"
                    ? "Syncing..."
                    : state === "success" || state === "error"
                      ? "Done"
                      : "Sync Now"}
                </SyncButton>
              </>
            )}
          </Stack>
        </StyledPaper>
      </MainContainer>
    </>
  );
}

const MainContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 20px;
  max-width: 600px !important;
`;

const FeatureDescription = styled.div`
  text-align: center;
  margin-bottom: 16px;
`;

const StyledPaper = styled.div`
  padding: 24px;
  border-radius: 24px;
  background: ${({ theme }) => (theme.darkmode ? "#1f1f1f" : "#ffffff")};
  width: 100%;
  text-align: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 20px 0;
`;

const SyncButton = styled(Button)`
  padding: 12px 24px;
  border-radius: 14px;
  font-weight: 600;
  min-width: 180px;
`;

const LoadingText = styled(Typography)`
  color: ${({ theme }) => (theme.darkmode ? "#ffffff" : "#000000")};
`;

const LastSyncedText = styled(Typography)`
  opacity: 0.9;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => (theme.darkmode ? "#ffffff" : "#000000")};
`;
