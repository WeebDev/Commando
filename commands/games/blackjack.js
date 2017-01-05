const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../currency/Currency');
const Blackjack = require('../../games/Blackjack');

const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

module.exports = class BlackjackCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'blackjack',
			group: 'games',
			memberName: 'blackjack',
			description: 'Play a game of blackjack for donuts!',
			details: 'Play a game of blackjack for donuts.',
			throttling: {
				duration: 30,
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
		const balance = await Currency.getBalance(msg.author.id);

		if (balance < bet) return msg.reply(`you don't have enough donuts. Your current account balance is ${balance} 🍩s.`);
		if (![100, 200, 300, 400, 500, 1000].includes(bet)) return msg.say('you need to bet either 100, 200, 300, 400, 500 or 1000 donuts.');
		if (Blackjack.gameExists(msg.author.id)) return msg.reply(`you can't start 2 games of blackjack at the same time.`);

		const blackjack = new Blackjack(msg.author.id);

		return msg.say(`New game of blackjack started with ${msg.member.displayName} with a bet of ${bet} 🍩s!`)
			.then(async () => {
				let playerHand = blackjack.getHand();
				let dealerHand = blackjack.getHand();

				if (this.handValue(playerHand) !== 'Blackjack') playerHand = await this.getFinalHand(msg, playerHand, dealerHand, blackjack);
				const playerValue = this.handValue(playerHand);

				while (this.handValue(dealerHand) < 17) dealerHand = blackjack.hit(dealerHand);
				const dealerValue = this.handValue(dealerHand);

				blackjack.endGame();

				if (this.handValue(playerHand) > 21) {
					Currency.removeBalance(msg.author.id, bet);

					return msg.embed({
						title: `Blackjack | ${msg.member.displayName}`,
						description: 'You busted and lost your 🍩s. Better luck next time.',
						fields: [
							{
								name: '**Your hand**',
								value: stripIndents`
									${playerHand.join(' - ')}
									Value: ${this.handValue(playerHand)}
								`,
								inline: true
							},
							{
								name: '**Dealer hand**',
								value: stripIndents`
									${dealerHand[0]} - XX
									Value: ${this.handValue([dealerHand[0]])}
								`,
								inline: true
							}
						]
					});
				}

				if (this.handValue(dealerHand) > 21) {
					Currency.addBalance(msg.author.id, bet / 2);

					return msg.embed({
						title: `Blackjack | ${msg.member.displayName}`,
						description: `The dealer busted. You won ${bet + (bet / 2)} 🍩s`,
						fields: [
							{
								name: '**Your hand**',
								value: stripIndents`
									${playerHand.join(' - ')}
									Value: ${this.handValue(playerHand)}
								`,
								inline: true
							},
							{
								name: '**Dealer hand**',
								value: stripIndents`
									${dealerHand.join(' - ')}
									Value: ${this.handValue(dealerHand)}
								`,
								inline: true
							}
						]
					});
				}

				const gameResult = this.gameResult(playerValue, dealerValue);

				if (gameResult === 'loss') {
					Currency.removeBalance(msg.author.id, bet);

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

				Currency.addBalance(msg.author.id, bet / 2);

				return msg.embed({
					title: `Blackjack | ${msg.member.displayName}`,
					description: `Congratulations! You have a greater hand value. You won ${bet + (bet / 2)} 🍩s`,
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

	handValue(hand) {
		let value = 0;
		let aces = 0;

		hand.forEach(card => {
			value += this.cardValue(card);
			if (this.cardValue(card) === 11) aces++;
		});

		while (value > 21 && aces > 0) {
			value -= 10;
			aces--;
		}

		if (value === 21 && hand.length === 2) return 'Blackjack';

		return value;
	}

	cardValue(card) {
		const index = ranks.indexOf(card.substring(0, card.length - 1));

		if (index === 0) return 11;

		return index >= 10 ? 10 : index + 1;
	}

	gameResult(playerValue, dealerValue) {
		if (playerValue === dealerValue) return 'push';
		if (playerValue === 'Blackjack' || playerValue > dealerValue) return 'win';
		return 'loss';
	}

	getFinalHand(msg, playerHand, dealerHand, blackjack) {
		return new Promise(async resolve => { // eslint-disable-line consistent-return
			while (this.handValue(playerHand) < 21) {
				await msg.embed({
					title: `Blackjack | ${msg.member.displayName}`,
					description: 'Type `hit` to draw another card or `stand` to pass.',
					fields: [
						{
							name: '**Your hand**',
							value: stripIndents`
								${playerHand.join(' - ')}
								Value: ${this.handValue(playerHand)}
							`,
							inline: true
						},
						{
							name: '**Dealer hand**',
							value: stripIndents`
								${dealerHand[0]} - XX
						 		Value: ${this.handValue([dealerHand[0]])}
							`,
							inline: true
						}
					]
				});

				const responses = await msg.channel.awaitMessages(msg2 => {
					return msg2.author.id === msg.author.id && (msg2.content === 'hit' || msg2.content === 'stand');
				}, {
					maxMatches: 1,
					time: 20e3
				});

				if (responses.size === 0) return resolve(playerHand);
				if (responses.first().content.toLowerCase() === 'stand') return resolve(playerHand);
				if (responses.first().content.toLowerCase() === 'hit') playerHand = blackjack.hit(playerHand);
				if (this.handValue(playerHand) >= 21) return resolve(playerHand);
			}
		});
	}
};
