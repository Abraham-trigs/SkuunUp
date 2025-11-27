// app/admission/steps/schemas/step6Schema.ts
import { z } from "zod";

export const Step6Schema = z.object({
  classId: z.string().nonempty({ message: "Class selection is required" }),
});
