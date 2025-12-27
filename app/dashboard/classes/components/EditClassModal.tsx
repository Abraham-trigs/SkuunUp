"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useClassesStore } from "@/app/store/useClassesStore.ts";

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EditClassModal({
  isOpen,
  onClose,
  onSuccess,
}: EditClassModalProps) {
  const {
    selectedClass,
    updateClass,
    loading,
    clearSelectedClass,
    setClassData,
  } = useClassesStore();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && selectedClass) {
      setName(selectedClass.name);
      setError(null);
    }
  }, [isOpen, selectedClass]);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setError(null);
      clearSelectedClass?.();
    }
  }, [isOpen, clearSelectedClass]);

  if (!isOpen || !selectedClass) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Class name cannot be empty.");
      return;
    }

    if (trimmedName === selectedClass.name) {
      onClose();
      return;
    }

    try {
      const result = await updateClass(selectedClass.id, trimmedName);

      if (result?.success && result.data) {
        setClassData(result.data);
        onSuccess?.();
        onClose();
      } else {
        setError(
          result?.error ??
            "Unable to update class. Please check your connection and try again."
        );
      }
    } catch (err: any) {
      setError(err?.message ?? "Unexpected error while updating class.");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div
        style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
        className="w-full max-w-md rounded-xl border p-6 shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        <h2 style={{ color: "#BFCDEF" }} className="mb-4 text-xl font-bold">
          Edit Class
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="class-name"
              style={{ color: "#BFCDEF" }}
              className="mb-1 block text-sm font-medium opacity-90"
            >
              Class name
            </label>
            <input
              id="class-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={loading}
              style={{
                backgroundColor: "#1c376e",
                color: "#6BE8EF",
                borderColor: "#BFCDEF33",
              }}
              className="w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] disabled:opacity-50 transition-all placeholder:text-white/20"
              placeholder="e.g. Grade 6"
            />
          </div>

          {error && (
            <p
              role="alert"
              style={{ color: "#E74C3C" }}
              className="text-sm font-medium bg-[#E74C3C]/10 p-2 rounded border border-[#E74C3C]/20"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ color: "#BFCDEF" }}
              className="rounded-lg px-4 py-2 hover:bg-white/5 disabled:opacity-50 transition-colors font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: loading ? "#1c376e" : "#6BE8EF",
                color: "#03102b",
              }}
              className={clsx(
                "rounded-lg px-6 py-2 font-bold transition-all active:scale-95 shadow-lg shadow-[#6BE8EF]/10",
                loading
                  ? "cursor-not-allowed opacity-50"
                  : "hover:brightness-110"
              )}
            >
              {loading ? "Updating…" : "Update Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
