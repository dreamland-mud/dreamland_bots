import requests
import json
import logging
import dl
from aiogram import Bot, Dispatcher, executor, types
from aiogram.contrib.fsm_storage.memory import MemoryStorage
from aiogram.dispatcher import FSMContext
from aiogram.dispatcher.filters.state import State, StatesGroup


class UserState(StatesGroup):
    TYPO = State()
    BUG = State()
    IDEA = State()
    NOHELP = State()
    # user_data = await state.get_data()
    # await state.finish()


logging.basicConfig(level=logging.INFO)
#bot = Bot(token='1740013764:AAEBYxpTnKgUpebaIog7Ow7qhDXEBhaZZqY')
bot = Bot(token='1055339561:AAHZBHX6bzm75nZAOOA1V5fwGsCYCz9ojxY')
dp = Dispatcher(bot, storage=MemoryStorage())

@dp.message_handler(commands=['start'])
async def welcome(message: types.Message):
    mess = 'Ааа, еще один искатель приключений. Что, снова что-то надо проверить? Ну давай-давай, подходи, у меня все записано..\n\n' \
           '(Помни, команда /help покажет список всех доступных команд!)'
    await bot.send_message(message.chat.id, mess)


@dp.message_handler(commands=['help'])
async def showcommand(message: types.Message):
    mess = '/help - выведет это сообщение;\n/typo - отправить отчет об ошибке/опечатке;\n' \
           '/bug - отправить отчет о баге;\n/idea - предложить идею;\n' \
           '/nohelp - отправить отчет об отсутсвии раздела справки.\n\n' \
           '<i>!typo текст</i> - отправить отчет об ошибке/опечатке;\n' \
           '<i>!bug текст</i> - отправить отчет о баге;\n' \
           '<i>!idea текст</i> - предложить идею;\n' \
           '<i>!nohelp текст</i> - отправить отчет об отсутсвии раздела справки.\n\n' \
           'Чтобы посмотреть любой раздел справки из бота - отправь текст формата: ?название_статьи'
    await bot.send_message(message.chat.id, mess, parse_mode='html')


@dp.message_handler(commands=['typo'])
async def typo(message: types.Message):
    await bot.send_message(message.chat.id, 'О какой именно опечатке ты хочешь сообщить?')
    await UserState.TYPO.set()


@dp.message_handler(commands=['bug'])
async def typo(message: types.Message):
    await bot.send_message(message.chat.id, 'О какой именно ошибке ты хочешь сообщить?')
    await UserState.BUG.set()


@dp.message_handler(commands=['idea'])
async def typo(message: types.Message):
    await bot.send_message(message.chat.id, 'О какой именно идее ты хочешь сообщить?')
    await UserState.IDEA.set()


@dp.message_handler(commands=['nohelp'])
async def typo(message: types.Message):
    await bot.send_message(message.chat.id, 'Об отсутствии какого раздела справки ты хочешь сообщить?')
    await UserState.NOHELP.set()

async def send(message, cmd):
    msg = message.text
    url = dl.endpoint(cmd)
    author = message.from_user.id
    response = requests.post(url, data=dl.payload(author, msg))
    await bot.send_message(message.chat.id, response)


@dp.message_handler(state=UserState.TYPO)
async def send_typo(message, state: FSMContext):
    await send(message, 'typo')
    await state.finish()

@dp.message_handler(state=UserState.BUG)
async def send_bug(message, state: FSMContext):
    await send(message, 'bug')
    await state.finish()

@dp.message_handler(state=UserState.IDEA)
async def send_idea(message, state: FSMContext):
    await send(message, 'idea')
    await state.finish()

@dp.message_handler(state=UserState.NOHELP)
async def send_typo(message, state: FSMContext):
    await send(message, 'nohelp')
    await state.finish()


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
        await bot.send_message(message.chat.id, 'Функционал справочника находится в разработке..')
    else:
        pass


if __name__ == '__main__':
    executor.start_polling(dp)
