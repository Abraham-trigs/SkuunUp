"use client";

import { useState } from "react";
import clsx from "clsx";
import { z } from "zod";
import { toast } from "sonner";
import { useClassesStore } from "@/app/store/useClassesStore.ts";

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>; // ✅ Added this
}

const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
});

export default function AddClassModal({
  isOpen,
  onClose,
  onSuccess,
}: AddClassModalProps) {
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
      setError(parsed.error.issues.map((e) => e.message).join(", "));
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

      // ✅ Call the onSuccess callback if provided
      if (onSuccess) await onSuccess();

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-ark-navy border border-ark-deepblue rounded-2xl shadow-2xl w-full max-w-md p-8 overflow-hidden">
        <h2 className="text-ark-lightblue text-2xl font-black mb-6">
          Add New Class
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-ark-lightblue text-sm font-bold mb-2">
              Class Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-ark-deepblue text-ark-cyan border border-ark-lightblue/20 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-ark-cyan placeholder:text-white/10 transition-all"
              placeholder="e.g. Senior Year"
              required
              autoFocus
            />
            <p className="text-ark-lightblue/60 text-xs mt-3 font-medium">
              Note: Grades "A", "B", and "C" will be generated automatically.
            </p>
          </div>

          {error && (
            <div className="bg-ark-red/10 border border-ark-red/20 p-3 rounded-lg">
              <p className="text-ark-red text-xs font-bold leading-tight">
                {error}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-ark-lightblue font-bold hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "px-8 py-2.5 rounded-xl font-black text-ark-navy transition-all active:scale-95 shadow-lg",
                loading
                  ? "bg-ark-deepblue opacity-50 cursor-not-allowed"
                  : "bg-ark-cyan hover:brightness-110 shadow-ark-cyan/20"
              )}
            >
              {loading ? "Initializing..." : "Create Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
