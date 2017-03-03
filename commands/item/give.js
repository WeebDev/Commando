const { Command } = require('discord.js-commando');

const Inventory = require('../../currency/Inventory');
const ItemGroup = require('../../currency/ItemGroup');

module.exports = class ItemGiveCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'give',
			aliases: [
				'give-item',
				'give-itmes',
				'item-give',
				'items-give'
			],
			group: 'item',
			memberName: 'give',
			description: `Give your items to another user.`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'member',
					prompt: 'what user would you like to give your item(s)?\n',
					type: 'member'
				},
				{
					key: 'amount',
					label: 'amount of items to give',
					prompt: 'how many items do you want to give to that user?\n',
					validate: amount => {
						return /^(?:\d+|-all)$/g.test(amount);
					}
				},
				{
					key: 'item',
					prompt: 'what item would you like to give?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const user = args.member;
		const item = this.convert(args.item);
		const inventory = await Inventory.fetchInventory(msg.author.id);

		if (!inventory.content[item]) return msg.reply(`you don't have any ${item}s.`);

		const itemBalance = inventory.content[item].amount;
		const amount = args.amount === '-all'
			? inventory.content[item].amount
			: parseInt(args.amount);

		if (user.id === msg.author.id) return msg.reply("giving items to yourself won't change anything.");
		if (user.user.bot) return msg.reply("don't give your items to bots: they're bots, man.");
		if (amount <= 0) return msg.reply("you can't trade 0 or less items.");
		if (amount > itemBalance) return msg.reply(`you only have ${itemBalance} ${item}(s).`);

		const itemGroup = new ItemGroup(item, amount);
		const receiveInv = await Inventory.fetchInventory(user.id);

		inventory.removeItems(itemGroup);
		receiveInv.addItems(itemGroup);

		return msg.reply(`${user.displayName} successfully received your item(s)!`);
	}

	convert(item) {
		item = item.toLowerCase();

		if (/s$/.test(item)) return item.slice(0, -1);
		return item;
	}
};
