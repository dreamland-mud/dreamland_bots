const Telegraf = require('telegraf')
const bot = new Telegraf(process.env.BOT_TOKEN)
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const fetch = require('node-fetch')

const apiUrl = cmd => `https://dreamland.rocks/api/${cmd}`
const postBody = ctx => ({username: ctx.from.username, userid: ctx.from.id, token: process.env.BOT_TOKEN, bottype: "telegram"})
const postOptions = ctx => ({ method: 'POST', body: JSON.stringify(postBody(ctx)) })

// 'start' - standard bot command
bot.start((ctx) => ctx.reply('Привет, я Хассан и я скоро поумнею. Набери /help для списка команд.'))

// 'help' command, can be reworked to show action buttons
bot.help((ctx) => ctx.reply('/who - показать кто в мире\n/cat - котики\n'))

// 'who' command using DL API, anyone can call.
bot.command('who', async (ctx) => {
    try {
        const response = await fetch(apiUrl('who'))
        const who = await response.json()

        if (who.total === 0) {
            ctx.replyWithMarkdown("В мире никого нет!")
            return
        }

        ctx.replyWithMarkdown(
          '```\nСейчас в мире:\n\n'

           + who.people
               .map(p =>
                    (p.name.ru || p.name.en) + ', ' + p.race.ru + (p.clan ? ', клан ' + p.clan.en : '')
               ).join('\n')

           + '\n\nВсего игроков: ' + who.total + '.\n```')

    } catch (error) {
        console.log(error)
    }
})

// 'eq' command, only Telegram users linked to online DL players can call it. 
bot.command('eq', async (ctx) => {
    try {
        const response = await fetch (apiUrl('eq'), postOptions(ctx))
        const eq = await response.json()

        // WIP 

    } catch (error) {
        console.log(error)
    }
})


// 'cat' command for my dear Tahi.
const random = (min, max) => Math.floor(Math.random() * (max - min) + min)
bot.command('cat', (ctx) => {
    const width = random(100, 600)
    const height = random(200, 400)
    ctx.replyWithPhoto('http://lorempixel.com/' + width + '/' + height + '/cats/')
})



bot.launch()
