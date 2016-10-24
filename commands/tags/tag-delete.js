/* eslint-disable no-console */
const { Command } = require('discord.js-commando');
const TagModel = require('../../mongoDB/models/tagModel.js');

module.exports = class TagDeleteCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag-delete',
			aliases: ['tag-del'],
			group: 'tags',
			memberName: 'tag-delete',
			description: 'Deletes a Tag.',
			format: '<tagname>',
			examples: ['tag-delete cat', 'tag-del test'],
			guildOnly: true,

			args: [
				{
					key: 'name',
					label: 'tagname',
					prompt: 'What Tag would you like to delete?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const name = args.name.toLowerCase();
		return TagModel.get(name, msg.guild.id).then(tag => {
			if (tag.userID === msg.author.id || msg.guild.owner.id === msg.author.id || msg.author.id === '81440962496172032') {
				return TagModel.delete(name, msg.guild.id).then(tagEdit => {
					if (!tagEdit) return msg.say(`There is no tag with the name **${name}**, ${msg.author}`);
					return msg.say(`The tag **${name}** has been deleted, ${msg.author}`);
				});
			}
			return msg.say(`You can only delete your own tags, ${msg.author}`);
		}).catch(error => console.log(error));
	}
};
