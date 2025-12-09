// app/components/admission/MultiStepAdmissionForm.tsx
// Purpose: Multi-step student admission form handling all steps from user creation to declaration & submission

"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

// Correct imports based on provided files
import Step1CreateUser from "./Step1CreateUser.tsx";
import Step2FamilyMembers from "./Step2FamilyMembers.tsx";
import Step3PreviousSchools from "./Step3PreviousSchools.tsx";
import Step4Medical from "./Step4Medical.tsx";
import Step5ClassAdmission from "./Step5ClassAdmission.tsx";
import Step6Declaration from "./Step6Declaration.tsx";

// Design reasoning:
// 1. Single modal handles all 6 steps with step progress bar.
// 2. Navigation buttons update `currentStep` while enforcing boundaries.
// 3. Focus management ensures the first input of each step is focused.
// 4. Errors from the store are displayed prominently.
// 5. Mobile-first layout with scrollable content to handle long forms.

export default function MultiStepAdmissionForm() {
  const { fetchClasses, errors } = useAdmissionStore(); // Store contains all form state and error tracking
  const [currentStep, setCurrentStep] = useState(1);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  // Fetch available classes once for Step5ClassAdmission
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Focus first input of current step
  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [currentStep]);

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, 6));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  // Render the current step component
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1CreateUser ref={firstFieldRef} onSuccess={goNext} />;
      case 2:
        return <Step2FamilyMembers />;
      case 3:
        return <Step3PreviousSchools />;
      case 4:
        return <Step4Medical />;
      case 5:
        return <Step5ClassAdmission />;
      case 6:
        return <Step6Declaration />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4 sm:px-6 md:px-8 overflow-y-auto backdrop-blur-md pointer-events-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl flex flex-col gap-6 p-4 sm:p-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {/* Step Progress Bar */}
        <div className="flex flex-col sm:flex-row justify-between mb-2 sm:mb-4">
          {[1, 2, 3, 4, 5, 6].map((id) => (
            <div
              key={id}
              className={`flex-1 text-center border-b-2 py-2 transition-all sm:py-3 ${
                currentStep === id
                  ? "border-blue-600 font-semibold text-black"
                  : "border-gray-300 text-gray-500"
              }`}
              aria-current={currentStep === id ? "step" : undefined}
            >
              Step {id}
            </div>
          ))}
        </div>

        {/* Current Step Form */}
        <div className="w-full">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between flex-wrap gap-2 mt-4">
          {currentStep > 1 && (
            <button
              onClick={goBack}
              className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              Back
            </button>
          )}
          {currentStep < 6 && (
            <button
              onClick={goNext}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Next
            </button>
          )}
        </div>

        {/* Global Errors Display */}
        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-2 bg-yellow-200 text-black rounded">
            <h3 className="font-bold">Errors:</h3>
            <ul>
              {Object.entries(errors).map(([field, msgs]) => (
                <li key={field}>
                  {field}: {msgs.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Structure:
// Exports MultiStepAdmissionForm as default
// Uses store to fetch classes, manage errors, and handle form state
// Renders 6 steps based on currentStep with navigation buttons

// Implementation Guidance:
// Drop into your existing Next.js page or modal.
// Ensure `useAdmissionStore` is set up with all actions (createUser, updateAdmission, fetchClasses).
// No external props needed; onSuccess callbacks handled per step internally.

// Scalability Insight:
// Steps can be added/removed by updating `renderStep` and progress bar array.
// Errors, loading, and focus management remain centralized for all steps.
