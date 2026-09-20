import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { BanUserData, ModerationApi, ModerationTarget } from "./api";
import { ModerationService } from "./service";

const CHANNEL = "channel-1";

/** Twitch, as far as this service can tell. */
class FakeModeration implements ModerationApi {
  users = new Map<string, ModerationTarget>();
  banned: { broadcaster: string; data: BanUserData }[] = [];
  unbanned: { broadcaster: string; user: string }[] = [];
  shoutouts: { from: string; to: string }[] = [];
  /** Thrown by the next write, to stand in for a refusal. */
  refuse?: Error;

  getUserByName(login: string) {
    return Promise.resolve(this.users.get(login) ?? null);
  }

  banUser(broadcaster: string, data: BanUserData) {
    this.refused();
    this.banned.push({ broadcaster, data });
    return Promise.resolve(undefined);
  }

  unbanUser(broadcaster: string, user: string) {
    this.refused();
    this.unbanned.push({ broadcaster, user });
    return Promise.resolve(undefined);
  }

  shoutoutUser(from: string, to: string) {
    this.refused();
    this.shoutouts.push({ from, to });
    return Promise.resolve(undefined);
  }

  private refused(): void {
    if (this.refuse) {
      throw this.refuse;
    }
  }
}

describe("ModerationService", () => {
  let api: FakeModeration;
  let channelId: string | undefined;
  let service: ModerationService;
  let errors: string[];
  let logs: string[];

  beforeEach(() => {
    api = new FakeModeration();
    api.users.set("troll", { id: "42", displayName: "Troll" });
    channelId = CHANNEL;
    service = new ModerationService(() => channelId, api);

    // The log is where an Action reports itself, so it is part of what these
    // tests are checking rather than noise to be hidden.
    errors = [];
    logs = [];
    vi.spyOn(console, "error").mockImplementation((...args) => void errors.push(String(args[0])));
    vi.spyOn(console, "log").mockImplementation((...args) => void logs.push(String(args[0])));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("banning", () => {
    it("resolves the login to a Twitch id before banning", async () => {
      await service.ban("troll", "spamming");

      expect(api.banned).toEqual([
        { broadcaster: CHANNEL, data: { user: "42", reason: "spamming" } },
      ]);
      expect(logs.join("\n")).toContain("Troll");
    });

    it("refuses a login twitch does not know, in the plugin's own words", async () => {
      await service.ban("nobody");

      expect(api.banned).toEqual([]);
      expect(errors.join("\n")).toContain("nobody");
    });

    it("refuses with no broadcaster account, and says which to connect", async () => {
      channelId = undefined;

      await service.ban("troll");

      expect(api.banned).toEqual([]);
      expect(errors.join("\n")).toContain("broadcaster account");
    });

    it("reports what twitch refused, in words the log can show", async () => {
      api.refuse = Object.assign(new Error("nope"), {
        statusCode: 400,
        body: '{"message":"reason is too long"}',
      });

      await service.ban("troll");

      expect(errors.join("\n")).toContain("reason is too long");
    });
  });

  describe("timing out", () => {
    it("carries the duration alongside the resolved id", async () => {
      await service.timeout("troll", 600, "cooling off");

      expect(api.banned).toEqual([
        { broadcaster: CHANNEL, data: { user: "42", duration: 600, reason: "cooling off" } },
      ]);
    });
  });

  describe("unbanning", () => {
    it("resolves the login and lifts the ban or timeout", async () => {
      await service.unban("troll");

      expect(api.unbanned).toEqual([{ broadcaster: CHANNEL, user: "42" }]);
      expect(logs.join("\n")).toContain("Troll");
    });
  });

  describe("shouting out", () => {
    it("resolves the login and sends the shoutout from the channel", async () => {
      await service.shoutout("troll");

      expect(api.shoutouts).toEqual([{ from: CHANNEL, to: "42" }]);
      expect(logs.join("\n")).toContain("Troll");
    });
  });
});
