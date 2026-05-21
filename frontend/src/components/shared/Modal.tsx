'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => { if (!el.open) onClose(); };
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'backdrop:bg-black/50 max-w-lg w-[calc(100%-2rem)] rounded-xl border border-outline-variant/30 bg-white p-0 shadow-xl',
        'sm:w-full',
        className,
      )}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
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
      <div className="p-4">{children}</div>
    </dialog>
  );
}
