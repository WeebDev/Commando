const UserProfile = require('../postgreSQL/models/UserProfile');
const Redis = require('../redis/Redis');

const redis = new Redis();

setInterval(() => Experience.saveExperience(), 30 * 60 * 1000);

class Experience {
	static addExperience(userID, earned) {
		return redis.db.hgetAsync('experience', userID).then(async balance => {
			const bal = parseInt(balance) || 0;
			await redis.db.hsetAsync('experience', userID, earned + parseInt(bal));
		});
	}

	static removeExperience(userID, earned) {
		Experience.addExperience(userID, -earned);
	}

	static async getTotalExperience(userID) {
		const experience = await redis.db.hgetAsync('experience', userID) || 0;
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
		const experiences = await redis.db.hgetallAsync('experience');

		const ids = Object.keys(experiences || {});

		for (const id of ids) {
			/* eslint-disable no-await-in-loop */
			const user = await UserProfile.findOne({ where: { userID: id } });
			if (!user) {
				UserProfile.create({
					userID: id,
					experience: experiences[id]
				});
			} else {
				user.update({ experience: experiences[id] });
			}
		}
	}
}

module.exports = Experience;
