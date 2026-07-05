"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Full-screen overlay on mobile, centered dialog on desktop (Tailwind
 * breakpoints only, no JS branching) so the same form works for the
 * mobile "new transaction" view and the desktop modal.
 */
export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center md:bg-slate-900/40 md:p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="hidden md:absolute md:inset-0 md:block"
      />
      <div className="relative flex h-full w-full flex-col bg-white md:h-auto md:max-h-[90vh] md:max-w-md md:rounded-card md:shadow-card">
        <div className="flex items-center justify-between border-b border-brand-50 px-4 py-3">
          <h2 className="font-bold text-brand-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
