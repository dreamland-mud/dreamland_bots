const fetch = require('node-fetch');
const {
  cleanMessage,
  wrapInCodeBlock,
  escapeMarkdown,
} = require('./telegram/utils');

const api = 'https://dreamland.rocks/api';

let toDream = Promise.resolve();

const enqueueToDream = (url, options = {}) => {
  const chain = async prev => {
    try {
      await prev;
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      console.log('DreamLand error', error);
    }
  };

  toDream = chain(toDream);
  return toDream;
};

class DreamLand {
  constructor(bottype) {
    this.bottype = bottype;
    this.token = process.env.DREAMLAND_TOKEN;
    this.types = {
      bug: { url: '/bug', title: '_Баг-репорт:_\n\n' },
      typo: { url: '/typo', title: '_Друкарська помилка:_\n\n' },
      idea: { url: '/idea', title: '_Ідея:_\n\n' },
      nohelp: { url: '/nohelp', title: '_Відсутність розділу довідки:_\n\n' },
    };
  }

  body(args) {
    return { args, token: this.token, bottype: this.bottype };
  }

  options(args) {
    return { method: 'POST', body: JSON.stringify(this.body(args)) };
  }

  async sendReport(type, args) {
    const { url, title } = this.types[type];

    const cleanedMessage = cleanMessage(args.message);
    const wrappedMessage = wrapInCodeBlock(cleanedMessage);

    const response = await enqueueToDream(`${api}${url}`, this.options(args));

    let result;

    if (response.ok) {
      const { id } = args;

      result =
        `${title}` +
        `*Відправник:* ${escapeMarkdown(id)}\n` +
        `${wrappedMessage}` +
        `${title.trim()} успішно надіслано.`;
    } else {
      result = `Цей користувач Telegram не повʼязан з жодним персонажем. Використовуй *'режим телеграм'* у грі.`;
    }

    return result;
  }

  async who() {
    const args = { message: '' };
    const response = await enqueueToDream(`${api}/who`, this.options(args));
    const who = await response.json();

    let result = '';

    if (who.total === 0) {
      result = 'У світі нікого немає!';
    } else {
      if (who.people && who.people.length > 0)
        result +=
          '\nЗараз у світі:\n\n' +
          who.people
            .map(
              p =>
                (p.name.ru || p.name.en) +
                ', ' +
                p.race.ru +
                (p.clan ? ', клан ' + p.clan.en : '')
            )
            .join('\n');

      if (who.discord && who.discord.length > 0)
        result +=
          '\n\nЧують канали: ' +
          who.discord.map(p => p.name.ru || p.name.en).join(', ');

      result += '\n\nУсього гравців: ' + who.total + '.';
    }

    return wrapInCodeBlock(result);
  }

  async whois(playerName) {
    const args = { message: playerName };
    const response = await enqueueToDream(`${api}/whois`, this.options(args));

    const whoisData = await response.json();

    let result = '';

    if (response.ok && !whoisData.error) {
      const name = whoisData.name?.ru || whoisData.name?.en || playerName;
      const race = whoisData.race || 'Невідомо';
      const clan = whoisData.clan ? whoisData.clan.name : 'Нет';
      const remorts = whoisData.remorts || '0';
      const title = whoisData.clan?.title
        ? `Титул у клані: ${whoisData.clan.title}\n`
        : '';
      const capitalizedPlayerName =
        name.charAt(0).toUpperCase() + name.slice(1);

      result =
        `Інформація про гравця:\n\n` +
        `Ім'я: ${capitalizedPlayerName}\n` +
        `Раса: ${race}\n` +
        `Клан: ${clan}\n` +
        title +
        `Кількість перероджень: ${remorts}`;
    } else if (whoisData.error === 'player not found') {
      result = `Персонаж із таким ім'ям не знайдений`;
    } else {
      result = 'Сталася помилка, спробуйте пізніше.';
    }

    return wrapInCodeBlock(result);
  }

  async ooc(args) {
    const response = await enqueueToDream(`${api}/ooc`, this.options(args));
    let result;

    if (response.ok) result = undefined;
    else if (response.status === 404)
      result =
        'Ти не приєднаний до жодного персонажа. Зайди в DreamLand і набери config' +
        this.bottype +
        '.';
    else result = 'Відбулася помилка, спробуй пізніше.';

    return result;
  }

  async link(args) {
    const response = await enqueueToDream(`${api}/link`, this.options(args));
    let result;

    if (response.ok) result = 'Успішно приєднано до персонажа.';
    else if (response.status === 404)
      result =
        'Персонажу з таким секретним словом немає. Зайди в DreamLand і набери config' +
        this.bottype +
        '.';
    else result = 'Відбулася помилка, спробуй пізніше.';

    return result;
  }

  async updateAll(args) {
    await enqueueToDream(`${api}/update/all`, this.options(args));
  }

  async updateOne(args) {
    await enqueueToDream(`${api}/update/one`, this.options(args));
  }
}

module.exports = DreamLand;
