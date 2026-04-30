import { JwtPayload } from "jsonwebtoken";
import { HUserDocument } from "../../DataBase/models/User.model";

declare module "express-serve-static-core" {
  interface Request {
    user?: HUserDocument;
    decode?: JwtPayload;
  }
}
