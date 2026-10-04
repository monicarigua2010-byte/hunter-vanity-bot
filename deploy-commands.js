require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { commands } = require("./commands");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  console.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID.");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    const body = commands.map(c => c.toJSON());
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
      console.log(`Registered ${body.length} guild commands in ${guildId}.`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body });
      console.log(`Registered ${body.length} global commands.`);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
