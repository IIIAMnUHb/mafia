const fs = require('fs');
module.exports = async (client) => {
    console.log(`Bot is online as ${client.user.tag}`);

    const interactionFiles = fs.readdirSync('./interactions');
    for(const interaction of interactionFiles) {
        const Interaction = require(`../interactions/${interaction}`);
        const interactionInstance = new Interaction();
        client.on('interactionCreate', async (interaction) => {
            if(interaction?.customId?.split('#')[0] == interactionInstance.customName) {
                await interactionInstance.execute(interaction, interaction.customId.split('#').slice(1));
            }
        })     
    }
    
    const commandFiles = fs.readdirSync('./commands');
    for(const command of commandFiles) {
        const Command = require(`../commands/${command}`);
        const commandInstance = new Command();
        await commandInstance.register(client);
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return;
            if (interaction.commandName === commandInstance.name) {
                await commandInstance.execute(interaction);
            }
        });
        console.log(`Registered command: ${commandInstance.name}`);
    }

    
}