const {
    Events,
    ChannelType,
    ActionRowBuilder,
    ChannelSelectMenuBuilder,
    RoleSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const { registerGuildSlashCommands } = require('./registerCommands');
const { getGuildConfigFile, saveGuildConfig } = require("./guildsRequests.js");


var GuildCreateEvent = {
    name: Events.GuildCreate,
    function: async (client, guild) => {
        // Collect data from the guild and store it in guildConfig
        const guildConfig = getGuildConfigFile(guild.id);

        // Gather guild name
        guildConfig.name = guild.name;

        // Gather all user IDs in the guild
        guildConfig.users = Array.from(guild.members.cache.values())
            .filter(member => !member.user.bot)
            .map(member => ({
                user_id: member.id,
                user_roles: member.roles.cache.filter(role => role.id !== guild.id).map(role => role.id),
                warn_count: 0
            }));

        // Gather all text channel IDs in the guild
        guildConfig.text_channels_ids = Array.from(guild.channels.cache.values())
            .filter(channel => channel.type === ChannelType.GuildText)
            .map(channel => channel.id);

        // Gather all voice channel IDs in the guild
        guildConfig.voice_channels_ids = Array.from(guild.channels.cache.values())
            .filter(channel => channel.type === ChannelType.GuildVoice)
            .map(channel => channel.id);

        // Save the collected data to the configuration
        saveGuildConfig(guildConfig);

        try {
            require("dotenv").config();
            await registerGuildSlashCommands(client, process.env.TOKEN);
        } catch (err) {
            console.error('Failed to register slash commands', err);
        }
    }
}

// var MessageCreateEvent = {
//     name: Events.MessageCreate,
//     function: async (client, message) => {
//         if (message.author.bot) return; // ignore bot messages
//         // if (message.channel.id != _config.server_info["main-text-channel-id"]) return; // ignore all channels except "main"

//         // command handling
//         // if (message.content.startsWith("/")) { // if "message" is a command...

//         // }


//         // logging messages
//         // ...
//     }
// }

var InteractionCreateEvent = {
    name: Events.InteractionCreate,
    function: async (client, interaction) => {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName === "config") {
            // Check if the user is an admin
            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (!member.permissions.has("Administrator")) {
                return await interaction.reply({
                    content: "Только администратор может использовать эту команду.",
                    ephemeral: true
                });
            }

            // message must be sended to main_text_channel_id
            // message must contains buttons with choices

            // check guild id

            /* select option to configure
                select option
                select Enable/Disable
            */

            /* for voiceChannelsCreation
            select voice channel from exists that became voice_creation_channel 
    
            */

            /* for roleSystem
    
            Roles:
                - Admin (0)
                - Member (1)
                - Friend (2)
                - Guest (3)
    
            select internal "Admin" role from existed roles on guild
            select internal "Member" role from existed roles on guild
            select internal "Friend" role from existed roles on guild
            select internal "Guest" role from existed roles on guild
            */

            // create rows

            // create main selector row
            const aliases = require("./config/aliases.js");
            const guildConfig = getGuildConfigFile(interaction.guildId);
            const summary = () => {
                // Get the voice creation channel name by id
                let voiceCreationChannelName = "---";
                if (guildConfig.voice_creation_channel_id) {
                    const channel = interaction.guild.channels.cache.get(guildConfig.voice_creation_channel_id);
                    if (channel) {
                        voiceCreationChannelName = channel.name;
                    }
                }
                // get roles names by ids in roles_map
                let rolesSummary = "";
                if (guildConfig.roles_map) {
                    const rolesMap = guildConfig.roles_map;
                    const roleNames = [];
                    for (const [internalRole, roleId] of Object.entries(rolesMap)) {
                        const role = interaction.guild.roles.cache.get(roleId);
                        let displayName = role ? role.name : "Not set";
                        // Format internalRole to readable label
                        let label = "";
                        switch (internalRole) {
                            case "admin_role_id":
                                label = "Роль 'Адимнистратор'";
                                break;
                            case "member_role_id":
                                label = "Роль 'Участник'";
                                break;
                            case "friend_role_id":
                                label = "Роль 'Друг'";
                                break;
                            case "guest_role_id":
                                label = "Роль 'Гость'";
                                break;
                            default:
                                label = internalRole;
                        }
                        roleNames.push(`${label}: ${displayName}`);
                    }
                    if (roleNames.length > 0) {
                        rolesSummary = "Роли:\n\t" + roleNames.join(",\n\t") + "\n";
                    }
                }
                return [
                    `ID Сервера: ${guildConfig.id},`,
                    `Имя сервера: ${guildConfig.name},`,
                    `Количество участников на сервере: ${(Array.isArray(guildConfig.users) ? guildConfig.users.length : 0)},`,
                    guildConfig.options.voiceChannelsCreation ? `Канал для создания временных голосовых чатов: ${voiceCreationChannelName}\n` : "",
                    guildConfig.options.roleSystem ? rolesSummary : "",
                    `Функции:`,
                    `\tСоздание временных войс-чатов: ${guildConfig.options.voiceChannelsCreation ? "Включено" : "Выключено"},`,
                    `\tИспользование системы ролей: ${guildConfig.options.roleSystem ? "Включено" : "Выключено"}.`
                ].join('\n');
            };

            const optionButtons = Array.from(aliases.keys()).map(key =>
                new ButtonBuilder()
                    .setCustomId(key)
                    .setLabel(aliases.get(key))
                    .setStyle(ButtonStyle.Primary)
            );
            const guildConfigOptionsRow = new ActionRowBuilder().addComponents([
                ...optionButtons,
                new ButtonBuilder()
                    .setCustomId("dismiss")
                    .setLabel("Закрыть")
                    .setStyle(ButtonStyle.Secondary)
            ]);

            // create voiceCreationToggleRow
            const voiceCreationToggleRow = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId("toggle_voice_creation_enable")
                    .setLabel("Включить")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("toggle_voice_creation_disable")
                    .setLabel("Выключить")
                    .setStyle(ButtonStyle.Danger),
            ]);

            // create roleSystemToggleRow
            const roleSystemToggleRow = new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                    .setCustomId("toggle_role_system_enable")
                    .setLabel("Включить")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("toggle_role_system_disable")
                    .setLabel("Выключить")
                    .setStyle(ButtonStyle.Danger),
            ]);


            const voiceCreationChannelRow = new ActionRowBuilder().addComponents(
                new ChannelSelectMenuBuilder()
                    .setCustomId('voice_creation_channel_select')
                    .setPlaceholder('Канал для создания временных войс-чатов')
                    .setChannelTypes([ChannelType.GuildVoice])
            );
            const adminRoleRow = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId('role_select_admin')
                    .setPlaceholder("Выберете роль 'Администратор'")
            );
            const memberRoleRow = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId('role_select_member')
                    .setPlaceholder("Выберете роль 'Участник'")
            );
            const friendRoleRow = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId('role_select_friend')
                    .setPlaceholder("Выберете роль 'Друг'")
            );
            const guestRoleRow = new ActionRowBuilder().addComponents(
                new RoleSelectMenuBuilder()
                    .setCustomId('role_select_guest')
                    .setPlaceholder("Выберете роль 'Гость'")
            );
            const roleSelectProceedButtonRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('role_select_proceed')
                    .setLabel('Подтвердить')
                    .setStyle(ButtonStyle.Primary)
            );

            // run interaction
            const response = await interaction.reply({
                content: `${summary()}\nВыберите опцию для конфигурации`,
                components: [
                    guildConfigOptionsRow
                ],
                ephemeral: true,
                fetchReply: true
            });

            // Set up a collectors
            const filterVoiceChannelCreatonSelect = i => (i.user.id === interaction.user.id) && (i.customId === "voiceChannelsCreation");
            const filterRoleSystemSelect = i => (i.user.id === interaction.user.id) && (i.customId === "roleSystem");
            const filterVoiceChannelCreaton = i => (i.user.id === interaction.user.id) && (
                i.customId === "toggle_voice_creation_enable" ||
                i.customId === "toggle_voice_creation_disable");
            const filterRoleSystem = i => (i.user.id === interaction.user.id) && (
                i.customId === "toggle_role_system_enable" ||
                i.customId === "toggle_role_system_disable");
            const filterVoiceChannelSelect = i => (i.user.id === interaction.user.id) && (i.customId === "voice_creation_channel_select");
            const filterRolesSelect = i => (i.user.id === interaction.user.id) && (i.customId.includes("role_select"));
            const filterDismissButton = i => (i.user.id === interaction.user.id) && (i.customId === "dismiss");

            const voiceChannelCreatonSelectCollector = response.createMessageComponentCollector({ filter: filterVoiceChannelCreatonSelect, time: 600_000 });
            const roleSystemSelectCollector = response.createMessageComponentCollector({ filter: filterRoleSystemSelect, time: 600_000 });
            const voiceChannelCreatonCollector = response.createMessageComponentCollector({ filter: filterVoiceChannelCreaton, time: 600_000 });
            const roleSystemCollector = response.createMessageComponentCollector({ filter: filterRoleSystem, time: 600_000 });
            const voiceChannelSelectCollector = response.createMessageComponentCollector({ filter: filterVoiceChannelSelect, time: 600_000 });
            const rolesSelectCollector = response.createMessageComponentCollector({ filter: filterRolesSelect, time: 600_000 });
            const dismissCollector = response.createMessageComponentCollector({ filter: filterDismissButton, time: 600_000 });

            // collectors events
            voiceChannelCreatonSelectCollector.on("collect", async i => {
                await i.update({
                    content: "Включить опцию 'Создание временных войс-чатов'?",
                    components: [
                        voiceCreationToggleRow
                    ]
                });
            });

            roleSystemSelectCollector.on("collect", async i => {
                await i.update({
                    content: "Включить опцию: 'Использование системы ролей'?",
                    components: [
                        roleSystemToggleRow
                    ]
                });
            });

            voiceChannelCreatonCollector.on("collect", async i => {
                if (i.customId === "toggle_voice_creation_enable") {
                    guildConfig.options.voiceChannelsCreation = true
                    saveGuildConfig(guildConfig);
                    await i.update({
                        content: `${summary()}`,
                        components: [
                            voiceCreationChannelRow
                        ]
                    })
                }
                if (i.customId === "toggle_voice_creation_disable") {
                    guildConfig.options.voiceChannelsCreation = false
                    guildConfig.voice_creation_channel_id = ""
                    saveGuildConfig(guildConfig);
                    await i.update({
                        content: `${summary()}\nВыберите опцию для конфигурации`,
                        components: [
                            guildConfigOptionsRow
                        ]
                    })
                }
            });

            roleSystemCollector.on("collect", async i => {
                if (i.customId === "toggle_role_system_enable") {
                    guildConfig.options.roleSystem = true
                    saveGuildConfig(guildConfig);
                    await i.update({
                        content: summary(),
                        components: [
                            adminRoleRow,
                            memberRoleRow,
                            friendRoleRow,
                            guestRoleRow,
                            roleSelectProceedButtonRow
                        ]
                    });
                }
                if (i.customId === "toggle_role_system_disable") {
                    guildConfig.options.roleSystem = false
                    guildConfig.roles_map = {};
                    saveGuildConfig(guildConfig);
                    await i.update({
                        content: `${summary()}\nВыберите опцию для конфигурации`,
                        components: [
                            guildConfigOptionsRow
                        ]
                    })
                }
            });

            voiceChannelSelectCollector.on("collect", async i => {
                const channelId = i.values[0];
                guildConfig.voice_creation_channel_id = channelId;
                saveGuildConfig(guildConfig);
                return i.update({
                    content: `${summary()}\nВыберите опцию для конфигурации`,
                    components: [
                        guildConfigOptionsRow
                    ]
                });
            });

            rolesSelectCollector.on("collect", async i => {
                guildConfig.roles_map ??= {};
                if (i.customId === 'role_select_admin') {
                    const selectedRoleId = i.values[0];
                    guildConfig.roles_map.admin_role_id = selectedRoleId;
                    await i.deferUpdate();
                }
                if (i.customId === 'role_select_member') {
                    const selectedRoleId = i.values[0];
                    guildConfig.roles_map.member_role_id = selectedRoleId;
                    await i.deferUpdate();
                }
                if (i.customId === 'role_select_friend') {
                    const selectedRoleId = i.values[0];
                    guildConfig.roles_map.friend_role_id = selectedRoleId;
                    await i.deferUpdate();
                }
                if (i.customId === 'role_select_guest') {
                    const selectedRoleId = i.values[0];
                    guildConfig.roles_map.guest_role_id = selectedRoleId;
                    await i.deferUpdate();
                }

                if (i.customId === 'role_select_proceed') {
                    saveGuildConfig(guildConfig);
                    await i.update({
                        content: `${summary()}\nВыберите опцию для конфигурации`,
                        components: [
                            guildConfigOptionsRow
                        ]
                    });
                }
            });

            dismissCollector.on("collect", async i => {
                await i.update({
                    content: "Конфигуратор отключён.",
                    components: []
                });
            });
        }

        if (interaction.commandName === "status") {
            // Check if a user was mentioned
            const userMention = interaction.options.getUser('user');
            if (!userMention) {
                return await interaction.reply({
                    content: "Пожалуйста, укажите пользователя для проверки его статуса. Вариант использования: `/status @user`",
                    ephemeral: true
                });
            }

            // Check if the user has admin privileges
            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (!member.permissions.has("Administrator")) {
                return await interaction.reply({
                    content: "Только администратор может использовать эту команду.",
                    ephemeral: true
                });
            }

            // Get guild config
            const guildConfig = getGuildConfigFile(interaction.guildId);

            // Find user info in guild config
            const userInfo = (guildConfig.users || []).find(u => u.user_id === userMention.id);

            if (!userInfo) {
                return await interaction.reply({
                    content: `Пользователь <@${userMention.username}> отсутствует в конфигурационном файле.`,
                    ephemeral: true
                });
            }

            // Prepare user info summary
            const roleNames = Array.isArray(userInfo.user_roles)
                ? userInfo.user_roles
                    .map(rid => interaction.guild.roles.cache.get(rid)?.name)
                    .filter(Boolean)
                : [];

            let statusMsg = `**Статус для <@${userMention.username}>**\n`;
            statusMsg += `ID пользователя: \`${userMention.id}\`\n`;
            statusMsg += `Количество предупреждений: \`${userInfo.warn_count || 0}\`\n`;
            if (roleNames.length > 0) {
                statusMsg += `Роли: ${roleNames.join(", ")}\n`;
            }

            return await interaction.reply({
                content: statusMsg,
                ephemeral: true
            });
        }

        if (interaction.commandName === "warn") {
            // Check if a user was mentioned
            const userMention = interaction.options.getUser('user');
            if (!userMention) {
                return await interaction.reply({
                    content: "Пожалуйста, укажите пользователя для выдачи предупреждения. Варианты использования: `/warn @user`",
                    ephemeral: true
                });
            }

            // Only allow admins to warn
            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (!member.permissions.has("Administrator")) {
                return await interaction.reply({
                    content: "Только администратор может использовать эту команду.",
                    ephemeral: true
                });
            }

            // Get guild config
            const guildConfig = getGuildConfigFile(interaction.guildId);
            guildConfig.users ??= [];

            let userInfo = guildConfig.users.find(u => u.user_id === userMention.id);
            if (!userInfo) {
                userInfo = { user_id: userMention.id, user_roles: [], warn_count: 0 };
                guildConfig.users.push(userInfo);
            }
            userInfo.warn_count = (userInfo.warn_count || 0) + 1;

            // Save updated config
            saveGuildConfig(guildConfig);

            return await interaction.reply({
                content: `Пользователь <@${userMention.username}> был предупреждён. Всего предупреждений: \`${userInfo.warn_count}\``,
                ephemeral: true
            });
        }

        if (interaction.commandName === "dewarn") {
            // Check if a user was mentioned
            const userMention = interaction.options.getUser('user');
            if (!userMention) {
                return await interaction.reply({
                    content: "Пожалуйста, укажите пользователя для снятия предупреждения. Варианты использования: `/dewarn @user`",
                    ephemeral: true
                });
            }

            // Only allow admins to dewarn
            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (!member.permissions.has("Administrator")) {
                return await interaction.reply({
                    content: "Только администратор может использовать эту команду.",
                    ephemeral: true
                });
            }

            // Get guild config
            const guildConfig = getGuildConfigFile(interaction.guildId);
            guildConfig.users ??= [];

            let userInfo = guildConfig.users.find(u => u.user_id === userMention.id);
            if (!userInfo) {
                userInfo = { user_id: userMention.id, user_roles: [], warn_count: 0 };
                guildConfig.users.push(userInfo);
            }
            userInfo.warn_count = Math.max(0, (userInfo.warn_count || 0) - 1);

            // Save updated config
            saveGuildConfig(guildConfig);

            return await interaction.reply({
                content: `С пользователя <@${userMention.username}> было снято предупреждение. Всего предупреждений: \`${userInfo.warn_count}\``,
                ephemeral: true
            });
        }

        if (interaction.commandName === "report") {
            // Check if a user was mentioned
            const userMention = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');

            if (!userMention || !reason) {
                return await interaction.reply({
                    content: "Пожалуйста, укажите пользователя и предоставьте причину. Варианты использования: `/report @user reason`",
                    ephemeral: true
                });
            }

            // Optionally, you can log the report to a specific channel or store it in the config
            // For now, just acknowledge the report
            await interaction.reply({
                content: `Жалоба на пользователя <@${userMention.id}> была отправлена. Причина: "${reason}"`,
                ephemeral: true
            });

            const guildConfig = getGuildConfigFile(interaction.guildId);
            guildConfig.reports ??= []

            const report = {
                id: Math.random().toString(36).substr(2, 9),
                from: interaction.user.id,
                to: userMention.id,
                reason: reason
            }

            guildConfig.reports.push(report);
            saveGuildConfig(guildConfig);
        }

        if (interaction.commandName === "show_reports") {
            // Check if the user is an admin
            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (!member.permissions.has("Administrator")) {
                return await interaction.reply({
                    content: "Только администратор может использовать эту команду.",
                    ephemeral: true
                });
            }

            const guildConfig = getGuildConfigFile(interaction.guildId);
            const reports = Array.isArray(guildConfig.reports) ? guildConfig.reports : [];

            if (reports.length === 0) {
                return await interaction.reply({
                    content: "На этом сервере нет жалоб.",
                    ephemeral: true
                });
            }

            // Format the reports for display, including the report id
            let reportMessages = reports.map((report, idx) => {
                return `**#${idx + 1}** (ID: \`${report.id}\`)\nОтправивший жалобу: <@${report.from}>\nЦель жалобы: <@${report.to}>\nПричина: ${report.reason}`;
            });

            // Discord message limit is 2000 chars, so chunk if needed
            const MAX_LENGTH = 1900;
            let chunks = [];
            let current = "";
            for (const msg of reportMessages) {
                if ((current + "\n\n" + msg).length > MAX_LENGTH) {
                    chunks.push(current);
                    current = msg;
                } else {
                    current += (current ? "\n\n" : "") + msg;
                }
            }
            if (current) chunks.push(current);

            for (let i = 0; i < chunks.length; i++) {
                await interaction.reply({
                    content: `**Жалобы (${reports.length}):**\n\n${chunks[i]}`,
                    ephemeral: true
                });
                // For subsequent chunks, use followUp
                interaction = {
                    ...interaction,
                    reply: interaction.followUp
                };
            }
        }

        if (interaction.commandName === "close") {
            // Check if a report_id was provided
            const reportId = interaction.options.getString('report_id');
            // Only allow admins to close reports
            const member = await interaction.guild.members.fetch(interaction.user.id);
            if (!member.permissions.has("Administrator")) {
                return await interaction.reply({
                    content: "Только администратор может использовать эту команду.",
                    ephemeral: true
                });
            }

            // Get guild config and reports
            const guildConfig = getGuildConfigFile(interaction.guildId);
            guildConfig.reports ??= [];

            if (reportId < 1 || reportId > guildConfig.reports.length) {
                return await interaction.reply({
                    content: `Жалоба #${reportId} не существует.`,
                    ephemeral: true
                });
            }

            // Fetch usernames for the 'from' and 'to' user IDs
            const closedReport = guildConfig.reports.splice(reportId - 1, 1)[0];
            saveGuildConfig(guildConfig);

            let fromUser, toUser;
            try {
                fromUser = await interaction.guild.members.fetch(closedReport.from);
                fromUser = fromUser.user.username;
            } catch {
                fromUser = closedReport.from;
            }
            try {
                toUser = await interaction.guild.members.fetch(closedReport.to);
                toUser = toUser.user.username;
            } catch {
                toUser = closedReport.to;
            }

            return await interaction.reply({
                content: `Жалоба #${reportId} (от ${fromUser} на ${toUser}) закрыта.`,
                ephemeral: true
            });
        }
    }
}

