const Canvas = require('canvas');
const { Command } = require('discord.js-commando');
const fs = global.Promise.promisifyAll(require('fs'));
const path = require('path');

module.exports = class PleaseCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'please',
			aliases: ['pls'],
			group: 'social',
			memberName: 'please',
			description: 'Pleases someone.',
			guildOnly: true,
			throttling: {
				usages: 1,
				duration: 60
			},

			args: [
				{
					key: 'member',
					prompt: 'who would you like to blame?\n',
					type: 'member',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const user = args.member || msg.member;
		const Image = Canvas.Image;

		Canvas.registerFont(path.join(__dirname, '..', '..', 'assets', 'profile', 'fonts', 'Roboto.ttf'), { family: 'Roboto' });
		Canvas.registerFont(path.join(__dirname, '..', '..', 'assets', 'profile', 'fonts', 'NotoEmoji-Regular.ttf'), { family: 'Roboto' });

		const canvas = new Canvas(300, 300);
		const ctx = canvas.getContext('2d');

		const base = new Image();

		const generate = () => {
			// Environment Variables
			ctx.drawImage(base, 0, 0);
			ctx.scale(1, 1);
			ctx.patternQuality = 'billinear';
			ctx.filter = 'bilinear';
			ctx.antialias = 'subpixel';
			ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
			ctx.shadowOffsetY = 2;
			ctx.shadowBlur = 2;
      
      // User
			ctx.font = '20px Roboto';
			ctx.fillStyle = '#F01111';
			ctx.fillText(user, 50, 173);
      
			// Blame message
			ctx.font = '20px Roboto';
			ctx.fillStyle = '#F01111';
			ctx.fillText('Pls', 50, 150);

			
		};
		base.src = await fs.readFileAsync(path.join(__dirname, '..', '..', 'assets', `bg.png`));
		await generate();

		return msg.channel.sendFile(await canvas.toBuffer(), `blame.png`);
	}
};
