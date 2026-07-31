const { PermissionsBitField } = require("discord.js");
// config.js
module.exports = {
    token: 'MTA2MzQ2NDc1NzUwNTU2ODg1OQ.-----', // Bot token
    config: {
        logs: '11111111111111111111', // Mafia session logs
        // techLogs: ['WebhookId', 'WebhookToken'] - for technical logs in JSON format
        use: ['11111111111111111111'], // Access to creating and hosting mafia
        adm: ['11111111111111111111'], // Access to /mafia admin
        category: '11111111111111111111', // Category in which channels will be created
        guild: '11111111111111111111', // Server on which mafia is hosted
        restrictedRoles: [], // Roles that are forbidden from joining mafia
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
            "<:empty:11111111111111111111>" // slot for non-players
        ],
        mafiaGuilds: [ // Mafia server IDs
            '11111111111111111111'
        ],
        afterGame: '11111111111111111111', // Post-game channel. All users will be moved to it after the game
        permissions: {
            voice: [ // Voice channel permissions on creation
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
            text: [ // Text channel permissions on creation
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
            player: [ // Variable player permissions during the game
                { // Text, daytime | player[0]
                    allow: [
                        'ViewChannel',
                        'SendMessages'
                    ],
                },
                { // Text, nighttime | player[1]
                    allow: [
                        'ViewChannel',
                    ],
                    deny: [
                        'SendMessages',
                    ]
                },
                { // Voice, daytime | player[2]
                    allow: [
                        'ViewChannel',
                        'Speak',
                    ],
                    deny: [
                        'SendMessages'
                    ]
                },
                { // Voice, nighttime | player[3]
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
        messages: { // Player search, preset message.
            pingRole: '<@&11111111111111111111> Заходите на мафию +$count', // Role mention when short on players | $count - number of players missing
            pingMembers: 'Игра начинается. Зайдите в голосовой канал $channel\n$pings' // Player mentions on launch | $channel - mafia channel | $pings - mentions of all players separated by ", "
        }
    },
    database: 'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.3' // DB connection. See structure in Database.md
}