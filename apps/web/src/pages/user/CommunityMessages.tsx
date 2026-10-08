import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, CheckCheck, MessageCircle, Send, ShieldCheck, Users } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Loader } from "../../components/ui/Loader";
import { PageHeader } from "../../components/layout/PageHeader";
import { SeoHead } from "../../components/common/SeoHead";
import { CommunitySubnav } from "../../components/community/CommunitySubnav";
import { communityService, type CommunityConversationDetail } from "../../services/community.service";
import { useAuthStore } from "../../stores/authStore";

const keys = {
  conversations: ["community-message-conversations"] as const,
  connections: ["community-accepted-connections"] as const,
  thread: (peerId: string) => ["community-message-thread", peerId] as const,
};

function isPageFocused() {
  return document.visibilityState === "visible" && document.hasFocus();
}

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

function formatListDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? formatTime(value)
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export function CommunityMessages() {
  const { userId } = useParams<{ userId?: string }>();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const client = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const markedReadRef = useRef("");

  const connections = useQuery({
    queryKey: keys.connections,
    queryFn: communityService.acceptedConnections,
    staleTime: 30_000,
  });
  const conversations = useQuery({
    queryKey: keys.conversations,
    queryFn: communityService.messageConversations,
    staleTime: 15_000,
    refetchInterval: () => (isPageFocused() ? 30_000 : false),
    refetchIntervalInBackground: false,
  });
  const isAcceptedConnection = !!userId && !!connections.data?.some((connection) => connection.person.id === userId);
  const thread = useQuery({
    queryKey: keys.thread(userId ?? ""),
    queryFn: () => communityService.messages(userId!),
    enabled: !!userId && isAcceptedConnection,
    staleTime: 0,
    refetchInterval: () => (isPageFocused() ? 5_000 : false),
    refetchIntervalInBackground: false,
  });

  const send = useMutation({
    mutationFn: (body: string) => communityService.sendMessage(userId!, body),
    onSuccess: async (message) => {
      client.setQueryData<CommunityConversationDetail>(keys.thread(userId!), (current) =>
        current && !current.messages.some((item) => item.id === message.id)
          ? { ...current, messages: [...current.messages, message] }
          : current,
      );
      setDraft("");
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.thread(userId!) }),
        client.invalidateQueries({ queryKey: keys.conversations }),
      ]);
    },
  });
  const markRead = useMutation({
    mutationFn: (peerId: string) => communityService.markMessagesRead(peerId),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.thread(userId!) }),
        client.invalidateQueries({ queryKey: keys.conversations }),
      ]);
    },
  });

  const inboundUnread = useMemo(
    () => thread.data?.messages.filter((message) => message.recipientId === currentUserId && !message.readAt) ?? [],
    [thread.data?.messages, currentUserId],
  );

  useEffect(() => {
    if (!userId || !isAcceptedConnection || !inboundUnread.length || markRead.isPending) return;
    const signature = `${userId}:${inboundUnread.map((message) => message.id).sort().join(",")}`;
    if (markedReadRef.current === signature) return;
    markedReadRef.current = signature;
    markRead.mutate(userId);
  }, [userId, isAcceptedConnection, inboundUnread, markRead.isPending]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.data?.messages.length, userId]);

  useEffect(() => {
    setDraft("");
    markedReadRef.current = "";
  }, [userId]);

  const activePerson = thread.data?.person ?? conversations.data?.find((item) => item.person.id === userId)?.person;
  const onSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (body && userId && isAcceptedConnection && !send.isPending) send.mutate(body);
  };

  return (
    <div className="scout-social-shell scout-community-page">
      <SeoHead title="Messages" />
      <PageHeader
        title="Messages"
        description="Private conversations with your accepted Scout connections."
        actions={
          <Badge tone="primary">
            <ShieldCheck aria-hidden className="mr-1 h-3.5 w-3.5" />Connections only
          </Badge>
        }
      />
      <CommunitySubnav />

      <Card padding="none" className="overflow-hidden">
        <div className="grid min-h-[min(680px,calc(100dvh-260px))] md:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]">
          <aside className={`${userId ? "hidden md:flex" : "flex"} min-h-0 flex-col border-b border-neutral-200 md:border-b-0 md:border-r`}>
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 sm:px-5">
              <div>
                <h2 className="font-semibold text-neutral-900">Your conversations</h2>
                <p className="mt-0.5 text-xs text-neutral-500">Accepted connections only</p>
              </div>
              <Link
                to="/community/connections"
                aria-label="View accepted connections"
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-primary-700"
              >
                <Users aria-hidden className="h-4 w-4" />
              </Link>
            </div>

            {conversations.isLoading ? (
              <div className="p-5"><Loader label="Loading conversations" /></div>
            ) : null}
            {conversations.isError ? (
              <div className="m-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p role="alert" className="text-sm text-red-500">Conversations could not be loaded.</p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void conversations.refetch()}>Try again</Button>
              </div>
            ) : null}
            {!conversations.isLoading && !conversations.isError && conversations.data?.length === 0 ? (
              <div className="m-4 rounded-xl border border-dashed border-neutral-200 p-5 text-center">
                <MessageCircle aria-hidden className="mx-auto h-6 w-6 text-primary-700" />
                <p className="mt-3 text-sm font-semibold text-neutral-900">No conversations yet</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">Message an accepted connection to start a conversation.</p>
                <Link to="/community/connections" className="mt-3 inline-block text-sm font-semibold text-primary-700 hover:underline">
                  Browse connections
                </Link>
              </div>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {conversations.data?.map((conversation) => {
                const selected = conversation.person.id === userId;
                return (
                  <Link
                    key={conversation.person.id}
                    to={`/community/messages/${conversation.person.id}`}
                    className={`flex items-center gap-3 border-b border-neutral-200 px-4 py-3.5 transition-colors hover:bg-neutral-100/70 sm:px-5 ${
                      selected ? "bg-primary-50/70" : ""
                    }`}
                  >
                    <span className="relative shrink-0">
                      <Avatar name={conversation.person.fullName} src={conversation.person.avatarUrl} size="md" />
                      {conversation.unreadCount > 0 ? (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-secondary-500" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-neutral-900">{conversation.person.fullName}</span>
                        {conversation.lastMessage ? <time className="shrink-0 text-[11px] text-neutral-500">{formatListDate(conversation.lastMessage.createdAt)}</time> : null}
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-neutral-500">
                          {conversation.lastMessage?.body ?? conversation.person.profile?.headline ?? "Connected on Scout"}
                        </span>
                        {conversation.unreadCount > 0 ? (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-neutral-200 p-4">
              <Link to="/community/connections" className="flex items-center justify-center gap-2 text-xs font-semibold text-primary-700 hover:underline">
                Manage accepted connections <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>

          <section className={`${userId ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
            {!userId ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-primary-500/20 bg-primary-50 text-primary-700">
                  <MessageCircle aria-hidden className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-neutral-900">Make room for a good conversation</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                  Choose a connection to pick up where you left off, or reach out about a shared skill or opportunity.
                </p>
                <Link to="/community/connections" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:underline">
                  Find a connection <ArrowUpRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            ) : !connections.isLoading && !connections.isError && !isAcceptedConnection ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
                <ShieldCheck aria-hidden className="h-8 w-8 text-neutral-500" />
                <h2 className="mt-4 font-semibold text-neutral-900">Messaging is for accepted connections</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                  You can start a private conversation after this member accepts your connection request.
                </p>
                <Link to="/community/connections" className="mt-4 text-sm font-semibold text-primary-700 hover:underline">
                  Review your connections
                </Link>
              </div>
            ) : connections.isLoading ? (
              <div className="p-6"><Loader label="Checking connection access" /></div>
            ) : connections.isError ? (
              <div className="m-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p role="alert" className="text-sm text-red-500">Connection access could not be confirmed.</p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void connections.refetch()}>Try again</Button>
              </div>
            ) : thread.isLoading ? (
              <div className="p-6"><Loader label="Loading conversation" /></div>
            ) : thread.isError ? (
              <div className="m-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p role="alert" className="text-sm text-red-500">This conversation could not be loaded.</p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void thread.refetch()}>Try again</Button>
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5">
                  <Link to="/community/messages" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 md:hidden" aria-label="Back to conversations">
                    <ArrowLeft aria-hidden className="h-4 w-4" />
                  </Link>
                  {activePerson ? (
                    <>
                      <Link to={`/community/profile/${activePerson.id}`}>
                        <Avatar name={activePerson.fullName} src={activePerson.avatarUrl} size="md" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link to={`/community/profile/${activePerson.id}`} className="block truncate text-sm font-semibold text-neutral-900 hover:text-primary-700">
                          {activePerson.fullName}
                        </Link>
                        <p className="truncate text-xs text-neutral-500">
                          {activePerson.profile?.headline || activePerson.professionalProfile?.profession || "Accepted Scout connection"}
                        </p>
                      </div>
                      <Badge tone="success"><CheckCheck aria-hidden className="mr-1 h-3.5 w-3.5" />Connected</Badge>
                    </>
                  ) : (
                    <p className="text-sm text-neutral-500">Conversation</p>
                  )}
                </header>

                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6">
                  {thread.data?.messages.length === 0 ? (
                    <div className="m-auto max-w-sm py-10 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-primary-500/20 bg-primary-50 text-primary-700">
                        <MessageCircle aria-hidden className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 font-semibold text-neutral-900">Start with a thoughtful hello</h3>
                      <p className="mt-1 text-sm leading-6 text-neutral-500">
                        Mention what brought you together — a skill, project, or opportunity you both care about.
                      </p>
                    </div>
                  ) : (
                    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
                      {thread.data?.messages.map((message) => {
                        const own = message.senderId === currentUserId;
                        return (
                          <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[86%] sm:max-w-[72%] ${own ? "items-end" : "items-start"} flex flex-col`}>
                              <div className={`rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                                own
                                  ? "rounded-br-md bg-primary-600 text-white"
                                  : "rounded-bl-md border border-neutral-200 bg-neutral-50 text-neutral-800"
                              }`}>
                                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                              </div>
                              <time className="mt-1 px-1 text-[10px] text-neutral-500">{formatTime(message.createdAt)}</time>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                <form onSubmit={onSend} className="border-t border-neutral-200 p-3 sm:p-4">
                  <div className="mx-auto flex max-w-3xl items-end gap-2">
                    <label className="sr-only" htmlFor="community-message">Write a message</label>
                    <textarea
                      id="community-message"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      maxLength={4000}
                      rows={1}
                      placeholder={`Message ${activePerson?.fullName ?? "your connection"}…`}
                      className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-neutral-200 px-3.5 py-3 text-sm leading-5 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15"
                      disabled={send.isPending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      aria-label="Send message"
                      disabled={!draft.trim() || send.isPending}
                      loading={send.isPending}
                      leftIcon={<Send className="h-4 w-4" />}
                    />
                  </div>
                  <p className="mx-auto mt-2 flex max-w-3xl items-center justify-between gap-3 px-1 text-[10px] text-neutral-500">
                    <span>Private message · Enter to send · Shift + Enter for a new line</span>
                    <span>{draft.length}/4000</span>
                  </p>
                  {send.isError ? (
                    <p role="alert" className="mx-auto mt-2 max-w-3xl px-1 text-xs text-red-500">
                      Your message was not sent. Check your connection and try again.
                    </p>
                  ) : null}
                  {markRead.isError ? (
                    <p role="status" className="mx-auto mt-2 max-w-3xl px-1 text-xs text-neutral-500">
                      Read status could not be updated yet.
                    </p>
                  ) : null}
                </form>
              </>
            )}
          </section>
        </div>
      </Card>
    </div>
  );
}
