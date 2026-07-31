const Interaction = require("../clases/Interaction");
const { Routes, StringSelectMenuInteraction } = require('discord.js');
const Service = require("../services/Services");
const { config } = require('../config');

module.exports = class MafiaTime extends Interaction {
    constructor() {
        super('mafia.step');
    }
    /**
     * 
     * @param {StringSelectMenuInteraction} interaction 
     * @param {Array<string>} args 
     */
    async execute(interaction, args) {
        let mafia = await Service.database.findMafia({
            text: interaction.channel.id,
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
        
        const action = args[0];

        if(mafia.beststep) {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: `> Лучший ход сделан. Данная функция для этой игры закрыта.`
            }).catch(() => { return; })
        }

        if(action == 'owner') {
            const user = Number(interaction.values[0]);
            const member = mafia.members[user];
            if(!member) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: 'Участник не найден'
                }).catch(() => { return; })
            }

            const memberObj = await interaction.guild.members.fetch(member.id).catch(() => { return; });

            interaction.update({
                components: [{
                    type: 10,
                    content: "> Меню выбора было отправлено в чат."
                }]
            }).catch(() => { return; });

            interaction.client.rest.post(
                Routes.channelMessages(mafia.channels.text), {
                    body: {
                        flags: 1 << 15,
                        components: [{
                            type: 17,
                            components: [
                                {
                                    type: 9,
                                    components: [
                                        {
                                            type: 10,
                                            content: [
                                                '## Лучший ход',
                                                `Игрок <@${member.id}> получил возможность сделать **лучший ход**.`,
                                                ``,
                                                `> <@${member.id}>, выберите вашу **тройку мафии**.`
                                            ].join('\n')
                                        }
                                    ],
                                    accessory: {
                                        type: 11,
                                        media: {
                                            url: memberObj?.displayAvatarURL()
                                        }
                                    }
                                },
                                {
                                    type: 1,
                                    components: [{
                                        type: 3,
                                        options: mafia.members.map((x,i) => ({
                                            label: `${(i+1).toString().padStart(2, '0')}`,
                                            value: i.toString()
                                        })).filter(Boolean),
                                        custom_id: 'mafia.step#user#'+member.id,
                                        min_values: 3,
                                        max_values: 3
                                    }]
                                }
                            ]
                        }]
                    }
                }
            ).catch(() => { return; });
        } else if(action == 'user') {
            const user = args[1];
            if(user != interaction.user.id) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: 'Это не ваш выбор'
                }).catch(() => { return; })
            }
            interaction.reply({
                flags: ['Ephemeral'],
                content: '> Ваш лучший ход был сохранен'
            }).catch(() => { return; });
            interaction.message.delete().catch(() => { return; });
            const playerIds = interaction.values.map(x => Number(x));
            await interaction.client.rest.post(
                Routes.channelMessages(mafia.channels.text), {
                    body: {
                        embeds: [{
                            title: 'ЛУЧШИЙ ХОД',
                            description: `${playerIds.map(x => `**${config.slotIcons[x]}**`).join(', ')}`,
                            thumbnail: {
                                url: interaction.client.user.displayAvatarURL()
                            }
                        }]
                    }
                }
            ).catch(() => { return });
            await Service.database.editMafia(mafia._id, {
                $set: {
                    beststep: {
                        sentBy: interaction.user.id,
                        players: playerIds 
                    }
                }
            });
        }

    }
}