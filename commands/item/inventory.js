const { Command, util } = require('discord.js-commando');

const config = require('../../settings');
const Inventory = require('../../currency/Inventory');

module.exports = class InventoryShowCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'inventory',
			aliases: ['inv'],
			group: 'item',
			memberName: 'inventory',
			description: 'Displays the items you have in your inventory',
			detail: 'Displays the items you have in your inventory',

			args: [
				{
					key: 'page',
					prompt: 'What page would you like to view?',
					type: 'integer',
					default: 1
				}
			]
		});
	}

	async run(msg, args) {
		const page = args.page;
		let items = [];

		const inventory = await Inventory.fetchInventory(msg.author.id);
		for (const item of Object.keys(inventory.content)) {
			items.push({
				name: item,
				amount: inventory.content[item].amount
			});
		}

		const paginated = util.paginate(items, page, Math.floor(config.paginationItems));

		if (items.length === 0) return msg.reply('can\'t show what you don\'t have, man.');

		return msg.embed({
			description: `__**${msg.author.username}#${msg.author.discriminator}'s inventory:**__`,
			fields: [
				{
					name: 'Item',
					value: paginated.items.map(item => item.name.replace(/(\b\w)/gi, lc => lc.toUpperCase())).join('\n'),
					inline: true
				},
				{
					name: 'Amount',
					value: paginated.items.map(item => item.amount).join('\n'),
					inline: true
				}
			],
			footer: { text: paginated.maxPage > 1 ? 'Use \'inventory <page>\' to view a specific page.' : '' }
		});
	}
};
