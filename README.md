# Staff Message Tracker — Aesthetic / Customizable Edition

A multi-server Discord staff message tracker for Railway. It tracks Staff-role messages, weekly quotas, daily DM reminders, and a live Top 15 leaderboard.

## Your default settings

- Staff role: `1550437605601054720`
- Weekly quota: `200`
- Reminder: `20:00` KST / `Asia/Seoul`
- Leaderboard channel: `1556219681273290752`
- Minimum message length: `5`
- Leaderboard: Top 15

## Aesthetic customization

Every server has its own saved message template. Nothing is hard-coded to one server.

### Customize reminders

`/message reminder title:"🔔 STAFF QUOTA" description:"Hey {user}!\\n\\nYou are at **{count}/{quota}**.\\nYou need **{remaining}** more!" color:#5865F2 footer:"{server} • Staff Department"`

### Customize quota-complete message

`/message complete title:"🎉 QUOTA COMPLETE" description:"Amazing {user}! You reached **{count}/{quota}**!" color:#57F287 footer:"{server} • Staff Department"`

### Customize leaderboard

`/message leaderboard title:"🏆 WEEKLY STAFF RANKINGS" description:"{leaderboard}" color:#FEE75C footer:"{server} • {period}" image:"https://example.com/banner.png" thumbnail:"https://example.com/icon.png"`

Use `/preview type:reminder`, `/preview type:complete`, or `/preview type:leaderboard` before/after customizing.

### Restore default designs

`/message reset`

Only Manage Server / Administrator can customize messages.

## Available placeholders

For reminder and complete messages:

- `{user}` — staff display name
- `{username}` — Discord username
- `{server}` — server name
- `{count}` — current weekly message count
- `{quota}` — weekly quota
- `{remaining}` — messages still needed
- `{plural}` — empty for 1, otherwise `s`
- `{period}` — current weekly period

For leaderboard messages:

- `{server}`
- `{quota}`
- `{period}`
- `{leaderboard}` — generated Top 15 ranking

Use `\\n` in slash-command text when you want line breaks.

## Commands

### Setup/config
- `/setup`
- `/config role`
- `/config quota`
- `/config leaderboard`
- `/config reminder`
- `/config minimum`
- `/config status`

### Aesthetic messages
- `/message reminder`
- `/message complete`
- `/message leaderboard`
- `/message reset`
- `/preview`

### Stats
- `/stats`
- `/leaderboard`
- `/reset`

## Discord Developer Portal

Enable:
- Server Members Intent
- Message Content Intent

Invite scopes:
- `bot`
- `applications.commands`

Recommended bot permissions:
- View Channels
- Send Messages
- Embed Links
- Read Message History

## Railway

Set:
- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`

Recommended:
- Add a Railway Volume mounted at `/data`
- Set `DB_PATH=/data/staff-tracker.sqlite`

The project includes `railway.json` and a Dockerfile. It starts with `npm start`.

## Counting

A message counts only if:
- it is in a server;
- the author is human;
- the author has the configured Staff role;
- trimmed content is at least the configured minimum length;
- it is not a webhook/bot message.

The bot does not store full message content.

## Weekly period

The weekly period is Monday 00:00 through Sunday 23:59 in each server's configured timezone. Historical counts remain in SQLite, while current commands use the current weekly period.

## Important

For accurate staff member discovery and role-based reminders, keep Server Members Intent enabled. If staff DMs are disabled, the bot cannot force Discord to deliver them.
