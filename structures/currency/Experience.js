const UserProfile = require('../../models/UserProfile');
const Redis = require('../Redis');

setInterval(() => Experience.saveExperience(), 30 * 60 * 1000);

class Experience {
	static addExperience(userID, earned) {
		return Redis.db.hgetAsync('experience', userID).then(async balance => {
			const bal = parseInt(balance) || 0;
			await Redis.db.hsetAsync('experience', userID, earned + parseInt(bal));
		});
	}

	static removeExperience(userID, earned) {
		Experience.addExperience(userID, -earned);
	}

	static async getTotalExperience(userID) {
		const experience = await Redis.db.hgetAsync('experience', userID) || 0;

		return experience;
	}

	static async getCurrentExperience(userID) {
		const totalXP = await Experience.getTotalExperience(userID);
		const level = await Experience.getLevel(userID);
		const { lowerBound } = Experience.getLevelBounds(level);

		return totalXP - lowerBound;
	}

	static getLevelBounds(level) {
		const upperBound = Math.ceil((level / 0.177) ** 2);
		const lowerBound = Math.ceil(((level - 1) / 0.177) ** 2);

		return {
			upperBound,
			lowerBound
		};
	}

	static async getLevel(userID) {
		const experience = await Experience.getTotalExperience(userID);

		return Math.floor(0.177 * Math.sqrt(experience)) + 1;
	}

	static async saveExperience() {
		const experiences = await Redis.db.hgetallAsync('experience');
		const ids = Object.keys(experiences || {});

		/* eslint-disable no-await-in-loop */
		for (const id of ids) {
			const user = await UserProfile.findOne({ where: { userID: id } });
			if (!user) {
				await UserProfile.create({
					userID: id,
					experience: experiences[id]
				});
			} else {
				user.update({ experience: experiences[id] });
			}
		}
		/* eslint-enable no-await-in-loop */
	}
}

module.exports = Experience;
