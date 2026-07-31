const Interaction = require("../clases/Interaction");
const { Routes, StringSelectMenuInteraction, ButtonInteraction } = require('discord.js');
const Service = require("../services/Services");
const { ObjectId } = require("mongodb");
const { config } = require('../config');

module.exports = class MafiaRoleAction extends Interaction {
    constructor() {
        super('mafia.roleaction');
    }
    /**
     * 
     * @param {StringSelectMenuInteraction|ButtonInteraction} interaction 
     * @param {Array<string>} args 
     */
    async execute(interaction, args) {
        const [ role, mafiaId ] = args;
        let mafia = await Service.database.findMafia({
            _id: new ObjectId(mafiaId)
        });
        if (!mafia) {
            return interaction.reply({
                flags: ['Ephemeral'],
                content: 'Не удалось найти стол. Похоже это меню больше не доступно.'
            })
        };

        if(interaction.isStringSelectMenu()) {
            const playerID = Number(interaction.values[0]);
            if(role == 'commissar') {
                const member = mafia.members[playerID];
                if(!member) return;
                interaction.update({
                    embeds:[{
                        title: 'Проверен '+(playerID+1).toString().padStart(2, '0'),
                        description: 'Он оказался **'+{don:'черным',mafia:'черным',civilian:'мирным',doctor:'мирным',commissar:'мирным'}[member.role]+'**',
                        thumbnail: {
                            url: interaction.user.displayAvatarURL()
                        }
                    }],
                    components: []
                }).catch(() => { return });

                await interaction.client.rest.post(
                    Routes.channelMessages(mafia.channels.thread), {
                        body: {
                            content: `> **Комиссар** проверил игрока **${config.slotIcons[playerID]}**. ${{
                                don: '⬛', mafia: '🟥', doctor: '🟩', commissar: '🟦', civilian: '⬜'
                            }[member.role]}`,
                        }
                    }
                ).catch((e) => { return console.log(e); })
            } else if(role == 'doctor') {
                const member = mafia.members[playerID];
                if(!member || !member.alive) return;
                if(member.id == interaction.user.id && mafia.doctorChoices.includes(playerID)) {
                    await interaction.client.rest.post(
                        Routes.channelMessages(mafia.channels.thread), {
                            body: { content: `> **Доктор** попытался вылечить самого себя **второй раз**.` }
                        }
                    ).catch((e) => { return console.log(e); });
                    return interaction.reply({
                        ephemeral: true,
                        content: '> Вы не можете вылечить самого себя **дважды**.'
                    });
                }
                if(mafia.doctorChoices.pop() == playerID) {
                    await interaction.client.rest.post(
                        Routes.channelMessages(mafia.channels.thread), {
                            body: { content: `> **Доктор** попытался вылечить **${config.slotIcons[playerID]}** второй раз **подряд**.` }
                        }
                    ).catch((e) => { return console.log(e); });
                    return interaction.reply({
                        ephemeral: true,
                        content: '> Вы не можете вылечить одного и того же игрока **дважды**.'
                    });
                }
                interaction.update({
                    embeds:[{
                        title: 'Вылечен '+(playerID+1).toString().padStart(2, '0'),
                        description: 'Вы успешно вылечили игрока **'+config.slotIcons[playerID]+'**',
                        thumbnail: {
                            url: interaction.user.displayAvatarURL()
                        }
                    }],
                    components: []
                }).catch(() => { return });

                await interaction.client.rest.post(
                    Routes.channelMessages(mafia.channels.thread), {
                        body: { content: `> **Доктор** вылечил игрока **${config.slotIcons[playerID]}**.` }
                    }
                ).catch((e) => { return console.log(e); });
                
                await Service.database.editMafia(mafia._id, {
                    $push: {
                        doctorChoices: playerID
                    }
                });
            }
        } else if (interaction.isButton()) {
            const activeRoles = { commissar: 'Комиссар', doctor: 'Доктор' }
            interaction.client.rest.post(
                Routes.channelMessages(mafia.channels.thread), {
                    body: { content: `> **${activeRoles[role]}** подтвердил получение роли.` }
                }
            ).catch(() => { return; });
            interaction.update({ components: [
                ...interaction.message.components.slice(0, -1)
            ] });
        }
        

    }
}