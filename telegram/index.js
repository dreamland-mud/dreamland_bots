const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const Markup = require('telegraf/markup');
const Extra = require('telegraf/extra');
const DreamLand = require('../dreamland.js');
const dreamland = new DreamLand('telegram');
const commandArgsMiddleware = require('./commandArgs');
const fetch = require('node-fetch');

// A rejected reply (a message in a CLOSED forum topic of our channel, a user who
// blocked the bot, any Telegram 400) must never crash the process. Fire-and-forget
// replies bypass bot.catch and would otherwise surface as an unhandled rejection
// that kills the bot; systemd respawns it and it dies again on the next trigger.
// Log it and keep serving.
process.on('unhandledRejection', reason => {
  console.log('Unhandled rejection:', (reason && (reason.description || reason.message)) || reason);
});

// 'start' - standard bot command. A t.me/<bot>?start=DL-XXXXX deep link arrives
// as "/start DL-XXXXX" -- one tap redeems the account linking code. Parse the
// payload straight off the message text: bot.start is registered before the
// commandArgs middleware, so ctx.state.command is not set here yet.
bot.start(async ctx => {
  const text = (ctx.message && ctx.message.text) || '';
  const payload = text.split(/\s+/)[1] || '';

  if (/^DL-/i.test(payload)) {
    const display = ctx.from.username
      ? '@' + ctx.from.username
      : ctx.from.first_name;
    const result = await dreamland.redeem({
      code: payload,
      identityType: 'telegram',
      value: String(ctx.from.id),
      display,
    });
    return ctx.reply(result);
  }

  return ctx.reply(
    'Привіт, я Хасан і я скоро порозумнішаю. Набери /help для списку команд.'
  );
});

bot.use(commandArgsMiddleware());

// 'help' command that combines both listing and custom functionality
bot.command('help', async ctx => {
  const command = ctx.state.command;
  let args = '';

  if (command && typeof command.args === 'string') {
    args = command.args.trim();
  }

  if (args) {
    if (/^\d+$/.test(args)) {
      const helpId = args;
      const helpUrl = `https://dreamland.rocks/help/${helpId}.html`;

      try {
        const response = await fetch(helpUrl);

        if (response.ok) {
          await ctx.replyWithMarkdown(`[Справка # ${helpId}](${helpUrl})`);
        } else if (response.status === 404) {
          ctx.reply(`Довідка з номером #${helpId} не знайдена.`);
        }
      } catch (error) {
        console.error('Помилка під час виконання команди /help:', error);
        ctx.reply(
          'Сталася помилка під час генерації посилання. Будь ласка, спробуйте пізніше.'
        );
      }
    } else {
      ctx.reply(
        'Будь ласка, введіть коректний номер довідки (тільки цифри, без пробілів та спеціальних символів).'
      );
    }
  } else {
    ctx.reply(
      '/who                - показати хто в світі\n' +
        '/who [імʼя]         - інформація про конкретного гравця\n' +
        '/help [id]          - отримати посилання на довідку з вказаним ідентифікатором\n' +
        '/bug               - відправити баг-репорт\n' +
        '/typo              - повідомити про друкарську помилку\n' +
        '/idea              - відправити ідею\n' +
        '/nohelp            - повідомити про відсутність розділу допомоги\n' +
        '/account           - показати твій акаунт і привʼязані персонажі\n' +
        '/attach DL-XXXXX   - привʼязати персонажа кодом з гри («аккаунт связать»)\n' +
        '/reset імʼя        - скинути пароль персонажа (тільки в приваті)\n' +
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

// --- passwordless account layer (Phase 3) ---

bot.command('account', async ctx => {
  const result = await dreamland.accountInfo({
    identityType: 'telegram',
    value: String(ctx.from.id),
  });
  ctx.replyWithMarkdown(result);
});

bot.command('attach', async ctx => {
  const code = (ctx.state.command.args || '').toString().trim();
  if (!/^DL-/i.test(code)) {
    return ctx.reply(
      'Використання: /attach DL-XXXXX. Код отримаєш у грі командою «аккаунт связать».'
    );
  }
  const display = ctx.from.username
    ? '@' + ctx.from.username
    : ctx.from.first_name;
  const result = await dreamland.redeem({
    code,
    identityType: 'telegram',
    value: String(ctx.from.id),
    display,
  });
  ctx.reply(result);
});

bot.command('reset', async ctx => {
  // The temp password is a secret -- refuse in groups so it can't land in a
  // shared chat. Private chat only.
  if (ctx.chat && ctx.chat.type !== 'private') {
    return ctx.reply(
      'Скидання пароля — тільки в приваті. Напиши мені /reset імʼя_персонажа особисто.'
    );
  }
  const char = (ctx.state.command.args || '').toString().trim();
  if (!char) {
    return ctx.reply('Використання: /reset імʼя_персонажа (латиницею).');
  }
  const result = await dreamland.resetpw({
    identityType: 'telegram',
    value: String(ctx.from.id),
    char,
  });
  ctx.reply(result);
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
