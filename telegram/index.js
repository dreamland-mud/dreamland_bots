const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const DreamLand = require('../dreamland.js');
const dreamland = new DreamLand('telegram');
const commandArgsMiddleware = require('./commandArgs');
const fetch = require('node-fetch');


// 'start' - standard bot command
bot.start((ctx) => ctx.reply('Привет, я Хассан и я скоро поумнею. Набери /help для списка команд.'));

// 'help' command, can be reworked to show action buttons
bot.help((ctx) => ctx.reply(
    '/who                - показать кто в мире\n' + 
    '/cat                - случайный котик\n' +
    '/cat says/meow meow - кот с надписью\n' +
    '/cat hat/says/hello - кот с тегом hat и надписью\n' +
    '/cat gif            - анимированный кот\n' + 
    'Подробности в https://cataas.com/#/about'
));

bot.use(commandArgsMiddleware());

// 'who' command using DL API, anyone can call.
bot.command('who', async (ctx) => {
    const response = await dreamland.who();
    ctx.replyWithMarkdown(response);
});

bot.catch((err) => {
    console.log(err);
});

// 'cat' command for my dear Tahi.
const random = (min, max) => Math.floor(Math.random() * (max - min) + min);
const encode = (args) => (typeof args === 'string') ? encodeURI(args.replace(/^\/?/, '/')) : '';
bot.command('cat', async (ctx) => {
    const args = ctx.state.command.args;
    const request = 'https://cataas.com/cat' + encode(args) + '?' + random(1, 1000); 
    const response = await fetch(request);

    if (response.ok) {
        if (response.headers.get('content-type') === 'image/gif')
            return ctx.replyWithDocument(request);
        else
            return ctx.replyWithPhoto(request);
    }

    if (response.status === 404)
        return ctx.reply('Неправильный запрос, читайте /help');

    return ctx.reply('Какая-то ошибка, попробуйте позже.');
});


bot.launch();
