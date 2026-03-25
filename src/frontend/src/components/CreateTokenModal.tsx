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
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Loader2, Rocket } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useCreateToken } from "../hooks/useQueries";

interface CreateTokenModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (tokenId: bigint) => void;
}

export default function CreateTokenModal({
  open,
  onClose,
  onSuccess,
}: CreateTokenModalProps) {
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync, isPending } = useCreateToken();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ticker.trim() || !imageFile) {
      toast.error("Please fill in all required fields and upload an image.");
      return;
    }
    try {
      const bytes = new Uint8Array(await imageFile.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
        setUploadProgress(pct),
      );
      const id = await mutateAsync({
        name: name.trim(),
        ticker: ticker.trim().toUpperCase(),
        description: description.trim(),
        imageId: blob,
      });
      toast.success(`${name} launched! 🚀`);
      onSuccess(id);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create token.");
    }
  };

  const resetForm = () => {
    setName("");
    setTicker("");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  const handleClose = () => {
    if (!isPending) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="bg-card border-neon-green/20 max-w-lg"
        data-ocid="create_token.dialog"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-neon-green" />
            </div>
            <DialogTitle className="font-display text-xl">
              Launch a Token
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground">
            Deploy your meme token on vibe.fun with a fair bonding curve.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>
              Token Image <span className="text-destructive">*</span>
            </Label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-neon-green/40 bg-muted/20 flex flex-col items-center justify-center gap-2 transition-colors group"
              data-ocid="create_token.dropzone"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-muted-foreground group-hover:text-neon-green transition-colors" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload image
                  </span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="token-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="token-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VibeToken"
                className="bg-muted/30 border-border focus:border-neon-green/50"
                data-ocid="create_token.input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token-ticker">
                Ticker <span className="text-destructive">*</span>
              </Label>
              <Input
                id="token-ticker"
                value={ticker}
                onChange={(e) =>
                  setTicker(e.target.value.toUpperCase().slice(0, 10))
                }
                placeholder="VIBE"
                maxLength={10}
                className="bg-muted/30 border-border focus:border-neon-green/50 font-mono"
                data-ocid="create_token.input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-desc">Description</Label>
            <Textarea
              id="token-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="The most vibe-worthy token on the ICP blockchain..."
              className="bg-muted/30 border-border focus:border-neon-green/50 resize-none"
              rows={3}
              data-ocid="create_token.textarea"
            />
          </div>

          {isPending && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uploading image...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-neon-green rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isPending}
              className="flex-1 border border-border"
              data-ocid="create_token.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending || !name.trim() || !ticker.trim() || !imageFile
              }
              className="flex-1 bg-neon-green text-background hover:bg-neon-green/90 font-semibold"
              data-ocid="create_token.submit_button"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Launch Token
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
