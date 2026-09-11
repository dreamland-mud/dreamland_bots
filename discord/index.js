const Discord = require('discord.js')
const client = new Discord.Client()
const auth = require('./auth.json')
const DreamLand = require('../dreamland.js')
const dreamland = new DreamLand('discord')

// A rejected reply (blocked user, missing permission, any Discord API error) must
// never crash the process. Fire-and-forget msg.reply/send calls would otherwise
// surface as an unhandled rejection that kills the bot. Log it and keep serving.
process.on('unhandledRejection', reason => {
  console.log('Unhandled rejection:', (reason && (reason.message || reason.code)) || reason);
});

const myGuild = '969942531980808243';

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
        let args = msg.content.match(/^\/link ([a-zA-Z0-9\-]+)$/);
        if (!args) {
            msg.reply('Использование: /link секретное_слово (для персонажа) или /link DL-XXXXX (код привязки аккаунта из игры, команда «аккаунт связать»).');
            return;
        }

        const word = args[1];

        // DL-XXXXX -> account linking code (redeem against this Discord identity).
        // A bare word is the old per-character status link (config discord).
        if (/^DL-/i.test(word)) {
            const result = await dreamland.redeem({
                code: word,
                identityType: 'discord',
                value: msg.author.id,
                display: msg.author.username,
            });
            msg.reply(result);
            return;
        }

        const response = await dreamland.link({
            id: msg.author.id,
            username: msg.author.username,
            link: word,
            status: 'online'
        });
        msg.reply(response);
        return;
    }

    if (msg.content.match(/^\/account( |$)/)) {
        const result = await dreamland.accountInfo({
            identityType: 'discord',
            value: msg.author.id,
        });
        msg.reply(result);
        return;
    }

    if (msg.content.match(/^\/reset( |$)/)) {
        const resetArgs = msg.content.match(/^\/reset ([a-zA-Z]+)$/);
        if (!resetArgs) {
            msg.reply('Использование: /reset имя_персонажа (латиницей).');
            return;
        }

        const result = await dreamland.resetpw({
            identityType: 'discord',
            value: msg.author.id,
            char: resetArgs[1],
        });

        // The temp password is a secret -- deliver it in a DM, never in a channel.
        try {
            await msg.author.send(result);
            if (msg.channel.type !== 'dm')
                msg.reply('Отправил результат тебе в личку.');
        } catch (e) {
            msg.reply('Не смог написать в личку — открой личные сообщения боту и повтори.');
        }
        return;
    }

    if (msg.content.match(/^\/(reboot|deny|ban)/)) {
        const response = await dreamland.admin({
            id: msg.author.id,
            username: msg.author.username, 
            command: msg.content.substring(1)
        });
        msg.reply(response);
        return;
    }
});

client.login(auth.token);

