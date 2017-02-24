const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');
const moment = require('moment');

module.exports = class ChatCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'star',
			group: 'fun',
			memberName: 'star',
			description: 'Stars a message.',
			examples: ['star 189696688657530880'],

			args: [
				{
					key: 'message',
					prompt: 'What would you like to star?\n',
					type: 'message',
					default: null
				}
			]
		});
	}

	async run(msg, args) {
		if (!msg.guild.channels.exists('name', 'starboard') || this.client.users.get('219833449530261506').presence.status === 'online') return;
		let image;
		if (args.message.attachments.some(attachment => attachment.url.match(/\.(png|jpg|jpeg|gif|webp)$/))) image = args.message.attachments.first().url;
		await msg.guild.channels.find('name', 'starboard').send(stripIndents`
			●▬▬▬▬▬▬▬▬▬▬▬▬▬▬●
			**Author**: \`${args.message.author.username} #${args.message.author.discriminator}\` | **Channel**: \`${args.message.channel.name}\` | **ID**: \`${args.message.id}\` | **Time**: \`${moment(new Date()).format('DD/MM/YYYY @ hh:mm:ss a')}\`
			**Message**:
			${args.message.cleanContent}
			`).catch(null);
		image ? await msg.guild.channels.find('name', 'starboard').sendFile(image) : null; // eslint-disable-line no-unused-expressions
		msg.delete().catch(null);
		return;
	}
};
