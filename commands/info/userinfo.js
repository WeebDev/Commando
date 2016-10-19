const stripIndents = require('common-tags').stripIndents;
const { Command } = require('discord.js-commando');
const moment = require('moment');

module.exports = class UserInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'userinfo',
			aliases: ['user'],
			group: 'info',
			memberName: 'userinfo',
			description: 'Get info on a user.',
			useage: '<user>',
			details: `Get detailed information on the specified user.`,
			examples: ['userinfo @Crawl#3208', 'user Crawl'],
			guildOnly: true,

			args: [
				{
					key: 'user',
					prompt: 'What user would you like information on?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		let user = args.user.startsWith('<') ? msg.channel.members.find('id', args.user.replace(/<|!|>|@/g, '')) : msg.channel.members.find(message => message.user.username === args.user);
		if (user === null) {
			return msg.say(`User not found.`);
		}

		return msg.say(stripIndents`
					Info on **${user.user.username}#${user.user.discriminator}** (ID: ${user.user.id})

					**❯ Member Details**
					${user.nickname !== null ? ` • Nickname: ${user.nickname}` : ' • No nickname'}
					 • Roles: ${user.roles.map(roles => `\`${roles.name}\``).join(' ')}
					 • Joined at: ${moment.utc(user.joinedAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}

					**❯ User Details**
					 • Created at: ${moment.utc(user.user.creationAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}${user.user.bot === true ? '\n • Is a bot account' : ''}
					 • Status: ${user.presence.status}
					 • Game: ${user.presence.game !== null ? user.presence.game.name : 'None'}
		`);
	}
};
