"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Staff, useStaffStore } from "@/app/store/useStaffStore.ts";
import { notify } from "@/lib/helpers/notifications.ts";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  staff: Staff | null;
  onClose: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  staff,
  onClose,
}: ConfirmDeleteModalProps) {
  const { deleteStaff } = useStaffStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const firstButton = dialogRef.current.querySelector("button");
      (firstButton as HTMLButtonElement)?.focus();
    }
  }, [isOpen]);

  if (!isOpen || !staff) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await deleteStaff(staff.id);
      notify.success(`Staff member "${staff.user.name}" deleted successfully.`);
      onClose();
    } catch (err) {
      console.error("Delete failed", err);
      notify.error("Failed to delete staff. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={dialogRef}
        style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
        className="relative w-full max-w-sm rounded-2xl border shadow-2xl p-8 animate-in fade-in zoom-in duration-200 text-center"
      >
        {/* Warning Icon Section */}
        <div className="flex flex-col items-center mb-6">
          <div
            style={{ backgroundColor: "#E74C3C20" }}
            className="p-4 rounded-full mb-4 border border-[#E74C3C40]"
          >
            <AlertTriangle size={32} className="text-[#E74C3C]" />
          </div>
          <h2
            style={{ color: "#BFCDEF" }}
            className="text-xl font-black uppercase tracking-tighter"
          >
            Terminate Record
          </h2>
          <div
            className="h-1 w-12 rounded-full mt-2"
            style={{ backgroundColor: "#E74C3C" }}
          />
        </div>

        {/* Message */}
        <div className="mb-8">
          <p
            style={{ color: "#BFCDEF" }}
            className="text-sm opacity-80 leading-relaxed"
          >
            Are you sure you want to delete <br />
            <span className="text-[#6BE8EF] font-bold">
              "{staff.user.name}"
            </span>
            ?
          </p>
          <p
            style={{ color: "#E74C3C" }}
            className="mt-4 text-[10px] font-black uppercase tracking-widest opacity-60"
          >
            This operation cannot be reversed.
          </p>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            style={{ color: "#BFCDEF" }}
            className="px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors border border-transparent disabled:opacity-20"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{ backgroundColor: "#E74C3C", color: "#ffffff" }}
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest 
              transition-all active:scale-95 shadow-lg shadow-[#E74C3C]/20
              ${
                isDeleting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:brightness-110"
              }
            `}
          >
            <Trash2 size={14} />
            {isDeleting ? "Deleting..." : "Confirm"}
          </button>
        </div>

        {/* Quick Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#BFCDEF] opacity-20 hover:opacity-100 transition-opacity"
        >
          <X size={18} />
        </button>
      </div>
    </div>,
    document.body
  );
}
