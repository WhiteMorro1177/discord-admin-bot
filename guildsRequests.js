const fs = require("node:fs");
const guildDataDirPath = process.env.GUILDS_DATA_DIR;

require("dotenv").config();
// const guildConfig = require("./guilds/guilds.json");

// config files requests
const getDefualtGuildConfig = () => {
    // read "guild.default.json" file
    const defaultConfig = fs.readFileSync(`${guildDataDirPath}/guild.default.json`, "utf-8");
    // parse json
    const defaultConfigJson = JSON.parse(defaultConfig);
    return defaultConfigJson;
}

const prepareStorage = () => {
    try {
        fs.mkdirSync(guildDataDirPath, { recursive: true });
        console.log("Data directory existed or created");
        fs.writeFileSync(`${guildDataDirPath}/guild.json`, JSON.stringify({}));
        console.log("Guilds storage file created");
        fs.writeFileSync(
            `${guildDataDirPath}/guild.default.json`, 
            JSON.stringify({
                "id": "",
                "name": "",
                "users": [], 
                "registration_channel_id": "",
                "main_text_channel_id": "",
                "text_channels_ids": [],
                "voice_creation_channel_id": "",
                "voice_channels_ids": [], 
                "temp_voices_ids": [],
                "roles_map": {},
                "reports": [],
                "options": {
                    "voiceChannelsCreation": false,
                    "roleSystem": false
                }
            }
        ));
        console.log("Guilds default config file created");
    } catch (error) {
        console.error("Error occured preparing storage", error);
    }
}

const getAvailableGuildsIds = () => {
    const guildConfig = require(`${guildDataDirPath}/guilds.json`);
    const guildListIds = guildConfig.map(guild => String(guild.id));
    return guildListIds;
}

const hasGuildConfiguration = (id) => {
    return getAvailableGuildsIds().includes(id);
}

const getGuildConfigFile = (guildId) => {
    // prepare enviroment
    prepareStorage();

    // check if guild configuration existed
    if (hasGuildConfiguration(guildId)) {
        const guildConfig = require(`${guildDataDirPath}/guilds.json`);
        const requiredGuildConfig = guildConfig.find(guild => String(guild.id) === String(guildId));
        return requiredGuildConfig;
    }
    else {
        const defaultConfig = getDefualtGuildConfig();
        defaultConfig.id = guildId;
        saveGuildConfig(defaultConfig);
        return defaultConfig;
    }
}

const saveGuildConfig = (newConfig) => {
    const guildConfig = require(`${guildDataDirPath}/guilds.json`);
    // check if guildConfig.id is already in guildsList
    if (guildConfig.find(guild => String(guild.id) === String(newConfig.id))) {
        // if it is, update the guildConfig
        const guildIndex = guildConfig.findIndex(guild => String(guild.id) === String(newConfig.id));
        guildConfig[guildIndex] = newConfig;
    } else {
        // if it is not, add it to the list
        guildConfig.push(newConfig);
    }
    // Save the file in both cases
    fs.writeFileSync(`${guildDataDirPath}/guild.json`, JSON.stringify(guildConfig, null, 2));
}

const deleteGuildConfig = (guildId) => {
    const guildConfig = require(`${guildDataDirPath}/guilds.json`);
    const guildIndex = guildConfig.findIndex(guild => String(guild.id) === String(guildId));
    if (guildIndex !== -1) {
        guildConfig.splice(guildIndex, 1);
        fs.writeFileSync(`${guildDataDirPath}/guild.json`, JSON.stringify(guildConfig, null, 2));
    }
}


module.exports = {
    prepareStorage,
    hasGuildConfiguration,
    getGuildConfigFile,
    saveGuildConfig,
    deleteGuildConfig
}