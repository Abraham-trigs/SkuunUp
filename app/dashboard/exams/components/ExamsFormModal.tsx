"use client";

import React, { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { X, Loader2 } from "lucide-react";
import { useExamStore, RichExam } from "@/app/store/examsStore.ts";

interface ExamsFormModalProps {
  exam?: RichExam | null;
  studentId: string;
  onClose: () => void;
}

export default function ExamsFormModal({
  exam,
  studentId,
  onClose,
}: ExamsFormModalProps) {
  const { createExam, updateExam } = useExamStore();
  const [loading, setLoading] = useState(false);

  // Initialize with correct types
  const [formData, setFormData] = useState({
    subjectName: "",
    score: 0,
    maxScore: 100,
    date: new Date().toISOString().split("T")[0], // Ensure string, not array
  });

  useEffect(() => {
    if (exam) {
      setFormData({
        subjectName: exam.subjectName || "",
        score: Number(exam.score) || 0,
        maxScore: Number(exam.maxScore) || 100,
        // Ensure we take index [0] to get YYYY-MM-DD string
        date: exam.date
          ? new Date(exam.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    }
  }, [exam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Construct payload explicitly to satisfy Partial<RichExam>
    const payload: Partial<RichExam> = {
      subjectName: formData.subjectName,
      score: formData.score,
      maxScore: formData.maxScore,
      date: new Date(formData.date), // Convert string back to Date for Prisma compatibility
      studentId: studentId,
    };

    try {
      if (exam?.id) {
        await updateExam(exam.id, payload);
      } else {
        await createExam(payload);
      }
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white p-6 shadow-xl w-full">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold text-black text-center w-full">
              {exam ? "Edit Exam Record" : "Add New Exam Record"}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-black absolute right-6 top-6"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subject Name
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Mathematics"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.subjectName}
                onChange={(e) =>
                  setFormData({ ...formData, subjectName: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Score
                </label>
                <input
                  required
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
                  value={formData.score}
                  onChange={(e) =>
                    setFormData({ ...formData, score: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Max Score
                </label>
                <input
                  required
                  type="number"
                  step="0.1"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
                  value={formData.maxScore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxScore: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date of Exam
              </label>
              <input
                required
                type="date"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-black"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex justify-center items-center gap-2 font-medium transition-all"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {exam ? "Update Details" : "Save Exam"}
            </button>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
