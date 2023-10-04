'use strict';

// imports
const { Client, Events, IntentsBitField, ChannelType } = require("discord.js");
const _config = require("./config.json");
const { Command } = require("./bot_entities")

// bot configuration
const intents = [
	IntentsBitField.Flags.Guilds, 
  	IntentsBitField.Flags.GuildMembers,
  	IntentsBitField.Flags.GuildMessages,
  	IntentsBitField.Flags.MessageContent,
]

// bot init
const client = new Client({ intents: intents});

// bot initialization
client.once(Events.ClientReady, client => {
	console.log(`Start configurate ${client.name}`); 
	
	_config.server_info["users"] = client.users;
	_config.server_info["roles"] = client.roles;
	_config.server_info["text-channels"] = client.channels.cache.filter(channel => { if (channel.type == ChannelType.GuildText) return true; });
	_config.server_info["main-text-channel"] = client.channels.cache.filter((channel) => { if (channel.name == "bot-tests") { return true; } }).at(0);
	
	console.log(_config.server_info);
	
	

  	_config.server_info["main-text-channel"].send(`Hi! Still Just_A_Bot, but now on JS! Say  '${_config.command_prefix}hello'  to me`);
});

// message handling
client.on(Events.MessageCreate, message => {
  	if (message.author.bot) return; // ignore bot messages
  	if (message.channel != _config.server_info["main-text-channel"]) return; // ignore all channels except "main"
	
  	// payload

	// command handling
	if (message.content.startsWith(_config.command_prefix)) { // if "message" is a command...
		const cmd_text = message.content.replace(_config.command_prefix, "");

		const cmd = new Command(message.content, message.author);

	}
	// logging messages
});

// users handling => new user registration
client.on(Events.GuildMemberAdd, member => {

});


client.login(_config.token);