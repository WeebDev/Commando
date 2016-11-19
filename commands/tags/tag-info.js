const { Command } = require('discord.js-commando');
const moment = require('moment');
const stripIndents = require('common-tags').stripIndents;
const winston = require('winston');

const TagModel = require('../../mongoDB/models/Tag');

module.exports = class TagWhoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag-info',
			aliases: ['tag-who'],
			group: 'tags',
			memberName: 'tag-info',
			description: 'Displays information about a Tag.',
			format: '<tagname>',
			guildOnly: true,

			args: [
				{
					key: 'name',
					label: 'tagname',
					prompt: 'What Tag would you like to have information on?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const name = args.name.toLowerCase();

		return TagModel.get(name, msg.guild.id).then(tag => {
			if (!tag) return msg.say(`A tag with the name **${name}** doesn't exist, ${msg.author}`);

			return msg.say(stripIndents`❯ Info on Tag: **${tag.name}**

				 • Username: ${tag.userName} (ID: ${tag.userID})
				 • Guild: ${tag.guildName}
				 • Created at: ${moment.utc(tag.createdAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}
				 • Uses: ${tag.uses}
			`);
		}).catch(error => { winston.error(error); });
	}
};
