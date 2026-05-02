// export interface ISignupBodyInputDto{
//   username:string;
//   email:string;
//   password:string;
// }

import {z} from 'zod';
import * as validators from './auth.validation';
export type ISignupBodyInputDto = z.infer<typeof validators.signup.body>
export type IConfirmEmailBodyInputDto = z.infer<typeof validators.confirmEmail.body>
export type IResendConfirmEmailBodyInputDto = z.infer<typeof validators.resendConfirmEmail.body>
export type ILoginBodyInputDto = z.infer<typeof validators.login.body>
export type IGmail = z.infer<typeof validators.signupWithGmail.body>
export type ISendForgotOTPCode = z.infer<typeof validators.sendForgotOTPCode.body>
export type IVerifyForgotOTPCode = z.infer<typeof validators.verifyForgotOTPCode.body>
export type IResetForgotPassword = z.infer<typeof validators.resetForgotPassword.body>