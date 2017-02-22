const { escapeMarkdown } = require('discord.js');
const { oneLineTrim } = require('common-tags');

const config = require('../settings');

module.exports = class Song {
	constructor(video, member) {
		this.name = escapeMarkdown(video.title);
		this.id = video.id;
		this.length = video.durationSeconds ? parseInt(video.durationSeconds) : parseInt(video.duration) / 1000;
		this.member = member;
		this.dispatcher = null;
		this.playing = false;
	}

	get url() {
		if (!isNaN(this.id)) {
			return `https://api.soundcloud.com/tracks/${this.id}/stream?client_id=${config.soundcloudID}`;
		} else {
			return `https://www.youtube.com/watch?v=${this.id}`;
		}
	}

	get thumbnail() {
		const thumbnail = `https://img.youtube.com/vi/${this.id}/mqdefault.jpg`;
		return thumbnail;
	}

	get username() {
		const name = `${this.member.user.username}#${this.member.user.discriminator} (${this.member.user.id})`;
		return escapeMarkdown(name);
	}

	get avatar() {
		const avatar = `${this.member.user.displayAvatarURL}`;
		return avatar;
	}

	get lengthString() {
		return this.constructor.timeString(this.length);
	}

	timeLeft(currentTime) {
		return this.constructor.timeString(this.length - currentTime);
	}

	toString() {
		return `${this.name} (${this.lengthString})`;
	}

	static timeString(seconds, forceHours = false) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor(seconds % 3600 / 60);
		return oneLineTrim`
			${forceHours || hours >= 1 ? `${hours}:` : ''}
			${hours >= 1 ? `0${minutes}`.slice(-2) : minutes}:
			${`0${Math.floor(seconds % 60)}`.slice(-2)}
		`;
	}
};
