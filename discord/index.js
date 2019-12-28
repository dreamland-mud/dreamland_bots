const Discord = require('discord.js')
const client = new Discord.Client()
const auth = require('./auth.json')
const commands = require('../commands.js')
const fetch = require('node-fetch')

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)

    const guild = client.guilds.get('464761427710705664')
    console.log(guild.name, 'members: ')

    guild.members
    .filter(m => !m.user.bot)
    .forEach(m => {
        console.log('    ', m.user.username + '#' + m.user.discriminator, m.id, m.presence.status)
    })
})

client.on("presenceUpdate", (oldMember, newMember) => {
    if (oldMember.user.bot)
        return;

    const id = oldMember.user.id
    const username = oldMember.user.username + '#' + oldMember.user.discriminator
    const oldPresence = oldMember.frozenPresence
    const newPresence = newMember.guild.presences.get(id)
        
    if (oldPresence.status === newPresence.status)
        return;

    console.log(`${username}'s ${id} presence changes`)
    console.log('oldPresence', oldPresence)
    console.log('newPresence', newPresence)
})

client.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('pong')
    }
})

client.on('message', async (msg) => {
 
    if (msg.channel.type === 'text' && !msg.channel.name.startsWith('dreamland'))
        return;

    if (msg.content.match(/^\/who *$/)) {
        const response = await commands.who()
        msg.reply(response)
        return
    }

    let args = msg.content.match(/^\/ooc (.*)$/)
    if (args) {
        const body = {args: {id: msg.author.id, message: args[1]}, token: auth.token, bottype: "discord"}
        const response = await commands.ooc(body)
        if (response)
            msg.reply(response)
        return
    }

    if (msg.content.match(/^\/link/)) {
        let args = msg.content.match(/^\/link ([a-zA-Z0-9]+)$/)
        if (!args) {
            msg.reply('Использование: /link секретное_слово. Слово можно получить изнутри мира по команде config discord.')
            return;
        }

        const body = 
            {args: 
                {id: msg.author.id, 
                 username: msg.author.username, 
                 link: args[1],
                 status: 'online'
                }, 
             token: auth.token, 
             bottype: "discord"}

        const response = await commands.link(body)
        msg.reply(response)
        return
    }
})

client.login(auth.token)

