const { Command } = require('discord.js-commando');
const { oneLine } = require('common-tags');

module.exports = class SkipSongCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'skip',
			group: 'music',
			memberName: 'skip',
			description: 'Skips the song that is currently playing.',
			details: oneLine`
				If there are 3 people or fewer (excluding the bot) in the voice channel, the skip will be immediate.
				With at least 4 people, a voteskip will be started with 15 seconds to accept votes.
				The required votes to successfully skip the song is one-third of the number of listeners, rounded up.
				Each vote will add 5 seconds to the vote's timer.
				Moderators can use the "force" parameter, which will immediately skip without a vote, no matter what.
			`,
			guildOnly: true,
			throttling: {
				usages: 2,
				duration: 3
			}
		});

		this.votes = new Map();
	}

	run(msg, args) {
		const queue = this.queue.get(msg.guild.id);
		if (!queue) return msg.reply('there isn\'t a song playing right now, silly.');
		if (!queue.voiceChannel.members.has(msg.author.id)) {
			return msg.reply('you\'re not in the voice channel. You better not be trying to mess with their mojo, man.');
		}
		if (!queue.songs[0].dispatcher) return msg.reply('the song hasn\'t even begun playing yet. Why not give it a chance?'); // eslint-disable-line max-len

		const threshold = Math.ceil((queue.voiceChannel.members.size - 1) / 3);
		const force = threshold <= 1
			|| queue.voiceChannel.members.size < threshold
			|| (msg.member.hasPermission('MANAGE_MESSAGES')
			&& args.toLowerCase() === 'force');
		if (force) return msg.reply(this.skip(msg.guild, queue));

		const vote = this.votes.get(msg.guild.id);
		if (vote && vote.count >= 1) {
			if (vote.users.some(user => user === msg.author.id)) return msg.reply('you\'ve already voted to skip the song.');

			vote.count++;
			vote.users.push(msg.author.id);
			if (vote.count >= threshold) return msg.reply(this.skip(msg.guild, queue));

			const time = this.setTimeout(vote);
			const remaining = threshold - vote.count;

			return msg.say(oneLine`
				${vote.count} vote${vote.count > 1 ? 's' : ''} received so far,
				${remaining} more ${remaining > 1 ? 'are' : 'is'} needed to skip.
				Five more seconds on the clock! The vote will end in ${time} seconds.
			`);
		} else {
			const newVote = {
				count: 1,
				users: [msg.author.id],
				queue,
				guild: msg.guild.id,
				start: Date.now(),
				timeout: null
			};

			const time = this.setTimeout(newVote);
			this.votes.set(msg.guild.id, newVote);
			const remaining = threshold - 1;

			return msg.say(oneLine`
				Starting a voteskip.
				${remaining} more vote${remaining > 1 ? 's are' : ' is'} required for the song to be skipped.
				The vote will end in ${time} seconds.
			`);
		}
	}

	skip(guild, queue) {
		if (this.votes.has(guild.id)) {
			clearTimeout(this.votes.get(guild.id).timeout);
			this.votes.delete(guild.id);
		}

		const song = queue.songs[0];
		song.dispatcher.end();

		return `Skipped: **${song}**`;
	}

	setTimeout(vote) {
		const time = vote.start + 15000 - Date.now() + ((vote.count - 1) * 5000);
		clearTimeout(vote.timeout);
		vote.timeout = setTimeout(() => {
			this.votes.delete(vote.guild);
			vote.queue.textChannel.send('The vote to skip the current song has ended. Get outta here, party poopers.');
		}, time);

		return Math.round(time / 1000);
	}

	get queue() {
		if (!this._queue) this._queue = this.client.registry.resolveCommand('music:play').queue;

		return this._queue;
	}
};
