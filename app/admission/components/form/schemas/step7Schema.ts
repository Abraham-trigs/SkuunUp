// app/admission/steps/schemas/step7Schema.ts
import { z } from "zod";

export const Step7Schema = z.object({
  feesAcknowledged: z.literal(true, { 
    errorMap: () => ({ message: "You must acknowledge the fees" }) 
  }),
  declarationSigned: z.literal(true, { 
    errorMap: () => ({ message: "You must sign the declaration" }) 
  }),
});
