// app/admission/components/steps/StepPreviousFamily.tsx
"use client";

import React from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import LabeledInput from "../LabeledInput.tsx";

export default function StepPreviousFamily() {
  const { control, register } = useFormContext();
  const previousArray = useFieldArray({ control, name: "previousSchools" });
  const familyArray = useFieldArray({ control, name: "familyMembers" });

  return (
    <>
      <h4 className="font-semibold mt-4 mb-2">Previous Schools</h4>
      {previousArray.fields.map((item, idx) => (
        <div
          key={item.id}
          className="flex flex-col gap-2 mb-2 p-2 border rounded"
        >
          <LabeledInput
            {...register(`previousSchools.${idx}.name`)}
            label="School Name"
          />
          <LabeledInput
            {...register(`previousSchools.${idx}.location`)}
            label="Location"
          />
          <LabeledInput
            {...register(`previousSchools.${idx}.startDate`)}
            type="date"
            label="Start Date"
          />
          <LabeledInput
            {...register(`previousSchools.${idx}.endDate`)}
            type="date"
            label="End Date"
          />
        </div>
      ))}

      <h4 className="font-semibold mt-4 mb-2">Family Members</h4>
      {familyArray.fields.map((item, idx) => (
        <div
          key={item.id}
          className="flex flex-col gap-2 mb-2 p-2 border rounded"
        >
          <LabeledInput
            {...register(`familyMembers.${idx}.relation`)}
            label="Relation"
          />
          <LabeledInput
            {...register(`familyMembers.${idx}.name`)}
            label="Name"
          />
          <LabeledInput
            {...register(`familyMembers.${idx}.postalAddress`)}
            label="Postal Address"
          />
          <LabeledInput
            {...register(`familyMembers.${idx}.residentialAddress`)}
            label="Residential Address"
          />
        </div>
      ))}
    </>
  );
}
