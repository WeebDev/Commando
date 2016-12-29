global.Promise = require('bluebird');

const commando = require('discord.js-commando');
const Collection = require('discord.js').Collection;
const oneLine = require('common-tags').oneLine;
const path = require('path');
const Raven = require('raven');
const sqlite = require('sqlite');
const winston = require('winston');

const Redis = require('./redis/Redis');
const Database = require('./postgreSQL/postgreSQL');
const config = require('./settings');
const Money = require('./postgreSQL/models/Money');

const database = new Database();
const redis = new Redis();
const client = new commando.Client({
	owner: config.owner,
	commandPrefix: '?',
	unknownCommandResponse: false,
	disableEveryone: true
});

Raven.config(config.ravenKey);
Raven.install();

database.start();
redis.start();

client.setProvider(sqlite.open(path.join(__dirname, 'settings.db'))
	.then(db => new commando.SQLiteProvider(db)))
	.catch(error => { winston.error(error); });

let earnings = new Collection();
setInterval(() => {
	for (const [userID, moneyEarned] of earnings) {
		Money.findOne({ where: { userID } }).then(user => {
			if (!user) {
				Money.create({
					userID: userID,
					money: moneyEarned
				});
			} else {
				user.increment('money', { by: moneyEarned });
				user.save();
			}
		});
	}

	earnings = new Collection();
}, 30 * 1000);

client.on('error', winston.error)
	.on('warn', winston.warn)
	.on('ready', () => {
		winston.info(oneLine`
			Client ready... Logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})
		`);
	})
	.on('disconnect', () => { winston.warn('Disconnected!'); })
	.on('reconnect', () => { winston.warn('Reconnecting...'); })
	.on('message', (message) => {
		const hasImageAttachment = message.attachments.some(attachment => attachment.url.match(/\.(png|jpg|jpeg|gif|webp)$/));
		const moneyEarned = (hasImageAttachment * 40) + ((1 - hasImageAttachment) * 5);
		const collectedMoney = earnings.get(message.author.id) || 0;

		earnings.set(message.author.id, collectedMoney + moneyEarned);
	})
	.on('commandRun', (cmd, promise, msg, args) => {
		winston.info(oneLine`${msg.author.username}#${msg.author.discriminator} (${msg.author.id})
			> ${msg.guild ? `${msg.guild.name} (${msg.guild.id})` : 'DM'}
			>> ${cmd.groupID}:${cmd.memberName}
			${Object.values(args)[0] !== '' ? `>>> ${Object.values(args)}` : ''}
		`);
	})
	.on('commandError', (cmd, err) => {
		if (err instanceof commando.FriendlyError) return;
		winston.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		winston.info(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
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
	});

client.registry
	.registerGroups([
		['info', 'Info'],
		['weather', 'Weather'],
		['music', 'Music'],
		['tags', 'Tags']
	])
	.registerDefaults()
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.login(config.token);
