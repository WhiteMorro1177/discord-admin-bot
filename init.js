const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
} = require("discord.js");

const _config = require("./config");
const _configAliases = require("./config_aliases"); // link aliases for functions

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
        _config.set(interaction.customId, true);
        console.log(_config);
    });
}

const showOptionChooser = async (reply, collector) => {
    collector.removeAllListeners();
    const optionChooserReplyContent = "Config saved.\n\nChoose option you would like to configurate next:";

    const optionChooserActionRow = new ActionRowBuilder();
    _config.forEach((value, key) => {
        if (value) {

            // create buttons for every enabled function
            const button = new ButtonBuilder()
            .setLabel(_configAliases.get(key))
            .setStyle(ButtonStyle.Primary)
            .setCustomId(key);
        
            optionChooserActionRow.addComponents(button);
        }
    })

    reply.edit({
        content: optionChooserReplyContent,
        components: [optionChooserActionRow]
    })

    // add "click" event listener
    collector.on("collect", async (interaction) => {
        switch (interaction.customId) {
            case "voiceChannelsCreation":
                // write configuration method for this
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