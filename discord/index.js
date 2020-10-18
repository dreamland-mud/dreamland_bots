const Discord = require('discord.js')
const client = new Discord.Client()
const auth = require('./auth.json')
const DreamLand = require('../dreamland.js')
const dreamland = new DreamLand('discord')

const myGuild = '464761427710705664';

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const guild = client.guilds.cache.get(myGuild);
    const members = guild.members.cache
        .filter(m => !m.user.bot)
        .filter(m => m.presence.status !== 'offline')
        .map(m => ({
            id: m.id,
            username: m.user.username,
            status: m.presence.status
        }));

    console.log(guild.name, 'online members:', members);

    dreamland.updateAll(members);
});

client.on("presenceUpdate", (oldMember, newMember) => {
    if (!oldMember || !oldMember.guild)	
	return;

    if (oldMember.guild.id !== myGuild)
        return;

    if (oldMember.user.bot)
        return;

    const id = oldMember.user.id;
    const username = oldMember.user.username;
    const oldPresence = oldMember.frozenPresence;
    const newPresence = newMember.guild.presences.cache.get(id);
        
    if (oldPresence && oldPresence.status === newPresence.status)
        return;

    if (oldPresence)	
        console.log(`${username}'s ${id} presence changes from ${oldPresence.status} to ${newPresence.status}`);
    else	
        console.log(`${username}'s ${id} presence changes to ${newPresence.status}`);

    const player = { id, username, status: newPresence.status };
    dreamland.updateOne(player);
})

client.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('pong');
    }
})

client.on('message', async (msg) => {
 
    if (msg.channel.type === 'text' && !msg.channel.name.startsWith('дрим'))
        return;

    if (msg.content.match(/^\/who *$/)) {
        const response = await dreamland.who();
        msg.reply(response);
        return;
    }

    let cmdArgs = msg.content.match(/^\/ooc (.*)$/);
    if (cmdArgs) {
        const args = {id: msg.author.id, message: cmdArgs[1]};
        const response = await dreamland.ooc(args);
        if (response)
            msg.reply(response);
        return;
    }

    if (msg.content.match(/^\/link/)) {
        let args = msg.content.match(/^\/link ([a-zA-Z0-9]+)$/);
        if (!args) {
            msg.reply('Использование: /link секретное_слово. Слово можно получить изнутри мира по команде config discord.');
            return;
        }

        const response = await dreamland.link({
            id: msg.author.id, 
            username: msg.author.username, 
            link: args[1], 
            status: 'online' 
        });
        msg.reply(response);
        return;
    }
});

console.log('Trying to login with ', auth.token);
client.on('debug', m => console.log(m));
client.login(auth.token);

