'use strict';

// imports
const { 
    Client, 
    Events, 
    IntentsBitField,
} = require("discord.js");

const eventsList = require("./events");
const { prepareStorage } = require("./guildsRequests.js");

require("dotenv").config();

// bot configuration
const intents = [
	IntentsBitField.Flags.Guilds, 
  	IntentsBitField.Flags.GuildMembers,
  	IntentsBitField.Flags.GuildMessages,
  	IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildPresences
];

prepareStorage();

const client = new Client({ intents: intents });
client.once(Events.ClientReady, async client => {
    console.log(client);
    console.log(`${client.user.tag}, locked and loaded! Type '/init' to start initialization`);
});

eventsList.forEach(event => {
    client.on(event.name, (...args) => event.function(client, ...args));
});

client.login(process.env.TOKEN);