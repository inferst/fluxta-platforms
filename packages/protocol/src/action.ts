/**
 * The settings an Action's editor saves and its Action reads back.
 *
 * These travel through the host rather than over the plugin's own channel, but
 * they are still one shape two sides must agree on, so they are defined once
 * here for the same reason the messages are.
 */

/** What an Action does about a Reward being shown to viewers. */
export const ENABLEMENTS = ["unchanged", "enable", "disable", "toggle"] as const;

export type Enablement = (typeof ENABLEMENTS)[number];

export const ENABLEMENT_LABELS: Record<Enablement, string> = {
  unchanged: "Leave as it is",
  enable: "Enable",
  disable: "Disable",
  toggle: "Toggle",
};

/** How a Redemption ends: the viewer got what they paid for, or their points back. */
export const RESOLUTIONS = ["fulfill", "refund"] as const;

export type Resolution = (typeof RESOLUTIONS)[number];

export const RESOLUTION_LABELS: Record<Resolution, string> = {
  fulfill: "Fulfil it",
  refund: "Refund the points",
};

/** Settings of the Update Reward Action. */
export type UpdateRewardSettings = {
  /** Picked from the live list of Rewards, never typed. */
  rewardId?: string;
  enablement?: Enablement;
  /** The new cost, as a template. Empty leaves the cost alone. */
  cost?: string;
};

/** Settings of the Resolve Redemption Action. */
export type ResolveRedemptionSettings = {
  /** Both ids come from the Reward Redeemed event, as template references. */
  rewardId?: string;
  redemptionId?: string;
  resolution?: Resolution;
};

/** Twitch's own caps for a Poll, so the editor can refuse before a round trip. */
export const POLL_TITLE_MAX = 60;
export const POLL_CHOICE_TITLE_MAX = 25;
export const POLL_MIN_CHOICES = 2;
export const POLL_MAX_CHOICES = 5;
export const POLL_DURATION_MIN = 15;
export const POLL_DURATION_MAX = 1800;

/** Settings of the Start Poll Action. */
export type StartPollSettings = {
  /** The poll title, as a template. Twitch's cap is `POLL_TITLE_MAX` characters. */
  title?: string;
  /** The poll's Choices. Twitch requires between `POLL_MIN_CHOICES` and `POLL_MAX_CHOICES`. */
  choices?: string[];
  /** How long the poll runs, in seconds, as a template. */
  duration?: string;
};

// The End Poll Action takes no settings: Twitch allows only one active Poll
// per channel, so there is nothing for its editor to configure.

/** Twitch's own caps for a Prediction, so the editor can refuse before a round trip. */
export const PREDICTION_TITLE_MAX = 45;
export const PREDICTION_OUTCOME_TITLE_MAX = 25;
export const PREDICTION_MIN_OUTCOMES = 2;
export const PREDICTION_MAX_OUTCOMES = 10;
export const PREDICTION_DURATION_MIN = 30;
export const PREDICTION_DURATION_MAX = 1800;

/** Settings of the Start Prediction Action. */
export type StartPredictionSettings = {
  /** The prediction title, as a template. Twitch's cap is `PREDICTION_TITLE_MAX` characters. */
  title?: string;
  /**
   * The prediction's Outcomes. Twitch requires between `PREDICTION_MIN_OUTCOMES` and
   * `PREDICTION_MAX_OUTCOMES`.
   */
  outcomes?: string[];
  /** How long betting stays open, in seconds, as a template. */
  duration?: string;
};

// The Lock Prediction and Cancel Prediction Actions take no settings: Twitch
// allows only one running Prediction per channel, so there is nothing for
// their editors to configure.

/** Settings of the Resolve Prediction Action. */
export type ResolvePredictionSettings = {
  /**
   * The winning Outcome, by its position (`"1"`, `"2"`, …) or its exact title —
   * as a template. Never Twitch's Outcome id: the plugin looks that up itself
   * from the running Prediction.
   */
  outcome?: string;
};

/** Twitch's own cap on why a Ban or a Timeout happened. */
export const MODERATION_REASON_MAX = 500;

/** Twitch's own bounds for a Timeout, in seconds — 14 days at the top. */
export const TIMEOUT_DURATION_MIN = 1;
export const TIMEOUT_DURATION_MAX = 1_209_600;

/** Settings of the Ban Twitch User Action. */
export type BanUserSettings = {
  /** The viewer's login, as a template — typed by hand or referenced from an Event. */
  login?: string;
  /** Why the viewer was banned, as a template. Twitch's cap is `MODERATION_REASON_MAX` characters. */
  reason?: string;
};

/** Settings of the Timeout Twitch User Action. */
export type TimeoutUserSettings = {
  /** The viewer's login, as a template — typed by hand or referenced from an Event. */
  login?: string;
  /**
   * How long the timeout lasts, in seconds, as a template. Twitch's bounds
   * are `TIMEOUT_DURATION_MIN` to `TIMEOUT_DURATION_MAX`.
   */
  duration?: string;
  /** Why the viewer was timed out, as a template. Twitch's cap is `MODERATION_REASON_MAX` characters. */
  reason?: string;
};

/** Settings of the Unban Twitch User Action. */
export type UnbanUserSettings = {
  /** The viewer's login, as a template — typed by hand or referenced from an Event. */
  login?: string;
};

/**
 * Settings of the Untimeout Twitch User Action.
 *
 * Identical to `UnbanUserSettings`: Twitch lifts a Timeout the same way it
 * lifts a Ban, one endpoint for both. Kept as its own name because the two
 * Actions are, even though the request behind them is not.
 */
export type UntimeoutUserSettings = {
  /** The viewer's login, as a template — typed by hand or referenced from an Event. */
  login?: string;
};

/** Settings of the Send Twitch Shoutout Action. */
export type SendShoutoutSettings = {
  /** The channel to shout out, by login, as a template. */
  login?: string;
};

/** Twitch's own cap on how many Tags a channel may carry, and on each Tag's length. */
export const CHANNEL_TAGS_MAX = 10;
export const CHANNEL_TAG_MAX = 25;

/** Settings of the Update Stream Info Action. */
export type UpdateStreamInfoSettings = {
  /** The stream's new title, as a template. Empty leaves the title alone. */
  title?: string;
  /** The new category, by its exact Twitch name, as a template. Empty leaves it alone. */
  category?: string;
  /**
   * The new Tags, comma-separated, as a template. Twitch allows at most
   * `CHANNEL_TAGS_MAX`, each up to `CHANNEL_TAG_MAX` characters. Empty leaves
   * the Tags alone.
   */
  tags?: string;
};

/** Settings of the Start Raid Action. */
export type StartRaidSettings = {
  /** The channel to raid, by login, as a template. */
  login?: string;
};

// The Cancel Raid Action takes no settings: Twitch allows only one raid this
// Channel can have initiated at a time, so there is nothing for its editor
// to configure.

/** Twitch's own fixed set of commercial lengths, in seconds. */
export const COMMERCIAL_LENGTHS = [30, 60, 90, 120, 150, 180] as const;

export type CommercialLength = (typeof COMMERCIAL_LENGTHS)[number];

/** Settings of the Run Commercial Action. */
export type RunCommercialSettings = {
  /** How long the commercial runs, in seconds, as a template. Twitch only accepts `COMMERCIAL_LENGTHS`. */
  length?: string;
};
