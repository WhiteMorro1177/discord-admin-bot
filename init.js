const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
} = require("discord.js");

const _configAliases = require("./config/aliases"); // link aliases for functions

// first step of initialization
const createInitMeassage = async (message) => {
    
    const firstInitMessage = "Starting configuration process...\n\nFirst of all, select functions, which bot will be able to moderate:";
    const actionRow = new ActionRowBuilder(); // create ActionRow object - collection for buttons
    
    // set up buttons for every function ever exists
    for (const [key, value] of _configAliases) {
        const button = new ButtonBuilder()
        .setLabel(value)
        .setStyle(ButtonStyle.Primary)
        .setCustomId(key);
        
        actionRow.addComponents(button);
    }

    // add "exit" button
    const button = new ButtonBuilder()
    .setLabel("Next step")
    .setStyle(ButtonStyle.Success)
    .setCustomId("exit");
    
    actionRow.addComponents(button);
    
    const reply = await message.reply({ content: firstInitMessage, components: [actionRow] }); // create message which contatins buttons
    const filter = (interaction) => message.author.id === interaction.user.id; // filter clicks on buttons
    
    // create object which will be "collect" buttons clicks
    const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter
    });
    
    // import config file
    const _serverConfig = require(`./guilds/${message.guild.id}.json`);

    // add "click" event listener
    let choosenFunctionCounter = 0;
    collector.on("collect", async (interaction) => {
        interaction.deferUpdate(); // hide "Interaction failed" error
        
        // handle "Next step" button click
        if (interaction.customId === "exit") {
            // message.delete();
            // reply.delete();
            showOptionChooser(reply, collector);
            return;
        }
        // handle other buttons clicks
        choosenFunctionCounter++; // count functions
        actionRow.components.filter(button => button.data.custom_id === interaction.customId).at(0).setDisabled(true); // filter clicked button and disable it
        

        // submit button changes
        reply.edit({
            content: reply.content + `\n${choosenFunctionCounter}: ${interaction.component.label}`,
            components: [actionRow]
        });

        // rewrite config file
        _serverConfig.options[interaction.customId] = true;
        console.log(_serverConfig);
    });
}

const showOptionChooser = async (reply, collector) => {
    collector.removeAllListeners();
    const optionChooserReplyContent = "Config saved.\n\nChoose option you would like to configurate next:";

    // import config file
    const _serverConfig = require(`./guilds/${reply.guild.id}.json`);

    const serverConfigOptions = new Map(Object.entries(JSON.parse(_serverConfig.options)));

    const optionChooserActionRow = new ActionRowBuilder();
    serverConfigOptions.forEach((value, key) => {
        if (value) {

            // create buttons for every enabled function
            const button = new ButtonBuilder()
            .setLabel(_configAliases.get(key))
            .setStyle(ButtonStyle.Primary)
            .setCustomId(key);
        
            optionChooserActionRow.addComponents(button);
        }
    });

    reply.edit({
        content: optionChooserReplyContent,
        components: [optionChooserActionRow]
    });

    // add "click" event listener
    collector.on("collect", async (interaction) => {
        switch (interaction.customId) {
            case "voiceChannelsCreation":
                if (_serverConfig.main_voice_channel_id == -1) {
                    // create new voice channel
                    
                }
                else {
                    // choose existed voice channel for creation

                    const voiceChannelsIds = _serverConfig.voice_channels_ids;
                    
                    const replyContent = "";
                    const actionRow = new ActionRowBuilder();
                    voiceChannelsIds.forEach(id => {
                        
                        // create buttons for every voice channel
                        const voiceChannelName = interaction.guild.channels.cache.filter(channel => channel.id == id);
                        const button = new ButtonBuilder()
                            .setLabel(voiceChannelName)
                            .setStyle(ButtonStyle.Primary)
                            .setCustomId(id);
                            
                            actionRow.addComponents(button);
                    });
                    
                    reply.edit({
                        content: replyContent,
                        components: [actionRow]
                    });
                }   
                break;
            case "roleSystem":
                reply.edit({
                    content: "Config saved.\n\nThis function has not configuration method\n\nChoose option you would like to configurate next:"
                });
                break;
            default: return;
        }
    });
}


module.exports = createInitMeassage;