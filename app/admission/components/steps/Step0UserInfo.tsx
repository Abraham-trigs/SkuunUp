// app/admission/components/steps/StepUserInfo.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import LabeledInput from "../LabeledInput.tsx";

export default function StepUserInfo() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      <LabeledInput
        {...register("surname")}
        label="Surname"
        error={errors.surname?.message as string}
      />
      <LabeledInput
        {...register("firstName")}
        label="First Name"
        error={errors.firstName?.message as string}
      />
      <LabeledInput
        {...register("otherNames")}
        label="Other Names"
        error={errors.otherNames?.message as string}
      />
      <LabeledInput
        {...register("email")}
        type="email"
        label="Email"
        error={errors.email?.message as string}
      />
      <LabeledInput
        {...register("password")}
        type="password"
        label="Password"
        error={errors.password?.message as string}
      />
    </>
  );
}
