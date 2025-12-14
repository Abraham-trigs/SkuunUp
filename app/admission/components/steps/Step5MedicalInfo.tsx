// app/admission/components/steps/StepMedicalInfo.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import LabeledInput from "../LabeledInput.tsx";

export default function StepMedicalInfo() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <LabeledInput
        {...register("medicalSummary")}
        label="Medical Summary"
        error={errors.medicalSummary?.message as string}
      />
      <LabeledInput
        {...register("bloodType")}
        label="Blood Type"
        error={errors.bloodType?.message as string}
      />
      <LabeledInput
        {...register("specialDisability")}
        label="Special Disability"
        error={errors.specialDisability?.message as string}
      />
    </>
  );
}
