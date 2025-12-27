"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, UserPlus } from "lucide-react";
import MultiStepAdmissionForm from "@/app/admission/components/steps/MultiStepAdmissionForm.tsx";

interface AdmissionFormModalProps {
  onStudentAdded?: () => void;
}

export default function AdmissionFormModal({
  onStudentAdded,
}: AdmissionFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);

  const closeModal = () => {
    setIsOpen(false);
    if (onStudentAdded) onStudentAdded();
  };

  return (
    <>
      {/* Trigger Button - Sleek 2025 Style */}
      <button
        onClick={openModal}
        style={{
          backgroundColor: "#6BE8EF",
          color: "#03102b",
        }}
        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-xs tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-[#6BE8EF]/20"
      >
        <UserPlus className="w-4 h-4" />
        Add New Student
      </button>

      {/* Modal with Transition */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          {/* Background Overlay with deep blur */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  style={{ backgroundColor: "#03102b", borderColor: "#1c376e" }}
                  className="relative w-full max-w-4xl rounded-2xl border shadow-2xl p-8 overflow-hidden"
                >
                  {/* Close Button - Cyan Accent */}
                  <button
                    onClick={closeModal}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 transition-colors"
                    style={{ color: "#BFCDEF" }}
                  >
                    <X
                      size={24}
                      className="hover:text-[#6BE8EF] transition-colors"
                    />
                  </button>

                  {/* Header Title */}
                  <div className="mb-8">
                    <h2
                      style={{ color: "#BFCDEF" }}
                      className="text-2xl font-black tracking-tight uppercase"
                    >
                      Student Admission
                    </h2>
                    <div
                      className="h-1 w-12 mt-2 rounded-full"
                      style={{ backgroundColor: "#6BE8EF" }}
                    />
                  </div>

                  {/* Multi-Step Form Container */}
                  <div className="text-white">
                    <MultiStepAdmissionForm onComplete={closeModal} />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
