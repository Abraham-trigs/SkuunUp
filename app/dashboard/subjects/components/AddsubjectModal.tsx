"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubjectStore } from "@/app/store/subjectStore.ts";
import { X, BookPlus, Hash } from "lucide-react";

// ------------------------- Schema -------------------------
const addSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().optional().nullable(),
});

type AddSubjectFormData = z.infer<typeof addSubjectSchema>;

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ------------------------- Modal Component -------------------------
export default function AddSubjectModal({
  isOpen,
  onClose,
  onSuccess,
}: AddSubjectModalProps) {
  const { createSubject, loading, error } = useSubjectStore();

  const { register, handleSubmit, reset, formState } =
    useForm<AddSubjectFormData>({
      resolver: zodResolver(addSubjectSchema),
      defaultValues: { name: "", code: "" },
    });

  const onSubmit = async (data: AddSubjectFormData) => {
    const result = await createSubject(data);
    if (result) {
      reset();
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
        className="relative w-full max-w-md rounded-2xl border shadow-2xl p-8 animate-in fade-in zoom-in duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2
              style={{ color: "#BFCDEF" }}
              className="text-xl font-black uppercase tracking-tighter"
            >
              Add New Subject
            </h2>
            <div
              className="h-1 w-12 rounded-full"
              style={{ backgroundColor: "#6BE8EF" }}
            />
          </div>
          <button
            onClick={onClose}
            className="text-[#BFCDEF] opacity-40 hover:opacity-100 transition-opacity"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Subject Name */}
          <div className="group">
            <label
              style={{ color: "#BFCDEF" }}
              className="block mb-2 text-xs font-black uppercase tracking-widest opacity-70"
            >
              Subject Name
            </label>
            <div className="relative">
              <BookPlus
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6BE8EF] opacity-40"
              />
              <input
                {...register("name")}
                style={{
                  backgroundColor: "#1c376e",
                  color: "#BFCDEF",
                  borderColor: "#BFCDEF33",
                }}
                className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] transition-all placeholder:text-[#BFCDEF]/20"
                placeholder="e.g. Mathematics"
                disabled={loading}
              />
            </div>
            {formState.errors.name && (
              <p className="text-[#E74C3C] text-[10px] font-bold uppercase tracking-wider mt-2">
                {formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Subject Code */}
          <div className="group">
            <label
              style={{ color: "#BFCDEF" }}
              className="block mb-2 text-xs font-black uppercase tracking-widest opacity-70"
            >
              Subject Code (Optional)
            </label>
            <div className="relative">
              <Hash
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6BE8EF] opacity-40"
              />
              <input
                {...register("code")}
                style={{
                  backgroundColor: "#1c376e",
                  color: "#BFCDEF",
                  borderColor: "#BFCDEF33",
                }}
                className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] transition-all placeholder:text-[#BFCDEF]/20"
                placeholder="e.g. MATH101"
                disabled={loading}
              />
            </div>
          </div>

          {/* Error feedback */}
          {error && (
            <p className="text-[#E74C3C] text-[10px] font-bold uppercase tracking-wider bg-[#E74C3C]/10 p-3 rounded-lg border border-[#E74C3C]/20">
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              style={{ color: "#BFCDEF" }}
              className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ backgroundColor: "#6BE8EF", color: "#03102b" }}
              className="px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#6BE8EF]/10 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Add Subject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
