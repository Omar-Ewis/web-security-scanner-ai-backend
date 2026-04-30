// export interface ISignupBodyInputDto{
//   username:string;
//   email:string;
//   password:string;
// }

import {z} from 'zod';
import * as validators from './scan.validation';
export type ITargetBodyInputDto = z.infer<typeof validators.targetSchema.body>
export type IScanIdParamsInputDto = z.infer<typeof validators.scanIdSchema.params>
