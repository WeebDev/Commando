const Canvas = require('canvas');
const { Command } = require('discord.js-commando');
const fs = global.Promise.promisifyAll(require('fs'));
const path = require('path');

module.exports = class BlameCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'blame',
			aliases: ['bm'],
			group: 'social',
			memberName: 'blame',
			description: 'Blames someone.',
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


		const fillValue = Math.min(Math.max(currentExp / (levelBounds.upperBound - levelBounds.lowerBound), 0), 1);

		Canvas.registerFont(path.join(__dirname, '..', '..', 'assets', 'profile', 'fonts', 'Roboto.ttf'), { family: 'Roboto' });
		Canvas.registerFont(path.join(__dirname, '..', '..', 'assets', 'profile', 'fonts', 'NotoEmoji-Regular.ttf'), { family: 'Roboto' });

		const canvas = new Canvas(300, 300);
		const ctx = canvas.getContext('2d');

		const lines = this.wrapText(ctx, personalMessage, 110);

		const base = new Image();
		const cond = new Image();

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


			// Image
			ctx.beginPath();
			ctx.arc(79, 76, 55, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			ctx.shadowBlur = 5;
			ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
			ctx.drawImage(cond, 24, 21, 110, 110);
		};

		base.src = await fs.readFileAsync(path.join(__dirname, '..', '..', 'assets', 'profile', 'backgrounds', `${profile ? profile.background : 'default'}.png`));
		cond.src = await request({
			uri: user.user.displayAvatarURL.replace(/(png|jpg|jpeg|gif|webp)\?size=1024/, 'png'),
			encoding: null
		});
		await generate();

		return msg.channel.sendFile(await canvas.toBuffer(), `profile.png`);
	}

	wrapText(ctx, text, maxWidth) {
		const words = text.split(' ');
		let lines = [];
		let line = '';

		if (ctx.measureText(text).width < maxWidth) {
			return [text];
		}

		while (words.length > 0) {
			let split = false;

			while (ctx.measureText(words[0]).width >= maxWidth) {
				const tmp = words[0];
				words[0] = tmp.slice(0, -1);

				if (!split) {
					split = true;
					words.splice(1, 0, tmp.slice(-1));
				} else {
					words[1] = tmp.slice(-1) + words[1];
				}
			}

			if (ctx.measureText(line + words[0]).width < maxWidth) {
				line += `${words.shift()} `;
			} else {
				lines.push(line);
				line = '';
			}

			if (words.length === 0) {
				lines.push(line);
			}
		}

		return lines;
	}
};
