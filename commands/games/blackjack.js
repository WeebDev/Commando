const { Command } = require('discord.js-commando');
const stripIndents = require('common-tags').stripIndents;

const Currency = require('../../currency/Currency');
const Blackjack = require('../../games/Blackjack');

module.exports = class BlackjackCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'blackjack',
			group: 'games',
			memberName: 'blackjack',
			description: 'Play a game of blackjack for donuts!',
			details: 'Play a game of blackjack for donuts.',
			guildOnly: true,
			throttling: {
				usages: 1,
				duration: 30
			},

			args: [
				{
					key: 'bet',
					prompt: 'how many donuts do you want to bet?\n',
					type: 'integer',
					validate: async (bet, msg) => {
						bet = parseInt(bet);
						const balance = await Currency.getBalance(msg.author.id);

						if (balance < bet) {
							return `
								you don't have enough donuts. Your current account balance is ${balance} 🍩s.
								Please specify a valid amount of donuts.
							`;
						}

						if (![100, 200, 300, 400, 500, 1000].includes(bet)) {
							return `
								please choose \`100, 200, 300, 400, 500, 1000\` for your bet.
							`;
						}

						return true;
					}
				}
			]
		});
	}

	async run(msg, args) {
		const bet = args.bet;

		if (Blackjack.gameOngoing(msg.author.id)) {
			return msg.reply(`you can't start 2 games of blackjack at the same time.`);
		}

		const blackjack = Blackjack.gameExists(msg.author.id)
			? Blackjack.startGame(msg.author.id)
			: new Blackjack(msg.author.id);

		return msg.say(`New game of blackjack started with ${msg.member.displayName} with a bet of ${bet} 🍩s!`)
			.then(async () => {
				const balance = await Currency.getBalance(msg.author.id);
				const playerHand = blackjack.getHand();
				let dealerHand = blackjack.getHand();
				let playerHands;

				if (Blackjack.handValue(playerHand) !== 'Blackjack') {
					playerHands = await this.getFinalHand(msg, playerHand, dealerHand, balance, bet, blackjack);
					while (Blackjack.handValue(dealerHand) < 17) blackjack.hit(dealerHand);
				} else {
					playerHands = [playerHand];
				}

				blackjack.endGame();

				const dealerValue = Blackjack.handValue(dealerHand);
				let winnings = 0;

				const embed = { title: `Blackjack | ${msg.member.displayName}`, fields: [] };

				playerHands.forEach((hand, i) => {
					const playerValue = Blackjack.handValue(hand);
					const result = this.gameResult(playerValue, dealerValue);
					const lossOrGain = (result === 'loss' || result === 'bust'
						? -2 : result === 'push'
							? 0 : 1) * (hand.doubled
								? 1 : 0.5) * bet;

					winnings += lossOrGain;

					embed.fields.push({
						name: `Hand ${i + 1}`,
						value: stripIndents`
							${hand.join(' - ')}
							Value: ${playerValue}

							Result: ${
								result.replace(/(^\w|\s\w)/g, ma => ma.toUpperCase())
							}${result !== 'push' ? `, ${lossOrGain} 🍩s` : ', 🍩s back'}
						`,
						inline: true
					});
				});

				embed.fields.push({
					name: '\u200B',
					value: '\u200B'
				});

				embed.fields.push({
					name: '**Dealer hand**',
					value: stripIndents`
						${dealerHand.join(' - ')}
						Value: ${dealerValue}
					`
				});

				embed.color = winnings > 0 ? 0x009900 : winnings < 0 ? 0x990000 : undefined;
				embed.description = `You ${winnings === 0
					? 'broke even' : `${winnings > 0
						? 'won' : 'lost'} ${Math.abs(winnings)} 🍩s`}`;

				if (winnings !== 0) Currency.addBalance(msg.author.id, winnings);

				return msg.embed(embed);
			});
	}

	gameResult(playerValue, dealerValue) {
		if (playerValue > 21) return 'bust';
		if (dealerValue > 21) return 'dealer bust';
		if (playerValue === dealerValue) return 'push';
		if (playerValue === 'Blackjack' || playerValue > dealerValue) return 'win';

		return 'loss';
	}

	getFinalHand(msg, playerHand, dealerHand, balance, bet, blackjack) {
		return new Promise(async resolve => {
			const hands = [{
				cards: playerHand,
				double: false
			}];
			let currentHand = hands[0];
			let totalBet = bet;

			while (currentHand) {
				const nextHand = () => { currentHand = hands[hands.indexOf(currentHand) + 1]; };

				if (currentHand.cards.length === 1) blackjack.hit(currentHand.cards);

				if (Blackjack.handValue(currentHand.cards) === 'Blackjack') {
					nextHand();

					continue;
				}

				if (Blackjack.handValue(currentHand.cards) > 21) {
					nextHand();

					continue;
				}

				if (currentHand.double) {
					blackjack.hit(currentHand.cards);
					currentHand.cards.doubled = true;
					nextHand();

					continue;
				}

				const canDoubleDown = balance >= totalBet + bet && currentHand.cards.length === 2;
				const canSplit = balance >= totalBet + bet
					&& Blackjack.handValue([currentHand.cards[0]]) === Blackjack.handValue([currentHand.cards[1]])
					&& currentHand.cards.length === 2;

				await msg.embed({
					title: `Blackjack | ${msg.member.displayName}`,
					description: !canDoubleDown && !canSplit
						?	'Type `hit` to draw another card or `stand` to pass.'
						:	`Type \`hit\` to draw another card, ${
							canDoubleDown ? '`double down` to double down, ' : ''
						}${
							canSplit ? '`split` to split, ' : ''
						}or \`stand\` to pass.`,
					fields: [
						{
							name: hands.length === 1 ? '**Your hand**' : `**Hand ${hands.indexOf(currentHand) + 1}**`,
							value: stripIndents`
								${currentHand.cards.join(' - ')}
								Value: ${Blackjack.handValue(currentHand.cards)}
							`,
							inline: true
						},
						{
							name: '**Dealer hand**',
							value: stripIndents`
								${dealerHand[0]} - XX
						 		Value: ${Blackjack.handValue([dealerHand[0]])}
							`,
							inline: true
						}
					]
				});

				const responses = await msg.channel.awaitMessages(msg2 => {
					return msg2.author.id === msg.author.id && (
						msg2.content === 'hit'
						|| msg2.content === 'stand'
						|| (msg2.content === 'split' && canSplit)
						|| (msg2.content === 'double down' && canDoubleDown)
					);
				}, {
					maxMatches: 1,
					time: 20e3
				});

				if (responses.size === 0) break;

				const action = responses.first().content.toLowerCase();

				if (action === 'stand' || Blackjack.handValue(currentHand.cards) >= 21) {
					if (currentHand === hands[hands.length - 1]) break;
					nextHand();
				}

				if (action === 'hit') blackjack.hit(currentHand.cards);

				if (action === 'split' && canSplit) {
					totalBet += bet;
					hands.push({
						cards: [currentHand.cards.pop()],
						double: false
					});
					blackjack.hit(currentHand.cards);
				}

				if (action === 'double down' && canDoubleDown) {
					currentHand.double = true;
				}
			}

			return resolve(hands.map(hand => hand.cards));
		});
	}
};
