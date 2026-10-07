import { prisma } from "../../../config/database";

export async function deliverInApp(deliveryId: string): Promise<void> {
  // In-app delivery is immediate: the notification row is already stored.
  // The delivery record simply confirms the notification is visible.
  await prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: { status: "SENT" },
  });
}