'use strict';

// imports
const { Client, Events, IntentsBitField, ChannelType, ButtonBuilder, SlashCommandBuilder } = require("discord.js");
const _config = require("./config.json");
const request = require("request");

// bot configuration
const intents = [
	IntentsBitField.Flags.Guilds, 
  	IntentsBitField.Flags.GuildMembers,
  	IntentsBitField.Flags.GuildMessages,
  	IntentsBitField.Flags.MessageContent
]

const slash_hello = new SlashCommandBuilder().setName("hello");
const url = "https://discord.com/api/v10/applications/895734878249828363/commands";


// // command creation
// module.exports = {
// 	data: new SlashCommandBuilder()
// 	.setName("init").setDescription("Reinitialize bot"), 
// 	async execute(interaction) {
// 		await interaction.channel.send("init");
// 	},
	
// 	data: new SlashCommandBuilder().setName("hello"),
// 	async execute(interaction) {
// 		await interaction.reply("Hi!");
// 	}
// }

// bot init

module.exports = {
	data: slash_hello,
	async execute(interaction) {
		console.log("Command called");
	}
}

const client = new Client({ intents: intents});

// bot initialization
client.once(Events.ClientReady, client => {
	console.log(`Start configurate ${client.user.tag}`); 

	_config.server_info["users"] = client.users;
	_config.server_info["roles"] = client.roles;
	_config.server_info["text-channels"] = client.channels.cache.filter(channel => { if (channel.type == ChannelType.GuildText) return true; });
	_config.server_info["main-text-channel"] = client.channels.cache.filter((channel) => { if (channel.name == "bot-tests") { return true; } }).at(0);
	
	console.log(_config.server_info);
	
	console.log(`Logged as ${client.user.tag}`);
  	_config.server_info["main-text-channel"].send(`${client.user.tag}, locked and loaded! Type '${_config.command_prefix}init' to start initialization`);
});

// message handling
client.on(Events.MessageCreate, message => {
  	if (message.author.bot) return; // ignore bot messages
  	if (message.channel != _config.server_info["main-text-channel"]) return; // ignore all channels except "main"
	
  	// payload

	// command handling
	if (message.content.startsWith(_config.command_prefix)) { // if "message" is a command...
		
	}
	// logging messages
	// ...

});

// commands handling
client.on(Events.InteractionCreate, interaction => {
	if (!interaction.isChatInputCommand()) return;
	console.log("Interaction created");

	if (interaction.commandName == "hello") {
		interaction.reply("Hi");
	}
});

// users handling => new user registration
client.on(Events.GuildMemberAdd, member => {

});

// roles handling
client.on(Events.GuildRoleCreate, role => {

});

client.login(_config.token);