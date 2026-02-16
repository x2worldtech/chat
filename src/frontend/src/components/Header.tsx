import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, MessageCircle } from 'lucide-react';
import type { User } from '../backend';
import ProfileDialog from './ProfileDialog';
import { useFileUrl } from '../blob-storage/FileStorage';

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const { clear } = useInternetIdentity();
  const [copied, setCopied] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { data: profilePictureUrl } = useFileUrl(user.profilePicture || '');

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const handleCopyPrincipal = async () => {
    try {
      await navigator.clipboard.writeText(user.principal.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <header className="border-b border-border/50 bg-card/50 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Secure Chat</h1>
              <p className="text-xs text-muted-foreground">End-to-end encrypted</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  {profilePictureUrl && (
                    <AvatarImage src={profilePictureUrl} alt={user.username} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.username}</p>
                  <button
                    onClick={handleCopyPrincipal}
                    className="text-xs text-muted-foreground truncate text-left hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Click to copy"
                  >
                    <span className="truncate">
                      {user.principal.toString().slice(0, 20)}...
                    </span>
                    {copied && (
                      <span className="flex items-center gap-1 text-primary whitespace-nowrap">
                        <img 
                          src="/assets/generated/copy-check-icon-transparent.dim_16x16.png" 
                          alt="Copied" 
                          className="h-3 w-3"
                        />
                        <span className="text-[10px]">Copied</span>
                      </span>
                    )}
                  </button>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setProfileDialogOpen(true)} 
                className="cursor-pointer"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clear} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <ProfileDialog 
        user={user} 
        open={profileDialogOpen} 
        onOpenChange={setProfileDialogOpen} 
      />
    </>
  );
}
