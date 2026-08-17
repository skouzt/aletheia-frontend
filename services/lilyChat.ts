/**
 * Chat transport for Lily.
 *
 *   POST /api/v1/chat/message   { content } -> { session_id, user_message, reply }
 *   GET  /api/v1/chat/messages?limit&before -> { messages, has_more, next_cursor }
 *
 * Sessions are handled entirely server-side — the client never starts, ends, or even
 * sees one. It sends messages and reads its own thread.
 */

export type ChatRole = 'lily' | 'user';

export type TokenGetter = (opts: { template: string }) => Promise<string | null>;

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Local URI of an attached image, if the message carries one. */
  imageUri?: string;
  /** Pre-formatted for display, e.g. "9:14 AM". */
  time: string;
  /** Raw ISO timestamp, for day grouping and pagination. */
  at?: string;
  /** True while an optimistic bubble is still in flight. */
  pending?: boolean;
  failed?: boolean;
}

interface ApiMessage {
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export type ChatErrorCode = 'auth' | 'no_subscription' | 'unavailable' | 'network';

export class ChatError extends Error {
  code: ChatErrorCode;
  constructor(code: ChatErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ChatError';
  }
}

const BASE = process.env.EXPO_PUBLIC_API_URL;

export function formatTime(d: Date = new Date()): string {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

/**
 * Shown when there's no history yet. Purely client-side — sending is what creates a
 * conversation, so this costs no request and no tokens.
 */
export const OPENING_THREAD: ChatMessage[] = [
  {
    id: 'seed-greeting',
    role: 'lily',
    text: "Hey, I'm here. What's been on your mind today?",
    time: formatTime(),
  },
];

function toMessage(m: ApiMessage): ChatMessage {
  const at = m.created_at;
  const d = new Date(at);
  return {
    id: m.id,
    role: m.role,
    text: m.content,
    time: formatTime(isNaN(d.getTime()) ? new Date() : d),
    at,
  };
}

async function authHeaders(getToken: TokenGetter) {
  const token = await getToken({ template: 'backend-api' });
  if (!token) throw new ChatError('auth', 'Not signed in');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
}

async function raise(res: Response): Promise<never> {
  if (res.status === 401) throw new ChatError('auth', 'Session expired');
  if (res.status === 402) throw new ChatError('no_subscription', 'Subscription required');
  if (res.status === 503) {
    throw new ChatError('unavailable', "Lily couldn't reply just now");
  }
  throw new ChatError('network', `HTTP ${res.status}`);
}

export interface HistoryPage {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
}

export async function fetchHistory(
  getToken: TokenGetter,
  opts: { limit?: number; before?: string } = {},
): Promise<HistoryPage> {
  const params = new URLSearchParams({ limit: String(opts.limit ?? 50) });
  if (opts.before) params.set('before', opts.before);

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/v1/chat/messages?${params}`, {
      headers: await authHeaders(getToken),
    });
  } catch {
    throw new ChatError('network', 'Could not reach Lily');
  }

  if (!res.ok) await raise(res);

  const data: { messages: ApiMessage[]; has_more: boolean; next_cursor: string | null } =
    await res.json();

  return {
    messages: (data.messages ?? []).map(toMessage),
    hasMore: data.has_more ?? false,
    nextCursor: data.next_cursor ?? null,
  };
}

/** End the conversation in progress. The server summarises it in the background. */
export async function closeSession(getToken: TokenGetter): Promise<void> {
  try {
    const res = await fetch(`${BASE}/api/v1/chat/session/close`, {
      method: 'POST',
      headers: await authHeaders(getToken),
    });
    if (!res.ok) await raise(res);
  } catch (e) {
    if (e instanceof ChatError) throw e;
    throw new ChatError('network', 'Could not reach Lily');
  }
}

export interface SendResult {
  sessionId: string;
  userMessage: ChatMessage;
  reply: ChatMessage;
}

export async function sendMessage(
  getToken: TokenGetter,
  content: string,
): Promise<SendResult> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/v1/chat/message`, {
      method: 'POST',
      headers: await authHeaders(getToken),
      body: JSON.stringify({ content }),
    });
  } catch {
    throw new ChatError('network', 'Could not reach Lily');
  }

  if (!res.ok) await raise(res);

  const data: { session_id: string; user_message: ApiMessage; reply: ApiMessage } =
    await res.json();

  return {
    sessionId: data.session_id,
    userMessage: toMessage(data.user_message),
    reply: toMessage(data.reply),
  };
}
