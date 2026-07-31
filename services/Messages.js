const { config } = require("../config");
function emojiParser(string) {
    const [_, name, id] = string.replace(/[<>]/g, '').split(':');
    return { id, name, animated: false };
}
module.exports = class Messages {
    constructor () {}
    generateMafiaTEMP(gameObject, flags) {
        if(gameObject.owner == '1199639783157268482') {
            return this.generateMafiaTEMP(gameObject, flags);
        }
        const gameStates = {
            picks: 'Поиск людей',
            game: 'Идёт игра',
            final: 'Финал'
        };
        const gameTimes = {
            day: 'День',
            night: 'Ночь',
            maintenance: 'Тех-Пауза'
        }
        const gameRoles = {
            civilian: 'Мирный житель',
            commissar: 'Комиссар',
            doctor: 'Доктор',
            mafia: 'Мафия',
            don: 'Дон',
            nothing: 'Нету'
        };
                    // `> Живые игроки **[${gameObject.members.filter(e => e.alive).filter(e => ['mafia', 'don'].includes(e.role)).length}/10]**`
                    // `> Живая мафия **[${gameObject.members.filter(e => ['mafia', 'don'].includes(e.role) && e.alive).length}/3]**`)
        return {
            content: `<@!${gameObject.owner}>`,
            embeds:[{
                title: 'Панель управления Мафией.',
                description: [
                    `Статус игры: **${gameStates[gameObject.state]}**`,
                    `Время: **${gameTimes[gameObject.time]}**`,
                    ``,
                    `> Живые игроки **[${gameObject.members.filter(e => e.alive).length}/10]**`,
                    `> Живая мафия **[${gameObject.members.filter(e => e.alive && ['mafia','don'].includes(e.role)).length}/3]**`,
                    ...gameObject.members.slice(0, 10).map((x,i) => `${config.slotIcons[i]} <@!${x.id}> | Роль: **${gameRoles[x.role]}** | Ф[**${x.folls}**] П[**${x.warns}**] | **${x.alive?'Жив':'Мёртв'}**`),
                ].join('\n')
            }],
            components: [
                {
                    type: 1,
                    components: new Array(5).fill(1).map((x,i) => ({
                        type: 2,
                        custom_id: `mafia.punish#foll#${(x+i)-1}`,
                        label: `Ф${(x+i).toString().padStart(2, '0')}`,
                        style: 1
                    }))
                },
                {
                    type: 1,
                    components: new Array(5).fill(1).map((x,i) => ({
                        type: 2,
                        custom_id: `mafia.punish#warn#${(x+i)-1}`,
                        label: `П${(x+i).toString().padStart(2, '0')}`,
                        style: 4
                    }))
                },
                {
                    type: 1,
                    components: new Array(5).fill(6).map((x,i) => ({
                        type: 2,
                        custom_id: `mafia.punish#foll#${(x+i)-1}`,
                        label: `Ф${(x+i).toString().padStart(2, '0')}`,
                        style: 1
                    }))
                },
                {
                    type: 1,
                    components: new Array(5).fill(6).map((x,i) => ({
                        type: 2,
                        custom_id: `mafia.punish#warn#${(x+i)-1}`,
                        label: `П${(x+i).toString().padStart(2, '0')}`,
                        style: 4
                    }))
                },
                {
                    type: 1,
                    components: [{
                        type: 3,
                        placeholder: 'Дополнительные опции',
                        options: [
                            ...gameObject.state == 'picks'?[{
                                label: 'Начать игру',
                                value: 'start'
                            },{
                                label: 'Удалить всех кто не в войсе',
                                value: 'remove_11'
                            }, ...gameObject.members.slice(0, 10).map((x,i) => ({
                                label: `Удалить игрока #${(i+1).toString().padStart(2, '0')}`,
                                value: `remove_`+i
                            }))]:[],
                            ...gameObject.state == 'game'?[{
                                label: 'Убить игрока',
                                value: 'kill'
                            },{
                                label: 'Чек / Хилл',
                                description: 'Отправить Комиссару и доктору меню выбора',
                                value: 'sendcheck'
                            },{
                                label: 'Сменить время суток',
                                value: 'switchtime'
                            },{
                                label: 'Отправить голосование',
                                value: 'sendvote'
                            },{
                                label: 'Убрать фолл',
                                value: 'delete_foll'
                            },{
                                label: 'Убрать пред',
                                value: 'delete_warn'
                            },{
                                label: 'Воскресить игрока',
                                value: 'revive'
                            },{
                                label: 'Лучший ход',
                                value: 'beststep'
                            },{
                                label: 'Отправить роли',
                                value: 'sendroles'
                            },{
                                label: 'Зарандомить роли',
                                value: 'randomroles'
                            },{
                                label: 'Закончить игру', // +
                                value: 'stop'
                            }]:[],
                            ...['picks', 'game']?[{
                                label: 'Передать хоста',
                                value: 'changeowner'
                            }]:[],
                            ...['final', 'picks'].includes(gameObject.state)?[{
                                label: 'Удалить комнату', // +
                                value: 'delete'
                            }]:[]
                        ],
                        custom_id: `mafia.actions`
                    }]
                },
            ]
        }
    }
    generateMafia(gameObject, flags) {
        const gameTimes = {
            day: 'День',
            night: 'Ночь',
            maintenance: 'Тех-Пауза'
        }
        const gameRoles = {
            civilian: config.additionalEmojies[0],
            commissar: config.additionalEmojies[1],
            doctor: config.additionalEmojies[2],
            mafia: config.additionalEmojies[5],
            don: config.additionalEmojies[3],
            nothing: config.additionalEmojies[8]
        };
        
        if(gameObject.state == 'picks') {
            return {
                ...(flags ? { flags: ['IsComponentsV2'] } : {}),
                components: [
                    {
                        type: 10,
                        content: `<@!${gameObject.owner}>`
                    },
                    {
                        type: 17,
                        components: [
                            {
                                type: 10,
                                content: "## Панель управления"
                            },
                            {
                                type: 14,
                                spacing: 2
                            },
                            {
                                type: 10,
                                content: [
                                    `> Игроки **[${gameObject.members.length}/10]**`
                                ].join('\n')
                            },
                            {
                                type: 1,
                                components: [
                                    ...(gameObject.members.length < 10 ? [
                                        {
                                            type: 2,
                                            style: 2,
                                            label: 'Пингануть роль Mafia',
                                            custom_id: 'mafia.ping#role'
                                        }
                                    ] : [
                                        {
                                            type: 2,
                                            style: 2,
                                            label: 'Пингануть игроков',
                                            custom_id: 'mafia.ping#voice'
                                        },
                                        {
                                            type: 2,
                                            style: 3,
                                            label: 'Начать игру',
                                            custom_id: 'mafia.actions#start'
                                        }
                                    ]),
                                    {
                                        type: 2,
                                        style: 2,
                                        label: "Удалить стол",
                                        custom_id: 'mafia.actions#delete'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        } else if (gameObject.state == 'game') {
            return {
                ...(flags ? { flags: ['IsComponentsV2'] } : {}),
                components: [
                    {
                        type: 10,
                        content: `<@!${gameObject.owner}>`
                    },
                    {
                        type: 17,
                        components: [
                            {
                                type: 10,
                                content: "## Панель управления"
                            },
                            {
                                type: 14,
                                spacing: 2
                            },
                            {
                                type: 10,
                                content: [
                                    `Статус игры: **${gameTimes[gameObject.time]}**`,
                                    ...!gameObject.chat?[`**ЧАТ ЗАКРЫТ**`]:[],
                                    ``,
                                    `> Живые игроки **[${gameObject.members.filter(e => e.alive).length}/10]**`,
                                    `> Живая мафия **[${gameObject.members.filter(e => e.alive && ['mafia','don'].includes(e.role)).length}/3]**`,
                                    ...gameObject.members.map((x,i) => `${config.slotIcons[i]} ${gameRoles[x.role]} | Ф[\`${x.folls}\`] П[\`${x.warns}\`] | ${x.alive?'Жив':'Мёртв'}`)
                                ].join('\n')
                            },
                            {
                                type: 1,
                                components: new Array(5).fill(1).map((x,i) => ({
                                    type: 2,
                                    custom_id: `mafia.punish#foll#${(x+i)-1}`,
                                    label: `Ф${(x+i).toString().padStart(2, '0')}`,
                                    style: 2
                                }))
                            },
                            {
                                type: 1,
                                components: new Array(5).fill(1).map((x,i) => ({
                                    type: 2,
                                    custom_id: `mafia.punish#warn#${(x+i)-1}`,
                                    label: `П${(x+i).toString().padStart(2, '0')}`,
                                    style: 3
                                }))
                            },
                            {
                                type: 1,
                                components: new Array(5).fill(6).map((x,i) => ({
                                    type: 2,
                                    custom_id: `mafia.punish#foll#${(x+i)-1}`,
                                    label: `Ф${(x+i).toString().padStart(2, '0')}`,
                                    style: 2
                                }))
                            },
                            {
                                type: 1,
                                components: new Array(5).fill(6).map((x,i) => ({
                                    type: 2,
                                    custom_id: `mafia.punish#warn#${(x+i)-1}`,
                                    label: `П${(x+i).toString().padStart(2, '0')}`,
                                    style: 3
                                }))
                            }
                        ]
                    },
                    {
                        type: 1,
                        components: [{
                            type: 3,
                            custom_id: 'mafia.time',
                            options: [
                                {
                                    label: 'День / Ночь',
                                    value: gameObject.time != 'day' ? 'day' : 'night' 
                                },
                                {
                                    label: 'Тех / Отмена теха',
                                    value: gameObject.time != 'maintenance' ? 'maintenance' : 'offmaintenance'
                                },
                                {
                                    label: 'Статус чата',
                                    value: gameObject.chat?'closechat':'openchat'
                                }
                            ],
                            placeholder: 'Основные'
                        }]
                    },
                    {
                        type: 1,
                        components: [{
                            type: 3,
                            custom_id: 'mafia.actions#0',
                            options: [
                                {
                                    label: 'Чек / Хилл / Килл',
                                    value: 'sendcheck'
                                },
                                {
                                    label: 'Голосование',
                                    value: 'sendvote'
                                },
                                {
                                    label: 'Завершить игру',
                                    value: 'stop'
                                }
                            ],
                            placeholder: 'Игровой процесс'
                        }]
                    },
                    {
                        type: 1,
                        components: [{
                            type: 3,
                            custom_id: 'mafia.actions#1',
                            options: [
                                {
                                    label: 'Зашафлить роли',
                                    value: 'randomroles'
                                },
                                {
                                    label: 'Отправить роли',
                                    value: 'sendroles'
                                }
                            ],
                            placeholder: 'Действия с ролями'
                        }]
                    },
                    {
                        type: 1,
                        components: [{
                            type: 3,
                            custom_id: 'mafia.actions#2',
                            options: [
                                {
                                    label: 'Убить игрока',
                                    value: 'kill'
                                },
                                {
                                    label: 'Лучший ход',
                                    value: 'beststep'
                                },
                                {
                                    label: 'Воскресить',
                                    value: 'revive'
                                }
                            ],
                            placeholder: 'Действия с игроками'
                        }]
                    }
                ],
            }
        } else if (gameObject.state == 'final') {
            return {
                ...(flags ? { flags: ['IsComponentsV2'] } : {}),
                components: [
                    {
                        type: 10,
                        content: `<@!${gameObject.owner}>`
                    },
                    {
                        type: 17,
                        components: [
                            {
                                type: 10,
                                content: "## Панель управления"
                            },
                            {
                                type: 14,
                                spacing: 2
                            },
                            {
                                type: 10,
                                content: [
                                    `Статус игры: **${gameTimes[gameObject.time]}**`,
                                    ``,
                                    `> Живые игроки **[${gameObject.members.filter(e => e.alive).length}/10]**`,
                                    `> Живая мафия **[${gameObject.members.filter(e => e.alive && ['mafia','don'].includes(e.role)).length}/3]**`,
                                    ...gameObject.members.map((x,i) => `${config.slotIcons[i]} ${gameRoles[x.role]} | Ф[\`${x.folls}\`] П[\`${x.warns}\`]`)
                                ].join('\n')
                            },
                            {
                                type: 1,
                                components: [
                                    {
                                        type: 2,
                                        style: 2,
                                        label: "Удалить стол",
                                        custom_id: 'mafia.actions#delete'
                                    }
                                ]
                            }
                        ]
                    }
                ],
            }
        }
    }
    generateMenu(gameObject, flags) {
        return {
            ...(flags ? { flags: ['IsComponentsV2'] } : {}),
            components: [{
                type: 17,
                components: [
                    {
                        type: 10,
                        content: "# Мафия: "+{
                            'city': 'Городская',
                            'classic': 'Классическая',
                            'london': 'Лондонская',
                            'newbies': 'Для новичков',
                            'web': 'Мафия WEB'
                        }[gameObject.mode]
                    },
                    {
                        type: 14,
                        spacing: 1
                    },
                    {
                        type: 9,
                        components: [{
                            type: 10,
                            content: `Ведущий: <@${gameObject.owner}>`
                        }],
                        accessory: {
                            style: 2,
                            type: 2,
                            emoji: emojiParser(config.additionalEmojies[4]),
                            custom_id: 'mafia.actions#changeowner'
                        }
                    },
                    {
                        type: 14,
                        spacing: 1
                    },
                    {
                        type: 10,
                        content: [
                            `Игроков: **${gameObject.members.length}** из **10**`,
                            ...gameObject.members.map(x => `<@${x.id}>`)
                        ].join('\n')
                    },
                    {
                        type: 14,
                        spacing: 1
                    },
                    {
                        type: 1,
                        components: [
                            {
                                style: 3,
                                type: 2,
                                label: "Записаться",
                                emoji: emojiParser(config.additionalEmojies[6]),
                                custom_id: 'mafia.register'
                            }
                        ]
                    },
                    {
                        type: 1,
                        components: [
                            {
                                type: 3,
                                custom_id: 'mafia.actions',
                                options: [
                                    {
                                        label: 'Выписать всех кто не в войсе',
                                        value: 'remove_11'
                                    }, 
                                    ...gameObject.members.slice(0, 10).map((x,i) => ({
                                        label: `Игрок #${(i+1).toString().padStart(2, '0')}`,
                                        value: `remove_`+i
                                    }))
                                ],
                                placeholder: 'Убрать игрока из записи',
                                min_values: 1,
                                max_values: 1
                            }
                        ]
                    }
                ]
            }]
        }
        return {
            embeds:[{
                title: 'Набор игроков',
                description: [
                    `Ведущий: <@${gameObject.owner}>`,
                    '> **Список участников:**',
                    ...gameObject.members
                    .slice(0, 10)    
                    .map((x,i) => `**${config.slotIcons[i]}** <@!${x.id}>`),
                    ...gameObject.members.length > 10 ? ['~~ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ~~'] : [],
                    ...gameObject.members
                    .slice(10)    
                    .map((x,i) => `**${config.slotIcons[10]}** <@!${x.id}>`)
                ].join('\n'),
            }],
            components: [{
                type: 1,
                components:[{
                    type: 2,
                    label: 'Записаться',
                    style: 1,
                    custom_id: 'mafia.register'
                }]
            }]
        }
    }
    generateVote(voteObject, gameObject) {
        if(voteObject.state == 'waiting') {
            return {
                embeds: [{
                    title: 'Ожидаем',
                    description: [
                        'Статус голосования: **Ожидание следующего кандидата**',
                        '**Кандидаты:**',
                        ...voteObject.candidates.map((x) => `> ${config.slotIcons[x]}`),
                    ].join('\n')
                }],
                components: [{
                    type: 1,
                    components: [{
                        type: 3,
                        placeholder: 'Выберите кандидата',
                        options: voteObject.candidates.map((x,i) => ({
                            label: 'Начать за '+(x+1).toString().padStart(2, '0'),
                            value: i.toString()
                        })),
                        custom_id: 'mafia.vote#start'
                    }]
                },{
                    type: 1,
                    components: [{
                        type: 2,
                        label: 'Удалить голосование полностью',
                        style: 4,
                        custom_id: 'mafia.vote#delete#1'
                    }]
                }]
            }
        } else if (voteObject.state == 'voting') {
            return {
                embeds: [{
                    title: 'Идёт голосование',
                    description: [
                        'Статус голосования: **Люди голосуют**',
                        '**Кандидаты:**',
                        ...voteObject.candidates.map((x) => `> ${config.slotIcons[x]}`),
                    ].join('\n')
                }],
                components: [{
                    type: 1,
                    components: [{
                        type: 2,
                        label: 'Закончить голосование',
                        style: 4,
                        custom_id: 'mafia.vote#stop'
                    }]
                }]
            }
        } else if(voteObject.state == 'finished') {
            const noVoted = gameObject.members
                .map((x,i) => ({...x,i}))
                .filter(e => e.alive)
                .filter(e => !voteObject.votes.some(j => e.i == j.id));
            return {
                embeds: [{
                    title: 'Окончено',
                    description: [
                        'Статус голосования: **Проголосовано за кандидата**',
                        '**Кандидаты:**',
                        ...voteObject.candidates.map((x) => `> ${config.slotIcons[x]}`),
                        '',
                        '**Голоса:**',
                        ...voteObject.candidates.map((x,i,a) => {
                            const allVoted = voteObject.votes.filter(e => e.voteFor == i);
                            console.log(x,i,allVoted)

                            return [
                                `> Кандидат #${config.slotIcons[x]}`,
                                `Голоса от: ${allVoted.map(x => `\`${(x.id+1).toString().padStart(2, '0')}\``)} (*${Math.floor((allVoted.length/gameObject.members.filter(e => e.alive).length)*100)}%*)`
                            ].join('\n')
                        }),
                        '',
                        `Оставшиеся голоса:`,
                        `> ${noVoted.map(x => `${(x.i+1).toString().padStart(2, '0')}`).join(', ')} (*${Math.floor((noVoted.length/gameObject.members.filter(e => e.alive).length)*100)}%*)`
                    ].join('\n'),
                }],
                components: [{
                    type: 1,
                    components: [{
                        type: 3,
                        placeholder: 'Выберите кандидата',
                        options: voteObject.candidates.map((x,i) => ({
                            label: 'Начать за '+(x+1).toString().padStart(2, '0'),
                            value: i.toString()
                        })),
                        custom_id: 'mafia.vote#start'
                    }]
                },{
                    type: 1,
                    components: [{
                        type: 2,
                        label: 'Удалить голосование полностью',
                        style: 4,
                        custom_id: 'mafia.vote#delete#1'
                    }]
                }]
            }
        }
    }
    administrateMafia(allGames) {
        const gameStates = {
            picks: 'Поиск людей',
            game: 'Идёт игра',
            final: 'Финал'
        };
        return {
            flags: ['Ephemeral'],
            embeds:[{
                title: 'Администрирование мафии',
                description: allGames.map((x,i) => [
                    `> **ID**: ${x._id}`,
                    `Ведущий: <@${x.owner}>`,
                    `Статус: **${gameStates[x.state]}**`,
                    `Каналы: [Текст](https://discord.com/channels/${config.guild}/${x.channels.text}) | [Голосовой](https://discord.com/channels/${config.guild}/${x.channels.voice})`,
                ].join('\n')).join('\n')
            }],
            components: (allGames.length?[{
                type: 1,
                components: [{
                    type: 3,
                    placeholder: 'Пингануть в управлении',
                    options: allGames.map(x => ({
                        label: `${x._id}`,
                        value: `${x._id}`
                    })),
                    custom_id: 'mafia.admin#ping'
                }]
            },{
                type: 1,
                components: [{
                    type: 3,
                    placeholder: 'Удалить из базы данных',
                    options: allGames.map(x => ({
                        label: `${x._id}`,
                        value: `${x._id}`
                    })),
                    custom_id: 'mafia.admin#delete'
                }]
            }]:[]).concat([{
                type: 1,
                components: [{
                    type: 2,
                    label: "Освободить сервера",
                    style: 2,
                    custom_id: 'mafia.admin#clearguilds'
                }]
            }])
        }
    }
}