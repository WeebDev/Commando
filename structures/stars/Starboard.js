const path = require('path');
const { URL } = require('url');
const winston = require('winston');

const Star = require('../../models/Star');

module.exports = class Starboard {
	static async createStar(message, starboardChannel, starBy) {
		const starboardMessage = await starboardChannel.send({ embed: Starboard._starEmbed(message, 1) });
		return Star.create({
			messageID: message.id,
			content: message.content,
			authorID: message.author.id,
			starboardMessageID: starboardMessage.id,
			starredBy: [starBy]
		});
	}

	static async deleteStar(message, starboardChannel) {
		const star = await Star.findByPrimary(message.id);
		const starMessage = await starboardChannel.fetchMessage(star.starboardMessageID);
		await starMessage.delete();
		await star.destroy();
	}

	static async isStarred(messageID) {
		const star = await Star.findByPrimary(messageID);
		return !!star;
	}

	static async isAuthor(messageID, userID) {
		const star = await Star.findOne({
			where: {
				messageID,
				authorID: userID
			}
		});
		return !!star;
	}

	static async hasStarred(messageID, userID) {
		const star = await Star.findByPrimary(messageID);
		if (!star) return false;
		return star.starredBy.includes(userID);
	}

	static async addStar(message, starboardChannel, starredBy) {
		const star = await Star.findByPrimary(message.id);
		const { stars: newCount } = await star.increment('stars');
		star.starredBy = star.starredBy.concat([starredBy]);
		await star.save();
		const starMessage = await starboardChannel.fetchMessage(star.starboardMessageID);
		starMessage.edit({ embed: Starboard._starEmbed(message, newCount) });
	}

	static async removeStar(message, starboardChannel, starredBy) {
		const star = await Star.findByPrimary(message.id);
		await star.decrement('stars');
		star.starredBy = star.starredBy.filter(user => user !== starredBy);
		const { stars: newCount } = await star.save();

		if (newCount <= 0) {
			Starboard.deleteStar(message, starboardChannel);
		} else {
			const starMessage = await starboardChannel.fetchMessage(star.starboardMessageID);
			starMessage.edit({ embed: Starboard._starEmbed(message, newCount) });
		}
	}

	static async getStar(messageID) {
		const star = await Star.findByPrimary(messageID);
		return star;
	}

	static _starEmbed(message, starCount) {
		let attachmentImage;
		const extensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
		const linkRegex = /https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_\.]+)+\.(?:png|jpg|jpeg|gif|webp)/; // eslint-disable-line no-useless-escape, max-len

		if (message.attachments.some(attachment => {
			try {
				const url = new URL(attachment.url);
				const ext = path.extname(url.pathname);
				return extensions.has(ext);
			} catch (err) {
				if (err.message !== 'Invalid URL') winston.error(err);
				return false;
			}
		})) attachmentImage = message.attachments.first().url;

		if (!attachmentImage) {
			const linkMatch = message.content.match(linkRegex);
			if (linkMatch) {
				try {
					const url = new URL(linkMatch[0]);
					const ext = path.extname(url.pathname);
					if (extensions.has(ext)) attachmentImage = linkMatch[0]; // eslint-disable-line max-depth
				} catch (err) {
					if (err.message === 'Invalid URL') winston.info('No valid image link.'); // eslint-disable-line max-depth
					else winston.error(err);
				}
			}
		}

		let footerText;
		if (starCount >= 15) footerText = `${starCount} 🌠`;
		else if (starCount >= 10) footerText = `${starCount} ✨`;
		else if (starCount >= 5) footerText = `${starCount} 🌟`;
		else footerText = `${starCount} ⭐`;
		return {
			author: {
				icon_url: message.author.displayAvatarURL, // eslint-disable-line camelcase
				name: `${message.author.username}#${message.author.discriminator} (${message.author.id})`
			},
			color: 0xFFAC33,
			fields: [
				{
					name: 'ID',
					value: message.id,
					inline: true
				},
				{
					name: 'Channel',
					value: message.channel.toString(),
					inline: true
				},
				{
					name: 'Message',
					value: message.content ? message.content : '\u200B'
				}
			],
			image: { url: attachmentImage || undefined },
			timestamp: message.createdAt,
			footer: { text: footerText }
		};
	}
};
