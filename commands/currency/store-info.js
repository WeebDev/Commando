const { Command, util } = require('discord.js-commando');

const config = require('../../settings');
const Store = require('../../currency/Store');

module.exports = class StoreInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'store-info',
			aliases: ['info-store'],
			group: 'currency',
			memberName: 'store-info',
			description: 'Displays price of all items.',
			display: 'Displays price of all items.',

			args: [
				{
					key: 'page',
					prompt: 'Which page would you like to view?',
					type: 'integer',
					default: 1
				}
			]
		});
	}

	async run(msg, args) {
		const page = args.page;
		const paginated = util.paginate(Store.getItems().array(), page, Math.floor(config.paginationItems));

		return msg.embed({
			description: `__**Items:**__`,
			fields: [
				{
					name: 'Item',
					value: paginated.items.map(item => item.name.replace(/(\b\w)/gi, lc => lc.toUpperCase())).join('\n'),
					inline: true
				},
				{
					name: 'Price',
					value: paginated.items.map(item => item.price).join('\n'),
					inline: true
				}
			],
			footer: { text: paginated.maxPage > 1 ? 'Use \'store-info <page>\' to view a specific page.' : '' }
		});
	}
};
