import { Share2, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSpacesContext } from "@/contexts/SpacesContext";
import { toast } from "sonner";

interface ShareSpaceButtonProps {
  spaceId: string;
  isPublic?: boolean;
  shareSlug?: string | null;
}

export const ShareSpaceButton = ({ spaceId, isPublic, shareSlug }: ShareSpaceButtonProps) => {
  const { makePublic, makePrivate } = useSpacesContext();

  const handleMakePublic = async () => {
    await makePublic(spaceId);
  };

  const handleMakePrivate = async () => {
    await makePrivate(spaceId);
  };

  const handleCopyLink = () => {
    if (shareSlug) {
      const shareUrl = `${window.location.origin}/s/${shareSlug}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isPublic ? (
          <>
            <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
              <Share2 className="h-4 w-4" />
              Copy Share Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleMakePrivate} className="gap-2">
              <Lock className="h-4 w-4" />
              Make Private
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={handleMakePublic} className="gap-2">
            <Unlock className="h-4 w-4" />
            Make Public & Get Link
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
