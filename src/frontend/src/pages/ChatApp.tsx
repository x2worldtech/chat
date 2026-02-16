import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useUser } from '../hooks/useQueries';
import UsernameSetup from '../components/UsernameSetup';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import Header from '../components/Header';

export default function ChatApp() {
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal();
  const { data: user, isLoading: userLoading } = useUser(principal);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent pull-to-refresh on touch devices
  useEffect(() => {
    let startY = 0;
    
    const preventPullToRefresh = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Allow scrolling within scroll areas
      if (target.closest('[data-radix-scroll-area-viewport]')) {
        return;
      }
      
      if (e.type === 'touchstart') {
        startY = e.touches[0].pageY;
      } else if (e.type === 'touchmove') {
        const currentY = e.touches[0].pageY;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Prevent pull-to-refresh when at the top of the page and pulling down
        if (scrollTop === 0 && currentY > startY) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchstart', preventPullToRefresh, { passive: false });
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventPullToRefresh);
      document.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, []);

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <UsernameSetup />;
  }

  const showChatList = !isMobileView || !selectedChatId;
  const showChatWindow = !isMobileView || selectedChatId;

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header user={user} />
      <div className="flex flex-1 overflow-hidden">
        {showChatList && (
          <div className={`${isMobileView ? 'w-full' : 'w-full md:w-96'} border-r border-border/50 bg-card/30`}>
            <ChatList
              onSelectChat={(chatId) => setSelectedChatId(chatId)}
              selectedChatId={selectedChatId}
            />
          </div>
        )}
        {showChatWindow && (
          <div className="flex-1">
            <ChatWindow
              chatId={selectedChatId}
              onBack={() => setSelectedChatId(null)}
              isMobileView={isMobileView}
            />
          </div>
        )}
      </div>
    </div>
  );
}
