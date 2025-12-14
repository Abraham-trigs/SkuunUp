// app/admission/components/steps/StepPersonalInfo.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import LabeledInput from "../LabeledInput.tsx";

export default function StepPersonalInfo() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <LabeledInput
        {...register("dateOfBirth")}
        type="date"
        label="Date of Birth"
        error={errors.dateOfBirth?.message as string}
      />
      <LabeledInput
        {...register("nationality")}
        label="Nationality"
        error={errors.nationality?.message as string}
      />
      <div className="flex flex-col w-full mb-4">
        <label className="mb-1 text-gray-700 font-medium">Sex</label>
        <select
          {...register("sex")}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        {errors.sex && (
          <span className="text-red-600 text-xs mt-1">
            {errors.sex.message}
          </span>
        )}
      </div>
    </>
  );
}
