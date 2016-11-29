const { Command, util } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Rep = require('../../postgreSQL/models/Rep');
const RepUser = require('../../postgreSQL/models/RepUser');

module.exports = class RepCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'rep',
			group: 'rep',
			memberName: 'rep',
			description: 'Shows someones reputations.',
			format: '<member> [page]',
			details: `Shows someones rep, usable for everyone on the server.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'member',
					prompt: 'What user would you like to have information on?\n',
					type: 'member'
				},
				{
					key: 'page',
					prompt: 'What page would you like to view?\n',
					type: 'integer',
					default: 1
				}
			]
		});
	}

	async run(msg, args) {
		const member = args.member;
		const user = member.user;
		const page = args.page;

		let repUser = await RepUser.findOne({ where: { userID: user.id, guildID: msg.guild.id } });
		if (!repUser) return msg.say(`**${user.username}#${user.discriminator} has ( +0 | -0 ) reputation**`);
		let repUsername = repUser.userName;
		let repUserPositive = repUser.positive;
		let repUserNegative = repUser.negative;

		let rep = await Rep.findAll({ where: { targetID: user.id, guildID: msg.guild.id } });
		const paginated = util.paginate(rep, page, 5);
		return msg.say(stripIndents`
			**${repUsername} has ${repUserPositive - repUserNegative} ( +${repUserPositive} | -${repUserNegative} ) reputation:**${paginated.maxPage > 1 ? `\n**Reputations page: ${paginated.page}**` : ''}

			${paginated.items.map(reps => `**${reps.rep}** ${reps.userName}: ${reps.content}`).join('\n')}
			${paginated.maxPage > 1 ? `\nUse \`rep <member> <page>\` to view a specific page.\n` : ''}
		`);
	}
};
