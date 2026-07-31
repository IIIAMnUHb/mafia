const Interaction = require("../clases/Interaction");
const { ButtonInteraction, Routes } = require('discord.js');
const Service = require("../services/Services");
const { config, database } = require("../config");

module.exports = class MafiaUnpunish extends Interaction {
    constructor() {
        super('mafia.unpunish');
    }
    /**
     * 
     * @param {ButtonInteraction} interaction 
     * @param {Array<string>} args 
     */
    async execute(interaction, args) {
        let mafia = await Service.database.findMafia({
            thread: interaction.channel.id,
            owner: interaction.user.id
        });
        if (!mafia) {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Не удалось найти стол. Похоже это меню больше не доступно.'
            })
        };
        
        async function updateMessage(mafia) {
            await interaction.client.rest.patch(
                Routes.channelMessage(mafia.channels.thread, mafia.channels.threadMessage),
                { body: Service.messages.generateMafia(mafia) }
            )
        }
        
        const [ type, playerId ] = (interaction?.values?.[0] || args[0]).split('_') ;
        const id = Number(playerId);

        if(type != 'all' && !mafia.members[id].alive) {
            updateMessage(mafia)
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Игрок уже мёртв. Нельзя снять наказание',
            });
        }

        let amnisted = [];
        if(type == 'warn' || type == 'foll') {
            mafia.members[id][type+'s']--;
        } else {
            for(let i = 0; i < mafia.members.length; i++) {
                if(mafia.members[i].folls || mafia.members[i].warns) {
                    amnisted.push(i);
                    mafia.members[i].folls = 0;
                    mafia.members[i].warns = 0;
                }
            }
        }

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
        interaction[args[0]?'reply':'update']({
            flags: ['Ephemeral'],
            content: 'Снято',
            components: []
        }).catch(() => { return; });

        if (type == 'all') {
            await interaction.client.rest.post(
                Routes.channelMessages(mafia.channels.text), {
                    body: {
                        flags: ['IsComponentsV2'],
                        components: [{
                            type: 17,
                            components: [
                                {
                                    type: 10,
                                    content: '# Амнистия',
                                },
                                {
                                    type: 14,
                                    spacing: 2
                                },
                                {
                                    type: 10,
                                    content: `Все наказания были сняты всем.`,
                                }
                            ]
                        }]
                    }
                }
            ).catch(() => { return; });

            for(const unpunished of amnisted) {
                const player = mafia.members[unpunished];
                await interaction.client.rest.patch(
                    Routes.guildMember(interaction.guild.id, player.id), {
                        body: {
                            nick: `${(unpunished+1).toString().padStart(2, '0')} ${player.folls+player.warns>0?`[${[player.folls?`Ф:${player.folls}`:'', player.warns?`П:${player.warns}`:''].filter(Boolean).join(' ')}]`:''}`
                        }
                    }
                ).catch((e) => { return; });
            }
        } else {
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
                                            content: `Фол был снят игроку **${config.slotIcons[id]}** <@${player.id}>`,
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
                                            content: `Предупреждение снято игроку **${config.slotIcons[id]}** <@${player.id}>`,
                                        }
                                    ]
                                }]
                            }
                        }
                    ).catch(() => { return; });
                default:
                    break;
            }
            
            await interaction.client.rest.patch(
                Routes.guildMember(interaction.guild.id, player.id), {
                    body: {
                        nick: `${(id+1).toString().padStart(2, '0')} ${player.folls+player.warns>0?`[${[player.folls?`Ф:${player.folls}`:'', player.warns?`П:${player.warns}`:''].filter(Boolean).join(' ')}]`:''}`
                    }
                }
            ).catch((e) => { return; });
        }

    }
}