var VoiceStateUpdateEvent = {
    name: Events.VoiceStateUpdate,
    function: async (client, oldState, newState) => {
        let _server_info = null;

        if (newState) {
            _server_info = getGuildConfigFile(newState.guild.id);
        }
        else if (oldState) {
            _server_info = getGuildConfigFile(oldState.guild.id);
        }
        else return;

        // voice channels creation
        if (_server_info && _server_info.options.voiceChannelsCreation) {
            if (newState?.channel?.id === _server_info.voice_creation_channel_id) {
                const creationChannel = newState.guild.channels.cache.find(channel => channel.id === _server_info.voice_creation_channel_id);
                console.log(`Creation channel: ${creationChannel}`);

                const creationChannelCategory = creationChannel ? creationChannel.parent : null;
                console.log(`Creation channel category: ${creationChannelCategory}`);

                const user = newState?.channel?.members?.at(0)?.user;
                if (!user) return;
                console.log(`User: ${user}`);

                // Create a new temporary voice channel for the user and move them into it
                const channelName = `${user.username}'s Channel`;
                console.log(`Creating channel: ${channelName}`);
                newState.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    parent: creationChannelCategory,
                    permissionOverwrites: [
                        {
                            id: user.id,
                            allow: ['Connect', 'Speak', 'ViewChannel'],
                        },
                        {
                            id: newState.guild.roles.everyone,
                            allow: ['Connect', 'Speak', 'ViewChannel'],
                        }
                    ]
                }).then(async (createdChannel) => {
                    // Add the new channel to temp_voices_ids
                    _server_info.temp_voices_ids ??= [];
                    _server_info.temp_voices_ids.push(createdChannel.id);
                    console.log(`Channel created: ${createdChannel.name}`);

                    // Save the updated config
                    saveGuildConfig(_server_info);

                    // Move the user to the new channel
                    if (newState.member && createdChannel) {
                        await newState.member.voice.setChannel(createdChannel);
                    }
                }).catch(console.error);
            }

            const leavedChannel = oldState.channel;
            if (leavedChannel) {
                // Check if the channel is a temporary voice channel
                const channelToDeleteId = _server_info.temp_voices_ids.find(id => id === leavedChannel.id);

                if (channelToDeleteId) {
                    // Only delete if the channel is empty
                    if (leavedChannel.members.size === 0) {
                        try {
                            await leavedChannel.delete();
                            // Remove the channel from temp_voices_ids
                            const index = _server_info.temp_voices_ids.indexOf(channelToDeleteId);
                            if (index !== -1) {
                                _server_info.temp_voices_ids.splice(index, 1);
                            }
                            // Save the updated config
                            saveGuildConfig(_server_info);
                        } catch (error) {
                            console.error(`Failed to delete channel: ${leavedChannel.id}`, error);
                        }
                    }
                }
            }
        }
    }
}

