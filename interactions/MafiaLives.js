const Interaction = require("../clases/Interaction");
const { Routes, StringSelectMenuInteraction, messageLink, NewsChannel } = require('discord.js');
const Service = require("../services/Services");
const { config } = require("../config");

module.exports = class MafiaAction extends Interaction {
    constructor() {
        super('mafia.live');
    }
    /**
     * 
     * @param {StringSelectMenuInteraction} interaction 
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
        const playerIds = interaction.values.map(x => Number(x));

        const text = await interaction.client.channels.fetch(mafia.channels.text);
        const voice = await interaction.client.channels.fetch(mafia.channels.voice);
        if(args[0] == 'kill') {
            for(const player of playerIds) {
                mafia.members[player].alive = false;
            }
            await Service.database.editMafia(mafia._id, {
                $set: {
                    members: mafia.members
                }
            });
            mafia = await Service.database.findMafia({
                _id: mafia._id
            });
            await updateMessage(mafia);
            await interaction.client.rest.post(
                Routes.channelMessages(mafia.channels.text), {
                    body: {
                        embeds: [{
                            title: 'УБИЙСТВО В ГОРОДЕ',
                            description: playerIds.length>1?
                                `Были убиты игроки: ${playerIds.map(x => `**${config.slotIcons[x]}**`).join(', ')}` :
                                `Был убит игрок: **${config.slotIcons[playerIds[0]]}**`,
                            thumbnail: {
                                url: interaction.client.user.displayAvatarURL()
                            }
                        }]
                    }
                }
            ).catch(() => { return });
            interaction.update({
                components: [{
                    type: 17,
                    components: [{
                        type: 10,
                        content: [
                            `# Убийство подтверждено`,
                            `Убиты игроки: ${playerIds.map(x => `**${config.slotIcons[x]}**`).join(', ')}`
                        ].join('\n'),
                    }]
                }]
            }).catch(() => { return })
            for(const player of playerIds) {
                const playerObject = mafia.members[player];
                await Promise.all([
                    text.permissionOverwrites.delete(playerObject.id).catch(() => { return }),
                    voice.permissionOverwrites.delete(playerObject.id).catch(() => { return })
                ]).catch(() => { return; })
                await interaction.client.rest.patch(
                    Routes.guildMember(interaction.guild.id, playerObject.id),
                    {
                        body: {
                            nick: "",
                            channel_id: mafia.channels.voice
                        }
                    }
                ).catch(() => { return });
                if(['don', 'mafia'].includes(playerObject.role)) {
                    await interaction.client.rest.patch(
                        Routes.guildMember(mafia.server.id, playerObject.id), {
                            body: {
                                communication_disabled_until: new Date(Date.now()+(1000*60*60*1)).toISOString()
                            }
                        }
                    ).catch(() => { return });
                }
            }
        } else if(args[0] == 'revive') {
            for(const player of playerIds) {
                mafia.members[player].alive = true;
            }
            await Service.database.editMafia(mafia._id, {
                $set: {
                    members: mafia.members
                }
            });
            mafia = await Service.database.findMafia({
                _id: mafia._id
            });
            await updateMessage(mafia);
            await interaction.client.rest.post(
                Routes.channelMessages(mafia.channels.text), {
                    body: {
                        embeds: [{
                            title: 'ВОСКРЕШЕНИЕ В ГОРОДЕ',
                            description: playerIds.length>1?
                                `Были воскрешены игроки: ${playerIds.map(x => `**${config.slotIcons[x]}**`).join(', ')}` :
                                `Был воскрешен игрок: **${config.slotIcons[playerIds[0]]}**`,
                            thumbnail: {
                                url: interaction.client.user.displayAvatarURL()
                            }
                        }]
                    }
                }
            ).catch(() => { return });
            interaction.update({
                components: [{
                    type: 17,
                    components: [{
                        type: 10,
                        content: [
                            `# Воскрешение подтверждено`,
                            `Воскрешены игроки: ${playerIds.map(x => `**${config.slotIcons[x]}**`).join(', ')}`
                        ].join('\n'),
                    }]
                }]
            }).catch(() => { return })
            for(const player of playerIds) {
                const playerObject = mafia.members[player];
                const permissionsText = (mafia.time == 'day' ? config.permissions.player[0] : config.permissions.player[1]);
                const permissionsVoice = (mafia.time == 'day' ? config.permissions.player[2] : config.permissions.player[3]);
                await Promise.all([
                    await text.permissionOverwrites.create(playerObject.id, {
                            ...permissionsText.allow.reduce((p,c) => { p[c] = true; return p },{}),
                            ...permissionsText.deny?.reduce((p,c) => { p[c] = false; return p },{})
                        }
                    ).catch(() => { return }),
                    await voice.permissionOverwrites.create(playerObject.id, {
                            ...permissionsVoice.allow.reduce((p,c) => { p[c] = true; return p },{}),
                            ...permissionsVoice.deny?.reduce((p,c) => { p[c] = false; return p },{})
                        }
                    ).catch(() => { return })
                ]).catch(() => { return; });


                await interaction.client.rest.patch(
                    Routes.guildMember(interaction.guild.id, playerObject.id),
                    {
                        body: {
                            nick: `${(player+1).toString().padStart(2, '0')} ${
                                playerObject.folls||playerObject.warns ? 
                                `[${[playerObject.folls?`Ф:${playerObject.folls}`:'', playerObject.warns?`П:${playerObject.warns}`:''].filter(Boolean).join(' ')}]`
                                :''
                            }`,
                            channel_id: mafia.channels.voice
                        }
                    }
                ).catch(() => { return });
                if(['don', 'mafia'].includes(playerObject.role)) {
                    await interaction.client.rest.patch(
                        Routes.guildMember(mafia.server.id, playerObject.id), {
                            body: {
                                communication_disabled_until: null
                            }
                        }
                    ).catch(() => { return });
                }
            }
        } else if(args[0] == 'beststep') {
            await updateMessage(mafia);
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
            interaction.update({
                components: [{
                    type: 17,
                    components: [{
                        type: 10,
                        content: [
                            `# Лучший ход подтвержден`,
                            `Тройка мафий: ${playerIds.map(x => `**${config.slotIcons[x]}**`).join(', ')}`
                        ].join('\n'),
                    }]
                }]
            }).catch(() => { return });
            for(const player of playerIds) {
                const playerObject = mafia.members[player];
                await interaction.client.rest.patch(
                    Routes.guildMember(interaction.guild.id, playerObject.id),
                    {
                        body: {
                            nick: `${(player+1).toString().padStart(2, '0')} ${
                                playerObject.folls||playerObject.warns ? 
                                `[${[playerObject.folls?`Ф:${playerObject.folls}`:'', playerObject.warns?`П:${playerObject.warns}`:''].filter(Boolean).join(' ')}]`
                                :''
                            }`
                        }
                    }
                ).catch(() => { return });
            }
        }

    }
}