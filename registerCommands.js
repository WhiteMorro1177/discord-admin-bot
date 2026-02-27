'use strict';

const { REST, Routes } = require('discord.js');

/**
 * Register guild-level slash commands for all guilds the bot is in.
 * @param {import('discord.js').Client} client
 * @param {string} token
 */
async function registerGuildSlashCommands(client, token) {
	const commands = [
		{
			name: 'config',
			description: 'Open interactive configuration for this server'
		},
		{
			name: 'status',
			description: 'Show status info for a user',
			options: [
				{
					name: 'user',
					description: 'User to check',
					type: 6, // ApplicationCommandOptionType.User
					required: true
				}
			]
		},
		{
			name: 'warn',
			description: 'Warn a user',
			options: [
				{
					name: 'user',
					description: 'User to warn',
					type: 6, // ApplicationCommandOptionType.User
					required: true
				}
			]
		},
		{
			name: 'dewarn',
			description: 'Remove one warning from a user',
			options: [
				{
					name: 'user',
					description: 'User to dewarn',
					type: 6, // ApplicationCommandOptionType.User
					required: true
				}
			]
		},
		{
			name: 'report',
			description: 'Report a user with a reason',
			options: [
				{
					name: 'user',
					description: 'User to report',
					type: 6, // ApplicationCommandOptionType.User
					required: true
				},
				{
					name: 'reason',
					description: 'Reason for the report',
					type: 3, // ApplicationCommandOptionType.String
					required: true
				}
			]
		},
		{
			name: 'show_reports',
			description: 'Show all reports for this server (Admin only)'
		},
		{
			name: 'close',
			description: 'Close and remove a report by ID (Admin only)',
			options: [
				{
					name: 'report_id',
					description: 'ID of the report to close',
					type: 3, // ApplicationCommandOptionType.String
					required: true
				}
			]
		}
	];

	const rest = new REST({ version: '10' }).setToken(token);
	const guildIds = client.guilds.cache.map(g => g.id);
	for (const guildId of guildIds) {
		await rest.put(
			Routes.applicationGuildCommands(client.user.id, guildId),
			{ body: commands }
		);
		console.log(`Registered slash commands for guild ${guildId}`);
	}
}

module.exports = { registerGuildSlashCommands };



