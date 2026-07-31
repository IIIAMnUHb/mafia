const { PermissionsBitField } = require("discord.js");
// config.js
module.exports = {
    token: 'MTA2MzQ2NDc1NzUwNTU2ODg1OQ.-----', // Токен бота
    config: {
        logs: '11111111111111111111', // Логи проведения мафий
        // techLogs: ['WebhookId', 'WebhookToken'] - для технических логов формата JSON
        use: ['11111111111111111111'], // Доступ к созданию и ведению мафии
        adm: ['11111111111111111111'], // Доступ к /mafia panel
        category: '11111111111111111111', // Категория в которой будут создаватся каналы
        guild: '11111111111111111111', // Сервер на котором проводится мафия
        restrictedRoles: [], // Запрещенные к посещению мафии роли
        slotIcons: [
            "<:1_:11111111111111111111>", // 01
            "<:2_:11111111111111111111>", // 02
            "<:3_:11111111111111111111>", // 03
            "<:4_:11111111111111111111>", // 04
            "<:5_:11111111111111111111>", // 05
            "<:6_:11111111111111111111>", // 06
            "<:7_:11111111111111111111>", // 07
            "<:8_:11111111111111111111>", // 08
            "<:9_:11111111111111111111>", // 09
            "<:10:11111111111111111111>", // 10
            "<:empty:11111111111111111111>" // слот для неигроков
        ],
        mafiaGuilds: [ // Айди серверов мафии
            '11111111111111111111'
        ],
        afterGame: '11111111111111111111', // После-игорный канал. Все ползователи будут перемещены в него после игры
        permissions: {
            voice: [ // Права на голосовой канал при создании
                {
                    id: '11111111111111111111',
                    allow: [
                        "ViewChannel",
                        "MuteMembers",
                        "DeafenMembers",
                        "MoveMembers",
                        "ManageChannels",
                        "SendMessages",
                        "EmbedLinks",
                        "ManageMessages"
                    ],
                    deny: [
                        "UseSoundboard",
                        "AddReactions"
                    ]
                },
                {
                    id: '11111111111111111111',
                    allow: [
                        "ViewChannel",
                        "Connect",
                        "Speak",
                        "Stream",
                        "UseExternalSounds",
                        "MuteMembers",
                        "DeafenMembers",
                        "MoveMembers",
                        "ManageEvents"
                    ],
                    deny: [
                        "UseSoundboard",
                        "AddReactions"
                    ]
                },
                {
                    id: '11111111111111111111',
                    allow: [
                        "ViewChannel",
                        "Connect"
                    ],
                    deny: [
                        'Stream',
                        "SendMessages"
                    ]
                }
            ],
            text: [ // Права на текстовый канал при создании
                {
                    id: '11111111111111111111',
                    allow: [
                        "ViewChannel",
                        "SendMessages",
                        "EmbedLinks",
                        "ManageMessages"
                    ]
                },
                {
                    id: '11111111111111111111',
                    allow: [
                        "ViewChannel"
                    ],
                    deny: [
                        "ManageChannels"
                    ]
                },
                {
                    id: '11111111111111111111',
                    allow: [
                        "ViewChannel",
                    ],
                    deny: [
                        "SendMessages"
                    ]
                }
            ],
            player: [ // Вариативные права игрока во время игры
                { // Текстовый днём | player[0]
                    allow: [
                        'ViewChannel',
                        'SendMessages'
                    ],
                },
                { // Текстовый ночью | player[1]
                    allow: [
                        'ViewChannel',
                    ],
                    deny: [
                        'SendMessages',
                    ]
                },
                { // Голосовой днём | player[2]
                    allow: [
                        'ViewChannel',
                        'Speak',
                    ],
                    deny: [
                        'SendMessages'
                    ]
                },
                { // Голосовой ночью | player[3]
                    allow: [
                        'ViewChannel',
                    ],
                    deny: [
                        'SendMessages',
                        'Speak'
                    ]
                }
            ]
        },
        messages: { // Поиск игроков, заданное сообщение.
            pingRole: '<@&11111111111111111111> Заходите на мафию +$count', // Упоминание роли при недоборе участников | $count - количество которого не хватает
            pingMembers: 'Игра начинается. Зайдите в голосовой канал $channel\n$pings' // Упоминание участников при запуске | $channel - канал мафии | $pings - пинги всех участников через ", "
        }
    },
    database: 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.3' // Подключение к БД. Структуру смотри в Database.md
}