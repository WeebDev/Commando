const oneLine = require('common-tags').oneLine;
const { Command } = require('discord.js-commando');

module.exports = class AddNumbersCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'add-numbers',
			aliases: ['add', 'add-nums', '➕'],
			group: 'math',
			memberName: 'add',
			description: 'Adds numbers together.',
			format: '<number> [number2] [number3...]',
			details: oneLine`
				This is an incredibly useful command that finds the sum of numbers.
				This command is the envy of all other commands.
			`,
			examples: ['add-numbers 42 1337'],

			args: [
				{
					key: 'numbers',
					label: 'number',
					prompt: 'What numbers would you like to add? Every message you send will be interpreted as a single number.\n',
					type: 'float',
					infinite: true
				}
			]
		});
	}

	async run(msg, args) {
		const total = args.numbers.reduce((prev, arg) => prev + parseFloat(arg), 0);
		return msg.reply(`**Sum:** ${total}`);
	}
};
