"use client";

import { useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { useModal } from "@/app/dashboard/components/common/useModal";
import { useExamStore, RichExam } from "@/app/store/examsStore";
import ExamsFormModal from "./components/ExamsFormModal";
import ConfirmDeleteExamModal from "./components/ConfirmDeleteExamModal";
import { Pagination } from "@/app/dashboard/components/common/Pagination";

export default function ExamsPage() {
  const {
    exams,
    loading,
    error,
    page,
    search,
    totalPages,
    setPage,
    setSearch,
    fetchExams,
    deleteExam,
  } = useExamStore();

  const formModal = useModal<RichExam>();
  const deleteModal = useModal<RichExam>();

  useEffect(() => {
    fetchExams({ page, search });
  }, [page, search, fetchExams]);

  const onConfirmDelete = async () => {
    if (deleteModal.data?.id) {
      await deleteExam(deleteModal.data.id);
      deleteModal.close();
      fetchExams({ page, search });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Exams 2025</h1>
        <button
          onClick={() => formModal.open()}
          className="bg-blue-600 text-white px-4 py-2 rounded flex gap-2"
        >
          <Plus size={18} /> Add Exam
        </button>
      </header>

      {loading ? (
        <Loader2 className="animate-spin mx-auto mt-10" />
      ) : error ? (
        <p className="text-red-600 text-center mt-10">{error}</p>
      ) : exams.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No exams found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-4 border rounded shadow-sm bg-white"
            >
              <h3 className="font-bold">{exam.subjectName}</h3>
              <div className="text-sm mt-2">
                <p>Date: {new Date(exam.date).toLocaleDateString()}</p>
                <p>
                  Score: {exam.score} / {exam.maxScore}
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => formModal.open(exam)}
                  className="text-sm bg-gray-100 px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteModal.open(exam)}
                  className="text-sm bg-red-50 text-red-600 px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {formModal.isOpen && (
        <ExamsFormModal
          exam={formModal.data ?? undefined}
          studentId="global"
          onClose={() => {
            formModal.close();
            fetchExams({ page, search });
          }}
        />
      )}

      {deleteModal.isOpen && deleteModal.data && (
        <ConfirmDeleteExamModal
          exam={deleteModal.data}
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.close}
          onConfirm={onConfirmDelete}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage(page - 1)}
            onNext={() => setPage(page + 1)}
          />
        </div>
      )}
    </div>
  );
}
