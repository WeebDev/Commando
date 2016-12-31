const { Command, util } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const config = require('../../settings');
const Money = require('../../postgreSQL/models/Money');
const Redis = require('../../redis/Redis');

const redis = new Redis();

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
		let ranking = 1;

		const money = await this.findCached();
		const paginated = util.paginate(JSON.parse(money), page, Math.floor(config.paginationItems));

		const embed = {
			color: 3447003,
			description: stripIndents`
				__**Donut leaderboard, page ${paginated.page}**__

				${paginated.items.map(user => `**${ranking++} -** ${`${this.client.users.get(user.userID).username}#${this.client.users.get(user.userID).discriminator}`} (**${user.money}** 🍩)`).join('\n')}
				${paginated.maxPage > 1 ? `\nUse \`donut-leaderboard <page>\` to view a specific page.\n` : ''}
			`
		};

		return msg.embed(embed);
	}

	async findCached() {
		return redis.db.getAsync('moneyleaderboard').then(async reply => {
			if (reply) {
				return reply;
			} else {
				const money = await Money.findAll({ where: { userID: { $ne: 'SLOTMACHINE' } }, order: 'money DESC' });
				if (!money) return `No money biatch`;

				redis.db.setAsync('moneyleaderboard', JSON.stringify(money));
				redis.db.expire('moneyleaderboard', 1800);

				return JSON.stringify(money);
			}
		});
	}
};
