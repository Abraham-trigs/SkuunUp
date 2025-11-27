"use client";

import React from "react";

interface Step1Props {
  formData: {
    firstName?: string;
    surname?: string;
    wardEmail?: string;
    password?: string;
  };
  setField: (field: string, value: string) => void;
  errors: Record<string, string[]>;
  loading?: boolean;
}

export default function Step1CreateUser({
  formData,
  setField,
  errors,
  loading,
}: Step1Props) {
  return (
    <div className="space-y-4" aria-labelledby="step1-title">
      <h2
        id="step1-title"
        className="text-lg font-bold text-[var(--ford-primary)]"
      >
        Step 1: Create User
      </h2>

      <div className="flex flex-col">
        <label
          htmlFor="firstName"
          className="font-medium text-[var(--ford-primary)]"
        >
          First Name
        </label>
        <input
          id="firstName"
          className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="Enter your first name"
          value={formData.firstName || ""}
          onChange={(e) => setField("firstName", e.target.value)}
          aria-label="First Name"
        />
      </div>

      <div className="flex flex-col">
        <label
          htmlFor="surname"
          className="font-medium text-[var(--ford-primary)]"
        >
          Surname
        </label>
        <input
          id="surname"
          className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="Enter your surname"
          value={formData.surname || ""}
          onChange={(e) => setField("surname", e.target.value)}
          aria-label="Surname"
        />
      </div>

      <div className="flex flex-col">
        <label
          htmlFor="wardEmail"
          className="font-medium text-[var(--ford-primary)]"
        >
          Ward Email
        </label>
        <input
          type="email"
          id="wardEmail"
          className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="Enter your email"
          value={formData.wardEmail || ""}
          onChange={(e) => setField("wardEmail", e.target.value)}
          aria-label="Ward Email"
        />
      </div>

      <div className="flex flex-col">
        <label
          htmlFor="password"
          className="font-medium text-[var(--ford-primary)]"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          className="w-full p-2 rounded bg-[var(--background)] text-[var(--ford-primary)]"
          placeholder="Enter a password"
          value={formData.password || ""}
          onChange={(e) => setField("password", e.target.value)}
          aria-label="Password"
        />
      </div>

      {errors.createUser && (
        <div className="text-red-600" role="alert" aria-live="assertive">
          {errors.createUser.join(", ")}
        </div>
      )}
    </div>
  );
}
