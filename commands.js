const {SlashCommandBuilder,PermissionFlagsBits,EmbedBuilder}=require("discord.js");
const db=require("./db");const {ensureConfig,getTemplate,defaultTemplate,validateTimezone,validateTime,validateColor}=require("./config");
const {periodKey,formatPeriod}=require("./time");const {buildLeaderboard,updateLeaderboard,replace}=require("./leaderboard");
const commands=[
new SlashCommandBuilder().setName("setup").setDescription("Initialize the staff tracker."),
new SlashCommandBuilder().setName("config").setDescription("Configure the staff tracker.")
 .addSubcommand(s=>s.setName("role").setDescription("Set the Staff role.").addRoleOption(o=>o.setName("role").setDescription("Staff role").setRequired(true)))
 .addSubcommand(s=>s.setName("quota").setDescription("Set weekly quota.").addIntegerOption(o=>o.setName("weekly").setDescription("Messages per week").setMinValue(1).setMaxValue(100000).setRequired(true)))
 .addSubcommand(s=>s.setName("leaderboard").setDescription("Set leaderboard channel.").addChannelOption(o=>o.setName("channel").setDescription("Text channel").setRequired(true)))
 .addSubcommand(s=>s.setName("reminder").setDescription("Set reminder time/timezone.").addStringOption(o=>o.setName("time").setDescription("HH:MM").setRequired(true)).addStringOption(o=>o.setName("timezone").setDescription("IANA timezone").setRequired(true)))
 .addSubcommand(s=>s.setName("minimum").setDescription("Set minimum message length.").addIntegerOption(o=>o.setName("length").setDescription("Characters").setMinValue(1).setMaxValue(1000).setRequired(true)))
 .addSubcommand(s=>s.setName("status").setDescription("Show current settings.")),
new SlashCommandBuilder().setName("message").setDescription("Customize bot embeds.")
 .addSubcommand(s=>s.setName("reminder").setDescription("Customize the daily reminder.")
  .addStringOption(o=>o.setName("title").setDescription("Embed title").setMaxLength(256))
  .addStringOption(o=>o.setName("description").setDescription("Embed description").setMaxLength(4000))
  .addStringOption(o=>o.setName("color").setDescription("Hex color, e.g. #5865F2").setMaxLength(7))
  .addStringOption(o=>o.setName("footer").setDescription("Footer text").setMaxLength(2048)))
 .addSubcommand(s=>s.setName("complete").setDescription("Customize quota-complete message.")
  .addStringOption(o=>o.setName("title").setDescription("Embed title").setMaxLength(256))
  .addStringOption(o=>o.setName("description").setDescription("Embed description").setMaxLength(4000))
  .addStringOption(o=>o.setName("color").setDescription("Hex color").setMaxLength(7))
  .addStringOption(o=>o.setName("footer").setDescription("Footer text").setMaxLength(2048)))
 .addSubcommand(s=>s.setName("leaderboard").setDescription("Customize leaderboard embed.")
  .addStringOption(o=>o.setName("title").setDescription("Embed title").setMaxLength(256))
  .addStringOption(o=>o.setName("description").setDescription("Description. Use {leaderboard}.").setMaxLength(4000))
  .addStringOption(o=>o.setName("color").setDescription("Hex color").setMaxLength(7))
  .addStringOption(o=>o.setName("footer").setDescription("Footer text").setMaxLength(2048))
  .addStringOption(o=>o.setName("image").setDescription("Image URL").setMaxLength(1000))
  .addStringOption(o=>o.setName("thumbnail").setDescription("Thumbnail URL").setMaxLength(1000)))
 .addSubcommand(s=>s.setName("reset").setDescription("Restore default aesthetic messages.")),
new SlashCommandBuilder().setName("preview").setDescription("Preview a customized bot embed.")
 .addStringOption(o=>o.setName("type").setDescription("Preview type").setRequired(true).addChoices({name:"Reminder",value:"reminder"},{name:"Quota Complete",value:"complete"},{name:"Leaderboard",value:"leaderboard"})),
new SlashCommandBuilder().setName("stats").setDescription("Show your weekly stats."),
new SlashCommandBuilder().setName("leaderboard").setDescription("Show/update Top 15 leaderboard."),
new SlashCommandBuilder().setName("reset").setDescription("Reset current week's counts.")
].map(x=>x.setDMPermission(false));
const isAdmin=i=>i.memberPermissions?.has(PermissionFlagsBits.ManageGuild)||i.memberPermissions?.has(PermissionFlagsBits.Administrator);
async function execute(i){
 const g=i.guild;if(!g)return i.reply({content:"Use this command in a server.",ephemeral:true});const n=i.commandName,c=ensureConfig(g.id);
 if(["setup","config","message","reset"].includes(n)&&!isAdmin(i))return i.reply({content:"You need Manage Server or Administrator permission.",ephemeral:true});
 if(n==="setup")return i.reply({content:`✅ Setup complete. Staff: <@&${c.staff_role_id}> • Quota: ${c.weekly_quota}/week • Reminder: ${c.reminder_time} ${c.timezone} • Leaderboard: <#${c.leaderboard_channel_id}>`,ephemeral:true});
 if(n==="config"){const s=i.options.getSubcommand();
  if(s==="role"){const r=i.options.getRole("role");db.saveConfig({...c,staff_role_id:r.id});return i.reply({content:`✅ Staff role: ${r}`,ephemeral:true})}
  if(s==="quota"){const q=i.options.getInteger("weekly");db.saveConfig({...c,weekly_quota:q});return i.reply({content:`✅ Weekly quota: **${q}**`,ephemeral:true})}
  if(s==="leaderboard"){const ch=i.options.getChannel("channel");if(!ch.isTextBased())return i.reply({content:"Choose a text channel.",ephemeral:true});db.saveConfig({...c,leaderboard_channel_id:ch.id});return i.reply({content:`✅ Leaderboard: ${ch}`,ephemeral:true})}
  if(s==="reminder"){const time=i.options.getString("time"),tz=i.options.getString("timezone");if(!validateTime(time)||!validateTimezone(tz))return i.reply({content:"Invalid time/timezone. Example: `20:00` and `Asia/Seoul`.",ephemeral:true});db.saveConfig({...c,reminder_time:time,timezone:tz});return i.reply({content:`✅ Reminder: **${time} ${tz}**`,ephemeral:true})}
  if(s==="minimum"){const x=i.options.getInteger("length");db.saveConfig({...c,min_message_length:x});return i.reply({content:`✅ Minimum length: **${x}** characters`,ephemeral:true})}
  const e=new EmbedBuilder().setTitle("⚙️ Staff Tracker Configuration").addFields(
   {name:"Staff role",value:`<@&${c.staff_role_id}>`,inline:true},{name:"Quota",value:`${c.weekly_quota}/week`,inline:true},
   {name:"Minimum",value:`${c.min_message_length} chars`,inline:true},{name:"Leaderboard",value:`<#${c.leaderboard_channel_id}>`,inline:true},
   {name:"Reminder",value:`${c.reminder_time} ${c.timezone}`,inline:true});return i.reply({embeds:[e],ephemeral:true});
 }
 if(n==="message"){
  let t=getTemplate(g.id),s=i.options.getSubcommand();
  if(s==="reset"){const d=defaultTemplate();d.guild_id=g.id;t=db.saveTemplate({...t,...d});return i.reply({content:"✅ All customizable messages restored to the default aesthetic.",ephemeral:true})}
  const p=s==="reminder"?["reminder_title","reminder_description","reminder_color","reminder_footer"]:s==="complete"?["complete_title","complete_description","complete_color","complete_footer"]:["leaderboard_title","leaderboard_description","leaderboard_color","leaderboard_footer","leaderboard_image","leaderboard_thumbnail"];
  const names=s==="reminder"?["title","description","color","footer"]:s==="complete"?["title","description","color","footer"]:["title","description","color","footer","image","thumbnail"];
  const changes={...t};for(let j=0;j<p.length;j++){const v=i.options.getString(names[j]);if(v!==null){if(names[j]==="color"&&!validateColor(v))return i.reply({content:"Color must be a hex value like `#5865F2`.",ephemeral:true});changes[p[j]]=v}}
  db.saveTemplate(changes);if(s==="leaderboard")await updateLeaderboard(g,c);
  return i.reply({content:`✅ ${s} message customization saved. Use \`/preview type:${s==="complete"?"complete":s}\` to preview it.`,ephemeral:true});
 }
 if(n==="preview"){const type=i.options.getString("type"),t=getTemplate(g.id),v={user:i.user,server:g.name,count:50,quota:c.weekly_quota,remaining:Math.max(c.weekly_quota-50,0),plural:"s",period:formatPeriod(c),leaderboard:"🥇 Example Staff — **185**\n🥈 Example Staff — **160**\n🥉 Example Staff — **142**"};
  const key=type==="reminder"?"reminder":type==="complete"?"complete":"leaderboard";const e=new EmbedBuilder().setTitle(replace(t[key+"_title"],v)).setDescription(replace(t[key+"_description"],v)).setColor(t[key+"_color"]).setFooter({text:replace(t[key+"_footer"],v)}).setTimestamp();if(key==="leaderboard"){if(t.leaderboard_image)e.setImage(t.leaderboard_image);if(t.leaderboard_thumbnail)e.setThumbnail(t.leaderboard_thumbnail)}return i.reply({embeds:[e],ephemeral:true})}
 if(n==="stats"){if(!i.member.roles.cache.has(c.staff_role_id))return i.reply({content:"You do not have the configured Staff role.",ephemeral:true});const x=db.getCount(g.id,periodKey(c.timezone),i.user.id),r=Math.max(c.weekly_quota-x,0);return i.reply({embeds:[new EmbedBuilder().setTitle("📊 Your Staff Stats").setDescription(`**${x}/${c.weekly_quota}** messages this week.`).addFields({name:"Remaining",value:r?`**${r}** messages`:"✅ Quota complete!"}).setFooter({text:formatPeriod(c)})],ephemeral:true})}
 if(n==="leaderboard"){await i.deferReply({ephemeral:true});await updateLeaderboard(g,c);return i.editReply({embeds:[await buildLeaderboard(g,c)]})}
 if(n==="reset"){db.clearPeriod(g.id,periodKey(c.timezone));await updateLeaderboard(g,c);return i.reply({content:"⚠️ Current week reset.",ephemeral:true})}
}
module.exports={commands,execute};
