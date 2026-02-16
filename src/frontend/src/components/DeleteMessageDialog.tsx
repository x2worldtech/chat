import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteMessageForEveryone, useDeleteMessageForMe } from '../hooks/useQueries';
import type { Message } from '../backend';
import type { Principal } from '@dfinity/principal';

interface DeleteMessageDialogProps {
  message: Message;
  chatId: string;
  currentUserPrincipal: Principal;
  onClose: () => void;
}

export default function DeleteMessageDialog({ 
  message, 
  chatId, 
  currentUserPrincipal,
  onClose 
}: DeleteMessageDialogProps) {
  const deleteForEveryone = useDeleteMessageForEveryone();
  const deleteForMe = useDeleteMessageForMe();

  // Check if the current user is the sender of the message
  const isOwnMessage = message.sender.toString() === currentUserPrincipal.toString();

  const handleDeleteForMe = async () => {
    try {
      await deleteForMe.mutateAsync({ chatId, messageId: message.id });
      onClose();
    } catch (error) {
      console.error('Error deleting message for me:', error);
    }
  };

  const handleDeleteForEveryone = async () => {
    try {
      await deleteForEveryone.mutateAsync({ chatId, messageId: message.id });
      onClose();
    } catch (error) {
      console.error('Error deleting message for everyone:', error);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Message</DialogTitle>
          <DialogDescription>
            {isOwnMessage 
              ? 'Choose how you want to delete this message'
              : 'This message will be deleted for you only'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleDeleteForMe}
            disabled={deleteForMe.isPending}
          >
            {deleteForMe.isPending ? 'Deleting...' : 'Delete for me'}
          </Button>

          {isOwnMessage && (
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleDeleteForEveryone}
              disabled={deleteForEveryone.isPending}
            >
              {deleteForEveryone.isPending ? 'Deleting...' : 'Delete for everyone'}
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
