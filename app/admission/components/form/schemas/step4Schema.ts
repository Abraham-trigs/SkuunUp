// app/admission/steps/schemas/step4Schema.ts
import { z } from "zod";

export const Step4Schema = z.object({
  previousSchools: z
    .array(
      z.object({
        name: z.string().nonempty({ message: "School Name is required" }),
        location: z.string().nonempty({ message: "Location is required" }),
        startDate: z.string().nonempty({ message: "Start Date is required" }),
        endDate: z.string().nonempty({ message: "End Date is required" }),
      })
    )
    .optional(), // optional because a student may not have previous schools
});
