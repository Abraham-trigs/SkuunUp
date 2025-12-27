"use client";

import { useState } from "react";
import clsx from "clsx";
import { z } from "zod";
import { toast } from "sonner";
import { useClassesStore } from "@/app/store/useClassesStore.ts";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});

export default function AddClassModal({ isOpen, onClose }: AddClassModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { createClass } = useClassesStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const parsed = classSchema.safeParse({ name });
    if (!parsed.success) {
      setError(parsed.error.errors.map((e) => e.message).join(", "));
      setLoading(false);
      return;
    }

    try {
      const result = await createClass(name);

      if (!result.success) {
        toast.error(result.error || "Failed to create class");
        setError(result.error || "Failed to create class");
        setLoading(false);
        return;
      }

      toast.success(
        `Class "${name}" created successfully with grades: A, B, C!`
      );
      setName("");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error while creating class.");
      setError("Unexpected error while creating class.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
        className="border rounded-xl shadow-2xl w-full max-w-md p-6 overflow-hidden"
      >
        <h2 style={{ color: "#BFCDEF" }} className="text-xl font-bold mb-4">
          Add Class
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              style={{ color: "#BFCDEF" }}
              className="block text-sm font-medium mb-1"
            >
              Class Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                backgroundColor: "#1c376e",
                color: "#6BE8EF",
                borderColor: "#BFCDEF/20",
              }}
              className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] placeholder:text-white/20"
              placeholder="e.g. Senior Year"
              required
              autoFocus
            />
            <p style={{ color: "#BFCDEF" }} className="opacity-60 text-xs mt-2">
              Grades "A", "B", and "C" will be created automatically.
            </p>
          </div>

          {error && (
            <p
              style={{ color: "#E74C3C" }}
              className="text-sm font-medium bg-[#E74C3C]/10 p-2 rounded"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              style={{ color: "#BFCDEF" }}
              className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
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
                "px-6 py-2 rounded-lg font-bold transition-all active:scale-95",
                loading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:brightness-110 shadow-lg shadow-[#6BE8EF]/20"
              )}
            >
              {loading ? "Saving..." : "Create Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
