const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const dbPath = process.env.DB_PATH || "./staff-tracker.sqlite";
const dir = path.dirname(dbPath);
if (dir && dir !== ".") fs.mkdirSync(dir, { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS guild_config (
  guild_id TEXT PRIMARY KEY,
  staff_role_id TEXT NOT NULL,
  leaderboard_channel_id TEXT NOT NULL,
  weekly_quota INTEGER NOT NULL DEFAULT 200,
  min_message_length INTEGER NOT NULL DEFAULT 5,
  reminder_time TEXT NOT NULL DEFAULT '20:00',
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  setup_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS weekly_stats (
  guild_id TEXT NOT NULL, period_key TEXT NOT NULL, user_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, period_key, user_id)
);
CREATE TABLE IF NOT EXISTS reminder_log (
  guild_id TEXT NOT NULL, period_key TEXT NOT NULL, user_id TEXT NOT NULL, reminder_date TEXT NOT NULL,
  PRIMARY KEY (guild_id, period_key, user_id, reminder_date)
);
CREATE TABLE IF NOT EXISTS message_templates (
  guild_id TEXT PRIMARY KEY,
  reminder_title TEXT NOT NULL,
  reminder_description TEXT NOT NULL,
  reminder_color TEXT NOT NULL,
  reminder_footer TEXT NOT NULL,
  complete_title TEXT NOT NULL,
  complete_description TEXT NOT NULL,
  complete_color TEXT NOT NULL,
  complete_footer TEXT NOT NULL,
  leaderboard_title TEXT NOT NULL,
  leaderboard_description TEXT NOT NULL,
  leaderboard_color TEXT NOT NULL,
  leaderboard_footer TEXT NOT NULL,
  leaderboard_image TEXT NOT NULL DEFAULT '',
  leaderboard_thumbnail TEXT NOT NULL DEFAULT ''
);
`);

const s = {
 getConfig: db.prepare(`SELECT * FROM guild_config WHERE guild_id=?`),
 upsertConfig: db.prepare(`
 INSERT INTO guild_config(guild_id,staff_role_id,leaderboard_channel_id,weekly_quota,min_message_length,reminder_time,timezone,setup_at)
 VALUES(@guild_id,@staff_role_id,@leaderboard_channel_id,@weekly_quota,@min_message_length,@reminder_time,@timezone,@setup_at)
 ON CONFLICT(guild_id) DO UPDATE SET staff_role_id=excluded.staff_role_id,
 leaderboard_channel_id=excluded.leaderboard_channel_id, weekly_quota=excluded.weekly_quota,
 min_message_length=excluded.min_message_length, reminder_time=excluded.reminder_time, timezone=excluded.timezone`),
 getTemplate: db.prepare(`SELECT * FROM message_templates WHERE guild_id=?`),
 upsertTemplate: db.prepare(`
 INSERT INTO message_templates(guild_id,reminder_title,reminder_description,reminder_color,reminder_footer,
 complete_title,complete_description,complete_color,complete_footer,
 leaderboard_title,leaderboard_description,leaderboard_color,leaderboard_footer,leaderboard_image,leaderboard_thumbnail)
 VALUES(@guild_id,@reminder_title,@reminder_description,@reminder_color,@reminder_footer,
 @complete_title,@complete_description,@complete_color,@complete_footer,
 @leaderboard_title,@leaderboard_description,@leaderboard_color,@leaderboard_footer,@leaderboard_image,@leaderboard_thumbnail)
 ON CONFLICT(guild_id) DO UPDATE SET
 reminder_title=excluded.reminder_title, reminder_description=excluded.reminder_description,
 reminder_color=excluded.reminder_color, reminder_footer=excluded.reminder_footer,
 complete_title=excluded.complete_title, complete_description=excluded.complete_description,
 complete_color=excluded.complete_color, complete_footer=excluded.complete_footer,
 leaderboard_title=excluded.leaderboard_title, leaderboard_description=excluded.leaderboard_description,
 leaderboard_color=excluded.leaderboard_color, leaderboard_footer=excluded.leaderboard_footer,
 leaderboard_image=excluded.leaderboard_image, leaderboard_thumbnail=excluded.leaderboard_thumbnail`),
 getCount: db.prepare(`SELECT count FROM weekly_stats WHERE guild_id=? AND period_key=? AND user_id=?`),
 increment: db.prepare(`INSERT INTO weekly_stats(guild_id,period_key,user_id,count) VALUES(?,?,?,1)
 ON CONFLICT(guild_id,period_key,user_id) DO UPDATE SET count=count+1`),
 leaderboard: db.prepare(`SELECT user_id,count FROM weekly_stats WHERE guild_id=? AND period_key=? AND count>0 ORDER BY count DESC,user_id ASC LIMIT 15`),
 resetPeriod: db.prepare(`DELETE FROM weekly_stats WHERE guild_id=? AND period_key=?`),
 reminderExists: db.prepare(`SELECT 1 FROM reminder_log WHERE guild_id=? AND period_key=? AND user_id=? AND reminder_date=?`),
 addReminder: db.prepare(`INSERT OR IGNORE INTO reminder_log(guild_id,period_key,user_id,reminder_date) VALUES(?,?,?,?,?)`)
};

function getConfig(g){return s.getConfig.get(g)}
function saveConfig(c){s.upsertConfig.run(c);return getConfig(c.guild_id)}
function getTemplate(g){return s.getTemplate.get(g)}
function saveTemplate(t){s.upsertTemplate.run(t);return getTemplate(t.guild_id)}
function increment(g,p,u){s.increment.run(g,p,u);return getCount(g,p,u)}
function getCount(g,p,u){return s.getCount.get(g,p,u)?.count||0}
function getLeaderboard(g,p){return s.leaderboard.all(g,p)}
function clearPeriod(g,p){const tx=db.transaction(()=>{s.resetPeriod.run(g,p);db.prepare(`DELETE FROM reminder_log WHERE guild_id=? AND period_key=?`).run(g,p)});tx()}
function reminderAlreadySent(g,p,u,d){return !!s.reminderExists.get(g,p,u,d)}
function markReminderSent(g,p,u,d){s.addReminder.run(g,p,u,d)}
module.exports={getConfig,saveConfig,getTemplate,saveTemplate,increment,getCount,getLeaderboard,clearPeriod,reminderAlreadySent,markReminderSent};
