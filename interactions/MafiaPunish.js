const Interaction = require("../clases/Interaction");
const { ButtonInteraction, Routes } = require('discord.js');
const Service = require("../services/Services");
const { config, database } = require("../config");

module.exports = class MafiaPunish extends Interaction {
    constructor() {
        super('mafia.punish');
    }
    /**
     * 
     * @param {ButtonInteraction} interaction 
     * @param {Array<string>} args 
     */
    async execute(interaction, args) {
        let mafia = await Service.database.findMafia({
            thread: interaction.channel.id
        });
        if (!mafia) {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Не удалось найти стол. Похоже это меню больше не доступно.'
            })
        };
        if (mafia.state != 'game') {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Не доступно до начала игры.'
            });
        };
        
        async function updateMessage(mafia) {
            await interaction.client.rest.patch(
                Routes.channelMessage(mafia.channels.thread, mafia.channels.threadMessage),
                { body: Service.messages.generateMafia(mafia) }
            )
        }
        
        const [ type, playerId ] = args;
        const id = Number(playerId);
        console.log(id, playerId, interaction.customId);
        if(!mafia.members[id]?.alive) {
            updateMessage(mafia)
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Игрок уже мёртв. Нельзя выдать наказание',
            });
        }

        mafia.members[id][type+'s']++;

        await Service.database.editMafia(mafia._id, {
            $set: {
                members: mafia.members
            }
        });
        mafia = await Service.database.findMafia({
            owner: interaction.user.id
        });
        const player = mafia.members[id];
        updateMessage(mafia);
        interaction.reply({
            flags: ['Ephemeral'],
            content: 'Выдано'
        }).catch(() => { return; });

        switch(type) {
            case 'foll':
                await interaction.client.rest.post(
                    Routes.channelMessages(mafia.channels.text), {
                        body: {
                            flags: 32768,
                            components: [{
                                type: 17,
                                components: [
                                    {
                                        type: 10,
                                        content: '# Фол',
                                    },
                                    {
                                        type: 14,
                                        spacing: 2
                                    },
                                    {
                                        type: 10,
                                        content: `Игрок **${config.slotIcons[id]}** <@${player.id}> получил **${player.folls}-й** фол`,
                                    },
                                    {
                                        type: 1,
                                        components: [
                                            {
                                                type: 2,
                                                style: 2,
                                                label: 'Отменить фол',
                                                custom_id: `mafia.unpunish#foll_${id}`
                                            }
                                        ]
                                    }
                                ]
                            }]
                        }
                    }
                ).catch(() => { return; });
                break;
            case 'warn':
                await interaction.client.rest.post(
                    Routes.channelMessages(mafia.channels.text), {
                        body: {
                            flags: 32768,
                            components: [{
                                type: 17,
                                components: [
                                    {
                                        type: 10,
                                        content: '# Предупреждение',
                                    },
                                    {
                                        type: 14,
                                        spacing: 2
                                    },
                                    {
                                        type: 10,
                                        content: `Игрок **${config.slotIcons[id]}** <@${player.id}> получил **${player.warns}-е** предупреждение`,
                                    },
                                    {
                                        type: 1,
                                        components: [
                                            {
                                                type: 2,
                                                style: 2,
                                                label: 'Отменить предупреждение',
                                                custom_id: `mafia.unpunish#warn_${id}`
                                            }
                                        ]
                                    }
                                ]
                            }]
                        }
                    }
                ).catch((e) => { return console.log(e); });
            default:
                break;
        }
        // await interaction.client.rest.post(
        //     Routes.channelMessages(mafia.channels.text), {
        //         body: {
        //             content: `<@${player.id}>`,
        //             embeds:[{
        //                 title: {warn:'Предупреждение',foll:'Фолл'}[type]+' игрок '+(id+1).toString().padStart(2, '0'),
        //                 description: 'Наказание было выдано ведущим.',
        //                 thumbnail: {
        //                     url: interaction.client.user.displayAvatarURL()
        //                 }
        //             }]
        //         }
        //     }
        // ).catch(() => { return; });
        
        await interaction.client.rest.patch(
            Routes.guildMember(interaction.guild.id, player.id), {
                body: {
                    nick: `${(id+1).toString().padStart(2, '0')} [${[player.folls?`Ф:${player.folls}`:'', player.warns?`П:${player.warns}`:''].filter(Boolean).join(' ')}]`
                }
            }
        ).catch((e) => { return; });

    }
}