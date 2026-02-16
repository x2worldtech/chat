import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteChatForMe, useDeleteChatForEveryone } from '../hooks/useQueries';

interface DeleteChatDialogProps {
  chatId: string | null;
  onClose: () => void;
}

export default function DeleteChatDialog({ chatId, onClose }: DeleteChatDialogProps) {
  const deleteChatForMe = useDeleteChatForMe();
  const deleteChatForEveryone = useDeleteChatForEveryone();

  const handleDeleteForMe = async () => {
    if (!chatId) return;
    
    try {
      await deleteChatForMe.mutateAsync({ chatId });
      onClose();
    } catch (error) {
      console.error('Failed to delete chat for me:', error);
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!chatId) return;
    
    try {
      await deleteChatForEveryone.mutateAsync({ chatId });
      onClose();
    } catch (error) {
      console.error('Failed to delete chat for everyone:', error);
    }
  };

  return (
    <Dialog open={!!chatId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Chat</DialogTitle>
          <DialogDescription>
            Choose how you want to delete this chat
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleDeleteForMe}
            disabled={deleteChatForMe.isPending || deleteChatForEveryone.isPending}
            variant="outline"
            className="w-full justify-start h-auto py-3 px-4"
          >
            <div className="text-left">
              <div className="font-semibold">Delete for me</div>
              <div className="text-xs text-muted-foreground mt-1">
                Remove this chat from your list only
              </div>
            </div>
          </Button>

          <Button
            onClick={handleDeleteForEveryone}
            disabled={deleteChatForMe.isPending || deleteChatForEveryone.isPending}
            variant="destructive"
            className="w-full justify-start h-auto py-3 px-4"
          >
            <div className="text-left">
              <div className="font-semibold">Delete for everyone</div>
              <div className="text-xs opacity-90 mt-1">
                Remove this chat for all participants
              </div>
            </div>
          </Button>

          <Button
            onClick={onClose}
            disabled={deleteChatForMe.isPending || deleteChatForEveryone.isPending}
            variant="ghost"
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
