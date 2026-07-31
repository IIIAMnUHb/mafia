const Interaction = require("../clases/Interaction");
const { Routes, StringSelectMenuInteraction, ButtonInteraction } = require('discord.js');
const Service = require("../services/Services");
const { config } = require("../config");
const { ObjectId } = require("mongodb");

module.exports = class MafiaAction extends Interaction {
    constructor() {
        super('mafia.admin');
    }
    /**
     * 
     * @param {StringSelectMenuInteraction|ButtonInteraction} interaction 
     * @param {Array<string>} args 
     */
    async execute(interaction, args) {
        const action = args[0];
        const mafiaId = interaction?.values?.[0];
        
        const mafia = await Service.database.findMafia({ _id: new ObjectId(mafiaId) });

        if(action == 'ping') {
            await interaction.client.rest.post(
                Routes.channelMessages(mafia.channels.thread), {
                    body: { content: `<@${interaction.user.id}>` }
                }
            ).catch(() => { return; });
            interaction.reply({
                flags: ['Ephemeral'],
                embeds: [{
                    title: 'Пингануло в управлении',
                    description: `[Нажмите чтобы перейти в управление](https://discord.com/channels/${config.guild}/${mafia.channels.thread})`,
                    thumbnail: {
                        url: interaction.user.displayAvatarURL()
                    }
                }]
            }).catch(() => { return; })
        } else if (action == 'delete') {
            await Service.database.deleteMafia(mafia._id);
            await Service.database.unalocateServer(mafia.server.id);

            await interaction.update(
                Service.messages.administrateMafia(
                    await Service.database.findAllMafia()
                )
            );
            
            await Promise.all([
                interaction.client.rest.delete(Routes.channel(mafia.channels.text)),
                interaction.client.rest.delete(Routes.channel(mafia.channels.voice)),
                interaction.client.rest.delete(Routes.channel(mafia.server.channel))
            ]).catch(() => { return });
        } else if (action == 'clearguilds') {
            const mafiaList = await Service.database.findAllMafia();
            const serverList = await Service.database.findAllServers();
            const noMafiaServers = serverList.filter(e => !mafiaList.some(x => x.server.id == e._id));
            const withAllocation = noMafiaServers.filter(e => e.status == "allocated");
            
            if(!withAllocation.length) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    embeds: [{
                        title: 'Сервера корректны',
                        description: 'Нету лишних выделенных серверов. **Очищать нечего**.',
                        thumbnail: {
                            url: interaction.user.displayAvatarURL()
                        }
                    }]
                }).catch(() => { return; });
            }

            await Service.database.unalocateServer(withAllocation.map(x => x._id));
            
            interaction.reply({
                flags: ['Ephemeral'],
                embeds: [{
                    title: 'Сервера очищены',
                    description: `Успешно очищено **${withAllocation.length} серв.**`,
                    thumbnail: {
                        url: interaction.user.displayAvatarURL()
                    }
                }]
            })
        }
    }
}