const fetch = require('node-fetch');
const {
  cleanMessage,
  wrapInCodeBlock,
  escapeMarkdown,
} = require('./telegram/utils');

const api = 'https://dreamland.rocks/api';
//const api = 'http://localhost:1235';

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

  async admin(args) {
    const response = await enqueueToDream(`${api}/admin`, this.options(args));
    if (!response.ok)
      return response.statusText;

    const commandResult = await response.json();
    return wrapInCodeBlock(commandResult.message);
  }

  // --- passwordless account layer (Phase 3, Trello 2zFpQBoW / ACCOUNTS_NANNY_ROADMAP.md) ---
  // These hit /account/{redeem,info,resetpw}. They ship dark: while in-game minting
  // is gated off no live codes exist, so redeem always reports an invalid code and
  // no account is created. Returned strings are user-facing (UA), like link()/who().

  // Redeem a DL-XXXXX code minted in-game against this messenger identity.
  // args: { code, identityType: 'telegram'|'discord', value: <numeric id>, display? }
  async redeem(args) {
    const response = await enqueueToDream(`${api}/account/redeem`, this.options(args));
    if (!response) return 'DreamLand не відповідає, спробуй пізніше.';

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      const char = data.char || 'персонаж';
      return data.created
        ? `Акаунт створено, персонаж ${char} привʼязаний. Тепер усі твої персонажі під одним дахом.`
        : `Персонаж ${char} привʼязаний до твого акаунта.`;
    }

    const reason = await response.text().catch(() => '');
    if (response.status === 400 && /another account/i.test(reason))
      return 'Цей персонаж уже привʼязаний до іншого акаунта.';
    if (response.status === 400)
      return 'Код невірний або протермінований. У грі набери «аккаунт связать» і спробуй свіжий код (він живе 10 хвилин).';
    if (response.status === 404)
      return 'Персонаж не знайдений — його видалили чи перейменували після того, як ти отримав код?';
    return 'Сталася помилка, спробуй пізніше.';
  }

  // Show the account behind this identity: attached characters + login methods.
  // args: { identityType, value }
  async accountInfo(args) {
    const response = await enqueueToDream(`${api}/account/info`, this.options(args));
    if (!response) return 'DreamLand не відповідає, спробуй пізніше.';

    if (response.status === 404)
      return 'До цієї адреси ще не привʼязано жодного акаунта. Отримай код у грі командою «аккаунт связать».';
    if (!response.ok) return 'Сталася помилка, спробуй пізніше.';

    const data = await response.json().catch(() => ({}));
    const chars =
      data.chars && data.chars.length ? data.chars.join(', ') : 'поки жодного';
    const methods =
      data.identities && data.identities.length
        ? data.identities.map(i => i.type).join(', ')
        : '—';

    return wrapInCodeBlock(
      `Акаунт: ${data.account}\n` +
        `Персонажі: ${chars}\n` +
        `Способи входу: ${methods}`
    );
  }

  // Reset one character's password to a fresh temporary one (forced change on next
  // login). The temp password is a SECRET -- callers MUST deliver it privately.
  // args: { identityType, value, char }
  async resetpw(args) {
    const response = await enqueueToDream(`${api}/account/resetpw`, this.options(args));
    if (!response) return 'DreamLand не відповідає, спробуй пізніше.';

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return (
        `Тимчасовий пароль для ${data.char}: ${data.password}\n` +
        'Зайди в гру цим паролем — гра одразу попросить задати новий.'
      );
    }

    const reason = await response.text().catch(() => '');
    if (response.status === 400 && /not on this account/i.test(reason))
      return 'Цей персонаж не на твоєму акаунті.';
    if (response.status === 400)
      return 'Імʼя персонажа — тільки латиницею (це логін-імʼя).';
    if (response.status === 404 && /no account/i.test(reason))
      return 'У тебе ще нема акаунта. Спершу привʼяжи персонажа: у грі «аккаунт связать», потім /attach тут.';
    if (response.status === 404) return 'Персонаж не знайдений.';
    return 'Сталася помилка, спробуй пізніше.';
  }

  async updateAll(args) {
    await enqueueToDream(`${api}/update/all`, this.options(args));
  }

  async updateOne(args) {
    await enqueueToDream(`${api}/update/one`, this.options(args));
  }
}

module.exports = DreamLand;
