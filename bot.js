'use strict';

// imports
const { Client, Events, IntentsBitField } = require("discord.js");
const _server_info = require("./server_info.json");

require("dotenv").config();

// bot configuration
const intents = [
	IntentsBitField.Flags.Guilds, 
  	IntentsBitField.Flags.GuildMembers,
  	IntentsBitField.Flags.GuildMessages,
  	IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
]


const client = new Client({ intents: intents });

// bot initialization
client.once(Events.ClientReady, client => {
    console.log(client);

    // TODO ( do refactor )
    // _server_info.users_ids = client.guilds.cache.find(guild => guild.id == _server_info.guild_id).members.cache.map(member => member.id);
    _server_info.roles_ids = client.guilds.cache.find(guild => guild.id == _server_info.guild_id).roles.cache.map(role => role.id);

    _server_info.main_voice_channel_id = client.channels.cache.find(channel => channel.name === "#Create_Channel_[+]").id;
    
    // channel.type = 0 => GuildText
    _server_info.text_channels_ids = client.channels.cache.filter(channel => channel.type === 0).map(channel => channel.id);
    _server_info.voice_channels_ids = client.channels.cache.filter(channel => channel.type === 2).map(channel => channel.id);
    
    console.log(_server_info);
	console.log(`${client.user.tag}, locked and loaded! Type '/init' to start initialization`);
});

// message handling
client.on(Events.MessageCreate, message => {
  	if (message.author.bot) return; // ignore bot messages
  	// if (message.channel.id != _config.server_info["main-text-channel-id"]) return; // ignore all channels except "main"
	
  	// payload

	// command handling
	if (message.content.startsWith("/")) { // if "message" is a command...
		
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

// create temporary voice channels
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const creationChannel = client.channels.cache.find(channel => channel.id === _server_info.main_voice_channel_id);

    const newStateChannel = newState.channel;
    const user = newStateChannel?.members.at(0).user;

    if (newStateChannel?.id === creationChannel?.id) {
        const newChannelName = `${user?.tag}'s Voice Channel`;
        const creationChannelCategory = newState.guild.channels.cache.find(channel => channel.id === "629317885935878156");

        newState.channel.setName(newChannelName)
        .then(voice => {
            _server_info.temp_voices_ids.push(voice.id);
            console.log(_server_info.temp_voices_ids);
            newState.guild.channels.create({
                name: "#Create_Channel_[+]",
                type: 2, // GuildVoice
                parent: creationChannelCategory,
                position: 0
            })
            .then(voice => {
                voice.setPosition(voice.position - 1);
                _server_info.main_voice_channel_id = voice.id;
                _server_info.voice_channels_ids.push(voice.id);
            });
        });
    }
        
    const leavedChannel = oldState.channel;
    const channelToDeleteId = _server_info.temp_voices_ids.find(id => id === leavedChannel?.id);
    
    if (channelToDeleteId !== undefined) {
        if (leavedChannel?.members.size === 0) {
            oldState.guild.channels.delete(leavedChannel)
            _server_info.temp_voices_ids = _server_info.temp_voices_ids.filter(id => id !== channelToDeleteId);
            // TODO( rewrite with .splice() )
        }
    }
});

client.on(Events.ChannelCreate, channel => {
    console.log("New channel created");
    console.log(channel.name);

    if (channel.type === 2) { // GuildVoice
        const findedChannelId = _server_info.voice_channels_ids.find(id => id === channel.id);

        if (findedChannelId === undefined) {
            _server_info.voice_channels_ids.push(findedChannelId);
        } else {
            console.log(findedChannelId + ": this channel already exist");
            channel.delete();
        }
    }
});

client.on(Events.ChannelDelete, channel => {
    console.log("Channel deleted");
    console.log(channel.name);

    if (channel.type === 2) { // GuildVoice
        _server_info.voice_channels_ids = _server_info.voice_channels_ids.filter(id => id !== channel.id);
        // TODO( rewrite with .splice() )
    }
});

// users handling => new user registration
client.on(Events.GuildMemberAdd, member => {

});

// roles handling
client.on(Events.GuildRoleCreate, role => {

});

client.login(process.env.TOKEN);