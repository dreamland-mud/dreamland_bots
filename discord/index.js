const { Client, GatewayIntentBits, Partials, ChannelType, Events } = require('discord.js')
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,     // privileged: member list for the who-list sync
        GatewayIntentBits.GuildPresences,   // privileged: online/idle/dnd status sync
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,   // privileged: the old text commands
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel],           // DM channels are not cached until the first message
})
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

// Player text goes back into channels: never let it ping @everyone or roles.
const noMentions = { parse: [] };

const linkUsage = 'Использование: /link секретное_слово (для персонажа) или /link DL-XXXXX (код привязки аккаунта из игры, команда «аккаунт связать»).';
const resetUsage = 'Использование: /reset имя_персонажа (латиницей).';

// DL-XXXXX -> account linking code (redeem against this Discord identity).
// A bare word is the old per-character status link (config discord).
async function linkWord(user, word) {
    if (/^DL-/i.test(word))
        return dreamland.redeem({
            code: word,
            identityType: 'discord',
            value: user.id,
            display: user.username,
        });

    return dreamland.link({
        id: user.id,
        username: user.username,
        link: word,
        status: 'online'
    });
}

client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const guild = client.guilds.cache.get(myGuild);
    const all = await guild.members.fetch({ withPresences: true });
    const members = all
        .filter(m => !m.user.bot)
        .filter(m => m.presence && m.presence.status !== 'offline')
        .map(m => ({
            id: m.id,
            username: m.user.username,
            status: m.presence.status
        }));

    dreamland.updateAll(members);
});

client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
    if (!newPresence.guild || newPresence.guild.id !== myGuild)
        return;

    const user = newPresence.user || (newPresence.member && newPresence.member.user);
    if (!user || user.bot)
        return;

    if (oldPresence && oldPresence.status === newPresence.status)
        return;

    const player = { id: user.id, username: user.username, status: newPresence.status };
    dreamland.updateOne(player);
})

/*
 * Slash commands (definitions in commands.js, registered by register-commands.js).
 * Defer first: Discord drops an interaction not answered within 3 seconds, and the
 * game API queue can be slower than that. Account answers are ephemeral -- only the
 * caller sees them, which also keeps link codes and temp passwords out of channels.
 */
// /ooc too: the game already relays the line to the Discord stream channel.
const ephemeral = new Set(['ooc', 'link', 'account', 'reset']);

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;

    const name = interaction.commandName;
    const user = interaction.user;

    try {
        await interaction.deferReply({ ephemeral: ephemeral.has(name) });
        let response;

        if (name === 'who') {
            response = await dreamland.who();
        }
        else if (name === 'ooc') {
            const message = interaction.options.getString('message');
            const error = await dreamland.ooc({ id: user.id, message });
            response = error || 'Надіслано в OOC.';
        }
        else if (name === 'link') {
            const word = interaction.options.getString('code').trim();
            response = /^[a-zA-Z0-9\-]+$/.test(word) ? await linkWord(user, word) : linkUsage;
        }
        else if (name === 'account') {
            response = await dreamland.accountInfo({ identityType: 'discord', value: user.id });
        }
        else if (name === 'reset') {
            const char = interaction.options.getString('character').trim();
            response = /^[a-zA-Z]+$/.test(char)
                ? await dreamland.resetpw({ identityType: 'discord', value: user.id, char })
                : resetUsage;
        }

        await interaction.editReply({ content: response || 'Готово.', allowedMentions: noMentions });
    } catch (e) {
        console.log(`/${name} failed:`, e.message || e);
        const content = 'DreamLand не відповідає, спробуй пізніше.';
        if (interaction.deferred || interaction.replied)
            await interaction.editReply({ content }).catch(() => {});
        else
            await interaction.reply({ content, ephemeral: true }).catch(() => {});
    }
});

/*
 * The old text commands, kept while players move over to the slash ones.
 */
client.on(Events.MessageCreate, async (msg) => {
    if (msg.author.bot)
        return;

    if (msg.content === 'ping') {
        msg.reply('pong');
        return;
    }

    // Channels were renamed from дрим-* to dream-*; accept both.
    if (msg.channel.type === ChannelType.GuildText && !/^(дрим|dream)/.test(msg.channel.name))
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
            msg.reply(linkUsage);
            return;
        }

        msg.reply(await linkWord(msg.author, args[1]));
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
            msg.reply(resetUsage);
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
            if (msg.channel.type !== ChannelType.DM)
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
