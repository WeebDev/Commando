const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

module.exports = class RouletteInfo extends Command {
	constructor(client) {
		super(client, {
			name: 'roulette-info',
			group: 'games',
			memberName: 'roulette-info',
			description: 'Displays information about the roulette.',
			details: 'Displays information about the roulette.'
		});
	}

	async run(msg) {
		return msg.embed({
			image: { url: 'https://a.cuntflaps.me/lcfoa.png' },
			description: stripIndents`
				To start a game or place a bet use \`roulette <donuts> <space>\`

				\`<donuts>\` is the amount of donuts you want to bet. Can only be 100, 200, 300, 400 or 500.

				\`<space>\` is the space you want to bet on. Those should be written exactly as in the image below.

				**Payout multipliers:**
				*Single number* - 36x\`<donuts>\`
				*Dozens* - 3x\`<donuts>\`
				*Columns* - 3x\`<donuts>\`
				*Halves* - 2x\`<donuts>\`
				*Odd/Even* - 2x\`<donuts>\`
				*Colors* - 2x\`<donuts>\`

				**Examples:**
				\`roulette 300 2nd\`
				\`bet 200 odd\`
			`
		});
	}
};
