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
		return msg.say(stripIndents`
				__**discord.js Commando:**__
				This is the WIP official command framework for discord.js.
				It makes full use of ES2017's \`async\`/\`await\`.

				GitHub: <https://github.com/Gawdl3y/discord.js-commando>

				__**Installation:**__
				**Node 7.0.0 or newer is required.**
				\`npm install --save discord.js-commando\`

				When running a bot using Commando, make sure to run Node with the \`--harmony\` flag.
				Example:
				\`node --harmony somebot.js\`
				\`pm2 start somebot.js --node-args='--harmony'\`

				__**Documentation (WIP):**__
				<https://gawdl3y.github.io/discord.js-commando/0.4.0/>
				See also:
				<https://discord.js.org/#!/docs/tag/master/file/general/Welcome>
		`);
	}
};