var ChannelCreateEvent = {
    name: Events.ChannelCreate,
    function: (client, channel) => {
        console.log(`New channel created: ${channel.name}`);

        if (channel.type === ChannelType.GuildVoice) {
            // Get guild configuration
            const _server_info = getGuildConfigFile(channel.guild.id);

            if (!_server_info.voice_channels_ids.includes(channel.id)) {
                _server_info.voice_channels_ids.push(channel.id);
                // Save the updated config
                saveGuildConfig(_server_info);
            }
        }
        if (channel.type === ChannelType.GuildText) {
            // Get guild configuration
            const _server_info = getGuildConfigFile(channel.guild.id);

            if (!_server_info.text_channels_ids.includes(channel.id)) {
                _server_info.text_channels_ids.push(channel.id);
                // Save the updated config
                saveGuildConfig(_server_info);
            }
        }
    }
}

var ChannelDeleteEvent = {
    name: Events.ChannelDelete,
    function: (client, channel) => {
        console.log(`Channel deleted: ${channel.name}`);

        if (channel.type === ChannelType.GuildVoice) {
            // Get guild configuration
            const _server_info = getGuildConfigFile(channel.guild.id);

            // Remove the channel from temp_voices_ids if present
            _server_info.temp_voices_ids = _server_info.temp_voices_ids.filter(id => id !== channel.id);
            _server_info.voice_channels_ids = _server_info.voice_channels_ids.filter(id => id !== channel.id);

            // Save the updated config
            saveGuildConfig(_server_info);
        }
        if (channel.type === ChannelType.GuildText) {
            // Get guild configuration
            const _server_info = getGuildConfigFile(channel.guild.id);

            // Remove the channel from text_channels_ids if present
            _server_info.text_channels_ids = _server_info.text_channels_ids.filter(id => id !== channel.id);

            // Save the updated config
            saveGuildConfig(_server_info);
        }
    }
}

