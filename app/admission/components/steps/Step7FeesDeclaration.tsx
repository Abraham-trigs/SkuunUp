// app/admission/components/steps/StepFeesDeclaration.tsx
"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import LabeledInput from "../LabeledInput.tsx";
import { useClassesStore } from "@/app/store/useClassesStore.ts";

export default function StepFeesDeclaration() {
  const { register, watch, setValue } = useFormContext();
  const { classes } = useClassesStore();
  const MAX_CLASS_SIZE = 30;

  const selectedClassId = watch("classId");
  const selectedClass = classes.find((cls) => cls.id === selectedClassId);

  return (
    <>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register("feesAcknowledged")}
          className="checkbox"
        />{" "}
        Fees Acknowledged
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          {...register("declarationSigned")}
          className="checkbox"
        />{" "}
        Declaration Signed
      </label>
      <LabeledInput {...register("signature")} label="Signature" />

      <div className="flex flex-col w-full mb-4 mt-4">
        <label className="mb-1 text-gray-700 font-medium">Select Class</label>
        <select
          {...register("classId")}
          onChange={(e) => {
            setValue("classId", e.target.value);
            setValue("gradeId", "");
          }}
          className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Class</option>
          {classes.map((cls) => (
            <option
              key={cls.id}
              value={cls.id}
              disabled={cls.studentCount >= MAX_CLASS_SIZE}
            >
              {cls.name} {cls.studentCount >= MAX_CLASS_SIZE ? "(Full)" : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && selectedClass.grades && (
        <div className="flex flex-col w-full mb-4">
          <label className="mb-1 text-gray-700 font-medium">Select Grade</label>
          <select
            {...register("gradeId")}
            className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Grade</option>
            {selectedClass.grades.map((grade) => (
              <option
                key={grade.id}
                value={grade.id}
                disabled={grade.studentCount >= MAX_CLASS_SIZE}
              >
                {grade.name}{" "}
                {grade.studentCount >= MAX_CLASS_SIZE ? "(Full)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
