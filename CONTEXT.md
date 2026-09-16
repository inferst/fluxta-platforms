# Platforms

The Fluxta plugin that connects a streamer's broadcasting platforms to their
deck. It turns what happens on a platform (a chat message, a command, a reward
redemption, a poll) into Fluxta Events, and exposes Actions that act back on
the platform. Twitch is the first Platform; YouTube and Kick are expected to
follow.

Fluxta's own vocabulary — Event, Event Source, Event Field, Action, Run
Variable, Value Source, Live Tile — is defined in the host's glossary and is not
redefined here.

## Platforms and identity

**Platform**:
A streaming service the plugin integrates with. Twitch, YouTube, Kick.
_Avoid_: provider, service, source

**Account**:
A platform user the plugin has been authorized to act as. Each Account holds its
own tokens and its own granted permissions.
_Avoid_: user, login, profile, credentials

**Broadcaster Account**:
The Account that owns the Channel. Required — it is the only Account whose
authorization covers Rewards, Polls and Predictions.
_Avoid_: streamer, owner, main account

**Bot Account**:
An optional second Account used only to speak in chat, so messages appear under a
bot's name rather than the streamer's. When absent, the Broadcaster Account
speaks.
_Avoid_: sender, alt account

**Channel**:
The Broadcaster Account's own chat and stream. The plugin observes exactly one.
_Avoid_: room, stream, chat

## Chat and commands

**Chat Message**:
A single message posted in the Channel, whether or not it matches a Command.
_Avoid_: message, chat line

**Command**:
A named chat trigger the plugin owns and recognizes: a name, its Aliases, a
Permission Level, and its Cooldowns. A Command performs no reaction of its own —
recognizing one only fires an Event.
_Avoid_: chat command, trigger, macro

**Alias**:
An alternative name that fires the same Command. The Event always reports the
Command's canonical name alongside the Alias actually typed.
_Avoid_: synonym, shortcut

**Arguments**:
Everything typed after the Command name, carried as one unsplit string.
_Avoid_: params, input, args list

**Permission Level**:
The minimum standing a viewer must have for a Command to fire: everyone,
subscriber, VIP, moderator, or broadcaster. Ordered — a higher standing satisfies
a lower requirement.
_Avoid_: role, permission, access level, user level

**Cooldown**:
The period after a Command fires during which it will not fire again. A Command
has a global Cooldown and a per-viewer Cooldown, both counted from an actual
firing, never from a rejected attempt.
_Avoid_: rate limit, throttle, timeout

## Channel points

**Reward**:
A channel-points item viewers can spend on. A **Managed Reward** was created by
this plugin and can be edited, enabled, disabled and have its Redemptions
resolved; an **Unmanaged Reward** was created elsewhere and is observable only.
_Avoid_: custom reward, channel point reward, item

**Redemption**:
One viewer spending channel points on a Reward. Redemptions of every Reward are
observable; only those of a Managed Reward can be fulfilled or refunded.
_Avoid_: redeem, claim, purchase

## Polls and predictions

**Poll**:
A viewer vote the Broadcaster runs on the Channel, with two or more Choices. At
most one is active at a time.
_Avoid_: vote, survey

**Prediction**:
A viewer wager the Broadcaster runs on the Channel, with two or more Outcomes.
At most one is active at a time. It is locked, then resolved to a winning
Outcome, or cancelled with wagers refunded.
_Avoid_: bet, wager, prediction poll

**Outcome**:
One side of a Prediction. Referred to by its position or its title — the
platform's identifier for it never reaches the user.
_Avoid_: option, choice, side

**Choice**:
One option of a Poll. Referred to the same way as an Outcome.
_Avoid_: answer, option
