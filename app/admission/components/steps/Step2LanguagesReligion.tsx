// app/admission/components/steps/StepLanguagesReligion.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import LabeledInput from "..//AdmissionButton.tsx";

export default function StepLanguagesReligion() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <LabeledInput
        {...register("languages.0")}
        label="Languages"
        error={errors.languages?.[0]?.message as string}
      />
      <LabeledInput
        {...register("mothersTongue")}
        label="Mother's Tongue"
        error={errors.mothersTongue?.message as string}
      />
      <LabeledInput
        {...register("religion")}
        label="Religion"
        error={errors.religion?.message as string}
      />
      <LabeledInput
        {...register("denomination")}
        label="Denomination"
        error={errors.denomination?.message as string}
      />
      <LabeledInput
        {...register("hometown")}
        label="Hometown"
        error={errors.hometown?.message as string}
      />
      <LabeledInput
        {...register("region")}
        label="Region"
        error={errors.region?.message as string}
      />
    </>
  );
}
