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

	handValue(hand) {
		let value = 0;
		let aces = 0;
		hand.forEach(card => {
			value += cardValue(card);
			if (cardValue(card) === 11) aces++;
		});
		while (value > 21 && aces > 0) {
			value -= 10;
			aces--;
		}
		if (value === 21 && hand.length === 2) return 'Blackjack';
		return value;
	}

	endGame() {
		games.delete(this.playerID);
	}
}

function cardValue(card) {
	const index = ranks.indexOf(card.substring(0, card.length - 1));
	if (index === 0) return 11;
	return index >= 10 ? 10 : index + 1;
}

function shuffle(array) {
	for (let i = array.length; i; i--) {
		let j = Math.floor(Math.random() * i);
		[array[i - 1], array[j]] = [array[j], array[i - 1]];
	}
	return array;
}

module.exports = Blackjack;
