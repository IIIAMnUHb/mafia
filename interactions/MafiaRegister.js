const Interaction = require("../clases/Interaction");
const { ButtonInteraction, Routes } = require('discord.js');
const Service = require("../services/Services");
const { config } = require("../config");

module.exports = class MafiaRegister extends Interaction {
    constructor() {
        super('mafia.register');
    }
    /**
     * 
     * @param {ButtonInteraction} interaction 
     * @param {Array<string>} args 
     */
    async execute(interaction, args) {
        if(interaction.member.roles.cache.find(e => config.restrictedRoles.includes(e.id))) {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Вы не можете записаться на эту игру.'
            }).catch(() => { return; });
        }
        let mafia = await Service.database.findMafia({
            text: interaction.channelId
        });
        if (!mafia) {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Не удалось найти стол. Похоже это меню больше не доступно.'
            })
        };
        if (mafia.owner == interaction.user.id) {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Вы не можете записаться на свою же игру.'
            }).catch(() => { return; });
        };
        let isSubscribed = false;
        if (mafia.members.find(e => e.id == interaction.user.id)) {
            isSubscribed = true;
            await Service.database.editMafia(mafia._id, {
                $pull: { 
                    members: {
                        id: interaction.user.id 
                    }
                }
            });
        } else {
            await Service.database.editMafia(mafia._id, {
                $push: { 
                    members: {
                        id: interaction.user.id, 
                        role: 'nothing', 
                        folls: 0, 
                        warns: 0, 
                        alive: true 
                    }
                }
            });
        }
        mafia = await Service.database.findMafia({
            text: interaction.channelId
        });

        await interaction.client.rest.patch(
            Routes.channelMessage(mafia.channels.thread, mafia.channels.threadMessage),
            { body: Service.messages.generateMafia(mafia) }
        ).catch(() => { return; })
        await interaction.message.edit(Service.messages.generateMenu(mafia)).catch(() => { return; });
        interaction.reply({
            flags: ['Ephemeral'],
            content: isSubscribed?
                'Вы успешно отписаны':
                'Вы успешно записались на мафию. Намжите повторно чтобы отписаться.'
        });

        if(mafia.members.length == 10) {
            interaction.client.rest.post(
                Routes.channelMessages(mafia.channels.thread), {
                    body: { content: `<@${mafia.owner}> стол собрался.` }
                }
            ).catch(() => { return; })
        }
    }
}