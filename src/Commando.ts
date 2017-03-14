global.Promise = require('bluebird');

import { oneLine } from 'common-tags';
import { Guild, Message, User } from 'discord.js';
import { Command, CommandGroup, CommandMessage, CommandoClient, FriendlyError } from 'discord.js-commando';
import * as path from 'path';
import * as winston from 'winston';

import Database from './postgreSQL/PostgreSQL';
import * as SequelizeProvider from './providers/sequelize';
import Redis from './redis/Redis';

const config: any = require('./settings.json');

const client: CommandoClient = new CommandoClient({
	owner: config.owner,
	commandPrefix: '?',
	unknownCommandResponse: false,
	disableEveryone: true
});

Database.start();
Redis.start();

client.setProvider(new SequelizeProvider(Database.db));

client.dispatcher.addInhibitor((msg: Message) => {
	const blacklist: string[] = client.provider.get('global', 'userBlacklist', []);

	if (!blacklist.includes(msg.author.id)) return false;

	return `User ${msg.author.username}#${msg.author.discriminator} (${msg.author.id}) has been blacklisted.`;
});

client.on('error', winston.error)
	.on('warn', winston.warn)
	.on('ready', () => {
		winston.info(oneLine`
			Client ready... Logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})
		`);
	})
	.on('disconnect', () => winston.warn('Disconnected!'))
	.on('reconnect', () => winston.warn('Reconnecting...'))
	.on('commandRun', (cmd: Command, promise: Promise<any>, msg: CommandMessage, args: string | {} | string[]) => {
		winston.info(oneLine`
			${msg.author.username}#${msg.author.discriminator} (${msg.author.id})
			> ${msg.guild ? `${msg.guild.name} (${msg.guild.id})` : 'DM'}
			>> ${cmd.groupID}:${cmd.memberName}
			${Object.values(args)[0] !== '' || [] ? `>>> ${Object.values(args)}` : ''}
		`);
	})
	.on('commandError', (cmd: Command, err: {}) => {
		if (err instanceof FriendlyError) return;
		winston.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg: CommandMessage, reason: string) => {
		winston.info(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; User ${msg.author.username}#${msg.author.discriminator} (${msg.author.id}): ${reason}
		`);
	})
	.on('commandPrefixChange', (guild: Guild, prefix: string) => {
		winston.info(oneLine`
			Prefix changed to ${prefix || 'the default'}
			${guild ? `in the guild ${guild.name} (${guild.id})` : 'globally'}
		`);
	})
	.on('commandStatusChange', (guild: Guild, command: Command, enabled: boolean) => {
		winston.info(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild: Guild, group: CommandGroup, enabled: boolean) => {
		winston.info(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
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
		['tags', 'Tags'],
		['starboard', 'Starboard'],
		['rep', 'Reputation']
	])
	.registerDefaults()
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.login(config.token);

process.on('unhandledRejection', (err: Error) => {
	console.error('Uncaught Promise Error: \n' + err.stack); // eslint-disable-line
});
