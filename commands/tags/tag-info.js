const { Command } = require('discord.js-commando');
const moment = require('moment');

const Tag = require('../../postgreSQL/models/Tag');

module.exports = class TagWhoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag-info',
			aliases: ['tag-who'],
			group: 'tags',
			memberName: 'info',
			description: 'Displays information about a tag.',
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'name',
					label: 'tagname',
					prompt: 'What tag would you like to have information on?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const name = args.name.toLowerCase();

		let tag = await Tag.findOne({ where: { name, guildID: msg.guild.id } });
		if (!tag) return msg.say(`A tag with the name **${name}** doesn't exist, ${msg.author}`);

		return msg.embed({
			color: 3447003,
			fields: [
				{
					name: 'Username',
					value: `${tag.userName} (ID: ${tag.userID})`
				},
				{
					name: 'Guild',
					value: `${tag.guildName}`
				},
				{
					name: 'Created at',
					value: `${moment.utc(tag.createdAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')}`
				},
				{
					name: 'Uses',
					value: `${tag.uses} `
				}
			]
		});
	}
};
