import { Model, Schema, Types, model, models } from "mongoose";

export enum ChatRoleEnum {
  USER = "user",
  ASSISTANT = "assistant",
}

export interface IChatMessage {
  sessionId: Types.ObjectId;
  userId: Types.ObjectId;
  role: ChatRoleEnum;
  content: string;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: Object.values(ChatRoleEnum),
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ChatMessageModel: Model<IChatMessage> =
  (models.ChatMessage as Model<IChatMessage>) ||
  model<IChatMessage>("ChatMessage", chatMessageSchema);