import { useState, useEffect, useRef } from 'react';
import { useMessages, useSendMessage } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Lock, Plus, Keyboard } from 'lucide-react';
import type { Message } from '../backend';
import MessageContextMenu from './MessageContextMenu';
import ForwardMessageDialog from './ForwardMessageDialog';
import DeleteMessageDialog from './DeleteMessageDialog';

interface ChatWindowProps {
  chatId: string | null;
  onBack: () => void;
  isMobileView: boolean;
}

export default function ChatWindow({ chatId, onBack, isMobileView }: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    message: Message;
    x: number;
    y: number;
  } | null>(null);
  const [forwardDialog, setForwardDialog] = useState<Message | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<Message | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);

  const { data: messages = [], refetch } = useMessages(chatId);
  const sendMessage = useSendMessage();

  // Auto-refresh messages every 3 seconds
  useEffect(() => {
    if (chatId) {
      const interval = setInterval(() => {
        refetch();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [chatId, refetch]);

  // Scroll to bottom when messages change or chat opens
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatId]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleSend = async () => {
    if (!messageText.trim() || !chatId || !principal) return;

    const content = messageText.trim();
    setMessageText('');
    setReplyToMessage(null);

    try {
      await sendMessage.mutateAsync({ chatId, content, sender: principal });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleInputContainerClick = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    inputRef.current?.focus();
  };

  const handleMenuItemClick = (action: string) => {
    console.log(`${action} feature coming soon`);
  };

  const handleLongPressStart = (message: Message, event: React.TouchEvent | React.MouseEvent) => {
    event.preventDefault();
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    longPressStartRef.current = { x: clientX, y: clientY };
    
    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({
        message,
        x: clientX,
        y: clientY,
      });
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartRef.current = null;
  };

  const handleLongPressMove = (event: React.TouchEvent | React.MouseEvent) => {
    if (!longPressStartRef.current) return;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const deltaX = Math.abs(clientX - longPressStartRef.current.x);
    const deltaY = Math.abs(clientY - longPressStartRef.current.y);
    
    if (deltaX > 10 || deltaY > 10) {
      handleLongPressEnd();
    }
  };

  const handleCopyMessage = (message: Message) => {
    navigator.clipboard.writeText(message.content);
    setContextMenu(null);
  };

  const handleReplyMessage = (message: Message) => {
    setReplyToMessage(message);
    setContextMenu(null);
    inputRef.current?.focus();
  };

  const handleForwardMessage = (message: Message) => {
    setForwardDialog(message);
    setContextMenu(null);
  };

  const handleDeleteMessage = (message: Message) => {
    setDeleteDialog(message);
    setContextMenu(null);
  };

  if (!chatId) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Select a chat</h3>
          <p className="text-muted-foreground">
            Choose a chat from the list or start a new one
          </p>
        </div>
      </div>
    );
  }

  const sortedMessages = [...messages].sort((a, b) => 
    Number(a.timestamp - b.timestamp)
  );

  return (
    <div className="relative flex h-full flex-col no-pull-refresh">
      <div className="border-b border-border/50 bg-card/50 backdrop-blur p-4">
        <div className="flex items-center gap-3">
          {isMobileView && (
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
            CH
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Chat</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>End-to-end encrypted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-[72px] md:pb-[80px] p-4">
        <div className="space-y-4 pb-2">
          {sortedMessages.map((message) => {
            const isOwn = message.sender.toString() === principal?.toString();
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 message-bubble ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                  onTouchStart={(e) => handleLongPressStart(message, e)}
                  onTouchEnd={handleLongPressEnd}
                  onTouchMove={handleLongPressMove}
                  onMouseDown={(e) => handleLongPressStart(message, e)}
                  onMouseUp={handleLongPressEnd}
                  onMouseMove={handleLongPressMove}
                  onMouseLeave={handleLongPressEnd}
                >
                  <p className="break-words message-content">{message.content}</p>
                  <p className={`mt-1 text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(Number(message.timestamp) / 1000000).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {replyToMessage && (
        <div className="fixed bottom-[72px] md:bottom-[80px] left-0 right-0 bg-muted/80 backdrop-blur px-4 py-2 border-t border-border/50 z-40">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Replying to</p>
              <p className="text-sm truncate message-content">{replyToMessage.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToMessage(null)}
              className="shrink-0"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="chat-footer-fixed">
        <div 
          className={`chat-icon-menu ${isMenuOpen ? 'chat-icon-menu-open' : ''}`}
        >
          <div className="flex items-center justify-around gap-4 px-4">
            <button
              type="button"
              onClick={() => handleMenuItemClick('Photo')}
              className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              aria-label="Photo"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <img 
                  src="/assets/generated/photo-icon.dim_24x24.png" 
                  alt="Photo" 
                  className="h-6 w-6"
                />
              </div>
              <span className="text-xs text-muted-foreground">Photo</span>
            </button>

            <button
              type="button"
              onClick={() => handleMenuItemClick('Camera')}
              className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              aria-label="Camera"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <img 
                  src="/assets/generated/camera-icon.dim_24x24.png" 
                  alt="Camera" 
                  className="h-6 w-6"
                />
              </div>
              <span className="text-xs text-muted-foreground">Camera</span>
            </button>

            <button
              type="button"
              onClick={() => handleMenuItemClick('Document')}
              className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              aria-label="Document"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <img 
                  src="/assets/generated/document-icon.dim_24x24.png" 
                  alt="Document" 
                  className="h-6 w-6"
                />
              </div>
              <span className="text-xs text-muted-foreground">Document</span>
            </button>

            <button
              type="button"
              onClick={() => handleMenuItemClick('Poll')}
              className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
              aria-label="Poll"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <img 
                  src="/assets/generated/poll-icon.dim_24x24.png" 
                  alt="Poll" 
                  className="h-6 w-6"
                />
              </div>
              <span className="text-xs text-muted-foreground">Poll</span>
            </button>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleToggleMenu}
            className="h-10 w-10 shrink-0 rounded-full hover:bg-accent"
            aria-label={isMenuOpen ? "Show keyboard" : "Attach files"}
          >
            {isMenuOpen ? (
              <Keyboard className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </Button>
          
          <div 
            className={`flex-1 relative transition-all duration-200 cursor-text ${isInputFocused ? 'chat-input-expanded' : ''}`}
            onClick={handleInputContainerClick}
          >
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              className="w-full rounded-full bg-muted/50 border-muted px-4 py-2 h-10 focus-visible:ring-1 focus-visible:ring-ring transition-all"
            />
          </div>

          <Button
            type="submit"
            size="icon"
            disabled={!messageText.trim()}
            className="h-10 w-10 shrink-0 rounded-full"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {contextMenu && (
        <MessageContextMenu
          message={contextMenu.message}
          x={contextMenu.x}
          y={contextMenu.y}
          onCopy={handleCopyMessage}
          onReply={handleReplyMessage}
          onForward={handleForwardMessage}
          onDelete={handleDeleteMessage}
          onClose={() => setContextMenu(null)}
        />
      )}

      {forwardDialog && (
        <ForwardMessageDialog
          message={forwardDialog}
          onClose={() => setForwardDialog(null)}
        />
      )}

      {deleteDialog && chatId && principal && (
        <DeleteMessageDialog
          message={deleteDialog}
          chatId={chatId}
          currentUserPrincipal={principal}
          onClose={() => setDeleteDialog(null)}
        />
      )}
    </div>
  );
}
