import { prisma } from "../../config/database";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../utils/errors";

const authorSelect = {
  id: true,
  fullName: true,
  avatarUrl: true,
  countryCode: true,
  profile: { select: { username: true, headline: true } },
  professionalProfile: { select: { profession: true, skills: true } },
} as const;

function orderedPair(firstId: string, secondId: string) {
  return firstId < secondId
    ? { userAId: firstId, userBId: secondId }
    : { userAId: secondId, userBId: firstId };
}

async function requireMessagingAccess(viewerId: string, peerId: string) {
  if (viewerId === peerId) throw new BadRequestError("You cannot message yourself");

  const [peer, connection, block] = await Promise.all([
    prisma.user.findFirst({
      where: { id: peerId, status: "ACTIVE" },
      select: authorSelect,
    }),
    prisma.communityConnection.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: viewerId, recipientId: peerId },
          { requesterId: peerId, recipientId: viewerId },
        ],
      },
      select: { id: true },
    }),
    prisma.communityUserAction.findFirst({
      where: {
        kind: "BLOCK",
        OR: [
          { actorId: viewerId, targetId: peerId },
          { actorId: peerId, targetId: viewerId },
        ],
      },
      select: { id: true },
    }),
  ]);

  if (block || !peer) throw new NotFoundError("Conversation not found");
  if (!connection) throw new ForbiddenError("Messaging is available to accepted connections only");
  return peer;
}

export async function listConversations(viewerId: string) {
  const [connections, blocks] = await Promise.all([
    prisma.communityConnection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: viewerId, recipient: { is: { status: "ACTIVE" } } },
          { recipientId: viewerId, requester: { is: { status: "ACTIVE" } } },
        ],
      },
      orderBy: { respondedAt: "desc" },
      take: 200,
      include: {
        requester: { select: authorSelect },
        recipient: { select: authorSelect },
      },
    }),
    prisma.communityUserAction.findMany({
      where: {
        kind: "BLOCK",
        OR: [{ actorId: viewerId }, { targetId: viewerId }],
      },
      select: { actorId: true, targetId: true },
    }),
  ]);

  const blockedIds = new Set(blocks.map((item) => item.actorId === viewerId ? item.targetId : item.actorId));
  const people = new Map<string, { connectedAt: Date; person: (typeof connections)[number]["requester"] }>();
  for (const connection of connections) {
    const person = connection.requesterId === viewerId ? connection.recipient : connection.requester;
    if (blockedIds.has(person.id) || people.has(person.id)) continue;
    people.set(person.id, { connectedAt: connection.respondedAt ?? connection.createdAt, person });
  }

  const peerIds = [...people.keys()];
  if (!peerIds.length) return [];

  const [conversations, unreadCounts] = await Promise.all([
    prisma.communityConversation.findMany({
      where: {
        OR: [
          { userAId: viewerId, userBId: { in: peerIds } },
          { userBId: viewerId, userAId: { in: peerIds } },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, body: true, senderId: true, createdAt: true, attachments: true },
        },
      },
    }),
    prisma.communityMessage.groupBy({
      by: ["senderId"],
      where: { recipientId: viewerId, readAt: null, senderId: { in: peerIds } },
      _count: { _all: true },
    }),
  ]);
  const conversationByPeer = new Map(
    conversations.map((conversation) => [
      conversation.userAId === viewerId ? conversation.userBId : conversation.userAId,
      conversation,
    ]),
  );
  const unreadByPeer = new Map(unreadCounts.map((item) => [item.senderId, item._count._all]));

  return [...people.entries()]
    .map(([peerId, connection]) => {
      const conversation = conversationByPeer.get(peerId);
      const lastMessage = conversation?.messages[0] ?? null;
      return {
        id: conversation?.id ?? null,
        person: connection.person,
        connectedAt: connection.connectedAt,
        lastMessage,
        unreadCount: unreadByPeer.get(peerId) ?? 0,
        lastMessageAt: conversation?.lastMessageAt ?? connection.connectedAt,
      };
    })
    .sort((left, right) => right.lastMessageAt.getTime() - left.lastMessageAt.getTime())
    .map(({ lastMessageAt: _lastMessageAt, ...conversation }) => conversation);
}

export async function getConversation(viewerId: string, peerId: string) {
  const person = await requireMessagingAccess(viewerId, peerId);
  const pair = orderedPair(viewerId, peerId);
  const conversation = await prisma.communityConversation.findUnique({
    where: { userAId_userBId: pair },
    select: { id: true },
  });

  if (!conversation) return { conversationId: null, person, messages: [] };

  const rows = await prisma.communityMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      recipientId: true,
      body: true,
      createdAt: true,
      readAt: true,
      attachments: true,
    },
  });
  return { conversationId: conversation.id, person, messages: rows.reverse() };
}

export async function sendMessage(viewerId: string, peerId: string, body: string, attachmentIds: string[] = []) {
  await requireMessagingAccess(viewerId, peerId);
  const content = body.trim();
  const uniqueIds = [...new Set(attachmentIds)];
  if (content.length > 4000) throw new BadRequestError("Message must be no more than 4000 characters");
  if (!content && uniqueIds.length === 0) throw new BadRequestError("Write a message or attach a file");
  if (uniqueIds.length > 5) throw new BadRequestError("You can attach up to 5 files");
  const media = uniqueIds.length
    ? await prisma.mediaAttachment.findMany({
        where: { id: { in: uniqueIds }, ownerId: viewerId },
        select: { id: true, filename: true, mimeType: true, size: true },
      })
    : [];
  if (media.length !== uniqueIds.length) throw new BadRequestError("Remove files that were not uploaded by you");
  const attachments = media.map((file) => ({
    id: file.id,
    filename: file.filename,
    mimeType: file.mimeType,
    size: file.size,
    url: `/api/v1/media/attachments/${file.id}`,
  }));
  const pair = orderedPair(viewerId, peerId);
  const sentAt = new Date();

  return prisma.$transaction(async (tx) => {
    const conversation = await tx.communityConversation.upsert({
      where: { userAId_userBId: pair },
      create: { ...pair, lastMessageAt: sentAt },
      update: { lastMessageAt: sentAt },
      select: { id: true },
    });
    return tx.communityMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: viewerId,
        recipientId: peerId,
        body: content,
        attachments: attachments as never,
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        recipientId: true,
        body: true,
        createdAt: true,
        readAt: true,
        attachments: true,
      },
    });
  });
}

export async function markMessagesRead(viewerId: string, peerId: string) {
  await requireMessagingAccess(viewerId, peerId);
  const pair = orderedPair(viewerId, peerId);
  const conversation = await prisma.communityConversation.findUnique({
    where: { userAId_userBId: pair },
    select: { id: true },
  });
  if (!conversation) return { updated: 0 };

  const result = await prisma.communityMessage.updateMany({
    where: { conversationId: conversation.id, recipientId: viewerId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}
