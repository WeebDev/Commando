const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../currency/Currency');
const Blackjack = require('../../games/Blackjack');

const currency = new Currency();

module.exports = class BlackjackCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'blackjack',
			group: 'games',
			memberName: 'blackjack',
			description: 'Play a game of blackjack for donuts!',
			details: 'Play a game of blackjack for donuts.',
			throttling: {
				duration: 60,
				usages: 1
			},
			args: [
				{
					key: 'bet',
					prompt: 'How many donuts do you want to bet?',
					type: 'integer'
				}
			]
		});
	}

	async run(msg, args) {
		const bet = args.bet;
		const balance = await currency.getBalance(msg.author.id);

		if (balance < bet) return msg.reply(`you don't have enough donuts. Your current account balance is ${balance} 🍩s.`);
		if (![100, 200, 300, 400, 500, 1000].includes(bet)) return msg.say('you need to bet either 100, 200, 300, 400, 500 or 1000 donuts.');
		if (Blackjack.gameExists(msg.author.id)) return msg.reply(`you can't start 2 games of blackjack at the same time.`);

		currency.removeBalance(msg.author.id, bet);
		const blackjack = new Blackjack(msg.author.id);

		return msg.say(`New game of blackjack started with ${msg.member.displayName} with a bet of ${bet} 🍩s!`).then(async () => {
			let playerHand = blackjack.getHand();
			playerHand = blackjack.handValue(playerHand) === 'Blackjack' ? playerHand : await this.getFinalHand(msg, playerHand, dealerHand, blackjack);
			const playerValue = blackjack.handValue(playerHand);

			let dealerHand = blackjack.getHand();
			while (blackjack.handValue(dealerHand) < 17) dealerHand = blackjack.hit(dealerHand);
			const dealerValue = blackjack.handValue(dealerHand);

			blackjack.endGame();

			if (blackjack.handValue(playerHand) > 21) {
				return msg.embed({
					title: `Blackjack | ${msg.member.displayName}`,
					description: 'You busted and lost your 🍩s. Better luck next time.',
					fields: [
						{
							name: '**Your hand**',
							value: stripIndents`
									${playerHand.join(' - ')}
									Value: ${blackjack.handValue(playerHand)}
								`,
							inline: true
						},
						{
							name: '**Dealer hand**',
							value: stripIndents`
									${dealerHand[0]} - XX
									Value: ${blackjack.handValue(dealerHand)}
								`,
							inline: true
						}
					]
				});
			}

			if (blackjack.handValue(dealerHand) > 21) {
				currency.addBalance(msg.author.id, bet + (bet / 2));
				return msg.embed({
					title: `Blackjack | ${msg.member.displayName}`,
					description: `The dealer busted. You won ${bet + (bet / 2)} 🍩s`,
					fields: [
						{
							name: '**Your hand**',
							value: stripIndents`
									${playerHand.join(' - ')}
									Value: ${blackjack.handValue(playerHand)}
								`,
							inline: true
						},
						{
							name: '**Dealer hand**',
							value: stripIndents`
									${dealerHand.join(' - ')}
									Value: ${blackjack.handValue(dealerHand)}
								`,
							inline: true
						}
					]
				});
			}

			const gameResult = this.gameResult(playerValue, dealerValue);

			if (gameResult === 'loss') {
				return msg.embed({
					title: `Blackjack | ${msg.member.displayName}`,
					description: `The dealer has a greater hand value. You lost your 🍩s`,
					fields: [
						{
							name: '**Your hand**',
							value: stripIndents`
									${playerHand.join(' - ')}
									Value: ${playerValue}
								`,
							inline: true
						},
						{
							name: '**Dealer hand**',
							value: stripIndents`
									${dealerHand.join(' - ')}
									Value: ${dealerValue}
								`,
							inline: true
						}
					]
				});
			}

			if (gameResult === 'push') {
				currency.addBalance(msg.author.id, bet);
				return msg.embed({
					title: `Blackjack | ${msg.member.displayName}`,
					description: `Equal hand values. You got back the 🍩s you bet.`,
					fields: [
						{
							name: '**Your hand**',
							value: stripIndents`
									${playerHand.join(' - ')}
									Value: ${playerValue}
								`,
							inline: true
						},
						{
							name: '**Dealer hand**',
							value: stripIndents`
									${dealerHand.join(' - ')}
									Value: ${dealerValue}
								`,
							inline: true
						}
					]
				});
			}

			currency.addBalance(msg.author.id, bet + (bet / 2));
			return msg.embed({
				title: `Blackjack | ${msg.member.displayName}`,
				description: `The dealer busted. You won ${bet + (bet / 2)} 🍩s`,
				fields: [
					{
						name: '**Your hand**',
						value: stripIndents`
								${playerHand.join(' - ')}
								Value: ${playerValue}
							`,
						inline: true
					},
					{
						name: '**Dealer hand**',
						value: stripIndents`
								${dealerHand.join(' - ')}
								Value: ${dealerValue}
							`,
						inline: true
					}
				]
			});
		});
	}

	gameResult(playerValue, dealerValue) {
		if (playerValue === dealerValue) return 'push';
		if (playerValue === 'Blackjack' || playerValue > dealerValue) return 'win';
		return 'loss';
	}

	getFinalHand(msg, playerHand, dealerHand, blackjack) {
		return new Promise(async resolve => {
			while (blackjack.handValue(playerHand) < 21) {
				await msg.embed({
					title: `Blackjack | ${msg.member.displayName}`,
					description: 'Type `hit` to draw another card or `stand` to pass.',
					fields: [
						{
							name: '**Your hand**',
							value: stripIndents`
									${playerHand.join(' - ')}
									Value: ${blackjack.handValue(playerHand)}
								`,
							inline: true
						},
						{
							name: '**Dealer hand**',
							value: stripIndents`
									${dealerHand[0]} - XX
									Value: ${blackjack.handValue(dealerHand)}
								`,
							inline: true
						}
					]
				});
				const responses = await msg.channel.awaitMessages(msg2 => msg2.author.id === msg.author.id, {
					maxMatches: 1,
					time: 20e3
				});
				if (!responses) resolve(playerHand);
				if (responses.first().content.toLowerCase() === 'stand') resolve(playerHand);
				if (responses.first().content.toLowerCase() === 'hit') playerHand = blackjack.hit(playerHand);
				if (blackjack.handValue(playerHand) >= 21) resolve(playerHand);
			}
		});
	}
};
