const fetch = require('node-fetch')
const api = 'https://dreamland.rocks/api'

module.exports = {
    who: async () => {
        const response = await fetch(`${api}/who`)
        const who = await response.json()
        let result

        if (who.total === 0) {
            result = 'В мире никого нет!'
        } else {
            result = 
                  '```\nСейчас в мире:\n\n'

                   + who.people
                       .map(p =>
                            (p.name.ru || p.name.en) + ', ' + p.race.ru + (p.clan ? ', клан ' + p.clan.en : '')
                       ).join('\n')

                   + '\n\nВсего игроков: ' + who.total + '.\n```'
        }

        return result
    },


    ooc: async (body) => {
        const options = {method: 'POST', body: JSON.stringify(body) }
        const response = await fetch (`${api}/ooc`, options)
        let result

        if (response.ok)
            result = undefined
        else if (response.status === 404)
            result = 'Ты не присоединен ни к одному персонажу. Зайди в DreamLand и набери config ' + body.bottype + '.'
        else
            result = 'Произошла ошибка, попробуй позже.'

        return result
    },


    link: async (body) => {
        const options = {method: 'POST', body: JSON.stringify(body) }
        const response = await fetch (`${api}/link`, options)
        let result

        if (response.ok)
            result = 'Успешно присоединен к персонажу.'
        else if (response.status === 404)
            result = 'Персонажа с таким секретным словом не существует. Зайди в DreamLand и набери config ' + body.bottype + '.'
        else
            result = 'Произошла ошибка, попробуй позже.'

        return result
    }
}

