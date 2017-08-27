const Canvas = require('canvas');
const { Command } = require('discord.js-commando');

const path = require('path');
const request = require('request-promise');

const { promisifyAll } = require('tsubaki');
const fs = promisifyAll(require('fs'));

const Bank = require('../../structures/currency/Bank');
const Currency = require('../../structures/currency/Currency');
const Experience = require('../../structures/currency/Experience');
const UserProfile = require('../../models/UserProfile');

module.exports = class ProfileCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'profile',
			aliases: ['p'],
			group: 'social',
			memberName: 'profile',
			description: 'Display your profile.',
			guildOnly: true,
			throttling: {
				usages: 1,
				duration: 60
			},

			args: [
				{
					key: 'member',
					prompt: 'whose profile would you like to view?\n',
					type: 'member',
					default: ''
				}
			]
		});
	}

	async run(msg, args) {
		const user = args.member || msg.member;
		const { Image } = Canvas;
		const profile = await UserProfile.findOne({ where: { userID: user.id } });
		const personalMessage = profile ? profile.personalMessage : '';
		const money = await Currency.getBalance(user.id);
		const balance = await Bank.getBalance(user.id);
		const networth = money + balance;
		const currentExp = await Experience.getCurrentExperience(user.id);
		const level = await Experience.getLevel(user.id);
		const levelBounds = await Experience.getLevelBounds(level);
		const totalExp = await Experience.getTotalExperience(user.id);
		const fillValue = Math.min(Math.max(currentExp / (levelBounds.upperBound - levelBounds.lowerBound), 0), 1);

		Canvas.registerFont(path.join(__dirname, '..', '..', 'assets', 'profile', 'fonts', 'Roboto.ttf'), { family: 'Roboto' }); // eslint-disable-line max-len
		Canvas.registerFont(path.join(__dirname, '..', '..', 'assets', 'profile', 'fonts', 'NotoEmoji-Regular.ttf'), { family: 'Roboto' }); // eslint-disable-line max-len

		const canvas = new Canvas(300, 300);
		const ctx = canvas.getContext('2d');
		const lines = await this._wrapText(ctx, personalMessage, 110);
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

			// Username
			ctx.font = '20px Roboto';
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(user.displayName, 50, 173);

			// EXP
			ctx.font = '10px Roboto';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#3498DB';
			ctx.shadowColor = 'rgba(0, 0, 0, 0)';
			ctx.fillRect(10, 191, fillValue * 135, 17);

			// EXP
			ctx.font = '10px Roboto';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#333333';
			ctx.shadowColor = 'rgba(0, 0, 0, 0)';
			ctx.fillText(`EXP: ${currentExp}/${levelBounds.upperBound - levelBounds.lowerBound}`, 78, 203);

			// LVL
			ctx.font = '30px Roboto';
			ctx.textAlign = 'left';
			ctx.fillStyle = '#E5E5E5';
			ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
			ctx.fillText('LVL.', 12, 235);

			// LVL Number
			ctx.font = '30px Roboto';
			ctx.fillStyle = '#E5E5E5';
			ctx.fillText(level, 86, 235);

			// Total EXP
			ctx.font = '14px Roboto';
			ctx.fillStyle = '#E5E5E5';
			ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
			ctx.fillText('Total EXP', 12, 254);

			// Total EXP Number
			ctx.font = '14px Roboto';
			ctx.fillStyle = '#E5E5E5';
			ctx.fillText(totalExp, 86, 254);

			/* // Global Rank
			ctx.font = '14px Roboto';
			ctx.fillStyle = '#E5E5E5';
			ctx.fillText('Rank', 12, 270);

			// Global Rank Number
			ctx.font = '14px Roboto';
			ctx.fillStyle = '#E5E5E5';
			ctx.fillText('#1', 86, 270); */

			// Currency
			ctx.font = '14px Roboto';
			ctx.fillStyle = '#E5E5E5';
			ctx.fillText('Net Worth', 12, 287);

			// Currency Number
			ctx.font = '14px Roboto';
			ctx.fillStyle = '#E5E5E5';
			ctx.fillText(networth, 86, 287);

			// Info title
			ctx.font = '12px Roboto';
			ctx.fillStyle = '#333333';
			ctx.shadowColor = 'rgba(0, 0, 0, 0)';
			ctx.fillText('Info Box', 182, 207);

			// Info
			ctx.font = '12px Roboto';
			ctx.fillStyle = '#333333';
			lines.forEach((line, i) => {
				ctx.fillText(line, 162, (i + 18.6) * parseInt(12, 0));
			});

			// Image
			ctx.beginPath();
			ctx.arc(79, 76, 55, 0, Math.PI * 2, true);
			ctx.closePath();
			ctx.clip();
			ctx.shadowBlur = 5;
			ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
			ctx.drawImage(cond, 24, 21, 110, 110);
		};
		base.src = await fs.readFileAsync(path.join(__dirname, '..', '..', 'assets', 'profile', 'backgrounds', `${profile ? profile.background : 'default'}.png`)); // eslint-disable-line max-len
		cond.src = await request({
			uri: user.user.displayAvatarURL({ format: 'png' }),
			encoding: null
		});
		generate();

		return msg.channel.send({ files: [{ attachment: canvas.toBuffer(), name: 'profile.png' }] });
	}

	_wrapText(ctx, text, maxWidth) {
		return new Promise(resolve => {
			const words = text.split(' ');
			let lines = [];
			let line = '';

			if (ctx.measureText(text).width < maxWidth) {
				return resolve([text]);
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

			return resolve(lines);
		});
	}
};
