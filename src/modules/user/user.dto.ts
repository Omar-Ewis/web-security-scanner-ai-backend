import z from "zod";
import { dataLeakSchema, emailCheck, logout } from "./user.validation";

export type LogoutInputDto = z.infer<typeof logout.body>  
export type DataLeakInputDto = z.infer<typeof dataLeakSchema.body>  
export type checkSingleEmailLeakInputDto = z.infer<typeof emailCheck.body>  