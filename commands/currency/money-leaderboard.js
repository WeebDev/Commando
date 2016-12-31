const { Command, util } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const config = require('../../settings');
const Money = require('../../postgreSQL/models/Money');

module.exports = class MoneyLeaderboardCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'money-leaderboard',
			aliases: ['donut-leaderboard', 'donuts-leaderboard'],
			group: 'currency',
			memberName: 'leaderboard',
			description: 'Displays the money members have earned.',
			details: 'Display the amount of money members have earned in a leaderboard.',
			guildOnly: true,

			args: [
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
		const page = args.page;

		const money = await Money.findAll({ where: { userID: { $ne: 'SLOTMACHINE' } }, order: 'money DESC' });

		const paginated = util.paginate(money, page, Math.floor(config.paginationItems));

		const embed = {
			color: 3447003,
			description: stripIndents`
				__**Donut leaderboard, page ${paginated.page}**__

				${paginated.items.map(user => `**-** ${`${this.client.users.get(user.userID).username}#${this.client.users.get(user.userID).discriminator}`} (**${user.money}** 🍩)`).join('\n')}
				${paginated.maxPage > 1 ? `\nUse \`donut-leaderboard <page>\` to view a specific page.\n` : ''}
			`
		};

		return msg.embed(embed);
	}
};
