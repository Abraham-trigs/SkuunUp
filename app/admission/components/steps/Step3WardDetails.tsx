// app/admission/components/steps/StepWardDetails.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import LabeledInput from "../LabeledInput";

export default function StepWardDetails() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <LabeledInput
        {...register("profilePicture")}
        label="Profile Picture URL"
        error={errors.profilePicture?.message as string}
      />
      <LabeledInput
        {...register("wardLivesWith")}
        label="Ward Lives With"
        error={errors.wardLivesWith?.message as string}
      />
      <LabeledInput
        {...register("numberOfSiblings", { valueAsNumber: true })}
        type="number"
        label="Number of Siblings"
        error={errors.numberOfSiblings?.message as string}
      />
      <LabeledInput
        {...register("siblingsOlder", { valueAsNumber: true })}
        type="number"
        label="Siblings Older"
        error={errors.siblingsOlder?.message as string}
      />
      <LabeledInput
        {...register("siblingsYounger", { valueAsNumber: true })}
        type="number"
        label="Siblings Younger"
        error={errors.siblingsYounger?.message as string}
      />
    </>
  );
}
