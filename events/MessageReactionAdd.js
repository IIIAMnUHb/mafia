const { ChannelType, MessageReaction, User } = require('discord.js');
const Service = require("../services/Services");
const { config } = require('../config');
/**
 * 
 * @param {MessageReaction} reaction 
 * @param {User} user 
 */
module.exports = async (reaction, user) => {
    if(user.bot) return;
    const channel = reaction.message.channel;
    if(
        [ChannelType.GuildText, ChannelType.PrivateThread].includes(channel.type) &&
        channel.parentId == config.category
    ) {
        const mafia = await Service.database.findMafia({
            text: channel.id, thread: channel.id
        });
        if(!mafia) return;
        if(mafia.channels.thread == channel.id) {
            await MasterReaction(reaction, user, mafia);
        } else {
            await VoteReaction(reaction, user, mafia);
        }
    }
}
/**
 * 
 * @param {MessageReaction} reaction 
 * @param {User} user 
 */
async function MasterReaction(reaction, user, mafia) {};
/**
 * 
 * @param {MessageReaction} reaction 
 * @param {User} user 
 */
async function VoteReaction(reaction, user, mafia) {
    const voteEmoji = [
        '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'
    ]
    if(!voteEmoji.includes(reaction.emoji.name)) return;
    const emojiIndex = voteEmoji.indexOf(reaction.emoji.name);
    console.log(emojiIndex)
    reaction.users.remove(user.id).catch(() => { return; });
    const vote = await Service.database.findVote({ activeVote: reaction.message.id });
    const voterId = mafia.members.findIndex(e => e.id == user.id);
    
    if(voterId == -1 || !mafia.members[voterId].alive) return;
    if(vote.votes.some(e => voterId == e.id)) return;

    await Service.database.editVote(vote._id, {
        $push: {
            votes: {
                id: voterId,
                voteFor: vote.candidates.findIndex(e => e == emojiIndex)
            }
        }
    });
    const candidateNumber = emojiIndex;
    reaction.message.channel.send(`> **${(voterId+1).toString().padStart(2, '0')}** проголосовал за **${config.slotIcons[candidateNumber]}**`)
};