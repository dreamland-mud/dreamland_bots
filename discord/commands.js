// Slash command definitions, shared by index.js (dispatch) and register-commands.js.
// Names stay English everywhere; descriptions follow the user's Discord language.

const { ApplicationCommandOptionType } = require('discord.js');

const text = (en, uk, ru) => ({ en, loc: { uk, ru } });

const cmd = (name, d, options = []) => ({
  name,
  description: d.en,
  description_localizations: d.loc,
  dm_permission: true,
  options,
});

const stringOption = (name, d) => ({
  type: ApplicationCommandOptionType.String,
  name,
  description: d.en,
  description_localizations: d.loc,
  required: true,
});

module.exports = [
  cmd('who', text(
    'Who is in the world right now',
    'Хто зараз у світі',
    'Кто сейчас в мире')),

  cmd('ooc', text(
    'Say something on the OOC channel in the game',
    'Сказати щось у канал OOC у грі',
    'Сказать что-то в канал OOC в игре'), [
    stringOption('message', text('What to say', 'Що сказати', 'Что сказать')),
  ]),

  cmd('link', text(
    'Link your Discord to a character or an account',
    'Привʼязати Discord до персонажа чи акаунта',
    'Привязать Discord к персонажу или аккаунту'), [
    stringOption('code', text(
      'Secret word from config discord, or a DL-XXXXX account code',
      'Секретне слово з config discord або код акаунта DL-XXXXX',
      'Секретное слово из config discord или код аккаунта DL-XXXXX')),
  ]),

  cmd('account', text(
    'Show your DreamLand account',
    'Показати твій акаунт DreamLand',
    'Показать твой аккаунт DreamLand')),

  cmd('reset', text(
    'Get a temporary password for your character',
    'Отримати тимчасовий пароль для персонажа',
    'Получить временный пароль для персонажа'), [
    stringOption('character', text(
      'Character login name, in Latin letters',
      'Логін-імʼя персонажа латиницею',
      'Логин-имя персонажа латиницей')),
  ]),
];
