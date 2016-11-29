global.Promise = require('bluebird');

const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const path = require('path');
const winston = require('winston');

const Database = require('./postgreSQL/postgreSQL');
const config = require('./settings');

const database = new Database();
const client = new commando.Client({
	owner: config.owner,
	commandPrefix: 'sir, ',
	unknownCommandResponse: false,
	disableEveryone: true
});

client.on('error', winston.error)
	.on('warn', winston.warn)
	.on('ready', () => {
		winston.info(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
	})
	.on('disconnect', () => { winston.warn('Disconnected!'); })
	.on('reconnect', () => { winston.warn('Reconnecting...'); })
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
		['math', 'Math'],
		['fun', 'Fun'],
		['weather', 'Weather'],
		['music', 'Music'],
		['tags', 'Tags'],
		['rep', 'Reputation']
	])
	.registerDefaults()
	.registerCommandsIn(path.join(__dirname, 'commands'));

database.start();

client.login(config.token);
