/* eslint-disable no-console */
const { Command } = require('discord.js-commando');
const { TagModel } = require('../../mongoDB/models/tagModel.js');

module.exports = class TagCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag',
			group: 'tags',
			memberName: 'tag',
			description: 'Displays a Tag.',
			format: '<tagname>',
			examples: ['tag cat', 'tag test'],
			guildOnly: true,

			args: [
				{
					key: 'name',
					label: 'tagname',
					prompt: 'What Tag would you like to see?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const name = args.name.toLowerCase();
		return TagModel.get(name, msg.guild.id).then(tag => {
			if (!tag) return msg.say(`A tag with the name **${name}** doesn't exist, ${msg.author}`);
			return msg.say(tag.content);
		}).catch(error => console.log(error));
	}
};
