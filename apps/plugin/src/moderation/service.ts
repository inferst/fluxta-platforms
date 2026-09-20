import { explainTwitchError } from "../twitch/errors";

import type { ModerationApi, ModerationTarget } from "./api";

const NO_BROADCASTER = "Connect the broadcaster account to moderate the channel.";

/**
 * Bans, times out, unbans, untimes-out a viewer, and sends a Shoutout to
 * another channel.
 *
 * Holds no state of its own: every write starts from a login, not an id, so
 * every write starts with the same lookup. There is nothing to cache — a
 * login is looked up once per Action run, not kept around to go stale.
 */
export class ModerationService {
  constructor(
    private readonly channelId: () => string | undefined,
    private readonly api: ModerationApi,
  ) {}

  /** Bans a viewer from the Channel outright. */
  async ban(login: string, reason?: string): Promise<void> {
    const target = await this.resolve(login);
    if (!target) return;

    try {
      await this.api.banUser(target.channelId, { user: target.user.id, reason });
      console.log(`Banned "${target.user.displayName}"`);
    } catch (error) {
      console.error(`"${target.user.displayName}" was not banned: ${explainTwitchError(error)}`);
    }
  }

  /** Times a viewer out of the Channel for a limited duration. */
  async timeout(login: string, durationSeconds: number, reason?: string): Promise<void> {
    const target = await this.resolve(login);
    if (!target) return;

    try {
      await this.api.banUser(target.channelId, {
        user: target.user.id,
        duration: durationSeconds,
        reason,
      });
      console.log(`Timed out "${target.user.displayName}" for ${durationSeconds}s`);
    } catch (error) {
      console.error(
        `"${target.user.displayName}" was not timed out: ${explainTwitchError(error)}`,
      );
    }
  }

  /** Lifts a Ban or a Timeout on a viewer — Twitch treats both the same way. */
  async unban(login: string): Promise<void> {
    const target = await this.resolve(login);
    if (!target) return;

    try {
      await this.api.unbanUser(target.channelId, target.user.id);
      console.log(`Unbanned "${target.user.displayName}"`);
    } catch (error) {
      console.error(
        `"${target.user.displayName}" was not unbanned: ${explainTwitchError(error)}`,
      );
    }
  }

  /** Shouts another channel out from the Channel. */
  async shoutout(login: string): Promise<void> {
    const target = await this.resolve(login);
    if (!target) return;

    try {
      await this.api.shoutoutUser(target.channelId, target.user.id);
      console.log(`Shouted out "${target.user.displayName}"`);
    } catch (error) {
      console.error(
        `"${target.user.displayName}" was not shouted out: ${explainTwitchError(error)}`,
      );
    }
  }

  /** The Channel and the resolved Twitch user a write may act on, or nothing when either is missing. */
  private async resolve(
    login: string,
  ): Promise<{ channelId: string; user: ModerationTarget } | undefined> {
    const channelId = this.channelId();

    if (!channelId) {
      console.error(NO_BROADCASTER);
      return undefined;
    }

    try {
      const user = await this.api.getUserByName(login);

      if (!user) {
        console.error(`No Twitch user is named "${login}"`);
        return undefined;
      }

      return { channelId, user };
    } catch (error) {
      console.error(`Could not look up the Twitch user "${login}": ${explainTwitchError(error)}`);
      return undefined;
    }
  }
}
