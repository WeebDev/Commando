/* eslint-disable no-console */
const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const path = require('path');

const token = require('./auth.json').token;

const client = new commando.Client({
	owner: '81440962496172032',
	commandPrefix: 'c!',
	disableEveryone: true,
	messageCacheLifetime: 30,
	messageSweepInterval: 60,
	disabledEvents: [
		'GUILD_CREATE',
		'GUILD_DELETE',
		'GUILD_UPDATE',
		'GUILD_UNAVAILABLE',
		'GUILD_AVAILABLE',
		'GUILD_MEMBER_UPDATE',
		'GUILD_MEMBER_AVAILABLE',
		'GUILD_MEMBER_SPEAKING',
		'GUILD_ROLE_CREATE',
		'GUILD_ROLE_DELETE',
		'GUILD_ROLE_UPDATE',
		'CHANNEL_CREATE',
		'CHANNEL_DELETE',
		'CHANNEL_UPDATE',
		'CHANNEL_PINS_UPDATE',
		'MESSAGE_DELETE_BULK',
		'USER_UPDATE',
		'USER_NOTE_UPDATE',
		'PRESENCE_UPDATE',
		'TYPING_START',
		'TYPING_STOP',
		'VOICE_STATE_UPDATE',
		'FRIEND_ADD',
		'FRIEND_REMOVE',
		'RELATIONSHIP_ADD',
		'RELATIONSHIP_REMOVE'
	]
});

client.on('error', console.error)
	.on('warn', console.warn)
	.on('ready', () => {
		console.log(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
	})
	.on('disconnect', () => { console.warn('Disconnected!'); })
	.on('reconnect', () => { console.warn('Reconnecting...'); })
	.on('commandError', (cmd, err) => {
		if (err instanceof commando.FriendlyError) return;
		console.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		console.log(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
	})
	.on('commandPrefixChange', (guild, prefix) => {
		console.log(oneLine`
			Prefix changed to ${prefix || 'the default'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('commandStatusChange', (guild, command, enabled) => {
		console.log(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild, group, enabled) => {
		console.log(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('guildMemberAdd', member => {
		member.guild.channels.get('232305140672102400').sendMessage(`**${member}** (ID: ${member.user.id}) has joined us.`);
	})
	.on('guildMemberRemove', member => {
		member.guild.channels.get('232305140672102400').sendMessage(`**${member}** (ID: ${member.user.id}) has left us.`);
	});

client.registry
	.registerGroups([
		['info', 'Info'],
		['math', 'Math'],
		['fun', 'Fun'],
		['music', 'Music'],
		['tags', 'Tags'],
		['rep', 'Reputation']
	])
	.registerDefaults()
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.login(token);
