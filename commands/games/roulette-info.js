const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

const Currency = require('../../structures/currency/Currency');

module.exports = class RouletteInfo extends Command {
	constructor(client) {
		super(client, {
			name: 'roulette-info',
			group: 'games',
			memberName: 'roulette-info',
			description: 'Displays information about the roulette.',
			details: 'Displays information about the roulette.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	run(msg) {
		return msg.embed({
			description: stripIndents`
				To start a game or place a bet use \`roulette <${Currency.textPlural}> <space>\`

				\`<${Currency.textPlural}>\` for the amount of ${Currency.textPlural} to bet.
				Can only be 100, 200, 300, 400, 500, 1000, 2000 or 5000.

				\`<space>\` is the space you want to bet on. Those should be written exactly as in the image below.

				**Payout multipliers:**
				*Single number* - 36x
				*Dozens* - 3x
				*Columns* - 3x
				*Halves* - 2x
				*Odd/Even* - 2x
				*Colors* - 2x

				**Examples:**
				\`roulette 300 2nd\`
				\`roulette 200 odd\`
			`,
			image: { url: 'https://a.safe.moe/lcfoa.png' }
		});
	}
};
