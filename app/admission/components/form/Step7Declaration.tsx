"use client";
import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { Step7Schema } from "./schemas/step7Schema.ts";

export default function Step7Declaration() {
  const { formData, setField, errors, setErrors } = useAdmissionStore();

  const validateStep7 = () => {
    try {
      Step7Schema.parse(formData);
      setErrors({});
      return true;
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setErrors({ updateAdmission: err.errors.map((e) => e.message) });
      }
      return false;
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Declaration & Submission
      </h2>

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.feesAcknowledged || false}
          onChange={(e) => setField("feesAcknowledged", e.target.checked)}
        />
        <span>Fees Acknowledged</span>
      </label>
      {errors.updateAdmission?.some((e) => e.includes("feesAcknowledged")) && (
        <p className="text-red-600 text-sm">
          {errors.updateAdmission.find((e) => e.includes("feesAcknowledged"))}
        </p>
      )}

      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={formData.declarationSigned || false}
          onChange={(e) => setField("declarationSigned", e.target.checked)}
        />
        <span>Declaration Signed</span>
      </label>
      {errors.updateAdmission?.some((e) => e.includes("declarationSigned")) && (
        <p className="text-red-600 text-sm">
          {errors.updateAdmission.find((e) => e.includes("declarationSigned"))}
        </p>
      )}
    </div>
  );
}
