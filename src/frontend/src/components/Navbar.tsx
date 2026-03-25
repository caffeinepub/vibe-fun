import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, Rocket, User } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";

type Page = "explore" | "token" | "profile";

interface NavbarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLaunchToken: () => void;
}

export default function Navbar({
  currentPage,
  onNavigate,
  onLaunchToken,
}: NavbarProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const { data: profile } = useGetCallerUserProfile();

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        if (error.message === "User is already authenticated") {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-neon-green/10 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            type="button"
            className="flex items-center gap-2 group"
            onClick={() => onNavigate("explore")}
            data-ocid="nav.link"
          >
            <img
              src="/assets/generated/vibe-fun-logo-transparent.dim_120x40.png"
              alt="vibe.fun"
              className="h-8 w-auto object-contain"
            />
          </button>

          <div className="flex items-center gap-3">
            <Button
              onClick={onLaunchToken}
              className="bg-neon-green/10 border border-neon-green/40 text-neon-green hover:bg-neon-green hover:text-background font-semibold transition-all hover:shadow-neon-green"
              data-ocid="nav.primary_button"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Launch Token
            </Button>

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => onNavigate("profile")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === "profile"
                    ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                data-ocid="nav.link"
              >
                <User className="w-4 h-4" />
                {profile?.name ?? "Profile"}
              </button>
            )}

            <Button
              variant="ghost"
              onClick={handleAuth}
              disabled={loginStatus === "logging-in"}
              className="text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30"
              data-ocid="nav.toggle"
            >
              {isAuthenticated ? (
                <>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </>
              ) : loginStatus === "logging-in" ? (
                "Connecting..."
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
