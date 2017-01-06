const Canvas = require('canvas');
const { Command } = require('discord.js-commando');
const fs = global.Promise.promisifyAll(require('fs'));
const moment = require('moment');
const path = require('path');
const request = require('request-promise');

const Currency = require('../../currency/Currency');

const config = require('../../settings');
const version = require('../../package').version;

module.exports = class ProfileCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'profile',
			aliases: ['p'],
			group: 'weather',
			memberName: 'profile',
			description: 'Get the weather.',
			throttling: {
				usages: 1,
				duration: 30
			}
		});
	}

	async run(msg, args) {
		const user = args.member || msg.author;
		const Image = Canvas.Image;

		const balance = await Currency.getBalance(user.id);

		Canvas.registerFont(path.join(__dirname, '../../assets/weather/fonts/Roboto.ttf'), { family: 'Roboto' });

		const canvas = new Canvas(300, 300);
		const ctx = canvas.getContext('2d');
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

			// Location
			ctx.font = '20px Roboto';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#FFFFFF';
			ctx.shadowColor = 'rgba(0, 0, 0, 1)';
			ctx.fillText(user.username, 72, 173);

			// Location
			ctx.font = '16px Roboto';
			ctx.textAlign = 'left';
			ctx.fillStyle = '#CCCCCC';
			ctx.shadowColor = 'rgba(0, 0, 0, 1)';
			ctx.fillText('Currency:', 140, 205);

			// Location
			ctx.font = '16px Roboto';
			ctx.fillStyle = '#CCCCCC';
			ctx.shadowColor = 'rgba(0, 0, 0, 1)';
			ctx.fillText(balance, 210, 205);

			// Image
			ctx.beginPath();
			ctx.arc(79, 76, 55, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			ctx.shadowBlur = 5;
			ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
			ctx.drawImage(cond, 24, 21, 110, 110);
		};

		base.src = await fs.readFileAsync(path.join(__dirname, `../../assets/profile/backgrounds/test.png`));
		cond.src = await request({ uri: msg.author.avatarURL.replace(/(png|jpg|jpeg|gif|webp)\?size=1024/, 'png'), encoding: null });
		await generate();

		return msg.channel.sendFile(await canvas.toBuffer(), `profile.png`);
	}

	getBase(icon) {
		if (icon === 'clear-day' || icon === 'partly-cloudy-day') {
			return path.join(__dirname, '../../assets/weather/base/sun.png');
		} else if (icon === 'clear-night' || icon === 'partly-cloudy-night') {
			return path.join(__dirname, '../../assets/weather/base/moon.png');
		} else if (icon === 'rain') {
			return path.join(__dirname, '../../assets/weather/base/rain.png');
		} else if (icon === 'snow' || icon === 'sleet' || icon === 'fog' || icon === 'wind') {
			return path.join(__dirname, '../../assets/weather/base/snow.png');
		} else {
			return path.join(__dirname, '../../assets/weather/base/cloud.png');
		}
	}
};
