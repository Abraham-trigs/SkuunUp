// app/students/components/AdmissionFormModal.tsx
"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import MultiStepAdmissionForm from "@/app/admission/components/steps/MultiStepAdmissionForm";

export default function AdmissionFormModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={openModal}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add New Student
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          {/* Background Overlay with blur */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 backdrop-blur-none"
            enterTo="opacity-30 backdrop-blur-sm"
            leave="ease-in duration-200"
            leaveFrom="opacity-30 backdrop-blur-sm"
            leaveTo="opacity-0 backdrop-blur-none"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          {/* Modal panel */}
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
                <Dialog.Panel className="relative w-full max-w-4xl bg-white rounded shadow-lg p-6">
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>

                  <MultiStepAdmissionForm onComplete={closeModal} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

/* ------------------------------------------------------------------------
Design reasoning:
- Uses Tailwind backdrop-blur utilities to create a visually appealing blurred background.
- Maintains modal focus and accessibility while reducing visual strain.

Structure:
- Transition.Child wraps overlay with opacity and blur animations.
- Dialog.Panel contains modal content, unchanged from previous logic.

Implementation guidance:
- Adjust `backdrop-blur-sm` to `backdrop-blur-md` or `backdrop-blur-lg` for stronger effect.
- Overlay color uses `bg-black/30` to combine opacity with blur.

Scalability insight:
- Easy to apply same overlay style across other modals for consistent UX.
- Blur effect is GPU-accelerated and performant on modern browsers.
------------------------------------------------------------------------ */
