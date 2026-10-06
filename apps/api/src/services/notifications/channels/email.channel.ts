import { env } from "../../../config/env";
import { sendMail } from "../../../config/mail";
import type { Notification } from "@prisma/client";
import { prisma } from "../../../config/database";

export async function deliverEmail(
  deliveryId: string,
  notification: Notification,
): Promise<void> {
  if (!env.SMTP_ENABLED) {
    await prisma.notificationDelivery.update({
      where: { id: deliveryId },
      data: { status: "SKIPPED" },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: notification.userId },
    select: { email: true },
  });
  if (!user) throw new Error("Notification user not found");

  await sendMail({
    to: user.email,
    subject: notification.title,
    html: `<p>${notification.body ?? notification.title}</p>`,
    text: notification.body ?? notification.title,
  });
}