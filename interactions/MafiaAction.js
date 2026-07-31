const Interaction = require("../clases/Interaction");
const { Routes, StringSelectMenuInteraction, messageLink, NewsChannel, AttachmentBuilder, Collection } = require('discord.js');
const Service = require("../services/Services");
const { config, database } = require("../config");

module.exports = class MafiaAction extends Interaction {
    constructor() {
        super('mafia.actions');
    }
    /**
     * 
     * @param {StringSelectMenuInteraction} interaction 
     * @param {Array<string>} args 
     */
    async execute(interaction, args) {
        console.log(args);
        let mafia = await Service.database.findMafia({
            thread: interaction.channel.id,
            owner: interaction.user.id
        });
        if(!mafia) {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Не удалось найти мафию'
            }).catch(() => { return });
        }
        
        const action = interaction?.values?.[0] || args[0];

        async function updateMessage(mafia) {
            await interaction.client.rest.patch(
                Routes.channelMessage(mafia.channels.thread, mafia.channels.threadMessage),
                { body: Service.messages.generateMafia(mafia) }
            )
        }
        async function updateRegistration(mafia) {
            await interaction.client.rest.patch(
                Routes.channelMessage(mafia.channels.text, mafia.channels.chatMessage),
                { body: Service.messages.generateMenu(mafia) }
            )
        }

        if (action == 'start') {
            if(mafia.state != 'picks') {
                updateMessage(mafia);
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: 'Мафия не может быть запущена дважды.'
                }).catch(() => { return; });
            }

            const voice = await interaction.guild.channels
                .fetch(mafia.channels.voice, {
                    force: true
                })
                .catch(() => { return });
            console.log(voice);
            const voiceMembers = [...voice.members.values()];
            const mafiaMembers = mafia.members.slice(0, 10);
            const voiceExcludeMembers = mafiaMembers.filter(e => !voiceMembers.some(j => j.id == e.id));
            
            if (mafiaMembers.length != 10) {
                updateMessage(mafia);
                return interaction.reply({
                    flags: ['Ephemeral'],
                    embeds: [{
                        title: 'Недостаточно игроков',
                        description: 'Для проведения игры требуется **10 игроков**',
                        thumbnail: {
                            url: interaction.user.displayAvatarURL()
                        }
                    }],
                    components: [{
                        type: 1,
                        components: [{
                            type: 2,
                            label: 'Упомянуть роль Мафии',
                            style: 2,
                            custom_id: 'mafia.ping#role'
                        }]
                    }]
                }).catch(() => { return; })
            }

            if (voiceExcludeMembers.length != 0) {
                updateMessage(mafia);
                return interaction.reply({
                    flags: ['Ephemeral'],
                    embeds: [{
                        title: 'Не все готовы',
                        description: 'В голосовом канале находятся не все записавшиеся',
                        fields: [{
                            name: '> Не готовы:',
                            value: voiceExcludeMembers.map((x,i) => `**${i+1}.** <@!${x.id}>`).join('\n')
                        }],
                        thumbnail: {
                            url: interaction.user.displayAvatarURL()
                        }
                    }],
                    components: [{
                        type: 1,
                        components: [{
                            type: 2,
                            label: 'Упомянуть',
                            style: 2,
                            custom_id: 'mafia.ping#voice'
                        }]
                    }]
                }).catch(() => { return; })
            }

            await interaction.reply({ flags: ['Ephemeral'], content: '> Начинаем игру.' })

            const schedules = await interaction.client.rest.get(
                Routes.guildScheduledEvents(interaction.guild.id)
            );
            const schedule = schedules.find(e => e.channel_id == mafia.channels.voice);
            if (schedule) {
                await interaction.client.rest.delete(
                    Routes.guildScheduledEvent(interaction.guild.id, schedule.id)
                );
            }


            await interaction.client.rest.delete(
                Routes.channelMessage(mafia.channels.text, mafia.channels.chatMessage)
            ).catch(() => { return; })

            mafia.members = Service.functions.shuffle(mafia.members.slice(0, 10));
            await Service.database.editMafia(mafia._id, {
                $set: {
                    state: 'game',
                    'channels.chatMessage': null,
                    startedAt: Date.now(),
                    members: mafia.members
                }
            });
            mafia = await Service.database.findMafia({
                _id: mafia._id
            });
            
            await interaction.client.rest.post(
                Routes.channelMessages(mafia.channels.text),
                { body: {
                    embeds: [{
                        title: 'Игра начинается',
                        description: 'Замутьте ваши микрофоны. Любая активность карается предупреждением.',
                        thumbnail: {
                            url: interaction.client.user.displayAvatarURL()
                        }
                    }]
                } }
            );

            await Promise.all([
                await interaction.client.channels.fetch(mafia.channels.text)
                    .catch(() => { return })
                    .then(async text => {
                        if (!text) return;
                        await text.permissionOverwrites.set([
                            ...text.permissionOverwrites.cache
                                .filter(e => !mafia.members.some(j => j.id == e.id))
                                .filter(e => e.id != config.guild).values(),
                            ...mafia.members.map(x => ({
                                id: x.id,
                                ...config.permissions.player[1],
                                ...mafia.mode == 'web' ? {
                                    allow: config.permissions.player[1].allow.concat(['Stream'])
                                } : {}
                            })),
                            ...[{
                                id: config.guild,
                                allow: [
                                    'ViewChannel'
                                ],
                                deny: [
                                    'SendMessages',
                                    'Stream',
                                    'AddReactions'
                                ]
                            }]
                        ]);
                    }),
                await interaction.client.channels.fetch(mafia.channels.voice)
                    .catch(() => { return })
                    .then(async voice => {
                        if (!voice) return;
                        await voice.permissionOverwrites.set([
                            ...voice.permissionOverwrites.cache
                                .filter(e => !mafia.members.some(j => j.id == e.id))
                                .filter(e => e.id != config.guild).values(),
                            ...mafia.members.map(x => ({
                                id: x.id,
                                ...config.permissions.player[3]
                            })),
                            ...[{
                                id: config.guild,
                                allow: [
                                    'ViewChannel',
                                    'Connect'
                                ],
                                deny: [
                                    'Speak',
                                    'SendMessages',
                                    'AddReactions'
                                ]
                            }]
                        ]);
                    })
            ]).catch(() => { return; })
            
            await Promise.all(mafia.members.map((x,i) => 
                interaction.client.rest.patch(
                    Routes.guildMember(interaction.guild.id, x.id), {
                        body: {
                            nick: (i+1).toString().padStart(2, '0'),
                            channel_id: mafia.channels.voice
                        }
                    }
                )
            ).concat([
                interaction.client.rest.patch(
                    Routes.guildMember(interaction.guild.id, mafia.owner), {
                        body: {
                            nick: '! Ведущий'
                        }
                    }
                )
            ])).catch((reason) => {
                console.log('Failed to apply nicknames to all',reason)
            });
            
            await updateMessage(mafia);
        } else if (action == 'switchtime') {
            interaction.reply({
                flags: ['Ephemeral'],
                content: 'Изменение времени в игре',
                components:[{
                    type: 1,
                    components:[
                        {
                            type: 2,
                            label: 'Ночь',
                            style: 4,
                            custom_id: 'mafia.time#night'
                        },
                        {
                            type: 2,
                            label: 'День',
                            style: 3,
                            custom_id: 'mafia.time#day'
                        },
                    ]
                },{
                    type: 1,
                    components:[
                        {
                            type: 2,
                            label: 'Тех-пауза',
                            style: 4,
                            custom_id: 'mafia.time#maintenance'
                        },
                        {
                            type: 2,
                            label: 'Отмена Тех-паузы',
                            style: 3,
                            custom_id: 'mafia.time#offmaintenance'
                        },
                    ]
                },{
                    type: 1,
                    components:[
                        {
                            type: 2,
                            label: 'Закрыть чат',
                            style: 4,
                            custom_id: 'mafia.time#closechat'
                        },
                        {
                            type: 2,
                            label: 'Открыть чат',
                            style: 3,
                            custom_id: 'mafia.time#openchat'
                        },
                    ]
                }]
            }).catch((e) => { return console.log(e) })
            updateMessage(mafia);
        } else if (action == 'randomroles') {
            const roles = Service.functions.shuffle([
                ...new Array(5).fill('civilian'),
                ...new Array(2).fill('mafia'),
                ...mafia.mode != 'city' ? ['civilian'] : ['doctor'], 
                'commissar', 'don'
            ]);
            await Service.database.editMafia(mafia._id, {
                $set: {
                    members: mafia.members.map((x,i) => ({
                        ...x,
                        role: roles[i]
                    }))
                }
            });
            mafia = await Service.database.findMafia({
                _id: mafia._id
            });
            await interaction.reply({
                flags: ['Ephemeral'],
                content: 'Зашафлено.'
            });
            updateMessage(mafia);
        } else if (action == 'kill') {
            if (mafia.members.filter(e => e.alive).length == 0) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: 'Все мертвы. Некого убивать'
                }).catch(() => { return })
            }
            await updateMessage(mafia);
            await interaction.reply({
                flags: ['Ephemeral', 'IsComponentsV2'],
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 10,
                            content: "# Выберите кого убить"
                        },
                        {
                            type: 14,
                            spacing: 2
                        },
                        {
                            type: 1,
                            components: [{
                                type: 3,
                                placeholder: 'Сделайте выбор',
                                options: mafia.members.map((x,i) => x.alive?({
                                    label: `${(i+1).toString().padStart(2, '0')}`,
                                    value: i.toString()
                                }):null).filter(Boolean),
                                max_values: mafia.members.filter(x => x.alive).length,
                                min_values: 1,
                                custom_id: 'mafia.live#kill'
                            }]
                        }
                    ]
                }]
                // components:[]
            })
        } else if (action == 'revive') {
            await updateMessage(mafia);
            if (mafia.members.filter(e => !e.alive).length == 0) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: 'Все живы. Некого воскрешать'
                }).catch(() => { return })
            }
            await interaction.reply({
                flags: ['Ephemeral', 'IsComponentsV2'],
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 10,
                            content: "# Выберите кого воскресить"
                        },
                        {
                            type: 14,
                            spacing: 2
                        }, 
                        {
                            type: 1,
                            components: [{
                                type: 3,
                                placeholder: 'Сделайте выбор',
                                options: mafia.members.map((x,i) => x.alive?null:({
                                    label: `${(i+1).toString().padStart(2, '0')}`,
                                    value: i.toString()
                                })).filter(Boolean),
                                max_values: mafia.members.filter(x => !x.alive).length,
                                min_values: 1,
                                custom_id: 'mafia.live#revive'
                            }]
                        }
                    ]
                }]
            }).catch(() => { return; })
        } else if (action == 'changeowner') {
            await updateMessage(mafia);
            await interaction.reply({
                flags: ['Ephemeral'],
                components:[{
                    type: 1,
                    components: [{
                        type: 5,
                        placeholder: 'Выберите нового владельца',
                        custom_id: 'mafia.table'
                    }]
                }]
            }).catch(() => { return; })
        } else if (action == 'beststep') {
            await updateMessage(mafia);
            if(mafia.beststep) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: `> Лучший ход сделан. Данная функция для этой игры закрыта.`
                }).catch(() => { return; })
            }
            await interaction.reply({
                flags: ['Ephemeral', 'IsComponentsV2'],
                components: [{
                    type: 17,
                    components: [
                        {
                            type: 10,
                            content: "# Выберите первого убиенного\n\nВыберите участника, который должен дать лучший ход."
                        },
                        {
                            type: 14,
                            spacing: 2
                        },
                        {
                            type: 1,
                            components: [{
                                type: 3,
                                placeholder: 'Сделайте выбор',
                                options: mafia.members.map((x,i) => ({
                                    label: `${(i+1).toString().padStart(2, '0')}`,
                                    value: i.toString()
                                })).filter(Boolean),
                                custom_id: 'mafia.step#owner'
                            }]
                        }
                    ]
                }]
            });
        } else if (action == 'sendvote') {
            updateMessage(mafia)
            const activeVote = await Service.database.findVote({
                mafia: mafia._id
            });
            if (activeVote) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: `У вас есть активное голосование. Удалить его из базы данных?\nСтатус: **${{waiting:'Ожидание',voting:'В процессе',finished:'Оконечно'}[activeVote.state]}**`,
                    components: [{
                        type: 1,
                        components:[{
                            type: 2,
                            label: 'Удалить?',
                            style: 4,
                            custom_id: 'mafia.vote#delete'
                        }]
                    }]
                }).catch(() => { return })
            }
            interaction.reply({
                flags: ['Ephemeral'],
                embeds:[{
                    title: 'Инстанс: Голосование',
                    description: `Выберите игроков ниже которых вы хотите выставить на голосование`,
                    thumbnail: {
                        url: interaction.user.displayAvatarURL()
                    }
                }],
                components: [{
                    type: 1,
                    components: [{
                        type: 3,
                        placeholder: 'Выберите кандидатуры',
                        options: mafia.members
                            .map((x,i) => x.alive?({
                                label: 'Выставить игрока '+(i+1).toString().padStart(2, '0'),
                                value: i.toString()
                            }):null)
                            .filter(e => e),
                        max_values: mafia.members
                            .filter(e => e.alive).length,
                        min_values: 2,
                        custom_id: 'mafia.vote#create'
                    }]
                }]
            });
        } else if (action.startsWith('remove')) {
            const index = Number(action.split('_').slice(1)[0]);
            if(index == 11) {
                const voice = await interaction.client.channels
                    .fetch(mafia.channels.voice, {
                        force: true
                    })
                    .catch(() => { return });
                const voiceMembers = [...voice.members.values()];
                const mafiaMembers = mafia.members.slice(0, 10);
                const voiceExcludeMembers = mafiaMembers.filter(e => !voiceMembers.some(j => j.id == e.id));
                if(voiceExcludeMembers.length) {
                    await Service.database.editMafia(mafia._id, {
                        $pull: { 
                            members: {
                                id: { $in: voiceExcludeMembers.map(x => x.id) }
                            } 
                        }
                    });
                    mafia = await Service.database.findMafia({
                        owner: interaction.user.id
                    });
                }
                
            } else {
                await Service.database.editMafia(mafia._id, {
                    $unset: { [`members.${index}`]: 1 }
                });
                await Service.database.editMafia(mafia._id, {
                    $pull: { members: null }
                });
                mafia = await Service.database.findMafia({
                    owner: interaction.user.id
                });
            }
            await interaction.update({});
            updateMessage(mafia);
            updateRegistration(mafia);
        } else if (action == 'sendroles') {
            if(mafia.members.filter(e => e.role == 'nothing').length) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    embeds: [{
                        title: 'Роли не разданы',
                        description: 'Вы не раздали роли пользователям. **Раздайте их сначала**',
                        thumbnail: {
                            url: interaction.user.displayAvatarURL()
                        }
                    }]
                }).catch(() => { return; });
            }
            updateMessage(mafia);
            const gameRoles = {
                civilian: 'Мирный житель',
                commissar: 'Комиссар',
                doctor: 'Доктор',
                mafia: 'Мафия',
                don: 'Дон',
                nothing: 'Нету'
            }
            const gameRolesDescription = {
                civilian: 'Вы играете за красных (мирных).\n**Задача**: найти Комиссара и вместе с ним избавиться от Мафии путём дневного голосования.',
                commissar: 'Вы играете за красных (мирных).\n**Задача**: делать ночные проверки и вычислить всю Мафию.',
                doctor: 'Вы играете за красных (мирных).\n**Задача**: спасать мирных игроков от ночного убийства.',
                mafia: 'Вы играете за чёрных (мафию).',
                don: 'Вы играете за чёрных (мафию).',
            }
            const gameRolesIcons = config.roleIcons
            interaction.reply({
                flags: ['Ephemeral'],
                content: 'Выдаём роли.'
            });
            
            const mafiaServer = await Service.database.getServerInfo(mafia.server.id);

            const [ donLink, ...mafiaLinks ] = await Promise.all([
                interaction.client.rest.post(
                    Routes.channelInvites(mafia.server.channel), {
                        body: { max_age: 3600, max_uses: 1, role_ids: [mafiaServer.roles[1]] }
                    }
                ),
                interaction.client.rest.post(
                    Routes.channelInvites(mafia.server.channel), {
                        body: { max_age: 3600, max_uses: 1, role_ids: [mafiaServer.roles[2]] }
                    }
                ),
                interaction.client.rest.post(
                    Routes.channelInvites(mafia.server.channel), {
                        body: { max_age: 3599, max_uses: 1, role_ids: [mafiaServer.roles[2]] }
                    }
                )
            ]);
            console.log(donLink.code, mafiaLinks.map(x => x.code))
            await Promise.all(mafia.members.map((x,i) => 
                interaction.client.users.fetch(x.id)
                    .catch((e) => { return console.log(`[Раздача ролей | ОШИБКА ПОЛУЧЕНИЯ ЮЗЕРА] ${JSON.stringify(e)}`) })
                    .then((user) => {
                        user?.send({
                            flags: ['IsComponentsV2'],
                            components: [{
                                type: 17,
                                components: [
                                    {
                                        type: 10,
                                        content: "## Раздача ролей"
                                    },
                                    {
                                        type: 14,
                                        spacing: 2
                                    },
                                    {
                                        type: 9,
                                        components: [
                                            {
                                                type: 10,
                                                content: [
                                                    `Игровой номер: **${(i+1).toString().padStart(2, '0')}**`,
                                                    `Роль: **${gameRoles[x.role]}**`,
                                                    ``,
                                                    gameRolesDescription[x.role]
                                                ].join('\n')
                                            }
                                        ],
                                        accessory: {
                                            type: 11,
                                            media: {
                                                url: gameRolesIcons[x.role]
                                            }
                                        }
                                    }
                                ]
                            },
                            ...['commissar','doctor'].includes(x.role)?[{
                                type: 1,
                                components: [{
                                    type: 2,
                                    label: 'Подтвердить получение роли',
                                    style: 3,
                                    custom_id: `mafia.roleaction#${x.role}#${mafia._id}`
                                }]
                            }]:[],
                            ...['mafia', 'don'].includes(x.role)?[{
                                type: 1,
                                components: [{
                                    type: 2,
                                    label: 'Зайти на сервер мафии',
                                    style: 5,
                                    url: `https://discord.gg/${(x.role=='don'?donLink:mafiaLinks.pop()).code}`
                                }]
                            }]:[]
                        ]
                        }).catch(()=>{ return; });
                    })
            ));
        } else if (action == 'sendcheck') {
            updateMessage(mafia)
            for(let i = 0; i < mafia.members.length; i++) {
                const player = mafia.members[i];
                if(!player.alive) continue;
                if(player.role == 'commissar') {
                    const user = await interaction.client.users.fetch(player.id).catch(() => { return });
                    user?.send({
                        embeds: [{
                            title: 'Ваша проверка',
                            description: 'Выберите игрока которого хотите проверить',
                            thumbnail: {
                                url: user?.displayAvatarURL()
                            }
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 3,
                                placeholder: 'Проверить игрока',
                                options: mafia.members
                                    .map((x,i) => ({...x, i}))
                                    .map(x => ({
                                        label: `Проверить ${(x.i+1).toString().padStart(2, '0')}`,
                                        value: `${x.i}`
                                    })),
                                custom_id: `mafia.roleaction#commissar#${mafia._id}`
                            }]
                        }]
                    }).catch(() => { return });
                }
                if(player.role == 'doctor') {
                    const user = await interaction.client.users.fetch(player.id).catch(() => { return });
                    user?.send({
                        embeds: [{
                            title: 'Ваше лечение',
                            description: 'Выберите игрока которого хотите исцелить',
                            thumbnail: {
                                url: user?.displayAvatarURL()
                            }
                        }],
                        components: [{
                            type: 1,
                            components: [{
                                type: 3,
                                placeholder: 'Исцелить игрока',
                                options: mafia.members
                                    .map((x,i) => ({...x, i}))
                                    .filter(e => e.alive)
                                    .map(x => ({
                                        label: `Лечить ${(x.i+1).toString().padStart(2, '0')}`,
                                        value: `${x.i}`
                                    })),
                                custom_id: `mafia.roleaction#doctor#${mafia._id}`
                            }]
                        }]
                    }).catch(() => { return });
                }
            }
            interaction.reply({
                flags: ['Ephemeral'],
                content: 'Роли разосланы.'
            })
        } else if (action.startsWith('delete_')) {
            interaction.reply({
                flags: ['Ephemeral'],
                content: 'Выберите игрока',
                components: [{
                    type: 1,
                    components: [{
                        type: 3,
                        placeholder: 'Выберите игрока',
                        options: (action.endsWith('warn') ?
                            mafia.members
                                .map((x,i) => ({...x,i}))
                                .filter(e => e.alive && e.warns)
                                .map(x => ({
                                    label: 'Снять пред #'+(x.i+1).toString().padStart(2, '0'),
                                    value: `warn_${x.i}`
                                })) :
                            mafia.members
                                .map((x,i) => ({...x,i}))
                                .filter(e => e.alive && e.folls)
                                .map(x => ({
                                    label: 'Снять фолл #'+(x.i+1).toString().padStart(2, '0'),
                                    value: `foll_${x.i}`
                                }))).concat([
                                    {
                                        label: 'Очистить всё и всем',
                                        value: `all`
                                    }
                                ]),
                        custom_id: 'mafia.unpunish'
                    }]
                }]
            })
        } else if (action == 'stop') {
            interaction.reply({
                flags: ['Ephemeral'],
                content: 'Выберите сторону',
                components: [{
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: 'Победа Мирных',
                            style: 3,
                            custom_id: 'mafia.stop#peace'
                        },
                        {
                            type: 2,
                            label: 'Победа Мафии',
                            style: 4,
                            custom_id: 'mafia.stop#mafia'
                        },
                        {
                            type: 2,
                            label: 'Ничья',
                            style: 2,
                            custom_id: 'mafia.stop#null'
                        }
                    ]
                }]
            })
        } else if (action == 'delete') {
            interaction.update({ components: [] }).catch(() => { return; })
            const gameRoles = {
                civilian: 'Мирный житель',
                commissar: 'Комиссар',
                doctor: 'Доктор',
                mafia: 'Мафия',
                don: 'Дон',
                nothing: 'Нету'
            }
            const gameResults = {
                peace: 'Победа мирного города 🟩',
                mafia: 'Победа мафии 🟥',
                null: 'Ничья ⬛'
            }
            if (mafia.result) {
                const voice = await interaction.client.channels
                    .fetch(mafia.channels.voice, {
                        force: true
                    })
                    .catch(() => { return });
                if(voice) {
                    try {
                        const voiceMembers = [...voice.members.values()];
                        await Promise.all(voiceMembers.map(member => 
                            member?.voice?.setChannel(config.afterGame).catch(() => { return })
                        ).filter(Boolean)).catch(() => { return });
                    } catch (err) {
                        console.log('ERROR IN MOVING',err)
                    }
                }
                await interaction.client.rest.post(
                    Routes.channelMessages(config.logs), {
                        body: {
                            embeds:[{
                                title: `Отчет по игре [${{
                                    city: 'Городская мафия',
                                    classic: 'Классическая мафия',
                                    newbies: 'Мафия для новичков',
                                    london: 'Лондонская мафия',
                                    web: 'Мафия WEB'
                                }[mafia.mode]}]`,
                                description: [
                                    `Ведущий: <@!${mafia.owner}>`,
                                    `Время начала: <t:${Math.floor(mafia.startedAt/1000)}:R>`,
                                    `Время конца: <t:${Math.floor(mafia.endedAt/1000)}:R>`,
                                    `Время проведения: **${Service.functions.timeFormat(Math.floor(mafia.endedAt/1000) - Math.floor(mafia.startedAt/1000))}**`,
                                    ``,
                                    `**Игроки:**`,
                                    ...mafia.members.map((x,i) => 
                                        `**${config.slotIcons[i]}** <@!${x.id}> - ${gameRoles[x.role]} [ Фоллов: ${x.folls} | Предов: ${x.warns} ]`
                                    ),
                                    '',
                                    '**Результат игры:**',
                                    `> ${gameResults[mafia.result]}`
                                ].join('\n') 
                            }]
                        }
                    }
                ).catch((err) => { return console.log(err); });
                if(config.techLogs) await interaction.client.rest.post(
                    Routes.webhook(config.techLogs[0], config.techLogs[1]), {
                        body: {
                            content: JSON.stringify(mafia)
                        }
                    }
                ).catch(() => { return });
            }
            try {
                await Promise.all([
                    interaction.client.rest.delete(Routes.channel(mafia.channels.text)),
                    interaction.client.rest.delete(Routes.channel(mafia.channels.voice)),
                    interaction.client.rest.delete(Routes.channel(mafia.server.channel))
                ]).catch(() => { return });

                await Service.database.deleteMafia(mafia._id);
                await Service.database.unalocateServer(mafia.server.id);

                await Promise.all([
                    mafia.owner,
                    ...mafia.members.filter(e => ['don','mafia'].includes(e.role)).map(x => x.id)
                ].map(x => interaction.client.rest.delete(
                    Routes.guildMember(mafia.server.id, x), {
                        query: { reason: "Мафия окончена" }
                    }
                ))).catch(() => { return })
            } catch (err) {
                console.log(err);
            }
            await Promise.all([...mafia.members, {id: mafia.owner}].map((x) => 
                interaction.client.rest.patch(
                    Routes.guildMember(interaction.guild.id, x.id), {
                        body: {
                            nick: ""
                        }
                    }
                )
            )).catch(() => { return });
        }
    }
}