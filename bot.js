'use strict';

// imports
const { 
    Client, 
    Events, 
    IntentsBitField
} = require("discord.js");

const eventsList = require("./events");

require("dotenv").config();

// bot configuration
const intents = [
	IntentsBitField.Flags.Guilds, 
  	IntentsBitField.Flags.GuildMembers,
  	IntentsBitField.Flags.GuildMessages,
  	IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
];

const client = new Client({ intents: intents });

client.once(Events.ClientReady, client => {
    console.log(client);
	console.log(`${client.user.tag}, locked and loaded! Type '/init' to start initialization`);
});

eventsList.forEach(event => {
    client.on(event.name, event.function);
});

client.login(process.env.TOKEN);