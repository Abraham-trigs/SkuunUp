// app/admission/components/steps/StepContactEmergency.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import LabeledInput from "../LabeledInput.tsx";

export default function StepContactEmergency() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <LabeledInput
        {...register("postalAddress")}
        label="Postal Address"
        error={errors.postalAddress?.message as string}
      />
      <LabeledInput
        {...register("residentialAddress")}
        label="Residential Address"
        error={errors.residentialAddress?.message as string}
      />
      <LabeledInput
        {...register("wardMobile")}
        label="Ward Mobile"
        error={errors.wardMobile?.message as string}
      />
      <LabeledInput
        {...register("emergencyContact")}
        label="Emergency Contact"
        error={errors.emergencyContact?.message as string}
      />
      <LabeledInput
        {...register("emergencyMedicalContact")}
        label="Emergency Medical Contact"
        error={errors.emergencyMedicalContact?.message as string}
      />
    </>
  );
}
