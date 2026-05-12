import dotenv from "dotenv";
dotenv.config({ path: "config/.env.development" });
// dotenv.config();

import connection from "../DataBase/connections.db";

const bootstrapWorkers = async () => {
  try {
    await connection();
    console.log("Workers connected to MongoDB");

    await import("./prepare.worker");
    await import("./monitor.worker");
    await import("./report.worker");
    console.log("Workers started");
  } catch (error) {
    console.error("Workers bootstrap failed:", error);
    process.exit(1);
  }
};

bootstrapWorkers();