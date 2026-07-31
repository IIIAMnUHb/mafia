const { Client, GatewayIntentBits, Events } = require('discord.js');
const Service = require('./services/Services');
const { token } = require('./config');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers
    ]
});

Service.init();

client.rest.on('rateLimited', (info) => {
  console.log('Rate limit hit:', info);
});


setTimeout(() => {
    fs.readdirSync('./events').forEach(file => {
        console.log('Registring event:', file);
        client.on(Events[file.split('.')[0]], require(`./events/${file}`));
    });

    client.login(token);    
}, 1000)
