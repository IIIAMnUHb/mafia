const Command = require("../clases/Command");
const { ChatInputCommandInteraction, ChannelType, PermissionsBitField, ThreadAutoArchiveDuration, OverwriteType, Routes, GuildScheduledEventStatus, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel } = require('discord.js');
const { config } = require("../config");
const Service = require('../services/Services')

function overwriteToBits({ id, type, allow = [], deny = [] }) {
  return {
    id,
    type: typeof type === "string" ? OverwriteType[type] : type,
    allow: new PermissionsBitField(allow).bitfield.toString(),
    deny: new PermissionsBitField(deny).bitfield.toString(),
  };
}
class Mafia extends Command {
    constructor() {
        super({
            name: "mafia",
            description: "Управление мафией",
            options: [{
                type: 1,
                name: 'create',
                description: 'Создать мафию',
                options: [{
                    type: 3,
                    name: "mode",
                    description: "Тип мафии",
                    required: true,
                    choices: [
                        {
                            name: "Городская",
                            value: "city"
                        },
                        // {
                        //     name: "Классическая",
                        //     value: "classic"
                        // },
                        {
                            name: "Лондон",
                            value: "london"
                        },
                        {
                            name: "Новички",
                            value: "newbies"
                        },
                        {
                            name: "Мафия веб",
                            value: "web"
                        }
                    ] 
                }]
            },{
                type: 1,
                name: 'admin',
                description: 'Админ панель мафий'
            }]
        });
    }
    /**
     * @constructor
     * @param {ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {

        // return interaction.reply({
        //     content: 'Бот временно выключен. Пожалуйста ожидайте.'
        // }).catch(() => { return; });

        const subcommand = interaction.options.getSubcommand();
        if(subcommand == 'create') {
            const gameMode = interaction.options.get('mode').value;
            if(!interaction.member.roles.cache.find(e => config.use.includes(e.id))) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    embeds:[{
                        title: 'Недостаточно прав',
                        description: 'У вас недостаточно прав чтобы **создавать мафию**.',
                        thumbnail: {
                            url: interaction.user.displayAvatarURL()
                        }
                    }]
                }).catch(() => { return; });
            }

            const activeMafia = await Service.database.findMafia({
                owner: interaction.user.id
            });

            if (activeMafia) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    embeds: [{
                        title: 'Мафия уже создана',
                        description: `У вас есть активная <#${activeMafia.channels.text}>`,
                        thumbnail: {
                            url: interaction.user.displayAvatarURL()
                        }
                    }]
                }).catch(() => { return; });
            }

            if (!await Service.database.freeServerCount()) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    embeds: [{
                        title: 'Серверы заняты',
                        description: 'Все сервера заняты, попробуйте позже.',
                        thumbnail: {
                            url: interaction.user.displayAvatarURL()
                        }
                    }]
                });
            }

            interaction.reply({
                flags: ['Ephemeral'],
                embeds: [{
                    title: 'Мафия создаётся',
                    description: 'В течении 10 секунд все каналы будут созданы.',
                    thumbnail: {
                        url: interaction.user.displayAvatarURL()
                    }
                }]
            }).catch(() => { return; });

            const mafiaServer = await Service.database.getFreeServer();
            console.log(mafiaServer)

            const category = await interaction.guild.channels.fetch(config.category);
            const mafiaModes = {
                city: 'Городская мафия',
                classic: 'Классическая мафия',
                newbies: 'Мафия для новичков',
                london: 'Лондонская мафия',
                web: 'Мафия WEB'
            }
            const [ text, voice ] = await Promise.all([
                category.children.create({
                    name: `🌆・${mafiaModes[gameMode]}`,
                    type: ChannelType.GuildText
                }),
                category.children.create({
                    name: `🌆・${mafiaModes[gameMode]}`,
                    type: ChannelType.GuildVoice
                })
            ]);

            await Promise.all([
                text.permissionOverwrites.set(config.restrictedRoles.map(x => ({
                    id: x,
                    deny: [
                        "ViewChannel",
                        "Connect"
                    ]
                })).concat(config.permissions.text)),
                voice.permissionOverwrites.set(config.restrictedRoles.map(x => ({
                    id: x,
                    deny: [
                        "ViewChannel",
                        "Connect"
                    ]
                })).concat(config.permissions.voice.map(x => {
                    if(x.id == interaction.guild.id && gameMode == 'web') {
                        return {
                            ...x,
                            allow: x.allow.concat(['Stream']),
                            deny: x.deny.filter(e => e != 'Stream')
                        }
                    } else { return x }
                })))
            ]);

            let thread = await (async() => {
                for(let i = 0; i < 5; i++) {
                    const t = await text.threads.create({
                        name: 'Управление',
                        type: ChannelType.PrivateThread,
                        defaultAutoArchiveDuration: ThreadAutoArchiveDuration.OneWeek
                    }).catch(() => { return; });
                    if (t) {
                        return t;
                    }
                }
            })();

            if (!thread) {
                await Promise.all([
                    text.delete(), voice.delete()
                ]).catch(() => {});
                return;
            }

            const mafiaChannel = await interaction.client.rest.post(
                Routes.guildChannels(mafiaServer._id), {
                    body: {
                        name: `Чат мафии #${interaction.user.username}`,
                        type: ChannelType.GuildText,
                        permission_overwrites: [
                            {
                                id: mafiaServer._id,
                                type: 0,
                                deny: [
                                    'ViewChannel',
                                ],
                                allow: [
                                    'SendMessages'
                                ]
                            }, {
                                id: mafiaServer.roles[0],
                                type: 0,
                                allow: [
                                    'ViewChannel',
                                    'SendMessages',
                                    'ManageMessages',
                                ]
                            }, {
                                id: mafiaServer.roles[1],
                                type: 0,
                                allow: [
                                    'ViewChannel'
                                ]
                            }, {
                                id: mafiaServer.roles[2],
                                type: 0,
                                allow: [
                                    'ViewChannel'
                                ]
                            }
                        ].map(x => overwriteToBits(x))
                    }
                }
            );

            const pregameObject = {
                mode: gameMode,
                modeOptions: {},
                owner: interaction.user.id,
                channels: {
                    text: text.id, thread: thread.id, voice: voice.id
                },
                server: {
                    id: mafiaServer._id,
                    channel: mafiaChannel.id
                },
                members: [],
                time: 'night',
                state: 'picks'
            };

            
            const threadMessage = await thread.send(Service.messages.generateMafia(pregameObject, true))
            pregameObject.channels.threadMessage = threadMessage.id;

            const chatMessage = await text.send(Service.messages.generateMenu(pregameObject, true))
            pregameObject.channels.chatMessage = chatMessage.id;
            
            await Service.database.createMafia(pregameObject);

            (async() => {
                const invite = await interaction.client.rest.post(
                    Routes.channelInvites(mafiaChannel.id), {
                        body: {
                            max_age: 3600,
                            max_uses: 0,
                            role_ids: [
                                mafiaServer.roles[0]
                            ]
                        }
                    }
                );
                await interaction.client.rest.post(
                    Routes.channelMessages(pregameObject.channels.thread), {
                        body: {
                            components:[{
                                type:1,
                                components:[{
                                    type: 2,
                                    label: 'Зайти на сервер Мафии',
                                    style: 5,
                                    url: `https://discord.gg/${invite.code}`
                                }]
                            }]
                        }
                    }
                );
            })()

            const schedules = await interaction.client.rest.get(
                Routes.guildScheduledEvents(interaction.guild.id)
            );
            if(schedules.filter(e => 
                e.status == GuildScheduledEventStatus.Active &&
                e.entity_type == GuildScheduledEventEntityType.StageInstance
            ).length) return;
            
            const schedule = await interaction.client.rest.post(
                Routes.guildScheduledEvents(interaction.guild.id), {
                    body: {
                        channel_id: voice.id,
                        description: "",
                        entity_metadata: null,
                        entity_type: GuildScheduledEventEntityType.Voice,
                        name: "🌆 "+mafiaModes[gameMode],
                        privacy_level: GuildScheduledEventPrivacyLevel.GuildOnly,
                        recurrence_rule: null,
                        scheduled_start_time: new Date(Date.now()+20000).toISOString()
                    }
                }
            );

            await interaction.client.rest.patch(
                Routes.guildScheduledEvent(interaction.guild.id, schedule.id), {
                    body: { status: GuildScheduledEventStatus.Active }
                }
            );
        } else if (subcommand == 'admin') {
            if(!interaction.member?.roles?.cache?.find(e => config.adm.includes(e.id))) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    embeds:[{
                        title: 'Недостаточно прав',
                        description: 'У вас недостаточно прав чтобы **администрировать мафию**.',
                        thumbnail: {
                            url: interaction.user.displayAvatarURL()
                        }
                    }]
                }).catch(() => { return; });
            }

            const allMafias = await Service.database.findAllMafia();
            
            interaction.reply(Service.messages.administrateMafia(allMafias)).catch(() => { return; });
        }
    }
}

module.exports = Mafia;