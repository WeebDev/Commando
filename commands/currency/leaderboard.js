const { Command, util } = require('discord.js-commando');
const moment = require('moment');
const stripIndents = require('common-tags').stripIndents;

const config = require('../../settings');
const Money = require('../../postgreSQL/models/Money');
const Redis = require('../../redis/Redis');

const redis = new Redis();

module.exports = class MoneyLeaderboardCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'leaderboard',
			aliases: ['donut-leaderboard', 'donuts-leaderboard', 'money-leaderboard'],
			group: 'currency',
			memberName: 'leaderboard',
			description: 'Displays the money members have earned.',
			details: 'Display the amount of money members have earned in a leaderboard.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

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

		const lastUpdate = await redis.db.getAsync('moneyleaderboardreset');
		const cooldown = 30 * 60 * 1000;
		const reset = cooldown - (Date.now() - lastUpdate);
		const money = await this.findCached();
		const paginated = util.paginate(JSON.parse(money), page, Math.floor(config.paginationItems));
		let ranking = config.paginationItems * (paginated.page - 1);

		for (const user of paginated.items) await this.client.fetchUser(user.userID);

		return msg.embed({
			color: 3447003,
			description: stripIndents`
				__**Donut leaderboard, page ${paginated.page}**__

				${paginated.items.map(user => `**${++ranking} -** ${`${this.client.users.get(user.userID).username}#${this.client.users.get(user.userID).discriminator}`} (**${user.money}** 🍩)`).join('\n')}

				${moment.duration(reset).format('hh [hours] mm [minutes]')} until the next update.
			`,
			footer: { text: paginated.maxPage > 1 ? 'Use \'leaderboard <page>\' to view a specific page.' : '' }
		});
	}

	async findCached() {
		return redis.db.getAsync('moneyleaderboard').then(async reply => {
			if (reply) {
				return reply;
			} else {
				const money = await Money.findAll({ where: { userID: { $ne: 'SLOTMACHINE' } }, order: 'money DESC' });
				if (!money) return `No money, biatch`;

				redis.db.setAsync('moneyleaderboard', JSON.stringify(money));
				redis.db.expire('moneyleaderboard', 3600);

				return JSON.stringify(money);
			}
		});
	}
};
