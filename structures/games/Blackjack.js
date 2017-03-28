const decks = new Map();
const games = new Map();

const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♣', '♦', '❤', '♠'];
const DECK_TEMPLATE = suits
	.map(suit => ranks.concat(ranks)
	.concat(ranks)
	.concat(ranks)
	.map(rank => rank + suit))
	.reduce((array, arr) => array.concat(arr));

class Blackjack {
	constructor(msg) {
		this.guildID = msg.guild.id;
		this.playerID = msg.author.id;

		games.set(this.playerID, this);
	}

	getHand() {
		return this.hit(this.hit([]));
	}

	hit(hand) {
		if (!this.deck || this.deck.length === 0) {
			if (decks.has(this.guildID) && decks.get(this.guildID).length !== 0) {
				this.deck = decks.get(this.guildID);
			} else {
				this.deck = this._shuffle(DECK_TEMPLATE);
				decks.set(this.guildID, this.deck);
			}
		}
		hand.push(this.deck.pop());

		return hand;
	}

	endGame() {
		return games.delete(this.playerID);
	}

	cardsRemaining() {
		return decks.has(this.guildID) ? decks.get(this.guildID).length : this.decks.length;
	}

	static gameExists(playerID) {
		return games.has(playerID);
	}

	static isSoft(hand) {
		let value = 0;
		let aces = 0;

		hand.forEach(card => {
			value += this._cardValue(card);
			if (this._cardValue(card) === 11) aces++;
		});

		while (value > 21 && aces > 0) {
			value -= 10;
			aces--;
		}

		if (value === 21 && hand.length === 2) return false;
		return aces !== 0;
	}

	static handValue(hand) {
		let value = 0;
		let aces = 0;

		hand.forEach(card => {
			value += this._cardValue(card);
			if (this._cardValue(card) === 11) aces++;
		});

		while (value > 21 && aces > 0) {
			value -= 10;
			aces--;
		}

		if (value === 21 && hand.length === 2) return 'Blackjack';
		return value;
	}

	static _cardValue(card) {
		const index = ranks.indexOf(card.slice(0, -1));
		if (index === 0) return 11;
		return index >= 10 ? 10 : index + 1;
	}

	static _shuffle(array) {
		let random;
		let temp;
		let length = array.length;
		let value = array.slice();

		while (length) {
			random = Math.floor(Math.random() * length--);
			temp = value[length];
			value[length] = value[random];
			value[random] = temp;
		}
		return value;
	}
}

module.exports = Blackjack;
