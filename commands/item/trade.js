const { Command } = require('discord.js-commando');

const Currency = require('../../currency/Currency');
const Inventory = require('../../currency/Inventory');
const ItemGroup = require('../../currency/ItemGroup');

module.exports = class ItemTradeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'item-trade',
			aliases: [
				'trade-items',
				'trade-item',
				'items-trade'
			],
			group: 'item',
			memberName: 'trade',
			description: `Trade items with another user.`,
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
					key: 'offerAmount',
					label: 'amount of items to give',
					prompt: 'how many would you like to offer?\n',
					type: 'integer',
					min: 1
				},
				{
					key: 'offerItem',
					prompt: 'what item would you like to offer?\n',
					type: 'string'
				},
				{
					key: 'receiveAmount',
					label: 'amount of items to receive',
					prompt: 'how many would you like to receive?\n',
					type: 'integer',
					min: 1
				},
				{
					key: 'receiveItem',
					prompt: 'what item would you like to receive?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const user = args.member;
		const offerAmount = args.offerAmount;
		const receiveAmount = args.receiveAmount;
		const offerItem = this.isDonuts(args.offerItem, offerAmount);
		const receiveItem = this.isDonuts(args.receiveItem, receiveAmount);

		if (user.id === msg.author.id) return msg.reply('what are you trying to achieve by trading with yourself?');
		if (user.user.bot) return msg.reply('bots got nothing to trade, man.');
		if (!(offerItem + receiveItem)) return msg.reply("you can't trade donuts for donuts.");

		const offerBalance = Currency.getBalance(msg.author.id);
		const receiveBalance = Currency.getBalance(user.id);

		const offerInv = Inventory.fetchInventory(msg.author.id);
		const receiveInv = Inventory.fetchInventory(user.id);

		const offerItemBalance = offerInv.content[offerItem] ? offerInv.content[offerItem].amount : 0;
		const receiveItemBalance = receiveInv.content[receiveItem] ? receiveInv.content[receiveItem].amount : 0;

		if (!offerItem && (offerAmount > offerBalance)) return msg.reply(`you have ${Currency.convert(offerBalance)}`);
		if (!receiveItem && (receiveAmount > receiveBalance)) return msg.reply(`${user.displayName} has ${Currency.convert(receiveBalance)}`);
		if (offerAmount > offerItemBalance) return msg.reply(`,you have ${offerItemBalance} ${offerItem}s.`);
		if (receiveAmount > receiveItemBalance) return msg.reply(`,${user.displayName} has ${receiveItemBalance} ${receiveItem}s.`);

		const embed = {
			title: `${msg.member.displayName} < -- > ${user.displayName}`,
			description: 'Type `accept` within the next 30 seconds to accept this offer.',
			fields: [
				{
					name: msg.member.displayName,
					value: offerItem
						? `${offerAmount} ${offerItem}`
						: Currency.convert(offerAmount)
				},
				{
					name: user.displayName,
					value: receiveItem
						? `${receiveAmount} ${receiveItem}`
						: Currency.convert(receiveAmount)
				}
			]
		};

		if (!await this.response(msg, user, embed)) return msg.reply(`${user.displayName} declined or failed to respond.`);

		if (!offerItem) this.sendDonuts(msg.author, user, offerAmount);
		else this.sendItems(offerInv, receiveInv, offerItem, offerAmount);

		if (!receiveItem) this.sendDonuts(user, msg.author, receiveAmount);
		else this.sendItems(receiveInv, offerInv, receiveItem, receiveAmount);

		return msg.say('Trade successful.');
	}

	isDonuts(item, amount) {
		if (/donuts?/.test(item)) return '';
		return ItemGroup.convert(item, amount);
	}
	sendItems(fromInventory, toInventory, item, amount) {
		const itemGroup = new ItemGroup(item, amount);

		fromInventory.removeItems(itemGroup);
		toInventory.addItems(itemGroup);
	}

	sendDonuts(fromUser, toUser, amount) {
		Currency.removeBalance(fromUser, amount);
		Currency.addBalance(toUser, amount);
	}

	response(msg, user, embed) {
		return new Promise(async resolve => {
			msg.say(`${user}, ${msg.member.displayName} wants to trade with you.`);
			msg.embed(embed);

			const responses = await msg.channel.awaitMessages(response => {
				return response.author.id === user.id && response.content.toLowerCase() === 'accept';
			}, {
				maxMatches: 1,
				time: 30e3
			});

			if (responses.size === 0) resolve(false);
			resolve(true);
		});
	}
};
