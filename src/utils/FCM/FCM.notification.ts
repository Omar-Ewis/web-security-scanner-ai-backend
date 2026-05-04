import admin from "firebase-admin";

export class NotificationService {
  private client: admin.app.App;

  constructor() {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is missing");
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    serviceAccount.private_key = serviceAccount.private_key.replace(
      /\\n/g,
      "\n"
    );

    if (admin.apps.length) {
      this.client = admin.app();
    } else {
      this.client = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }

  async sendNotification({
    token,
    data,
  }: {
    token: string;
    data: { title: string; body: string };
  }) {
    return await this.client.messaging().send({
      token,
      data,
    });
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
      tokens.map((token) => this.sendNotification({ token, data }))
    );

    return results;
  }
}

export const notificationService = new NotificationService();