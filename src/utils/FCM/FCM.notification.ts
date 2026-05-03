import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";

export class NotificationService {
  private client: admin.app.App;

  constructor() {
    const serviceAccountPath = resolve(
      process.cwd(),
      "config",
      "black-cat-38cs-417c5-firebase-adminsdk-fbsvc-47ff3aa641.json"
    );

    const serviceAccount = JSON.parse(
      readFileSync(serviceAccountPath, "utf-8")
    );

    this.client = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  async sendNotification({
    token,
    data,
  }: {
    token: string;
    data: { title: string; body: string };
  }) {
    const message = {
      token,
      data,
    };

    return await this.client.messaging().send(message);
  }

  async sendNotifications({
    tokens,
    data,
  }: {
    tokens: string[];
    data: { title: string; body: string };
  }) {
    if (!tokens.length) return [];

    const results = await Promise.allSettled(
      tokens.map((token) => {
        return this.sendNotification({ token, data });
      })
    );

    return results;
  }
}

export const notificationService = new NotificationService();