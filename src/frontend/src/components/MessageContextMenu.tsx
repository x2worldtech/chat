import { useEffect, useRef } from 'react';
import type { Message } from '../backend';

interface MessageContextMenuProps {
  message: Message;
  x: number;
  y: number;
  onCopy: (message: Message) => void;
  onReply: (message: Message) => void;
  onForward: (message: Message) => void;
  onDelete: (message: Message) => void;
  onClose: () => void;
}

export default function MessageContextMenu({
  message,
  x,
  y,
  onCopy,
  onReply,
  onForward,
  onDelete,
  onClose,
}: MessageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = y - rect.height - 10;
      }

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
      />
      <div
        ref={menuRef}
        className="fixed z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden message-context-menu"
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left"
          onClick={() => handleAction(() => onCopy(message))}
        >
          <img
            src="/assets/generated/copy-message-icon-transparent.dim_16x16.png"
            alt=""
            className="h-4 w-4"
          />
          <span className="text-sm">Copy</span>
        </button>

        <button
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left"
          onClick={() => handleAction(() => onReply(message))}
        >
          <img
            src="/assets/generated/reply-message-icon-transparent.dim_16x16.png"
            alt=""
            className="h-4 w-4"
          />
          <span className="text-sm">Reply</span>
        </button>

        <button
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left"
          onClick={() => handleAction(() => onForward(message))}
        >
          <img
            src="/assets/generated/forward-message-icon-transparent.dim_16x16.png"
            alt=""
            className="h-4 w-4"
          />
          <span className="text-sm">Forward</span>
        </button>

        <button
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-accent transition-colors text-left border-t border-border"
          onClick={() => handleAction(() => onDelete(message))}
        >
          <img
            src="/assets/generated/delete-message-icon-transparent.dim_16x16.png"
            alt=""
            className="h-4 w-4"
          />
          <span className="text-sm text-destructive">Delete</span>
        </button>
      </div>
    </>
  );
}
