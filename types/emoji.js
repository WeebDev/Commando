const { ArgumentType } = require('discord.js-commando')

class EmojiArgumentType extends ArgumentType {
	constructor(client) {
		super(client, 'emoji');
	}

	validate(value, msg) {
		let regex = /<:([a-zA-Z0-9_]+):(\d+)>/;
		if (value.match(regex)) {
			let emoji = msg.client.emojis.get(value.match(regex)[2]);
			if(emoji) return true;
		}
		else if (value.match(/(\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F])/)) {
			return true
		}
		return false;
		}

	parse(value, msg) {
		let regex = /<:([a-zA-Z0-9_]+):(\d+)>/;
		if (value.match(regex) != null) {
			let emoji = msg.client.emojis.get(value.match(regex)[2])
			if(emoji != null) return emoji;
		}
		else if (value.match(/(\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F])/) != null) {
			return value.match(/(\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F])/)[1]
		}
	}
}

module.exports = EmojiArgumentType;
