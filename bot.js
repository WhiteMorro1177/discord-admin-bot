'use strict';

// imports
const { Client, Events, IntentsBitField, ChannelType } = require("discord.js");
const _config = require("./config.json");
const _server_info = require("./server_info.json");

const { joinVoiceChannel } = require('@discordjs/voice');

// bot configuration
const intents = [
	IntentsBitField.Flags.Guilds, 
  	IntentsBitField.Flags.GuildMembers,
  	IntentsBitField.Flags.GuildMessages,
  	IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildVoiceStates,
]

// const slash_hello = new SlashCommandBuilder().setName("hello");
// const url = "https://discord.com/api/v10/applications/895734878249828363/commands";

const client = new Client({ intents: intents});

// bot initialization
client.once(Events.ClientReady, client => {
	console.log(`${client.user.tag}, locked and loaded! Type '${_config.command_prefix}init' to start initialization`);

    _server_info.main_voice_channel_id = client.channels.cache.find(channel => channel.name === "#Create_Channel_[+]").id;

    // console.log(client.guilds.cache.at(0));

	// _config.server_info["users-ids"] = client.users.cache.map(user => user.id);
	// _config.server_info["roles-ids"] = client.guilds.cache.at(0).roles.cache.map(role => role.id);
	// _config.server_info["text-channels-ids"] = client.channels.cache.filter(channel => channel.type === ChannelType.GuildText).map(sortedItem => sortedItem.id);
	// _config.server_info["main-text-channel-id"] = client.channels.cache.find((channel) => channel.name === "bot-tests").id;
    
	// console.log(_config.server_info);
	
	// console.log(`Logged as ${client.user.tag}`);
    // client.channels.cache
    //     .find(channel => channel.id == _config.server_info["main-text-channel-id"])
    //     .send(`${client.user.tag}, locked and loaded! Type '${_config.command_prefix}init' to start initialization`);
});

// message handling
client.on(Events.MessageCreate, message => {
  	if (message.author.bot) return; // ignore bot messages
  	// if (message.channel.id != _config.server_info["main-text-channel-id"]) return; // ignore all channels except "main"
	
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

// create temporary voice channels
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const creationChannel = client.channels.cache.find(channel => channel.id === _server_info.main_voice_channel_id);

    const newStateChannel = newState.channel;
    const user = newStateChannel?.members.at(0).user;

    if (newStateChannel?.id === creationChannel.id) {
        const newChannelName = `${user.tag}'s Voice Channel`;
        const creationChannelParent = newState.guild.channels.cache.find(channel => channel.id === "629317885935878156");

        newState.channel.setName(newChannelName)
        .then(voice => {
            _server_info.temp_voices_ids.push(voice.id);
            console.log(_server_info.temp_voices_ids);
            newState.guild.channels.create({
                name: "#Create_Channel_[+]",
                type: ChannelType.GuildVoice,
                parent: creationChannelParent,
                position: 0
            })
            .then(voice => {
                voice.setPosition(voice.position - 1);
                _server_info.main_voice_channel_id = voice.id;
            });
        });

        // newState.guild.channels.create({
        //     name: newChannelName,
        //     type: ChannelType.GuildVoice,
        //     parent: _config.guild_id
        // })
        // .then(voice => {
        //     const connection = joinVoiceChannel({
        //         channelId: voice.id,
        //         guildId: _config.guild_id,
        //         adapterCreator: newState.guild.voiceAdapterCreator
        //     });

        //     connection.
        //     _server_info.temp_voices_ids.push(voice.id);
        // });
    }
        
    const leavedChannel = oldState.channel;
    const channelToDeleteId = _server_info.temp_voices_ids.find(id => id === leavedChannel?.id);
    if (channelToDeleteId !== undefined) {
        if (leavedChannel?.members.size === 0) {
            oldState.guild.channels.delete(leavedChannel)
            _server_info.temp_voices_ids = _server_info.temp_voices_ids.filter(id => id !== channelToDeleteId);
        }
    }
    
    // const tempVoices = _config.server_info["temp-voices"];
    
    // const channelToDelete = tempVoices.find(channel => channel.id === leavedChannel.id)
    // if (channelToDelete !== undefined) {
    //     leavedChannel.guild.channels.delete(channelToDelete).then(() => {
    //         console.log("Channel {0} deleted", channelToDelete.id);
    //     });
    // }

    console.log(_server_info.temp_voices_ids);
});

client.on(Events.ChannelCreate, channel => {
    console.log("New channel created");
    console.log(channel);
});

client.on(Events.ChannelDelete, channel => {
    console.log("Channel deleted");
    console.log(channel);
});

// users handling => new user registration
client.on(Events.GuildMemberAdd, member => {

});

// roles handling
client.on(Events.GuildRoleCreate, role => {

});

client.login(_config.token);