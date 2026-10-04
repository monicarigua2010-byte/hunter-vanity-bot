const {EmbedBuilder}=require("discord.js");
const db=require("./db"); const {periodKey,formatPeriod}=require("./time"); const {getTemplate}=require("./config");
function replace(s,v){return String(s||"").replace(/\{(\w+)\}/g,(_,k)=>v[k]??`{${k}}`).replace(/\\n/g,"\n")}
function medal(i){return ["🥇","🥈","🥉"][i]||`**${i+1}.**`}
async function buildLeaderboard(guild,config){
 const t=getTemplate(guild.id), rows=db.getLeaderboard(guild.id,periodKey(config.timezone)), lines=[];
 for(let i=0;i<rows.length;i++){const m=await guild.members.fetch(rows[i].user_id).catch(()=>null);const name=m?.displayName||`User ${rows[i].user_id}`;const done=rows[i].count>=config.weekly_quota?" ✅":"";lines.push(`${medal(i)} ${name} — **${rows[i].count}**${done}`)}
 const lb=lines.length?lines.join("\n"):"No qualifying staff messages have been recorded yet this week.";
 const vars={server:guild.name,period:formatPeriod(config),quota:config.weekly_quota,leaderboard:lb};
 const e=new EmbedBuilder().setTitle(replace(t.leaderboard_title,vars)).setDescription(replace(t.leaderboard_description,vars))
 .setColor(t.leaderboard_color).setFooter({text:replace(t.leaderboard_footer,vars)}).setTimestamp();
 if(t.leaderboard_image)e.setImage(t.leaderboard_image); if(t.leaderboard_thumbnail)e.setThumbnail(t.leaderboard_thumbnail); return e;
}
async function updateLeaderboard(guild,config){
 const ch=await guild.channels.fetch(config.leaderboard_channel_id).catch(()=>null);if(!ch?.isTextBased())return false;
 const embed=await buildLeaderboard(guild,config), msgs=await ch.messages.fetch({limit:50}).catch(()=>null);if(!msgs)return false;
 const own=msgs.find(m=>m.author.id===guild.client.user.id&&m.embeds[0]?.footer?.text?.includes(guild.name)&&m.embeds[0]?.title?.includes("Leaderboard"));
 if(own)await own.edit({embeds:[embed]}).catch(()=>{});else await ch.send({embeds:[embed]}).catch(()=>{});return true;
}
module.exports={buildLeaderboard,updateLeaderboard,replace};
