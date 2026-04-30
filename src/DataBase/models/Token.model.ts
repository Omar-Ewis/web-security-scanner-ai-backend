import { HydratedDocument, model, Schema, Types } from "mongoose";
export interface IToken {
  jti:string;
  expiresIn:number;
  userId:Types.ObjectId
}
const tokenSchema = new Schema<IToken>({
  jti:{
    type:String,
    required:true,
    unique:true
  },
  expiresIn: {
    type: Number,
    required: true,
    index: { expires: 0 }  // TTL
  },
  userId:{
    type:Schema.Types.ObjectId,
    ref:"User",
    required:true
  }
},
{
  timestamps:true
});

export const TokenModel = model<IToken>('Token',tokenSchema);
export type HTokenDocument = HydratedDocument<IToken>;