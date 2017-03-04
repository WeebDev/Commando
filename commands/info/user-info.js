const { Command } = require('discord.js-commando');
const moment = require('moment');
const { stripIndents } = require('common-tags');
const userName = require('../../postgreSQL/models/UserName');

module.exports = class UserInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'user-info',
			aliases: ['user'],
			group: 'info',
			memberName: 'user',
			description: 'Get info on a user.',
			details: `Get detailed information on the specified user.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'member',
					prompt: 'what user would you like to have information on?\n',
					type: 'member'
				}
			]
		});
	}

	async run(msg, args) {
		const member = args.member;
		const user = member.user;

		const userNames = await userName.findAll({ where: { userid: user.id } });

		return msg.embed({
			color: 3447003,
			fields: [
				{
					name: '❯ Member Details',
					value: stripIndents`
						${member.nickname !== null ? ` • Nickname: ${member.nickname}` : '• No nickname'}
						• Roles: ${member.roles.map(roles => `\`${roles.name}\``).join(' ')}
						• Joined at: ${moment.utc(member.joinedAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}
					`
				},
				{
					name: '❯ User Details',
					value: stripIndents`
						• Created at: ${moment.utc(user.createdAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}${user.bot
							? '\n• Is a bot account'
							: ''}
						• Aliases: ${userNames.length ? userNames.map(uName => uName.username).join(', ') : user.username}
						• Status: ${user.presence.status}
						• Game: ${user.presence.game ? user.presence.game.name : 'None'}
					`
				}
			],
			thumbnail: { url: user.avatarURL }
		});
	}
};
