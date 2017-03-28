const { oneLine, stripIndents } = require('common-tags');
const { Command, util } = require('discord.js-commando');
const moment = require('moment');
const Sequelize = require('sequelize');

const Currency = require('../../structures/currency/Currency');
const { paginationItems } = require('../../settings');
const Redis = require('../../structures/Redis');
const UserProfile = require('../../models/UserProfile');

const redis = new Redis();

module.exports = class MoneyLeaderboardCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'leaderboard',
			aliases: [
				'baltop',
				'balancetop',
				'money-leaderboard',
				'donut-leaderboard',
				'donuts-leaderboard',
				'doughnut-leaderboard',
				'doughnuts-leaderboard'
			],
			group: 'economy',
			memberName: 'leaderboard',
			description: `Displays the ${Currency.textPlural} members have earned.`,
			details: `Display the amount of ${Currency.textPlural} members have earned in a leaderboard.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'page',
					prompt: 'what page would you like to view?\n',
					type: 'integer',
					default: 1
				}
			]
		});
	}

	async run(msg, args) {
		const { page } = args;
		const lastUpdate = await redis.db.getAsync('moneyleaderboardreset');
		const cooldown = 30 * 60 * 1000;
		const reset = cooldown - (Date.now() - lastUpdate);
		const money = await this.findCached();
		const paginated = util.paginate(JSON.parse(money), page, Math.floor(paginationItems));
		let ranking = paginationItems * (paginated.page - 1);

		for (const user of paginated.items) await this.client.fetchUser(user.userID); // eslint-disable-line

		return msg.embed({
			color: 3447003,
			description: stripIndents`
				__**${Currency.textSingular.replace(/./, lc => lc.toUpperCase())} leaderboard, page ${paginated.page}**__

				${paginated.items.map(user => oneLine`
					**${++ranking} -**
					${`${this.client.users.get(user.userID).username}#${this.client.users.get(user.userID).discriminator}`}
					(**${Currency.convert(user.networth)}**)`).join('\n')}

				${moment.duration(reset).format('hh [hours] mm [minutes]')} until the next update.
			`,
			footer: { text: paginated.maxPage > 1 ? `Use ${msg.usage()} to view a specific page.` : '' }
		});
	}

	async findCached() {
		const cache = await redis.db.getAsync('moneyleaderboard');
		if (cache) return cache;

		const money = await UserProfile.findAll(
			{ where: { userID: { $ne: 'bank' } }, order: Sequelize.literal('networth DESC') }
		);

		redis.db.setAsync('moneyleaderboard', JSON.stringify(money));
		return JSON.stringify(money);
	}
};
