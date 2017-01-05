const games = new Map();

const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suits = ['♣', '♦', '❤', '♠'];
const deck = suits
	.map(suit => ranks
		.map(rank => rank + suit))
			.reduce((coolArray, array) => coolArray.concat(array));

class Blackjack {
	constructor(playerID) {
		this.playerID = playerID;
		this.deck = shuffle(deck);

		games.set(this.playerID, this);
	}

	static gameExists(playerID) {
		return games.has(playerID);
	}

	getHand() {
		return [this.deck.pop(), this.deck.pop()];
	}

	hit(hand) {
		hand.push(this.deck.pop());

		return hand;
	}

	endGame() {
		games.delete(this.playerID);
	}
}

function shuffle(array) {
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

module.exports = Blackjack;
