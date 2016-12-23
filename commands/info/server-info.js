const { Command } = require('discord.js-commando');
const moment = require('moment');
const stripIndents = require('common-tags').stripIndents;

module.exports = class ServerInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'server-info',
			aliases: ['server'],
			group: 'info',
			memberName: 'server-info',
			description: 'Get info on the server.',
			details: `Get detailed information on the server.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	async run(msg) {
		let embed = {
			color: 3447003,
			description: `Info on **${msg.guild.name}** (ID: ${msg.guild.id})`,
			fields: [
				{
					name: '❯ Channels',
					value: stripIndents`
						• ${msg.guild.channels
							.filter(ch => ch.type === 'text').size} Text, ${msg.guild.channels
								.filter(ch => ch.type === 'voice').size} Voice
						• Default: ${msg.guild.defaultChannel}
						• AFK: ${msg.guild.afkChannelID
							? `<#${msg.guild.afkChannelID}> after ${msg.guild.afkTimeout / 60}min`
							: 'None.'}
					`,
					inline: true
				},
				{
					name: '❯ Member',
					value: stripIndents`
						• ${msg.guild.memberCount} members
						• Owner: ${msg.guild.owner.user.username}#${msg.guild.owner.user.discriminator}
						(ID: ${msg.guild.ownerID})
					`,
					inline: true
				},
				{
					name: '❯ Other',
					value: stripIndents`
						• Roles: ${msg.guild.roles.size}
						• Region: ${msg.guild.region}
						• Created at: ${moment.utc(msg.guild.createdAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}
						• Verification Level: ${msg.guild.verificationLevel}
						• Emojis: ${msg.guild.emojis.array().join(' ')}
					`
				}
			],
			thumbnail: { url: msg.guild.iconURL }
		};

		return msg.embed(embed);
	}
};
