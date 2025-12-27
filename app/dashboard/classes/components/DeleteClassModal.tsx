"use client";

import { useState, useEffect, useRef } from "react";
import { useClassesStore } from "@/app/store/useClassesStore.ts";
import clsx from "clsx";

interface DeleteClassModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeleteClassModal({
  id,
  isOpen,
  onClose,
  onSuccess,
}: DeleteClassModalProps) {
  const { deleteClass, clearSelectedClass } = useClassesStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTimeout(() => firstButtonRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await deleteClass(id);
      useClassesStore.setState((state) => ({
        classes: state.classes.filter((cls) => cls.id !== id),
        selectedClass:
          state.selectedClass?.id === id ? null : state.selectedClass,
      }));

      clearSelectedClass();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        ref={modalRef}
        style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
        className="border rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200"
      >
        <h2 style={{ color: "#BFCDEF" }} className="text-lg font-bold mb-3">
          Confirm Deletion
        </h2>
        <p
          style={{ color: "#BFCDEF" }}
          className="mb-6 opacity-80 leading-relaxed"
        >
          Are you sure you want to delete this class? This action is permanent
          and cannot be undone.
        </p>

        {error && (
          <p
            style={{ backgroundColor: "#E74C3C20", color: "#E74C3C" }}
            className="text-sm p-3 rounded-lg mb-4 border border-[#E74C3C40]"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            ref={firstButtonRef}
            onClick={onClose}
            style={{ color: "#BFCDEF" }}
            className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            style={{ backgroundColor: "#E74C3C" }}
            className={clsx(
              "px-5 py-2 rounded-lg text-white font-bold transition-all active:scale-95 shadow-lg shadow-[#E74C3C]/20",
              loading ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"
            )}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Class"}
          </button>
        </div>
      </div>
    </div>
  );
}
