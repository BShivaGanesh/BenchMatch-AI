import React, { useEffect } from "react";
import Button from "./Button";

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ open, title, onClose, children }) => {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {title ?? "Details"}
          </h2>
          <Button variant="ghost" className="px-1 py-0.5 text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-3 text-sm text-slate-800">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
