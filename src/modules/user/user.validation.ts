import z from "zod";
import { LogoutEnum } from "../../utils/security/token.security";
import { generalFeild } from "../../middleware/validation.middleware";

export const logout = {
  body:z.strictObject({
    flag:z.enum(LogoutEnum).default(LogoutEnum.only)
  })
}

export const dataLeakSchema = {
  body: z.object({
    emails: z
      .array(z.email())
      .min(1, "At least one email is required")
      .refine((arr) => new Set(arr).size === arr.length, {
        message: "Emails must be unique",
      }),
  }),
};
export const emailCheck = {
  body:z.strictObject({
    email:generalFeild.email
  })
};