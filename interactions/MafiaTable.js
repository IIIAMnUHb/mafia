const Interaction = require("../clases/Interaction");
const { Routes, UserSelectMenuInteraction } = require('discord.js');
const Service = require("../services/Services");
const { config } = require("../config");

module.exports = class MafiaAction extends Interaction {
    constructor() {
        super('mafia.table');
    }
    /**
     * 
     * @param {UserSelectMenuInteraction} interaction 
     */
    async execute(interaction) {
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
        const newOwner = interaction.values[0];
        const newOwnerUser = await interaction.guild.members.fetch(newOwner);
        if(!newOwnerUser.roles.cache.find(e => config.use.includes(e.id))) {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: '> Невозможно передать стол этому человеку'
            })
        }
        interaction.update({
            flags: ['Ephemeral'],
            content: 'Мафия передана.',
            components: []
        }).catch(() => { return });
        async function updateMessage(mafia) {
            await interaction.client.rest.patch(
                Routes.channelMessage(mafia.channels.thread, mafia.channels.threadMessage),
                { body: Service.messages.generateMafia(mafia) }
            ).catch(() => { return });
        }

        await Service.database.editMafia(mafia._id, {
            $set: {
                owner: newOwner
            }
        });
            
        await interaction.client.rest.delete(
            Routes.guildMember(mafia.server.id, mafia.owner), {
                query: { reason: "Смена владельца стола" }
            }
        ).catch(() => { return });

        await interaction.client.rest.delete(
            Routes.threadMembers(mafia.channels.thread, mafia.owner)
        ).catch(() => { return });
        await interaction.client.rest.put(
            Routes.threadMembers(mafia.channels.thread, newOwner)
        ).catch(() => { return });

        mafia = await Service.database.findMafia({
            thread: mafia.channels.thread
        });
        
        updateMessage(mafia);
        await interaction.client.rest.patch(
            Routes.channelMessage(mafia.channels.text, mafia.channels.chatMessage), {
                body: Service.messages.generateMenu(mafia)
            }    
        ).catch(() => { return; });


    }
}