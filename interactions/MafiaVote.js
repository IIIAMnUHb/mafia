const Interaction = require("../clases/Interaction");
const { Routes, StringSelectMenuInteraction } = require('discord.js');
const Service = require("../services/Services");
const { config } = require('../config');

module.exports = class MafiaTime extends Interaction {
    constructor() {
        super('mafia.vote');
    }
    /**
     * 
     * @param {StringSelectMenuInteraction} interaction 
     * @param {Array<string>} args 
     */
    async execute(interaction, args) {

        const action = args[0];
        let mafia = await Service.database.findMafia({
            ...action == 'vote' ? 
            { text: interaction.channel.id } :
            { thread: interaction.channel.id }
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
        
        if(action == 'create') {
            const values = interaction.values.map(x => Number(x));
            const preVote = {
                mafia: mafia._id,
                state: 'waiting',
                candidates: values,
                votes: [],
                messages: { ownerMenu: null, activeVote: null }
            }

            const message = await interaction.channel.send(
                Service.messages.generateVote(preVote)
            );
            
            preVote.messages.ownerMenu = message.id;

            await Service.database.createVote(preVote);

            await interaction.client.rest.post(
                Routes.channelMessages(mafia.channels.text), {
                    body: {
                        embeds: [{
                            title: 'Голосование',
                            description: `Выставлены:\n> **${preVote.candidates.map(x => config.slotIcons[x]).join(', ')}**`,
                            thumbnail: {
                                url: interaction.client.user.displayAvatarURL()
                            }
                        }]
                    }
                }
            ).catch(() => { return; });

            interaction.update({
                embeds:[],
                components:[],
                content:'Создано'
            }).catch(() => { return; })
        } else if (action == 'start') {
            let vote = await Service.database.findVote({ ownerMenu: interaction.message.id });
            if (!vote) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: 'Не удалось найти голосование'
                }).catch(() => { return });
            }
            const candidateId = Number(interaction.values[0]);
            const candidateNumber = vote.candidates[candidateId];

            const voteEmoji = [
                '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'
            ]
            
            const message = await interaction.client.rest.post(
                Routes.channelMessages(mafia.channels.text),
                {
                    body: {
                        components:[{
                            type: 1,
                            components:[{
                                type: 2,
                                disabled: true,
                                label: `Голосование за игрока #${(candidateNumber+1).toString().padStart(2, '0')}`,
                                style: 3,
                                custom_id: 'mafia.vote#vote#'+candidateId
                            }]
                        }]
                    }
                }
            );
            
            interaction.client.rest.put(
                Routes.channelMessageOwnReaction(mafia.channels.text, message.id, voteEmoji[candidateNumber])
            )

            await Service.database.editVote(vote._id, {
                $set: {
                    state: 'voting',
                    'messages.activeVote': message.id
                }
            });

            vote = await Service.database.findVote({ ownerMenu: interaction.message.id });

            await interaction.update({});
            await interaction.client.rest.patch(
                Routes.channelMessage(mafia.channels.thread, vote.messages.ownerMenu),
                { body: Service.messages.generateVote(vote) }
            );
        } else if (action == 'vote') {
            let vote = await Service.database.findVote({ activeVote: interaction.message.id });
            const voterId = mafia.members.findIndex(e => e.id == interaction.user.id)
            interaction.update({}).catch(() => { return });
            if(voterId == -1 || !mafia.members[voterId].alive) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: 'Вы не учавствуете в данной мафии или были убиты.'
                }).catch(() => { return });
            }
            if(vote.votes.some(e => voterId == e.id)) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: 'Вы уже голосовали. Проголосовать можно было ТОЛЬКО за 1-го кандидата.'
                }).catch(() => { return });
            }
            await Service.database.editVote(vote._id, {
                $push: {
                    votes: {
                        id: voterId,
                        voteFor: Number(args[1])
                    }
                }
            });
            const candidateNumber = vote.candidates[Number(args[1])];
            interaction.channel.send(`> **${(voterId+1).toString().padStart(2, '0')}** проголосовал за **${config.slotIcons[candidateNumber]}**`)
        } else if (action == 'stop') {
            let vote = await Service.database.findVote({ ownerMenu: interaction.message.id });
            if (!vote) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: 'Не удалось найти голосование'
                }).catch(() => { return });
            }

            await interaction.client.rest.delete(
                Routes.channelMessage(mafia.channels.text, vote.messages.activeVote)
            ).catch(() => { return; });

            await Service.database.editVote(vote._id, {
                $set: {
                    'messages.activeVote': null,
                    state: 'finished',
                }
            });
            
            vote = await Service.database.findVote({ ownerMenu: interaction.message.id });
            
            await interaction.update({});
            await interaction.client.rest.patch(
                Routes.channelMessage(mafia.channels.thread, vote.messages.ownerMenu),
                { body: Service.messages.generateVote(vote, mafia) }
            );
        } else if (action == 'delete') {
            let vote = await Service.database.findVote({ mafia: mafia._id });
            if (!vote) {
                return interaction.reply({
                    flags: ['Ephemeral'],
                    content: 'Не удалось найти голосование'
                }).catch(() => { return });
            }
            await Service.database.deleteVote(vote._id);
            if(args[1]) {
                interaction.message.delete();
            } else {
                interaction.update({
                    content: 'Удалено. Можете запускать голосование повторно',
                    components: []
                }) 
            }           
        }
    }
}