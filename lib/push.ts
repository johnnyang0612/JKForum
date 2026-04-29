/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, prefer-const */
import webpush from "web-push";
import { db } from "./db";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BOLE0nXrSO3S-MV1elsCqMspoUPpetYH7Nwg-bxiE55RJFVvn8lbIXCmbEMwSW-qb8-Gtsfs-pZZkLnPjCuqyA4";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ||
  "mWQMCSIKcttVryHeX9bh9W0V7JSIVUsDxTFQW6KI3PY";
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@jkforum.com";

webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

export type PushPayload = {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
};

/**
 * 發送推播給特定訂閱
 */
export async function sendPushToSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
  payload: PushPayload
) {
  await webpush.sendNotification(
    {
      endpoint,
      keys: { p256dh, auth },
    },
    JSON.stringify(payload)
  );
}

/**
 * 發送給單一用戶（所有裝置）
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subs = await db.pushSubscription.findMany({ where: { userId } });
  return sendBatch(subs, payload);
}

/**
 * 發送給所有訂閱（廣播）
 */
export async function broadcastPush(payload: PushPayload) {
  const subs = await db.pushSubscription.findMany();
  return sendBatch(subs, payload);
}

async function sendBatch(
  subs: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>,
  payload: PushPayload
) {
  let sent = 0,
    failed = 0,
    expired: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await sendPushToSubscription(s.endpoint, s.p256dh, s.auth, payload);
        sent++;
      } catch (e: any) {
        failed++;
        if (e.statusCode === 404 || e.statusCode === 410) {
          // Subscription expired
          expired.push(s.id);
        }
      }
    })
  );
  // 清理過期訂閱
  if (expired.length > 0) {
    await db.pushSubscription.deleteMany({ where: { id: { in: expired } } });
  }
  return { sent, failed, expired: expired.length };
}
