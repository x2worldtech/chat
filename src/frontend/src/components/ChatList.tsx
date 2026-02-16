import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, MessageCircle } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useChatList, useUser } from '../hooks/useQueries';
import NewChatDialog from './NewChatDialog';
import DeleteChatDialog from './DeleteChatDialog';
import type { Chat, Message } from '../backend';

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId: string | null;
}

function parseMessageList(messages: any): Message[] {
  const result: Message[] = [];
  let current = messages;
  
  while (current && Array.isArray(current) && current.length === 2) {
    result.push(current[0]);
    current = current[1];
  }
  
  return result;
}

export default function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal();
  
  const { data: chats = [], isLoading } = useChatList();

  const chatListItems = useMemo(() => {
    return chats.map((chat) => {
      const messages = parseMessageList(chat.messages);
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
      
      const otherParticipant = chat.participants.find(
        (p) => p.toString() !== principal?.toString()
      );
      
      return {
        id: chat.id,
        participantPrincipal: otherParticipant,
        lastMessage: lastMessage?.content || 'No messages',
        timestamp: lastMessage ? Number(lastMessage.timestamp) : Number(chat.createdAt),
        hasMessages: messages.length > 0,
      };
    });
  }, [chats, principal]);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chatListItems;
    
    const query = searchQuery.toLowerCase();
    return chatListItems.filter((chat) => {
      const principalStr = chat.participantPrincipal?.toString().toLowerCase() || '';
      const lastMsg = chat.lastMessage.toLowerCase();
      return principalStr.includes(query) || lastMsg.includes(query);
    });
  }, [chatListItems, searchQuery]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp / 1000000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
    }
  };

  const ChatListItem = ({ chat }: { chat: typeof chatListItems[0] }) => {
    const { data: otherUser } = useUser(chat.participantPrincipal);
    const displayName = otherUser?.username || chat.participantPrincipal?.toString().slice(0, 8) || 'Unknown';
    const avatarText = otherUser?.username?.slice(0, 2).toUpperCase() || 'CH';

    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startXRef = useRef(0);
    const currentXRef = useRef(0);
    const itemRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
      currentXRef.current = e.touches[0].clientX;
      setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isSwiping) return;
      
      currentXRef.current = e.touches[0].clientX;
      const diff = startXRef.current - currentXRef.current;
      
      // Only allow left swipe (positive diff)
      if (diff > 0) {
        setSwipeOffset(Math.min(diff, 160)); // Max swipe distance
      } else {
        setSwipeOffset(0);
      }
    };

    const handleTouchEnd = () => {
      setIsSwiping(false);
      
      // If swiped more than 80px, keep it open at 160px
      if (swipeOffset > 80) {
        setSwipeOffset(160);
      } else {
        setSwipeOffset(0);
      }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      startXRef.current = e.clientX;
      currentXRef.current = e.clientX;
      setIsSwiping(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isSwiping) return;
      
      currentXRef.current = e.clientX;
      const diff = startXRef.current - currentXRef.current;
      
      if (diff > 0) {
        setSwipeOffset(Math.min(diff, 160));
      } else {
        setSwipeOffset(0);
      }
    };

    const handleMouseUp = () => {
      setIsSwiping(false);
      
      if (swipeOffset > 80) {
        setSwipeOffset(160);
      } else {
        setSwipeOffset(0);
      }
    };

    const handleMouseLeave = () => {
      if (isSwiping) {
        setIsSwiping(false);
        if (swipeOffset > 80) {
          setSwipeOffset(160);
        } else {
          setSwipeOffset(0);
        }
      }
    };

    const handleChatClick = () => {
      if (swipeOffset > 0) {
        setSwipeOffset(0);
      } else {
        onSelectChat(chat.id);
      }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteChatId(chat.id);
      setSwipeOffset(0);
    };

    const handleArchiveClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Archive functionality - future implementation
      setSwipeOffset(0);
    };

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if (itemRef.current && !itemRef.current.contains(e.target as Node) && swipeOffset > 0) {
          setSwipeOffset(0);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }, [swipeOffset]);

    return (
      <div 
        ref={itemRef}
        className="relative overflow-hidden"
      >
        <div
          className={`absolute right-0 top-0 bottom-0 flex items-center gap-2 pr-4 ${
            swipeOffset > 0 ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transition: isSwiping ? 'none' : 'opacity 0.3s ease' }}
        >
          <button
            onClick={handleArchiveClick}
            className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            <img src="/assets/generated/archive-chat-icon.dim_24x24.png" alt="Archive" className="h-6 w-6" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="flex h-16 w-16 items-center justify-center rounded-lg bg-destructive hover:bg-destructive/80 transition-colors"
          >
            <img src="/assets/generated/delete-chat-icon.dim_24x24.png" alt="Delete" className="h-6 w-6" />
          </button>
        </div>

        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClick={handleChatClick}
          className={`relative w-full p-4 text-left transition-colors bg-background cursor-pointer ${
            selectedChatId === chat.id ? 'bg-accent/50' : 'hover:bg-accent/50'
          }`}
          style={{
            transform: `translateX(-${swipeOffset}px)`,
            transition: isSwiping ? 'none' : 'transform 0.3s ease',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {avatarText}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold truncate">{displayName}</h3>
                <span className="text-xs text-muted-foreground ml-2 shrink-0">
                  {formatTimestamp(chat.timestamp)}
                </span>
              </div>
              <div className="flex items-center">
                <p className="text-sm text-muted-foreground truncate">
                  {chat.lastMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col no-pull-refresh">
      <div className="border-b border-border/50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Chats</h2>
          <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Chat</DialogTitle>
              </DialogHeader>
              <NewChatDialog onClose={() => setIsNewChatOpen(false)} onChatCreated={onSelectChat} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
            <p className="text-sm text-muted-foreground">Loading chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4">
              {searchQuery ? <Search className="h-8 w-8 text-muted-foreground" /> : <MessageCircle className="h-8 w-8 text-muted-foreground" />}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No results' : 'No chats'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Start a new chat to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsNewChatOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Chat
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredChats.map((chat) => (
              <ChatListItem key={chat.id} chat={chat} />
            ))}
          </div>
        )}
      </ScrollArea>

      <DeleteChatDialog
        chatId={deleteChatId}
        onClose={() => setDeleteChatId(null)}
      />
    </div>
  );
}
