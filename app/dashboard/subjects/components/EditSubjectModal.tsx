"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubjectStore } from "@/app/store/subjectStore.ts";
import { X, Edit3, Hash, User, Loader2 } from "lucide-react";

// ------------------------- Schema -------------------------
const editSubjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional().nullable(),
});

type EditSubjectFormData = z.infer<typeof editSubjectSchema>;

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  onSuccess?: () => void;
}

// ------------------------- Modal Component -------------------------
export default function EditSubjectModal({
  isOpen,
  onClose,
  subjectId,
  onSuccess,
}: EditSubjectModalProps) {
  const { updateSubject } = useSubjectStore();
  const [subject, setSubject] = useState<EditSubjectFormData & any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState } =
    useForm<EditSubjectFormData>({
      resolver: zodResolver(editSubjectSchema),
    });

  useEffect(() => {
    if (isOpen && subjectId) {
      setLoading(true);
      fetch(`/api/subjects/${subjectId}`)
        .then((res) => res.json())
        .then((data) => {
          setSubject(data);
          reset({ name: data.name, code: data.code });
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, subjectId, reset]);

  const onSubmit = async (data: EditSubjectFormData) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const updated = await updateSubject(subjectId, data);
      if (updated) {
        setSuccess("Subject updated successfully");
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || "Failed to update subject");
    } finally {
      setLoading(false);
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
              Edit Subject
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

        {loading && !subject ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#6BE8EF]" />
            <p className="text-[#BFCDEF] text-xs font-bold uppercase tracking-widest opacity-60">
              Fetching Data...
            </p>
          </div>
        ) : (
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
                <Edit3
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
                  className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] transition-all"
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
                Subject Code
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
                  className="w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#6BE8EF] transition-all"
                  placeholder="e.g. MATH101"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Meta Info Badge */}
            {subject?.createdBy && (
              <div
                style={{ backgroundColor: "#1c376e55" }}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#1c376e]"
              >
                <div className="p-2 rounded-lg bg-[#03102b]">
                  <User size={14} className="text-[#6BE8EF]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#BFCDEF] opacity-50 uppercase font-black">
                    Managed By
                  </span>
                  <span className="text-xs text-[#BFCDEF] font-bold">
                    {subject.createdBy.name}{" "}
                    <span className="opacity-40 italic font-normal">
                      ({subject.createdBy.role})
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Feedback */}
            {error && (
              <p className="text-[#E74C3C] text-[10px] font-bold uppercase tracking-wider bg-[#E74C3C]/10 p-3 rounded-lg border border-[#E74C3C]/20">
                {error}
              </p>
            )}
            {success && (
              <p className="text-[#6BE8EF] text-[10px] font-bold uppercase tracking-wider bg-[#6BE8EF]/10 p-3 rounded-lg border border-[#6BE8EF]/20">
                {success}
              </p>
            )}

            {/* Buttons */}
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
                {loading ? "Saving..." : "Update Subject"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
