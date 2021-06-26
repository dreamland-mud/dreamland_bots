import requests
import json
import logging
import dl
from aiogram import Bot, Dispatcher, executor, types
from aiogram.contrib.fsm_storage.memory import MemoryStorage
from aiogram.dispatcher import FSMContext
from aiogram.dispatcher.filters.state import State, StatesGroup


logging.basicConfig(level=logging.INFO)
# bot = Bot(token='1740013764:AAEBYxpTnKgUpebaIog7Ow7qhDXEBhaZZqY')
bot = Bot(token='1055339561:AAHZBHX6bzm75nZAOOA1V5fwGsCYCz9ojxY')
dp = Dispatcher(bot, storage=MemoryStorage())


@dp.message_handler(commands=['start'])
async def welcome(message: types.Message):
    mess = 'Ааа, еще один искатель приключений. Что, снова что-то надо проверить? Ну давай-давай, подходи, у меня все записано..\n\n' \
           '(Помни, команда /help покажет список всех доступных команд!)'
    await bot.send_message(message.chat.id, mess)


@dp.message_handler(commands=['help'])
async def show_command(message: types.Message):
    mess = '<i>!typo текст</i> - отправить отчет об ошибке/опечатке;\n' \
           '<i>!bug текст</i> - отправить отчет о баге;\n' \
           '<i>!idea текст</i> - предложить идею;\n' \
           '<i>!nohelp текст</i> - отправить отчет об отсутсвии раздела справки.\n\n' \
           'Чтобы посмотреть любой раздел справки из бота - отправь текст формата: ?название_статьи'
    await bot.send_message(message.chat.id, mess, parse_mode='html')


@dp.message_handler()
async def allmsg(message: types.Message):
    user_data = message.text

    if user_data.startswith('!'):
        cmd = dl.command(user_data)
        if not cmd:
            pass

        newmsg = user_data[1+len(cmd):]
        url = dl.endpoint(cmd)
        author = message.from_user.id
        response = requests.post(url, data=dl.payload(author, newmsg))
        await bot.send_message(message.chat.id, response)

    elif user_data.startswith('?'):
        url = dl.endpoint('skill')
        new_user_data = user_data.replace('?', '')
        response = requests.request(url, data=dl.desc(new_user_data))
        await bot.send_message(message.chat.id, response)
    else:
        pass


if __name__ == '__main__':
    executor.start_polling(dp)
