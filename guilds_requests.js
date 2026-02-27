const fs = require("node:fs");
const guildConfig = require("./guilds/guilds.json");

// config files requests
const getDefualtGuildConfig = () => {
    // read "guild.default.json" file
    const defaultConfig = fs.readFileSync("./guilds/guild.default.json", "utf-8");
    // parse json
    const defaultConfigJson = JSON.parse(defaultConfig);
    return defaultConfigJson;
}

const getAvailableGuildsIds = () => {
    const guildListIds = guildConfig.map(guild => String(guild.id));
    return guildListIds;
}

const hasGuildConfiguration = (id) => {
    return getAvailableGuildsIds().includes(id);
}

const getGuildConfigFile = (guildId) => {
    if (hasGuildConfiguration(guildId)) {
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
    fs.writeFileSync("./guilds/guilds.json", JSON.stringify(guildConfig, null, 2));
}

const deleteGuildConfig = (guildId) => {
    const guildIndex = guildConfig.findIndex(guild => String(guild.id) === String(guildId));
    if (guildIndex !== -1) {
        guildConfig.splice(guildIndex, 1);
        fs.writeFileSync("./guilds/guilds.json", JSON.stringify(guildConfig, null, 2));
    }
}


module.exports = {
    hasGuildConfiguration,
    getGuildConfigFile,
    saveGuildConfig,
    deleteGuildConfig
}