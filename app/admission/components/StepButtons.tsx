// app/admission/component/AdmissionButton.tsx
// Purpose: Reusable multi-step Admission button with debounce to prevent rapid multiple clicks.

"use client";

import React, { useRef } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";

interface AdmissionButtonProps {
  type: "next" | "back";
  currentStep?: number;
  maxSteps?: number;
  onBack?: () => void;
  label?: string;
}

export default function AdmissionButton({
  type,
  currentStep = 0,
  maxSteps = 1,
  onBack,
  label,
}: AdmissionButtonProps) {
  const { loading, completeStep, userCreated } = useAdmissionStore();

  // Ref to track debounce state
  const isDebounced = useRef(false);

  /**
   * Handles advancing to the next step with debounce
   */
  const handleNext = async () => {
    if (loading || isDebounced.current) return;

    // Set debounce lock
    isDebounced.current = true;
    setTimeout(() => (isDebounced.current = false), 500); // 500ms debounce

    if (!userCreated && currentStep === 0) {
      const success = await completeStep(0);
      if (!success) return;
    } else {
      const success = await completeStep(currentStep);
      if (!success) return;
    }
  };

  const handleBack = () => {
    if (onBack) return onBack();
  };

  if (type === "back") {
    return (
      <button
        type="button"
        onClick={handleBack}
        disabled={loading || currentStep === 0}
        className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition disabled:opacity-50"
      >
        {label || "Back"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleNext}
      disabled={loading}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition disabled:opacity-50 ml-auto"
    >
      {label || (currentStep === maxSteps - 1 ? "Submit" : "Next")}
    </button>
  );
}

/*
Design reasoning:
- Prevents accidental multiple submissions by adding a 500ms debounce on clicks.
- Ensures step completion logic is called only once per intended click, improving UX and preventing API/store conflicts.
- Keeps Back button immediate as rapid back clicks are less critical.

Structure:
- AdmissionButton (default export)
- Internal functions: handleNext (with debounce), handleBack

Implementation guidance:
- Drop directly in any multi-step Admission form.
- Debounce delay can be adjusted via the setTimeout duration.
- No change required in useAdmissionStore logic.

Scalability insight:
- Debounce logic can be converted to a reusable hook for all buttons with async handlers in the app.
- Delay duration can be dynamically passed as a prop for finer control per button type.
*/
