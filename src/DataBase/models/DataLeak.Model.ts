import { Schema, model, models, HydratedDocument, Model } from "mongoose";

export interface IEmail {
  email: string;
}

const EmailSchema = new Schema<IEmail>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

EmailSchema.index({ email: 1 }, { unique: true });

export const EmailModel: Model<IEmail> =
  (models.Email as Model<IEmail>) || model<IEmail>("Email", EmailSchema);

export type HEmailDocument = HydratedDocument<IEmail>;