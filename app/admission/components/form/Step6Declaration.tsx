"use client";

import React from "react";
import { useAdmissionStore } from "@/app/store/admissionStore.ts";
import { Step7Schema } from "./schemas/step7Schema.ts";

// Required fields for Step 7
export const Step7Fields = ["feesAcknowledged", "declarationSigned"];

export default function Step6Declaration() {
  const { formData, setField, errors, setErrors, updateAdmission, loading } =
    useAdmissionStore();

  const getError = (field: string) =>
    errors.updateAdmission?.filter((e) =>
      e.toLowerCase().includes(field.toLowerCase())
    );

  const handleChange = async (
    field: "feesAcknowledged" | "declarationSigned",
    value: boolean
  ) => {
    setField(field, value);

    try {
      Step7Schema.parse({ ...formData, [field]: value });
      setErrors({});
      await updateAdmission({ [field]: value }, 7);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        formattedErrors.updateAdmission = err.errors.map((e) => e.message);
        setErrors(formattedErrors);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[var(--ford-primary)]">
        Step 6: Declaration & Submission
      </h2>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="feesAcknowledged"
          checked={formData.feesAcknowledged || false}
          onChange={(e) => handleChange("feesAcknowledged", e.target.checked)}
          disabled={loading}
          aria-invalid={!!getError("feesAcknowledged")?.length}
          aria-describedby={
            getError("feesAcknowledged")?.length
              ? "feesAcknowledged-error"
              : undefined
          }
        />
        <label htmlFor="feesAcknowledged">Fees Acknowledged</label>
      </div>
      {getError("feesAcknowledged")?.length > 0 && (
        <p id="feesAcknowledged-error" className="text-red-600 text-sm">
          {getError("feesAcknowledged")?.join(", ")}
        </p>
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="declarationSigned"
          checked={formData.declarationSigned || false}
          onChange={(e) => handleChange("declarationSigned", e.target.checked)}
          disabled={loading}
          aria-invalid={!!getError("declarationSigned")?.length}
          aria-describedby={
            getError("declarationSigned")?.length
              ? "declarationSigned-error"
              : undefined
          }
        />
        <label htmlFor="declarationSigned">Declaration Signed</label>
      </div>
      {getError("declarationSigned")?.length > 0 && (
        <p id="declarationSigned-error" className="text-red-600 text-sm">
          {getError("declarationSigned")?.join(", ")}
        </p>
      )}
    </div>
  );
}
