import { useState } from 'react';
import { useChatList, useSendMessage } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send } from 'lucide-react';
import type { Message, Chat } from '../backend';

interface ForwardMessageDialogProps {
  message: Message;
  onClose: () => void;
}

export default function ForwardMessageDialog({ message, onClose }: ForwardMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const { data: chats = [] } = useChatList();
  const sendMessage = useSendMessage();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal();

  const filteredChats = chats.filter((chat) =>
    chat.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleForward = async () => {
    if (!selectedChat || !principal) return;

    try {
      await sendMessage.mutateAsync({
        chatId: selectedChat,
        content: message.content,
        sender: principal,
      });
      onClose();
    } catch (error) {
      console.error('Error forwarding message:', error);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
          <DialogDescription>
            Select a chat to forward this message to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] rounded-md border">
            <div className="p-2 space-y-1">
              {filteredChats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No chats found
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedChat === chat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="font-medium text-sm">Chat</div>
                    <div className="text-xs opacity-70 truncate">
                      {chat.id}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleForward}
              disabled={!selectedChat || sendMessage.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Forward
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
