import { connect } from "mongoose";
import { UserModel } from "./models/User.model";

const connection = async (): Promise<void> => {
  try {
    const result = await connect(process.env.DB_URI as string, {
      serverSelectionTimeoutMS: 30000,
    });

    await UserModel.syncIndexes();

    console.log(result.models);
    console.log("DataBase connected successfully");
  } catch (err) {
    console.log("fail to connect DataBase");
    throw err;
  }
};

export default connection;