# dreamland_bots
Telegram and Discord bots for DreamLand MUD

## Discord bot, Valkyrie

This bot uses [Discord.js](https://github.com/discordjs/) library. It integrates with [DreamLand MUD](https://github.com/dreamland-mud/dreamland_code) sending commands to DreamLand API. On Discord #dreamland* channels, the following commands become available:

* For everyone: `/who` command, to see who's currently in the game, their name, race and clan.
* For all players: `/link` command, to link your game character with your Discord account.
* For linked players: `/ooc` command, to send messages from Discord straight into OOC channel inside the game.

In addition, the bot notifies DreamLand API each time a new user comes offline or online, that way `who` command inside the MUD can show which linked players are listening in and their online/away/busy status.

To test the bot on your own Discord and DreamLand servers:

* Register a bot following [this tutorial](https://medium.com/davao-js/2019-tutorial-creating-your-first-simple-discord-bot-47fc836a170b) and invite it to your Discord server.

* Grab your bot's token and put it into `dreamland_bots/discord/auth.json` file, as described in the tutorial. 

* Compile and launch DreamLand MUD following [this instruction](https://github.com/dreamland-mud/dreamland_code/blob/master/README.en.md).

* Generate random token for authentication with DreamLand API. Save it in two places:
    * On MUD side, inside the `/path/to/runtime/var/misc/dreamland_bot.token` file, e.g. `echo owi49slslsl > var/misc/dreamland_bot.token`
    * On bot side, inside the `DREAMLAND_TOKEN` environment variable, e.g. `export DREAMLAND_TOKEN=owi49slslsl`

* Run the bot:
```bash
cd discord
npm i
npm run start
```

* Log in to the game, type `config discord` and execute `/link xxx` command mentioned there in a chat with the bot.

* Type `/who`, `/ooc some message` commands in a chat with the bot or on a channel whose name starts with #dreamland.


## Telegram bot, Hassan

This bot uses [Telegraf](https://github.com/telegraf/telegraf) library. You can easily create your own bot by [chatting to Bot Father](https://core.telegram.org/bots#6-botfather)
and use it for testing the commands available via DreamLand API.

* Get the bot token from Bot Father and export it in an environment variable, for example:
```bash
export BOT_TOKEN=110201543:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
```

* Run the bot locally:
```bash
cd telegram
npm i
npm run start
```

* In Telegram, invite the bot to a channel or chat privately. Try sending `/start` and `/help` commands.




