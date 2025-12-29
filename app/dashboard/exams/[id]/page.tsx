"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import ExamsFormModal from "../components/ExamsFormModal.tsx";
import ConfirmDeleteExamModal from "../components/ConfirmDeleteExamModal.tsx";
import { useExamStore } from "@/app/store/examsStore.ts";

export default function StudentExamsPage() {
  const { id: studentId } = useParams();

  // FIX: Destructure 'perPage' instead of 'limit' to match your store
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

  const [selectedExam, setSelectedExam] = useState<any>(null);
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Student Exams</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus size={16} /> Add Exam
        </button>
      </header>

      <div className="flex justify-end mb-4">
        <input
          type="text"
          placeholder="Search exams..."
          className="border p-2 rounded w-full md:w-1/2"
          value={search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center mt-10">
          <Loader2 className="animate-spin w-10 h-10 text-gray-400" />
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : exams.length === 0 ? (
        <p className="text-gray-500 italic">
          No exams recorded for this student
        </p>
      ) : (
        <ul className="space-y-3">
          {exams.map((exam) => (
            <li
              key={exam.id}
              className="bg-white p-4 shadow rounded flex justify-between items-center text-black"
            >
              <div>
                <span className="font-medium">{exam.subject}</span>:{" "}
                {exam.score}/{exam.maxScore}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedExam(exam);
                    setIsModalOpen(true);
                  }}
                  className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedExam(exam);
                    setIsDeleteOpen(true);
                  }}
                  className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Pagination Fix: use perPage */}
      {exams.length > 0 && (
        <div className="flex justify-between mt-4 items-center text-sm">
          <button
            disabled={page <= 1}
            onClick={() => {
              if (setPage) setPage(page - 1);
              fetchExams({ studentId: studentId as string, page: page - 1 });
            }}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} / {Math.ceil(total / perPage)}
          </span>
          <button
            disabled={page * perPage >= total}
            onClick={() => {
              if (setPage) setPage(page + 1);
              fetchExams({ studentId: studentId as string, page: page + 1 });
            }}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modals remain the same */}
    </div>
  );
}
