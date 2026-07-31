const Interaction = require("../clases/Interaction");
const { Routes, ButtonInteraction } = require('discord.js');
const Service = require("../services/Services");
const { config } = require('../config');

module.exports = class MafiaTime extends Interaction {
    constructor() {
        super('mafia.stop');
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
        
        const endType = args[0];
        const gameRoles = {
            civilian: 'Мирный житель',
            commissar: 'Комиссар',
            doctor: 'Доктор',
            mafia: 'Мафия',
            don: 'Дон',
            nothing: 'Нету'
        }
        
        await Service.database.editMafia(mafia._id, {
            $set: {
                state: 'final',
                result: endType,
                endedAt: Date.now()
            }
        });
        mafia = await Service.database.findMafia({
            owner: interaction.user.id
        });
        await interaction.client.rest.post(
            Routes.channelMessages(mafia.channels.text), {
                body: {
                    embeds:[{
                        title: 'Игра завершена',
                        description: [
                            `Результат: **${{
                                'peace': 'Победа мирного города',
                                'mafia': 'Победа мафии',
                                'null': 'Ничья'
                            }[endType]}**`,
                            ``,
                            `> **Роли**:`,
                            ...mafia.members.map((x,i) =>
                                config.slotIcons[i]+` ${gameRoles[x.role]}`
                            )
                        ].join('\n'),
                        thumbnail: {
                            url: interaction.client.user.displayAvatarURL()
                        }
                    }]
                }
            }
        );
        interaction.update({
            content: 'Завершено. Можно закрывать',
            components: []
        }).catch(() => { return });

        updateMessage(mafia);

    }
}