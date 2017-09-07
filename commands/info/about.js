const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');

module.exports = class AboutCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'about',
			group: 'info',
			memberName: 'about',
			description: 'Displays information about the command framework.',
			throttling: {
				usages: 2,
				duration: 3
			}
		});
	}

	run(msg) {
		return msg.embed({
			color: 3447003,
			description: stripIndents`
				__**discord.js Commando:**__
				This is the WIP official command framework for discord.js.
				It makes full use of ES2017's \`async\`/\`await\`.

				
			`
		});
	}
};
