// Register Valkyrie's slash commands with Discord.
//
//   node register-commands.js           -- guild commands on the DreamLand server (show up at once)
//   node register-commands.js --global  -- global commands, and clear the guild copies so nothing shows twice
//
// Re-run after editing commands.js. PUT replaces the whole set, so removed commands disappear.

const { REST, Routes } = require('discord.js');
const auth = require('./auth.json');
const commands = require('./commands');

const myGuild = '969942531980808243';
const isGlobal = process.argv.includes('--global');

(async () => {
  const rest = new REST({ version: '10' }).setToken(auth.token);
  const app = await rest.get(Routes.oauth2CurrentApplication());

  if (isGlobal) {
    const set = await rest.put(Routes.applicationCommands(app.id), { body: commands });
    await rest.put(Routes.applicationGuildCommands(app.id, myGuild), { body: [] });
    console.log(`Registered ${set.length} global commands for ${app.name}, cleared guild commands.`);
  } else {
    const set = await rest.put(Routes.applicationGuildCommands(app.id, myGuild), { body: commands });
    console.log(`Registered ${set.length} guild commands for ${app.name}: ${set.map(c => '/' + c.name).join(' ')}`);
  }
})().catch(e => {
  console.error('Registration failed:', e.message || e);
  process.exit(1);
});
