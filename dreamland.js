const fetch = require('node-fetch');
const api = 'https://dreamland.rocks/api';

let toDream = Promise.resolve();

const enqueueToDream = (url, options={}) => {
    const chain = async (prev) => {
        try {
            await prev;
            console.log('Calling', url, 'options', options);
            const response = await fetch(url, options);
            console.log('DreamLand response', response.status, response.statusText);
            return response;

        } catch (error) {
            console.log('DreamLand error', error);
        }
    }

    toDream = chain(toDream);
    return toDream;
};

class DreamLand {
    constructor(bottype) {
        this.bottype = bottype;
        this.token = process.env.DREAMLAND_TOKEN;
    }
    
    body(args) {
        return {args, token: this.token, bottype: this.bottype};
    }

    options(args) {
        return {method: 'POST', body: JSON.stringify(this.body(args))};
    }
    
    async who() {
        const response = await enqueueToDream(`${api}/who`);
        const who = await response.json();
        let result;

        if (who.total === 0) {
            result = 'В мире никого нет!';
        } else {
            result = 
                  '```\nСейчас в мире:\n\n'

                   + who.people
                       .map(p =>
                            (p.name.ru || p.name.en) + ', ' + p.race.ru + (p.clan ? ', клан ' + p.clan.en : '')
                       ).join('\n')

                   + '\n\nВсего игроков: ' + who.total + '.\n```';
        }

        return result;
    }


    async ooc(args) {
        const response = await enqueueToDream(`${api}/ooc`, this.options(args));
        let result

        if (response.ok)
            result = undefined
        else if (response.status === 404)
            result = 'Ты не присоединен ни к одному персонажу. Зайди в DreamLand и набери config ' + this.bottype + '.'
        else
            result = 'Произошла ошибка, попробуй позже.'

        return result
    }


    async link(args) {
        const response = await enqueueToDream(`${api}/link`, this.options(args));
        let result

        if (response.ok)
            result = 'Успешно присоединен к персонажу.'
        else if (response.status === 404)
            result = 'Персонажа с таким секретным словом не существует. Зайди в DreamLand и набери config ' + this.bottype + '.'
        else
            result = 'Произошла ошибка, попробуй позже.'

        return result
    }

    async updateAll(args) {
        await enqueueToDream(`${api}/update/all`, this.options(args));
    }

    async updateOne(args) {
        await enqueueToDream(`${api}/update/one`, this.options(args));
    }
}

module.exports = DreamLand;
