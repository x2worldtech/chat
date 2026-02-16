import { useState } from 'react';
import { useSearchUser, useCreateChat, useFindExistingChat } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';
import type { User } from '../backend';

interface NewChatDialogProps {
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export default function NewChatDialog({ onClose, onChatCreated }: NewChatDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchUser = useSearchUser();
  const createChat = useCreateChat();
  const findExistingChat = useFindExistingChat();
  const { identity } = useInternetIdentity();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchError('Please enter a username or Principal ID');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const user = await searchUser.mutateAsync(searchTerm.trim());
      if (user) {
        setFoundUser(user);
      } else {
        setSearchError('User not found');
        setFoundUser(null);
      }
    } catch (error) {
      setSearchError('Error searching for user');
      setFoundUser(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateChat = async () => {
    if (!foundUser || !identity) return;

    try {
      const currentUserPrincipal = identity.getPrincipal();
      
      // Check if chat already exists
      const existingChatId = await findExistingChat.mutateAsync({
        participant1: currentUserPrincipal,
        participant2: foundUser.principal,
      });

      if (existingChatId) {
        // Navigate to existing chat
        onChatCreated(existingChatId);
        onClose();
        return;
      }

      // Create new chat if none exists
      const chatId = await createChat.mutateAsync(foundUser.principal);
      onChatCreated(chatId);
      onClose();
    } catch (error) {
      // Silent error handling - no toast notification
      console.error('Error creating chat:', error);
    }
  };

  const isLoading = createChat.isPending || findExistingChat.isPending;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="search">Search user</Label>
        <div className="flex gap-2">
          <Input
            id="search"
            placeholder="Username or Principal ID"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSearchError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isSearching}
          />
          <Button onClick={handleSearch} disabled={isSearching} size="icon">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        {searchError && (
          <p className="text-sm text-destructive">{searchError}</p>
        )}
      </div>

      {foundUser && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
              {foundUser.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="font-semibold truncate">{foundUser.username}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground break-all leading-tight">
                {foundUser.principal.toString()}
              </p>
            </div>
          </div>
          <Button
            onClick={handleCreateChat}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Start chat'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
