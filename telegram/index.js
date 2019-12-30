const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const DreamLand = require('../dreamland.js');
const dreamland = new DreamLand('telegram');

// 'start' - standard bot command
bot.start((ctx) => ctx.reply('Привет, я Хассан и я скоро поумнею. Набери /help для списка команд.'));

// 'help' command, can be reworked to show action buttons
bot.help((ctx) => ctx.reply('/who - показать кто в мире\n/cat - котики\n'));

// 'who' command using DL API, anyone can call.
bot.command('who', async (ctx) => {
    const response = await dreamland.who();
    ctx.replyWithMarkdown(response);
});

// 'cat' command for my dear Tahi.
const random = (min, max) => Math.floor(Math.random() * (max - min) + min);
bot.command('cat', (ctx) => {
    const width = random(100, 600);
    const height = random(200, 400);
    ctx.replyWithPhoto('http://lorempixel.com/' + width + '/' + height + '/cats/');
});


bot.launch();
