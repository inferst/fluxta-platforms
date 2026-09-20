/** What the plugin needs back from a Twitch user lookup. */
export interface ModerationTarget {
  id: string;
  displayName: string;
}

/** What Twitch's Ban User endpoint accepts. Timeout is the same call with a `duration`. */
export interface BanUserData {
  user: string;
  duration?: number;
  reason?: string;
}

/**
 * The parts of twurple's moderation, chat and user APIs this plugin uses to
 * act on a viewer or another channel.
 *
 * Narrowed to an own type, spanning three of twurple's own namespaces, so
 * everything built on it can be exercised without a live `ApiClient`, which
 * only a connected Account can produce.
 */
export interface ModerationApi {
  /** Twitch has no "ban by login" endpoint — every write needs the numeric id first. */
  getUserByName(login: string): Promise<ModerationTarget | null>;
  banUser(broadcaster: string, data: BanUserData): Promise<unknown>;
  /** Lifts a Ban or a Timeout — Twitch does not tell the two apart here. */
  unbanUser(broadcaster: string, user: string): Promise<void>;
  shoutoutUser(from: string, to: string): Promise<void>;
}
