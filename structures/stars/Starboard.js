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

	static _starEmbed({ content, author, id, channel, attachments, createdAt }, starCount) {
		const attachment = attachments.size ? attachments.first() : undefined;

		let footerText;

		if (starCount >= 15) footerText = `${starCount} 🌠`;
		else if (starCount >= 10) footerText = `${starCount} ✨`;
		else if (starCount >= 5) footerText = `${starCount} 🌟`;
		else footerText = `${starCount} ⭐`;

		return {
			author: {
				icon_url: author.displayAvatarURL, // eslint-disable-line camelcase
				name: `${author.username}#${author.discriminator} (${author.id})`
			},
			color: 0xFFAC33,
			fields: [
				{
					name: 'ID',
					value: id,
					inline: true
				},
				{
					name: 'Channel',
					value: channel.toString(),
					inline: true
				},
				{
					name: 'Message',
					value: content ? content : '\u200B'
				}
			],
			image: { url: attachment || undefined },
			timestamp: createdAt,
			footer: { text: footerText }
		};
	}
};