var GuildMemberAddEvent = {
    name: Events.GuildMemberAdd,
    function: async (client, member) => {
        const guildConfig = getGuildConfigFile(member.guild.id);
        guildConfig.users ??= [];


        // Try to get the guest role id from roles_map
        let guestRoleId = null;
        if (guildConfig.roles_map && guildConfig.roles_map.guest_role_id) {
            guestRoleId = guildConfig.roles_map.guest_role_id;
        }

        if (!guildConfig.users.find(u => u.user_id === member.id)) {
            // Add guest role to the member in Discord if it exists and member doesn't already have it
            if (guestRoleId && !member.roles.cache.has(guestRoleId)) {
                try {
                    await member.roles.add(guestRoleId);
                } catch (e) {
                    console.error(`Failed to add Guest role to user ${member.id}:`, e);
                }
            }

            // Add user to config, including the guest role if present
            let userRoles = member.roles.cache.filter(r => r.id !== member.guild.id).map(r => r.id);
            if (guestRoleId && !userRoles.includes(guestRoleId)) {
                userRoles.push(guestRoleId);
            }
            guildConfig.users.push({ user_id: member.id, user_roles: userRoles, warn_count: 0 });
            saveGuildConfig(guildConfig);
        } else {
            // If user already exists in config, ensure they have the guest role in Discord and in config
            if (guestRoleId && !member.roles.cache.has(guestRoleId)) {
                try {
                    await member.roles.add(guestRoleId);
                } catch (e) {
                    console.error(`Failed to add Guest role to user ${member.id}:`, e);
                }
            }
            if (guestRoleId && !guildConfig.users.find(u => u.user_id === member.id).user_roles.includes(guestRoleId)) {
                guildConfig.users.find(u => u.user_id === member.id).user_roles.push(guestRoleId);
                saveGuildConfig(guildConfig);
            }
        }
    }
}

var GuildMemberUpdateEvent = {
    name: Events.GuildMemberUpdate,
    function: async (client, oldMember, newMember) => {
        const guildConfig = getGuildConfigFile(newMember.guild.id);
        guildConfig.users ??= [];
        let user = guildConfig.users.find(u => u.user_id === newMember.id);
        if (!user) {
            user = { user_id: newMember.id, user_roles: [], warn_count: 0 };
            guildConfig.users.push(user);
        }
        user.user_roles = newMember.roles.cache.filter(role => role.id !== newMember.guild.id).map(role => role.id);

        saveGuildConfig(guildConfig);
    }
}

module.exports = [
    GuildCreateEvent,
    InteractionCreateEvent,
    VoiceStateUpdateEvent,
    ChannelCreateEvent,
    ChannelDeleteEvent,
    GuildMemberAddEvent,
    GuildMemberUpdateEvent
];
