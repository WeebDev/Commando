const { ArgumentType } = require('discord.js-commando');
const emojiRanges = [
	'[\u0023-\u0039]\u20E3',
	'[\u2002-\u21AA]',
	'[\u231A-\u27bf]',
	'[\u2934-\u2b55]',
	'\u3030', '\u303D',
	'\u3297', '\u3299',
	'\uD83C[\udc04-\uDFFF]',
	'\uD83D[\uDC00-\uDE4F]'
];
const emojiRegex = new RegExp(emojiRanges.join('|'), 'g');
const regex = /<:([a-zA-Z0-9_]+):(\d+)>/;

class EmojiArgumentType extends ArgumentType {
	constructor(client) {
		super(client, 'emoji');
	}

	validate(value, msg) {
		if (value.match(regex)) {
			const emoji = msg.client.emojis.get(value.match(regex)[2]);
			if (emoji) return true;
		} else if (value.match(emojiRegex)) {
			return true;
		}

		return false;
	}

	parse(value, msg) { // eslint-disable-line consistent-return
		if (value.match(regex)) {
			const emoji = msg.client.emojis.get(value.match(regex)[2]);
			if (emoji) return emoji;
		} else if (value.match(emojiRegex)) {
			return value.match(emojiRegex)[0];
		}
	}
}

module.exports = EmojiArgumentType;
