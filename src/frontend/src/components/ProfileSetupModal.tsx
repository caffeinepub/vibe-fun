import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveUserProfile } from "../hooks/useQueries";

interface ProfileSetupModalProps {
  open: boolean;
}

export default function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [name, setName] = useState("");
  const { mutateAsync, isPending } = useSaveUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await mutateAsync({ name: name.trim() });
      toast.success("Profile created! Welcome to CyberLaunch.");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="bg-card border-neon-green/20 max-w-md"
        data-ocid="profile_setup.dialog"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-neon-green" />
            </div>
            <DialogTitle className="font-display text-xl">
              Welcome to CyberLaunch
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Choose a display name to get started on the launchpad.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Display Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CyberTrader..."
              className="bg-muted/50 border-border focus:border-neon-green/60"
              autoFocus
              data-ocid="profile_setup.input"
            />
          </div>
          <Button
            type="submit"
            disabled={!name.trim() || isPending}
            className="w-full bg-neon-green text-background hover:bg-neon-green/90 font-semibold"
            data-ocid="profile_setup.submit_button"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {isPending ? "Saving..." : "Enter the Launchpad"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
