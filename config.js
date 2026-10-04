const { ChannelType } = require("discord.js");
const { IANAZone } = require("luxon");
const db = require("./db");
function envInt(n,f){const x=Number(process.env[n]);return Number.isInteger(x)&&x>0?x:f}
function defaults(){return {
 staff_role_id:process.env.DEFAULT_STAFF_ROLE_ID||"1550437605601054720",
 leaderboard_channel_id:process.env.DEFAULT_LEADERBOARD_CHANNEL_ID||"1556219681273290752",
 weekly_quota:envInt("DEFAULT_WEEKLY_QUOTA",200),
 min_message_length:envInt("DEFAULT_MIN_MESSAGE_LENGTH",5),
 reminder_time:process.env.DEFAULT_REMINDER_TIME||"20:00",
 timezone:process.env.DEFAULT_TIMEZONE||"Asia/Seoul"
}}
function defaultTemplate(guildName="this server"){return {
 guild_id:null,
 reminder_title:"🔔 Staff Quota Reminder",
 reminder_description:"Hello {user}!\\n\\nYou currently have **{count}/{quota}** messages this week.\\nYou still need **{remaining}** more message{plural} to reach your quota.\\n\\nKeep going! 💪",
 reminder_color:"#5865F2", reminder_footer:"{server} • Staff Activity",
 complete_title:"✅ Weekly Quota Complete!",
 complete_description:"Congratulations {user}!\\n\\nYou have reached **{count}/{quota}** messages this week. 🎉",
 complete_color:"#57F287", complete_footer:"{server} • Staff Activity",
 leaderboard_title:"🏆 Staff Message Leaderboard",
 leaderboard_description:"**Top 15 Staff Members**\\n\\n{leaderboard}",
 leaderboard_color:"#FEE75C", leaderboard_footer:"{server} • {period} • Quota: {quota}/week",
 leaderboard_image:"", leaderboard_thumbnail:""
}}
function ensureConfig(g){let c=db.getConfig(g);if(!c){const d=defaults();c=db.saveConfig({guild_id:g,...d,setup_at:new Date().toISOString()})}if(!db.getTemplate(g)){const t=defaultTemplate();t.guild_id=g;db.saveTemplate(t)}return c}
function getTemplate(g){ensureConfig(g);return db.getTemplate(g)}
function validateTimezone(tz){try{return IANAZone.create(tz).isValid}catch{return false}}
function validateTime(t){return /^([01]\\d|2[0-3]):[0-5]\\d$/.test(t)}
function validateColor(c){return /^#[0-9A-Fa-f]{6}$/.test(c)}
async function validateChannels(guild,c){const role=await guild.roles.fetch(c.staff_role_id).catch(()=>null);const channel=await guild.channels.fetch(c.leaderboard_channel_id).catch(()=>null);return {role,channel,channelIsText:channel&&[ChannelType.GuildText,ChannelType.GuildAnnouncement].includes(channel.type)}}
module.exports={defaults,defaultTemplate,ensureConfig,getTemplate,validateTimezone,validateTime,validateColor,validateChannels};
