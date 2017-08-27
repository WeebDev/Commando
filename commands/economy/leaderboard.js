const { oneLine, stripIndents } = require('common-tags');
const { Command, util } = require('discord.js-commando');
const moment = require('moment');
const Sequelize = require('sequelize');

const Currency = require('../../structures/currency/Currency');
const { PAGINATED_ITEMS } = process.env;
const UserProfile = require('../../models/UserProfile');

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

	async run(msg, { page }) {
		const lastUpdate = await this.client.redis.getAsync('moneyleaderboardreset');
		const cooldown = 30 * 60 * 1000;
		const reset = cooldown - (Date.now() - lastUpdate);
		const money = await this.findCached();
		const paginated = util.paginate(JSON.parse(money), page, Math.floor(PAGINATED_ITEMS));
		let ranking = PAGINATED_ITEMS * (paginated.page - 1);

		for (const user of paginated.items) await this.client.users.fetch(user.userID); // eslint-disable-line

		return msg.embed({
			color: 3447003,
			description: stripIndents`
				__**${Currency.textSingular.replace(/./, lc => lc.toUpperCase())} leaderboard, page ${paginated.page}**__

				${paginated.items.map(user => oneLine`
					**${++ranking} -**
					${`${this.client.users.get(user.userID).tag}`}
					(**${Currency.convert(user.networth)}**)`).join('\n')}

				${moment.duration(reset).format('hh [hours] mm [minutes]')} until the next update.
			`,
			footer: { text: paginated.maxPage > 1 ? `Use ${msg.usage()} to view a specific page.` : '' }
		});
	}

	async findCached() {
		const cache = await this.client.redis.getAsync('moneyleaderboard');
		const cacheExpire = await this.client.redis.ttlAsync('moneyleaderboard');
		if (cacheExpire !== -1 && cacheExpire !== -2) return cache;

		const money = await UserProfile.findAll(
			{ where: { userID: { $ne: 'bank' } }, order: Sequelize.literal('networth DESC') }
		);

		await this.client.redis.setAsync('moneyleaderboard', JSON.stringify(money));
		await this.client.redis.expireAsync('moneyleaderboard', 3600);

		return JSON.stringify(money);
	}
};
