"use client";

import React, { useEffect, useState } from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { useUserStore } from "@/app/store/useUserStore.ts";
import { validateStep } from "@/app/admission/components/form/schemas/stepValidators.ts";

import Step1CreateUser from "./Step1CreateUser.tsx";
import Step2PersonalDetails from "./Step2PersonalDetails.tsx";
import Step3FamilyMembers from "./Step3FamilyMembers.tsx";
import Step4PreviousSchools from "./Step4PreviousSchools.tsx";
import Step5Medical from "./Step5Medical.tsx";
import Step6ClassAdmission from "./Step6Class.tsx";
import Step7Declaration from "./Step7Declaration.tsx";

const steps = [
  {
    id: 1,
    label: "Create User",
    fields: ["firstName", "surname", "wardEmail", "password"],
  },
  { id: 2, label: "Personal Details", fields: ["dob", "gender", "address"] },
  { id: 3, label: "Family Members", fields: ["fatherName", "motherName"] },
  { id: 4, label: "Previous Schools", fields: ["lastSchool", "yearCompleted"] },
  { id: 5, label: "Medical & Special Needs", fields: ["medicalInfo"] },
  { id: 6, label: "Class & Admission", fields: ["classId"] },
  { id: 7, label: "Declaration & Submit", fields: ["declarationAccepted"] },
];

export default function MultiStepAdmissionForm() {
  const {
    formData,
    loading,
    errors,
    setField,
    updateAdmission,
    fetchClasses,
    submitted,
    setErrors,
  } = useAdmissionStore();
  const { createUser } = useUserStore();
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Check if all fields in current step are filled
  const isStepFilled = () => {
    const step = steps.find((s) => s.id === currentStep);
    if (!step) return false;
    return step.fields.every((field) => {
      const value = formData[field];
      return typeof value === "string"
        ? value.trim() !== ""
        : value !== undefined && value !== null;
    });
  };

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, steps.length));
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleNext = async () => {
    // Step 1: Create user
    if (currentStep === 1) {
      const { valid, errors: stepErrors } = validateStep(1, formData);
      if (!valid) {
        setErrors(stepErrors);
        return;
      }

      try {
        const user = await createUser({
          name: `${formData.firstName} ${formData.surname}`,
          email: formData.wardEmail,
          password: formData.password,
          role: "STUDENT",
        });

        if (!user) {
          // createUser returned false due to error (e.g., email exists)
          setErrors({ createUser: ["Email already in use"] });
          return;
        }

        setField("studentId", user.id);
      } catch (err: any) {
        // Catch unexpected errors
        console.error("createUser unexpected error:", err);
        setErrors({ createUser: [err?.message || "Failed to create user"] });
        return;
      }
    }

    // Validate current step again before sending to backend
    const { valid, errors: stepErrors } = validateStep(currentStep, formData);
    if (!valid) {
      setErrors(stepErrors);
      return;
    }

    // Update backend for intermediate steps
    if (currentStep < steps.length) {
      await updateAdmission(formData, currentStep);
    }

    goNext();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1CreateUser
            formData={formData}
            setField={setField}
            errors={errors}
          />
        );
      case 2:
        return <Step2PersonalDetails formData={formData} setField={setField} />;
      case 3:
        return <Step3FamilyMembers formData={formData} setField={setField} />;
      case 4:
        return <Step4PreviousSchools formData={formData} setField={setField} />;
      case 5:
        return <Step5Medical formData={formData} setField={setField} />;
      case 6:
        return <Step6ClassAdmission formData={formData} setField={setField} />;
      case 7:
        return <Step7Declaration formData={formData} setField={setField} />;
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
        {/* Step Progress */}
        <div className="flex flex-col sm:flex-row justify-between mb-2 sm:mb-4">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`flex-1 text-center border-b-2 py-2 transition-all sm:py-3 ${
                currentStep === s.id
                  ? "border-blue-600 font-semibold text-black"
                  : "border-gray-300 text-gray-500"
              }`}
              aria-current={currentStep === s.id ? "step" : undefined}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Current Step */}
        <div className="w-full">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between flex-wrap gap-2">
          {currentStep > 1 && (
            <button
              onClick={goBack}
              className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 transition"
              aria-label="Go to previous step"
            >
              Back
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                disabled={!isStepFilled() || loading}
                className={`px-4 py-2 rounded transition ${
                  isStepFilled()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading && currentStep === 1 ? "Creating..." : "Next"}
              </button>
            ) : (
              <button
                onClick={async () => await updateAdmission(formData)}
                disabled={loading || submitted}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                {loading ? "Submitting..." : submitted ? "Submitted" : "Submit"}
              </button>
            )}
          </div>
        </div>

        {/* Errors */}
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
