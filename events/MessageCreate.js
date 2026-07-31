const { ChannelType, Message } = require('discord.js');
const Service = require("../services/Services");
const { config } = require('../config');
/**
 * 
 * @param {Message} message 
 */
module.exports = async (message) => {
    if(message.channel.type != ChannelType.GuildVoice) return;
    if(message.channel.parentId != config.category) return;
    if(message.author.bot) return;
    const connectedMafia = await Service.database.findMafia({
        voice: message.channel.id
    });
    if(!connectedMafia) return;
    if(message.deletable) message.delete()
        .catch(() => { return; });
    const slotsNumber = Math.floor(Number(message.content));
    if(slotsNumber < 0 || slotsNumber > 99) return;
    await message.channel.setUserLimit(slotsNumber);
    message.channel
        .send(`> Установлен лимит в голосовом канале: \`${slotsNumber?`${slotsNumber} сл.`:'Неограничено'}\``)
        .then((msg) => setTimeout(() => msg.delete(), 5000))
}