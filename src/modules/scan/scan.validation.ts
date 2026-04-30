import mongoose from "mongoose";
import { z } from "zod";

export const targetSchema = {
  body: z.strictObject({
    target: z
      .string()
      .trim()
      .min(1, "Target is required")
      .superRefine((val, ctx) => {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(val);
        } catch {
          ctx.addIssue({
            code: "custom",
            message: "Invalid URL format",
          });
          return;
        }

        if (
          parsedUrl.protocol !== "http:" &&
          parsedUrl.protocol !== "https:"
        ) {
          ctx.addIssue({
            code: "custom",
            message: "URL must start with http:// or https://",
          });
        }

        if (
          parsedUrl.hostname === "localhost" ||
          parsedUrl.hostname === "127.0.0.1"
        ) {
          ctx.addIssue({
            code: "custom",
            message: "Local URLs are not allowed",
          });
        }
      }),
  }),
};

export const scanIdSchema = {
  params: z.strictObject({
    scanId: z
      .string()
      .trim()
      .min(1, "Scan ID is required")
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid Scan ID format",
      }),
  }),
};