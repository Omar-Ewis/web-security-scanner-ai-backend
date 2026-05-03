import { Schema, model, models, Types, Model } from "mongoose";


export interface IFCMToken {
  userId: Types.ObjectId;
  token: string;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const fcmTokenSchema = new Schema<IFCMToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const FCMTokenModel: Model<IFCMToken> =
  (models.FCMToken as Model<IFCMToken>) ||
  model<IFCMToken>("FCMToken", fcmTokenSchema);