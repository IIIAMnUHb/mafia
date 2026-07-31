const { GuildMember, Routes } = require('discord.js');
const Service = require("../services/Services");
const { config } = require('../config');
/**
 * 
 * @param {GuildMember} member 
 */
module.exports = async (member) => {
    if(!config.mafiaGuilds.includes(member.guild.id)) return;
    console.log('Обнаружен вход по инвайту на сервер МАФИИ');
    const mafia = await Service.database.findMafia({
        server: member.guild.id
    });
    if(!mafia) {
        return member.kick('Мафия связанная с этим сервером не найдена.').catch(() => { return });
    }
    if(!mafia.members.find(e => e.id == member.id && ['don','mafia'].includes(e.role)) && mafia.owner != member.id) {
        return member.kick('Человек не является участником мафии или ведущим.').catch(() => { return });
    }
    const roles = {
        'don': 'Дон',
        'mafia': 'Мафия'
    }
    const role = (() => {
        if(member.id == mafia.owner) {
            return 'Ведущий'
        }
        const mafiaMember = mafia.members.find(e => e.id == member.id);
        console.log(mafiaMember);
        return roles[mafiaMember.role]
    })();
    const memberIndex = mafia.members.findIndex(e => e.id == member.id);
    member.setNickname(
        role=='Ведущий'?
        `! ${role}` : 
        (memberIndex+1).toString().padStart(2, '0')+` ${role}`
    );
    member.timeout(null, 'Восстановление доступа к серверу МАФИИ').catch(() => { return });
    await member.client.rest.post(
        Routes.channelMessages(mafia.server.channel), {
            body: {
                content: `Добро пожаловать, <@${member.id}>. Вы **${role}**`
            }
        }
    );
}