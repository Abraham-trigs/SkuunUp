"use client";

import React, { useState } from "react";
import { useSubjectStore } from "@/app/store/subjectStore.ts";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDeleteModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  subjectId: string;
  subjectName: string;
}

export default function ConfirmDeleteModal({
  onClose,
  onSuccess,
  subjectId,
  subjectName,
}: ConfirmDeleteModalProps) {
  const { deleteSubject, loading } = useSubjectStore();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      await deleteSubject(subjectId);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during deletion.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
        className="relative w-full max-w-sm rounded-2xl border shadow-2xl p-8 animate-in fade-in zoom-in duration-200"
      >
        {/* Header with Danger Icon */}
        <div className="flex flex-col items-center text-center mb-6">
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
            Confirm Deletion
          </h2>
          <div
            className="h-1 w-12 rounded-full mt-2"
            style={{ backgroundColor: "#E74C3C" }}
          />
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <p
            style={{ color: "#BFCDEF" }}
            className="text-sm opacity-80 leading-relaxed"
          >
            Are you sure you want to permanently remove <br />
            <span className="text-[#6BE8EF] font-bold">"{subjectName}"</span>?
          </p>
          <p
            style={{ color: "#E74C3C" }}
            className="mt-4 text-[10px] font-black uppercase tracking-widest opacity-60"
          >
            This action is irreversible.
          </p>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-[#E74C3C]/10 border border-[#E74C3C]/20 text-center">
            <p className="text-[#E74C3C] text-[10px] font-bold uppercase tracking-wider">
              {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            style={{ color: "#BFCDEF" }}
            className="px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors border border-transparent"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            style={{ backgroundColor: "#E74C3C", color: "#white" }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#E74C3C]/20 disabled:opacity-50"
            disabled={loading}
          >
            <Trash2 size={14} />
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>

        {/* Close Icon for quick exit */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#BFCDEF] opacity-20 hover:opacity-100 transition-opacity"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
