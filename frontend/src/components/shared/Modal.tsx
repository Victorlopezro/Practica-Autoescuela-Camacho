'use client';

import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Modal wrapper — centers content, click-through so backdrop catches clicks */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto max-h-[85vh] overflow-y-auto',
            'rounded-xl border border-outline-variant/30 bg-white p-0 shadow-xl',
            className,
          )}
          style={{ width: 'min(90vw, 36rem)' }}
        >
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/20">
            <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-surface-container-low text-on-surface-variant"
              aria-label="Cerrar"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </>
  );
}
