// app/admission/steps/schemas/stepValidators.ts
import { Step1Schema } from "./step1Schema.ts";
import { Step2Schema } from "./step2Schema.ts";
import { Step3Schema } from "./step3Schema.ts";
import { Step4Schema } from "./step4Schema.ts";
import { Step5Schema } from "./step5Schema.ts";
import { Step6Schema } from "./step6Schema.ts";
import { Step7Schema } from "./step7Schema.ts";

export const stepSchemas: Record<number, any> = {
  1: Step1Schema,
  2: Step2Schema,
  3: Step3Schema,
  4: Step4Schema,
  5: Step5Schema,
  6: Step6Schema,
  7: Step7Schema,
};

export function validateStep(stepNumber: number, formData: any) {
  const schema = stepSchemas[stepNumber];
  if (!schema) return true; // no validation if schema missing

  try {
    schema.parse(formData);
    return { valid: true, errors: [] };
  } catch (err: any) {
    if (err.errors) {
      const messages = err.errors.map((e: any) => e.message);
      return { valid: false, errors: messages };
    }
    return { valid: false, errors: [err.message || "Validation failed"] };
  }
}
