const ExperienceSchema = require('../postgreSQL/models/Experience');
const Redis = require('../redis/Redis');

const redis = new Redis();

class Experience {
	static addExperience(userID, earned) {
		return redis.db.hgetAsync('experience', userID).then(balance => {
			balance = parseInt(balance) || 0;
			redis.db.hsetAsync('experience', userID, earned + parseInt(balance));
		});
	}

	static removeExperience(userID, earned) {
		Experience.addExperience(userID, -earned);
	}

	static getTotalExperience(userID) {
		return redis.db.hgetAsync('experience', userID);
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

	static saveExperience() {
		redis.db.hgetallAsync('experience').then(experiences => {
			const ids = Object.keys(experiences);

			for (const id of ids) {
				ExperienceSchema.findOne({ where: { userID: id } }).then(user => {
					if (!user) {
						ExperienceSchema.create({
							userID: id,
							experience: experiences[id]
						});
					} else {
						user.update({ experience: experiences[id] });
					}
				});
			}
		});
	}
}

module.exports = Experience;
