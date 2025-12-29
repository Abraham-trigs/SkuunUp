"use client";

import { Dialog } from "@headlessui/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface ConfirmDeleteExamModalProps {
  isOpen: boolean;
  exam: any;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function ConfirmDeleteExamModal({
  isOpen,
  exam,
  onClose,
  onConfirm,
}: ConfirmDeleteExamModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Deletion failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-md">
        <Dialog.Title className="text-lg font-bold mb-4">
          Delete Exam
        </Dialog.Title>
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{exam?.subject}</strong>?
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2 hover:bg-red-700 disabled:opacity-50"
            disabled={loading}
          >
            <Trash2 size={16} />
            {loading ? "Deleting..." : "Delete Exam"}
          </button>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}
