global.Promise = require('bluebird');

const commando = require('discord.js-commando');
const { oneLine } = require('common-tags');
const path = require('path');
const winston = require('winston');

const Database = require('./postgreSQL/PostgreSQL');
const Redis = require('./redis/Redis');
const SequelizeProvider = require('./postgreSQL/SequelizeProvider');
const config = require('./settings');

const database = new Database();
const redis = new Redis();
const client = new commando.Client({
	owner: config.owner,
	commandPrefix: '?',
	unknownCommandResponse: false,
	disableEveryone: true
});

const Currency = require('./currency/Currency');
const Experience = require('./currency/Experience');
const starBoard = require('./postgreSQL/models/StarBoard');
const userName = require('./postgreSQL/models/UserName');

let earnedRecently = [];
let gainedXPRecently = [];

database.start();
redis.start();

client.setProvider(new SequelizeProvider(database.db));

client.dispatcher.addInhibitor(msg => {
	const blacklist = client.provider.get('global', 'userBlacklist', []);

	if (!blacklist.includes(msg.author.id)) return false;

	return `User ${msg.author.username}#${msg.author.discriminator} (${msg.author.id}) has been blacklisted.`;
});

client.on('error', winston.error)
	.on('warn', winston.warn)
	.once('ready', () => Currency.leaderboard())
	.on('ready', () => {
		winston.info(oneLine`
			Client ready... Logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})
		`);
	})
	.on('disconnect', () => winston.warn('Disconnected!'))
	.on('reconnect', () => winston.warn('Reconnecting...'))
	.on('commandRun', (cmd, promise, msg, args) => {
		winston.info(oneLine`${msg.author.username}#${msg.author.discriminator} (${msg.author.id})
			> ${msg.guild ? `${msg.guild.name} (${msg.guild.id})` : 'DM'}
			>> ${cmd.groupID}:${cmd.memberName}
			${Object.values(args)[0] !== '' ? `>>> ${Object.values(args)}` : ''}
		`);
	})
	.on('message', async (message) => {
		if (message.channel.type === 'dm') return;

		if (message.guild.id === '222078108977594368' && !message.member.roles.has('242700009961816065') && /(discord\.gg\/.+|discordapp\.com\/invite\/.+)/i.test(message.content)) {
			if (message.deletable && message.author.id !== client.user.id) message.delete();
			message.reply('Please do not post invite links on this server. If you wish to give invite links, do so in direct messages.');
		}
		const channelLocks = client.provider.get(message.guild.id, 'locks', []);
		if (channelLocks.includes(message.channel.id)) return;
		if (message.author.bot) return;

		if (!earnedRecently.includes(message.author.id)) {
			const hasImageAttachment = message.attachments.some(attachment => {
				return attachment.url.match(/\.(png|jpg|jpeg|gif|webp)$/);
			});
			const moneyEarned = hasImageAttachment
				? Math.ceil(Math.random() * 7) + 5
				: Math.ceil(Math.random() * 7) + 1;

			Currency._changeBalance(message.author.id, moneyEarned);

			earnedRecently.push(message.author.id);
			setTimeout(() => {
				const index = earnedRecently.indexOf(message.author.id);
				earnedRecently.splice(index, 1);
			}, 8000);
		}

		if (!gainedXPRecently.includes(message.author.id)) {
			const xpEarned = Math.ceil(Math.random() * 9) + 3;
			const oldLevel = await Experience.getLevel(message.author.id);
			Experience.addExperience(message.author.id, xpEarned).then(async () => {
				const newLevel = await Experience.getLevel(message.author.id);

				if (newLevel > oldLevel) {
					Currency._changeBalance(message.author.id, 100 * newLevel);
				}
			}).catch(winston.error);

			gainedXPRecently.push(message.author.id);
			setTimeout(() => {
				const index = gainedXPRecently.indexOf(message.author.id);
				gainedXPRecently.splice(index, 1);
			}, 60 * 1000);
		}
	})
	.on('messageReactionAdd', async (messageReaction, user) => {
		if (messageReaction.emoji.name !== '⭐') return;
		if (messageReaction.message.author.id === user.id) return message.channel.send(`${user}, you cannot star your own messages!`); // eslint-disable-line consistent-return

		const message = messageReaction.message;
		const starboard = message.guild.channels.find('name', 'starboard');
		if (!starboard) return;

		let settings = await starBoard.findOne({ where: { guildID: message.guild.id } });
		if (!settings) settings = await starBoard.create({ guildID: message.guild.id });
		const starred = settings.starred;

		if (starred.hasOwnProperty(message.id)) {
			if (starred[message.id].stars.includes(user.id)) return message.channel.send(`${user}, you cannot star the same message twice!`); // eslint-disable-line consistent-return
			const starCount = starred[message.id].count += 1;
			const starredMessage = await starboard.fetchMessage(starred[message.id].starredMessageID);
			const starredMessageContent = starred[message.id].starredMessageContent;
			const starredMessageAttachmentImage = starred[message.id].starredMessageImage;
			const starredMessageDate = starred[message.id].starredMessageDate;
			const edit = starredMessage.embeds[0].footer.text.replace(`${starCount - 1} ⭐`, `${starCount} ⭐`);
			await starredMessage.edit({
				embed: {
					author: {
						icon_url: message.author.displayAvatarURL, // eslint-disable-line camelcase
						name: `${message.author.username}#${message.author.discriminator} (${message.author.id})`
					},
					color: 0xFFAC33,
					fields: [
						{
							name: 'ID',
							value: message.id,
							inline: true
						},
						{
							name: 'Channel',
							value: message.channel.toString(),
							inline: true
						},
						{
							name: 'Message',
							value: starredMessageContent ? starredMessageContent : '\u200B'
						}
					],
					image: { url: starredMessageAttachmentImage ? starredMessageAttachmentImage : undefined },
					timestamp: starredMessageDate,
					footer: { text: edit }
				}
			}).catch(null);
			starred[message.id].count = starCount;
			starred[message.id].stars.push(user.id);
			settings.starred = starred;

			await settings.save();
		} else {
			const starCount = 1;
			let attachmentImage;
			if (message.attachments.some(attachment => attachment.url.match(/\.(png|jpg|jpeg|gif|webp)$/))) attachmentImage = message.attachments.first().url;

			const sentStar = await starboard.send({
				embed: {
					author: {
						icon_url: message.author.displayAvatarURL, // eslint-disable-line camelcase
						name: `${message.author.username}#${message.author.discriminator} (${message.author.id})`
					},
					color: 0xFFAC33,
					fields: [
						{
							name: 'ID',
							value: message.id,
							inline: true
						},
						{
							name: 'Channel',
							value: message.channel.toString(),
							inline: true
						},
						{
							name: 'Message',
							value: message.content ? message.cleanContent : '\u200B'
						}
					],
					image: { url: attachmentImage ? attachmentImage.toString() : undefined },
					timestamp: message.createdAt,
					footer: { text: `${starCount} ⭐` }
				}
			}).catch(null);

			starred[message.id] = {};
			starred[message.id].authorID = message.author.id;
			starred[message.id].starredMessageID = sentStar.id;
			starred[message.id].starredMessageContent = message.cleanContent;
			starred[message.id].starredMessageImage = attachmentImage || '';
			starred[message.id].starredMessageDate = message.createdAt;
			starred[message.id].count = starCount;
			starred[message.id].stars = [];
			starred[message.id].stars.push(user.id);
			settings.starred = starred;

			await settings.save();
		}
	})
	.on('commandError', (cmd, err) => {
		if (err instanceof commando.FriendlyError) return;
		winston.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		winston.info(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; User ${msg.author.username}#${msg.author.discriminator} (${msg.author.id}): ${reason}
		`);
	})
	.on('commandPrefixChange', (guild, prefix) => {
		winston.info(oneLine`
			Prefix changed to ${prefix || 'the default'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('commandStatusChange', (guild, command, enabled) => {
		winston.info(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild, group, enabled) => {
		winston.info(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('userUpdate', (oldUser, newUser) => {
		if (oldUser.username !== newUser.username) {
			userName.create({ userid: newUser.id, username: oldUser.username }).catch(() => null);
		}
	});

client.registry
	.registerGroups([
		['info', 'Info'],
		['economy', 'Economy'],
		['social', 'Social'],
		['games', 'Games'],
		['item', 'Item'],
		['weather', 'Weather'],
		['music', 'Music'],
		['tags', 'Tags']
	])
	.registerDefaults()
	.registerTypesIn(path.join(__dirname, 'types'))
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.login(config.token);
