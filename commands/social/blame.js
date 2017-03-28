const Canvas = require('canvas');
const { Command } = require('discord.js-commando');

module.exports = class BlameCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'blame',
			group: 'social',
			memberName: 'blame',
			description: 'Put the blame on someone.',
			guildOnly: true,
			throttling: {
				usages: 1,
				duration: 10
			},

			args: [
				{
					key: 'member',
					prompt: 'whom would you like to blame?\n',
					type: 'member',
					default: ''
				}
			]
		});
	}

	run(msg, args) {
		const member = args.member.displayName || 'Crawl';
		const canvas = new Canvas();
		const ctx = canvas.getContext('2d');
		const { width, height } = this.textSizes(ctx, member);

		canvas.width = width < 130 ? 130 : width;
		canvas.height = height;

		const generate = () => {
			ctx.font = '700 32px Arial';
			ctx.fillStyle = '#B93F2C';
			ctx.textAlign = 'center';
			ctx.fillText('Blame', canvas.width / 2, 35);

			ctx.fillStyle = '#F01111';
			ctx.fillText(member, canvas.width / 2, 70);
		};
		generate();

		return msg.channel.sendFile(canvas.toBuffer(), 'blame.png');
	}

	textSizes(ctx, text) {
		ctx.font = '700 32px Arial';
		const dimensions = ctx.measureText(text);
		const sizes = {
			width: dimensions.width + 20,
			height: dimensions.emHeightAscent + 54
		};
		if (dimensions.actualBoundingBoxDescent) {
			sizes.height += dimensions.actualBoundingBoxDescent - 3;
		}
		return sizes;
	}
};
