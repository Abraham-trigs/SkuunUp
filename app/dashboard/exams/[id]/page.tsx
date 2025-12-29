"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Plus, Search, Calendar } from "lucide-react";
import ExamsFormModal from "../components/ExamsFormModal.tsx";
import ConfirmDeleteExamModal from "../components/ConfirmDeleteExamModal.tsx";
import { useExamStore, RichExam } from "@/app/store/examsStore.ts";

export default function StudentExamsPage() {
  const { id: studentId } = useParams();

  const {
    exams,
    total,
    loading,
    error,
    page,
    perPage,
    search,
    fetchExams,
    setPage,
    setSearch,
    deleteExam,
  } = useExamStore();

  // Use the RichExam type for the selected exam state
  const [selectedExam, setSelectedExam] = useState<RichExam | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    fetchExams({ studentId: studentId as string });
  }, [studentId, fetchExams]);

  const handleDelete = async (examId: string) => {
    await deleteExam(examId);
    setIsDeleteOpen(false);
    fetchExams({ studentId: studentId as string, page });
  };

  const handleSearchChange = (value: string) => {
    if (setSearch) setSearch(value);
    if (setPage) setPage(1);
    fetchExams({ studentId: studentId as string, search: value, page: 1 });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Exams</h1>
          <p className="text-sm text-gray-500">
            View and manage examination records
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedExam(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Exam Record
        </button>
      </header>

      {/* Filter Bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search by subject name..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-96 text-black focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Data Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin w-12 h-12 text-blue-600 mb-2" />
          <p className="text-gray-500 animate-pulse">Loading records...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500">No exams recorded for this student</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white p-5 border border-gray-200 shadow-sm rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-blue-300 transition-colors"
            >
              <div className="space-y-1">
                {/* FIX: Use subjectName to match updated RichExam type */}
                <h3 className="font-bold text-lg text-gray-900">
                  {exam.subjectName || "Unknown Subject"}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(exam.date).toLocaleDateString()}
                  </span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    Score: {exam.score} / {exam.maxScore}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 sm:self-center">
                <button
                  onClick={() => {
                    setSelectedExam(exam);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedExam(exam);
                    setIsDeleteOpen(true);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {exams.length > 0 && (
        <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-100 text-sm">
          <p className="text-gray-500">
            Showing page{" "}
            <span className="font-semibold text-gray-900">{page}</span> of{" "}
            <span className="font-semibold text-gray-900">
              {Math.ceil(total / perPage)}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => {
                if (setPage) setPage(page - 1);
                fetchExams({ studentId: studentId as string, page: page - 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all font-medium text-gray-700"
            >
              Previous
            </button>
            <button
              disabled={page * perPage >= total}
              onClick={() => {
                if (setPage) setPage(page + 1);
                fetchExams({ studentId: studentId as string, page: page + 1 });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all font-medium text-gray-700"
            >
              Next
            </button>
          </div>
        </footer>
      )}

      {/* Modals */}
      {isModalOpen && (
        <ExamsFormModal
          exam={selectedExam}
          studentId={studentId as string}
          onClose={() => {
            setSelectedExam(null);
            setIsModalOpen(false);
            fetchExams({ studentId: studentId as string, page });
          }}
        />
      )}

      {isDeleteOpen && selectedExam && (
        <ConfirmDeleteExamModal
          exam={selectedExam}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={() => handleDelete(selectedExam.id)}
        />
      )}
    </div>
  );
}
