const { Command } = require('discord.js-commando');
const moment = require('moment');
const stripIndents = require('common-tags').stripIndents;

module.exports = class UserInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'user-info',
			aliases: ['user', '🗒'],
			group: 'info',
			memberName: 'user-info',
			description: 'Get info on a user.',
			format: '<user>',
			details: `Get detailed information on the specified user.`,
			guildOnly: true,

			args: [
				{
					key: 'member',
					prompt: 'What user would you like to have information on?\n',
					type: 'member'
				}
			]
		});
	}

	async run(msg, args) {
		const member = args.member;
		const user = member.user;

		return msg.say(stripIndents`
				Info on **${user.username}#${user.discriminator}** (ID: ${user.id})

				**❯ Member Details**
				${member.nickname !== null ? ` • Nickname: ${member.nickname}` : ' • No nickname'}
				 • Roles: ${member.roles.map(roles => `\`${roles.name}\``).join(' ')}
				 • Joined at: ${moment.utc(member.joinedAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}

				**❯ User Details**
				 • Created at: ${moment.utc(user.createdAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}${user.bot ? '\n • Is a bot account' : ''}
				 • Status: ${user.presence.status}
				 • Game: ${user.presence.game ? user.presence.game.name : 'None'}
		`);
	}
};
