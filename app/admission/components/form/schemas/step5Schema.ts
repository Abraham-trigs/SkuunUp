// app/admission/steps/schemas/step5Schema.ts
import { z } from "zod";

export const Step5Schema = z.object({
  medicalSummary: z.string().optional(),
  bloodType: z.string().optional(),
  specialDisability: z.string().optional(),
});
