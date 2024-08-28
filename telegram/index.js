const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const DreamLand = require('../dreamland.js');
const dreamland = new DreamLand('telegram');
const commandArgsMiddleware = require('./commandArgs');
const fetch = require('node-fetch');

// 'start' - standard bot command
bot.start(ctx =>
  ctx.reply(
    'Привіт, я Хасан і я скоро порозумнішаю. Набери /help для списку команд.'
  )
);

bot.use(commandArgsMiddleware());

// 'help' command that combines both listing and custom functionality
bot.command('help', async ctx => {
  const command = ctx.state.command;
  let args = '';

  if (command && typeof command.args === 'string') {
    args = command.args.trim();
  }

  if (args && !isNaN(args)) {
    const helpId = args;

    const helpUrl = `https://dreamland.rocks//help/${helpId}.html`;

    try {
      await ctx.replyWithMarkdown(`[Справка # ${helpId}](${helpUrl})`);
    } catch (error) {
      console.error('Помилка під час виконання команди /help:', error);
      ctx.reply(
        'Сталася помилка під час генерації посилання. Будь ласка, спробуйте пізніше.'
      );
    }
  } else {
    ctx.reply(
      '/who                - показати хто в світі\n' +
        '/who [імʼя]         - інформація про конкретного гравця\n' +
        '/bug               - відправити баг-репорт\n' +
        '/typo              - повідомити про друкарську помилку\n' +
        '/idea              - відправити ідею\n' +
        '/nohelp            - повідомити про відсутність розділу допомоги\n' +
        '/cat               - випадковий котик\n' +
        '/cat says/meow meow - кіт з написом\n' +
        '/cat hat/says/hello - кіт з тегом hat і написом\n' +
        '/cat gif           - анімований кіт\n' +
        '/cat says/hello?color=orange  - кіт з написом помаранчевим кольором\n' +
        '/cat says/aloha?color=red&filter=sepia  - кіт з написом червоним кольором в сепії\n' +
        '   доступні опції:\n' +
        '   color - колір тексту;\n' +
        '   size - розмір шрифту;\n' +
        '   type - тип картинки (small, medium, square, original);\n' +
        '   filter - фільтр (blur,mono,sepia,negative,paint,pixel);\n' +
        '   width|height - ширина або висота картинки в пікселях;\n' +
        'Деталі на https://cataas.com/'
    );
  }
});

bot.use(commandArgsMiddleware());

bot.command('bug', async ctx => {
  await handleReportCommand(ctx, 'bug');
});

bot.command('typo', async ctx => {
  await handleReportCommand(ctx, 'typo');
});

bot.command('idea', async ctx => {
  await handleReportCommand(ctx, 'idea');
});

bot.command('nohelp', async ctx => {
  await handleReportCommand(ctx, 'nohelp');
});

async function handleReportCommand(ctx, type) {
  const args = ctx.state.command.args;

  if (!args || typeof args !== 'string' || args.trim() === '') {
    return ctx.reply(
      `Будь ласка, вкажіть опис після команди /${ctx.state.command.command}.`
    );
  }

  const userId = ctx.from.username
    ? `@${ctx.from.username}`
    : ctx.from.first_name;

  const reportData = {
    id: userId,
    message: args,
  };

  try {
    const response = await dreamland.sendReport(type, reportData);
    ctx.replyWithMarkdown(response);
  } catch (error) {
    console.error('Помилка під час надсилання повідомлення:', error);
    ctx.reply(
      'Сталася помилка під час надсилання повідомлення. Спробуйте пізніше.'
    );
  }
}

bot.command('who', async ctx => {
  const args = { message: ctx.state.command.args };

  let response;

  try {
    if (args.message.length > 0) {
      response = await dreamland.whois(args.message);
    } else {
      response = await dreamland.who();
    }

    ctx.replyWithMarkdown(response);
  } catch (error) {
    console.error('Помилка під час виконання команди /who:', error);
    ctx.reply(
      'Сталася помилка під час отримання інформації. Будь ласка, спробуйте пізніше.'
    );
  }
});

console.log('Bot is starting...');

bot.catch(err => {
  console.log('Bot encountered an error:', err);
});

// 'cat' command for generating cat images
const parser = (str, numb) => {
  let result = '';
  let matches = str.match(
    /^\/(?:(?<tag>\w*)(?:\/)?)?((?:says\/)(?<says>[^?]*))?(?:\?(?<options>.*))?$/
  );

  if (!matches) return result + '?' + numb;

  if (matches['groups']['tag']) result += '/' + matches['groups']['tag'];
  if (matches['groups']['says']) result += '/says/' + matches['groups']['says'];

  result += '?' + numb;
  if (matches['groups']['options']) {
    let option;
    option = matches['groups']['options'].match(/(?:s(?:ize)=([\d]+))/);
    if (option) result += '&size=' + option[1];
    option = matches['groups']['options'].match(/(?:c(?:olor)=([\w]+))/);
    if (option) result += '&color=' + option[1];
    option = matches['groups']['options'].match(
      /(?:t(?:ype)=(sm(all)?|m(e)?d(ium)?|sq(uare)?|or(iginal)?))/
    );
    if (option) result += '&type=' + option[1];
    option = matches['groups']['options'].match(
      /(?:fi(?:lter)=(blur|mono|sepia|negative|paint|pixel))/
    );
    if (option) result += '&filter=' + option[1];
    option = matches['groups']['options'].match(/(?:wi(?:dth)=([\d]+))/);
    if (option) result += '&width=' + option[1];
    option = matches['groups']['options'].match(/(?:he(?:ight)=([\d]+))/);
    if (option) result += '&height=' + option[1];
  }
  return result;
};

const random = (min, max) => Math.floor(Math.random() * (max - min) + min);

const replacer = (match, p1, p2) => {
  if (p1) return p1;
  if (p2) return '%3F';
};

const encode = args =>
  typeof args === 'string'
    ? encodeURI(args.replace(/^\/?/, '/')).replace(
        /(\?\w*=\w*)|(\?)/g,
        replacer
      )
    : '';

bot.command('cat', async ctx => {
  const args = ctx.state.command.args;
  const request =
    'https://cataas.com/cat' + parser(encode(args), random(1, 1000));
  const response = await fetch(request);

  if (response.ok) {
    if (response.headers.get('content-type') === 'image/gif')
      return ctx.replyWithDocument(request);
    else return ctx.replyWithPhoto(request);
  }

  if (response.status === 404)
    return ctx.reply('Неправильний запит читайте /help');

  return ctx.reply('Якась помилка, спробуйте пізніше.');
});

bot.use((ctx, next) => {
  console.log('Middleware triggered');
  return next();
});

bot.launch();
