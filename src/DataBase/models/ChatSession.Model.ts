import {Model, Schema , Types, model, models} from "mongoose";

export interface IChatSession {
  userId: Types.ObjectId;
  title: string;
  lastMessage?: string;
}

const chatSessionSchema = new Schema<IChatSession>({
  userId:{
    type:Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  title:{
    type:String,
    required:true,
    default:'New Chat',
    trim:true
  },
  lastMessage:{
    type:String,
    default:'',
    trim:true
  }
},{
  timestamps:true,
});
export const ChatSessionModel: Model<IChatSession> =
  (models.ChatSession as Model<IChatSession>) ||
  model<IChatSession>("ChatSession", chatSessionSchema);