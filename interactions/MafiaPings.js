const Interaction = require("../clases/Interaction");
const { ButtonInteraction, Routes } = require('discord.js');
const Service = require("../services/Services");
const { config } = require("../config");

module.exports = class MafiaPings extends Interaction {
    constructor() {
        super('mafia.ping');
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

        const param = {
            'voice': 'pingMembers',
            'role': 'pingRole'
        }[args[0]];

        interaction.reply({
            content: 'Пингануло',
            flags: ["Ephemeral"]
        })
        
        let voiceExcludeMembers = [];
        if (param == 'pingMembers') {
            const voice = await interaction.client.channels
                .fetch(mafia.channels.voice, {
                    force: true
                })
                .catch(() => { return });
            const voiceMembers = [...voice.members.values()];
            const mafiaMembers = mafia.members.slice(0, 10);
            voiceExcludeMembers = mafiaMembers.filter(e => !voiceMembers.some(j => j.id == e.id));
        }
        console.log(config.messages[param], param, config.messages)

        await interaction.client.rest.post(
            Routes.channelMessages(mafia.channels.text), {
                body: {
                    content: config.messages[param]
                        .replaceAll('$count', 10-mafia.members.length)
                        .replaceAll('$channel', `<#${mafia.channels.voice}>`)
                        .replaceAll('$pings', voiceExcludeMembers.map((x) => `<@!${x.id}>`).join(', '))
                }
            }
        )

    }
}