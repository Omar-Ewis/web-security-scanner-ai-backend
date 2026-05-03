import { Types } from "mongoose";
import { FCMTokenModel } from '../../DataBase/models/FCMToken.model';

export const saveToken = async ({
  userId,
  token,
}: {
  userId: Types.ObjectId | string;
  token: string;
}) => {
  return await FCMTokenModel.updateOne(
    { token },
    {
      userId,
      token,
      isActive: true,
      lastUsedAt: new Date(),
    },
    { upsert: true }
  );
};

export const getUserTokens = async (userId: Types.ObjectId | string) => {
  return await FCMTokenModel.find({
    userId,
    isActive: true,
  }).distinct("token");
};

export const removeToken = async (token: string) => {
  return await FCMTokenModel.deleteOne({ token });
};

export const deactivateToken = async (token: string) => {
  return await FCMTokenModel.updateOne(
    { token },
    { isActive: false }
  );
};