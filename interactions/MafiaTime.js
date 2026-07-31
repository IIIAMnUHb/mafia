const Interaction = require("../clases/Interaction");
const { Routes, ButtonInteraction, PermissionsBitField, OverwriteType, StringSelectMenuInteraction } = require('discord.js');
const Service = require("../services/Services");
const { config } = require("../config");
function overwriteToBits({ type, allow = [], deny = [] }) {
  return {
    type: typeof type === "string" ? OverwriteType[type] : type,
    allow: new PermissionsBitField(allow).bitfield.toString(),
    deny: new PermissionsBitField(deny).bitfield.toString(),
  };
}
module.exports = class MafiaTime extends Interaction {
    constructor() {
        super('mafia.time');
    }
    /**
     * 
     * @param {ButtonInteraction|StringSelectMenuInteraction} interaction 
     * @param {Array<string>} args 
     */
    async execute(interaction, args) {
        let mafia = await Service.database.findMafia({
            thread: interaction.channel.id
        });
        if(!mafia) {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Не удалось найти мафию'
            }).catch(() => { return });
        }
        async function updateMessage(mafia) {
            await interaction.client.rest.patch(
                Routes.channelMessage(mafia.channels.thread, mafia.channels.threadMessage),
                { body: Service.messages.generateMafia(mafia) }
            )
        }
        
        const newTime = args[0] || interaction?.values?.[0];
        
        if(mafia.time == newTime) {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Это время уже установлено'
            }).catch(() => { return });
        }

        const time = Date.now();
        Promise.all([
            ...['web','london'].includes(mafia.mode) && !['openchat','closechat'].includes(newTime) ? [] : mafia.members
            .filter(e => e.alive)
            .map(x => 
                interaction.client.rest.put(
                    Routes.channelPermission(mafia.channels.text, x.id), {
                        body: overwriteToBits({
                            type: 1,
                            ...['day', 'offmaintenance', 'openchat'].includes(newTime) ? config.permissions.player[0] : config.permissions.player[1]
                        })
                    }
                ).catch((e) => { return console.log('Ошибка в установке прав TEXT: ', e) })
            ),
            ...['openchat', 'closechat'].includes(newTime) ? [] : mafia.members
            .filter(e => e.alive)
            .map(x => 
                interaction.client.rest.put(
                    Routes.channelPermission(mafia.channels.voice, x.id), {
                        body: overwriteToBits({
                            type: 1,
                            ...config.permissions.player[['day', 'offmaintenance'].includes(newTime) ? 2 : 3],
                            ...mafia.mode == 'web' ? {
                                allow: config.permissions.player[['day', 'offmaintenance'].includes(newTime) ? 2 : 3].allow.concat(['Stream'])
                            } : {}
                        })
                    }
                ).catch((e) => { return console.log('Ошибка в установке прав VOICE: ', e) })
                .then(() => interaction.client.rest.patch(
                    Routes.guildMember(interaction.guild.id, x.id), {
                        body: {
                            channel_id: mafia.channels.voice
                        }
                    }
                ).catch(() => { return }))
            )
        ]).finally(() => {
            console.log('Каналы изменены за', Date.now()-time)
        });
        
        if (newTime == 'night') {
            await interaction.client.rest.put(
                Routes.channelPermission(mafia.server.channel, mafia.server.id), {
                    body: {
                        id: mafia.server.id,
                        type: OverwriteType.Role,
                        allow: "2048",
                        deny: "1024"
                    }
                }
            );
            await interaction.client.rest.post(
                Routes.channelMessages(mafia.server.channel), {
                    body: { content: `> Чат **открыт на ночь**.` }
                }
            )
        } else if (mafia.time == 'night') {
            await interaction.client.rest.put(
                Routes.channelPermission(mafia.server.channel, mafia.server.id), {
                    body: {
                        id: mafia.server.id,
                        type: OverwriteType.Role,
                        allow: "0",
                        deny: "3072"
                    }
                }
            );
            await interaction.client.rest.post(
                Routes.channelMessages(mafia.server.channel), {
                    body: { content: `> Чат **закрыт на день**.` }
                }
            );
        }
        
        let obj = {$set:{}};
        if (!['openchat','closechat'].includes(newTime)) {
            obj.$set.time = newTime=='offmaintenance'?'day':newTime;
        }
        obj.$set.chat = ['maintenance','night','closechat'].includes(newTime) ? false : true;
        await Service.database.editMafia(mafia._id, obj);

        mafia = await Service.database.findMafia({
            thread: interaction.channel.id
        });
        
        
        interaction.update(Service.messages.generateMafia(mafia)).catch(() => {return updateMessage(mafia)})
        

        await interaction.client.rest.post(
            Routes.channelMessages(mafia.channels.text), {
                body: {
                    embeds: [{
                        ...{
                            day: {
                                title: 'ДЕНЬ',
                                description: 'Город просыпается.',
                            },
                            night: {
                                title: 'НОЧЬ',
                                description: 'Город засыпает.',
                            },
                            maintenance: {
                                title: 'ТЕХ-ПАУЗА',
                                description: 'Ведущий приостановил игру.',
                            },
                            offmaintenance: {
                                title: 'ОТМЕНА ТЕХ-ПАУЗЫ',
                                description: 'Ведущий возобновил игру.',
                            },
                            closechat: {
                                title: 'ЧАТ ЗАКРЫТ',
                                description: 'Ведущий закрыл чат.',
                            },
                            openchat: {
                                title: 'ЧАТ ОТКРЫТ',
                                description: 'Ведущий открыл чат.',
                            }
                        }[newTime],
                        thumbnail: {
                            url: interaction.client.user.displayAvatarURL()
                        }
                    }]
                }
            }
        ); 
        

    }
}