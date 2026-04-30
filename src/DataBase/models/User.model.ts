import { HydratedDocument, Schema,model,models } from "mongoose";
export enum GenderEnum{
  male = 'male',
  female = 'female'
}
export enum RoleEnum{
  user = 'user',
} 
export enum ProviderEnum{
  Google = "Google",
  System = "System"
} 
export interface IUser {
  firstName:string;
  lastName:string;
  slug:string;
  username?:string;
  picture?:string

  email:string;
  confirmEmailOTP?:string;
  confirmEmailOTPExpireAt?:Date,
  confirmEmailOTPAttempts?:number,
  confirmEmailOTPBlockedUntil?:Date | null,
  confirmedAt?:Date;

  password:string;
  resetPasswordOTP?:string
  changeCredentialsTime?:Date

  phone?:string
  address?:string;

  gender:GenderEnum;
  role:RoleEnum;
  provider?:ProviderEnum;

  sessionCreatedAt?:Date,
  createdAt:Date;
  updatedAt?:Date;

}

const userSchema = new Schema<IUser>(
  {
    firstName:{
      type:String,
      required:true,
      minLength:3,
      maxLength:40
    },
    lastName:{
      type:String,
      required:true,
      minLength:3,
      maxLength:40
    },
    slug:String,
    picture:String,
  
    email:{
      type:String,
      required:true,
      unique:true,
    },
    confirmEmailOTP:String,
    confirmEmailOTPExpireAt:Date,
    confirmEmailOTPAttempts:{
      type:Number,
      default:0
    },
    confirmEmailOTPBlockedUntil:Date,
    confirmedAt:Date,
    
    password:{
      type:String,
      required:function():boolean{
          return this.provider === ProviderEnum.System ? true : false; 
        },
    },
    resetPasswordOTP:String,
    changeCredentialsTime:Date,

    phone:String,
    address:String,

    gender:{
      type:String,
      enum:GenderEnum,
      default:GenderEnum.male
    },
    role:{
      type:String,
      enum:RoleEnum,
      default:RoleEnum.user
    },
    provider:{
      type:String,
      enum:ProviderEnum,
      default:ProviderEnum.System
    },
    sessionCreatedAt: Date,
  },
  {
    timestamps:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
  }
);
userSchema.virtual("username").set(function (val:string){
  const [ firstName, lastName ] = val.split(" ") || [];
  this.set({firstName, lastName, slug:val.replaceAll(/\s+/g,"-")});
})
.get(function(){
  return this.firstName + " " +this.lastName;
})


export const UserModel = models.User ||  model<IUser>("User",userSchema);
export type HUserDocument = HydratedDocument<IUser>

