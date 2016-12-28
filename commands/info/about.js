const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

module.exports = class AboutCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'about',
			aliases: ['📓'],
			group: 'info',
			memberName: 'about',
			description: 'Displays information about the command framework.'
		});
	}

	async run(msg) {
		let embed = {
			color: 3447003,
			description: stripIndents`
				__**discord.js Commando:**__
				This is the WIP official command framework for discord.js.
				It makes full use of ES2017's \`async\`/\`await\`.

				[Framework GitHub](https://github.com/Gawdl3y/discord.js-commando)
				[Commando bot Github](https://github.com/WeebDev/Commando)

				__**Installation:**__
				**Node 7.0.0 or newer is required.**
				\`npm i -S discord.js-commando\`

				When running a bot using Commando, make sure to run Node with the \`--harmony\` flag.
				Example:
				\`node --harmony somebot.js\`
				\`pm2 start somebot.js --node-args='--harmony'\`

				[Documentation (WIP)](https://discord.js.org/#/docs/commando/)
				[Discord.js Documentation](https://discord.js.org/#/docs/main/)
			`
		};
		return msg.embed(embed);
	}
};
