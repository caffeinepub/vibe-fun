import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { Token } from "./backend.d";
import CreateTokenModal from "./components/CreateTokenModal";
import ExplorePage from "./components/ExplorePage";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProfileSetupModal from "./components/ProfileSetupModal";
import TokenDetailPage from "./components/TokenDetailPage";
import UserProfilePage from "./components/UserProfilePage";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";

const queryClient = new QueryClient();

type Page = "explore" | "token" | "profile";

function AppInner() {
  const [page, setPage] = useState<Page>("explore");
  const [selectedToken, setSelectedToken] = useState<bigint | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  const handleTokenClick = (token: Token) => {
    setSelectedToken(token.id);
    setPage("token");
  };

  const handleLaunchToken = () => {
    if (!isAuthenticated) {
      return;
    }
    setCreateModalOpen(true);
  };

  const handleCreateSuccess = (tokenId: bigint) => {
    setCreateModalOpen(false);
    setSelectedToken(tokenId);
    setPage("token");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        currentPage={page}
        onNavigate={(p) => setPage(p)}
        onLaunchToken={handleLaunchToken}
      />

      <div className="flex-1">
        {page === "explore" && (
          <ExplorePage
            onTokenClick={handleTokenClick}
            onLaunchToken={handleLaunchToken}
          />
        )}
        {page === "token" && selectedToken !== null && (
          <TokenDetailPage
            tokenId={selectedToken}
            onBack={() => setPage("explore")}
            onLoginRequired={() => {
              // The navbar login button handles this
            }}
          />
        )}
        {page === "profile" && isAuthenticated && (
          <UserProfilePage
            onBack={() => setPage("explore")}
            onTokenClick={handleTokenClick}
          />
        )}
        {page === "profile" && !isAuthenticated && (
          <div className="max-w-4xl mx-auto px-4 py-24 text-center">
            <p className="text-muted-foreground text-lg">
              Please login to view your profile.
            </p>
          </div>
        )}
      </div>

      <Footer />

      <CreateTokenModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ProfileSetupModal open={showProfileSetup} />

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "oklch(0.11 0.02 265)",
            border: "1px solid oklch(0.87 0.22 155 / 20%)",
            color: "oklch(0.96 0.01 265)",
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
