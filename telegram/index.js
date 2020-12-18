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
    '/cat says/hello?color=orange  - кот с надписью оранжевым цветом\n' +
    '/cat says/aloha?color=red&filter=sepia  - кот с надписью красным цветом в сепии\n' +
    '   доступны опции:\n' +
    '   color - цвет текста;\n' +
    '   size - размер шрифта;\n' +
    '   type - тип картинки (small, medium, square, original);\n' +
    '   filter - фильтр (blur,mono,sepia,negative,paint,pixel);\n' +
    '   width|height - ширина или высота картинки в пикселях;\n' +
    'Подробности в https://cataas.com/'
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
const parser = (str, numb) => {
    let result = '';
    let matches = str.match(/^\/(?:(?<tag>\w*)(?:\/)?)?((?:says\/)(?<says>[^?]*))?(?:\?(?<options>.*))?$/);

    if(!matches) return result + "?" + numb;

    if(matches['groups']['tag']) result += '/' + matches['groups']['tag'];
    if(matches['groups']['says']) result += '/says/'+matches['groups']['says'];

    result += "?" + numb;
    if(matches['groups']['options']) {
        let option;
        option = matches['groups']['options'].match(/(?:s(?:ize)=([\d]+))/);
        if(option) result += "&size=" + option[1];
        option = matches['groups']['options'].match(/(?:c(?:olor)=([\w]+))/);
        if(option) result += "&color=" + option[1];
        option = matches['groups']['options'].match(/(?:t(?:ype)=(sm(all)?|m(e)?d(ium)?|sq(uare)?|or(iginal)?))/);
        if(option) result += "&type=" + option[1];
        option = matches['groups']['options'].match(/(?:fi(?:lter)=(blur|mono|sepia|negative|paint|pixel))/);
        if(option) result += "&filter=" + option[1];
        option = matches['groups']['options'].match(/(?:wi(?:dth)=([\d]+))/);
        if(option) result += "&width=" + option[1];
        option = matches['groups']['options'].match(/(?:he(?:ight)=([\d]+))/);
        if(option) result += "&height=" + option[1];
    } 
    return result;
};
const random = (min, max) => Math.floor(Math.random() * (max - min) + min);
const replacer = (match, p1, p2) => { if(p1) return p1; if(p2) return '%3F'; };
const encode = (args) => (typeof args === 'string') ? encodeURI(args.replace(/^\/?/, '/')).replace(/(\?\w*=\w*)|(\?)/g, replacer) : '';
bot.command('cat', async (ctx) => {
    const args = ctx.state.command.args;
    const request = 'https://cataas.com/cat' + parser(encode(args), random(1, 1000)); 
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
