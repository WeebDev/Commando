const commando = require('discord.js-commando');
const fs = require('fs');
const moment = require('moment');
const oneLine = require('common-tags').oneLine;
const path = require('path');
const winston = require('winston');

const config = require('./settings');

const data = require('./docsdata.json');
const Docs = require('./src/Docs.js');
const Lookup = require('./src/Lookup.js');
const Commands = require('./src/Commands.js');

const docs = new Docs(data);
const lookup = new Lookup(data, docs);
const commands = new Commands(data, docs);

const client = new commando.Client({
	owner: config.owner,
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
		'FRIEND_REMOVE'
	]
});

client.on('error', winston.error)
	.on('warn', winston.warn)
	.on('ready', () => {
		winston.log(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
	})
	.on('disconnect', () => { winston.warn('Disconnected!'); })
	.on('reconnect', () => { winston.warn('Reconnecting...'); })
	.on('message', msg => {
		if (msg.author.bot) return;

		const prefix = 'docs, ';

		if (!msg.content.toLowerCase().startsWith(prefix)) return;

		const params = msg.content.split(' ').splice(1);
		const command = params[0].toLowerCase();
		const args = params.splice(1);

		if (msg.author.id === '81440962496172032') {
			if (command === 'init') {
				if (data.channels.hasOwnProperty(msg.channel.id)) {
					msg.channel.sendMessage('Already initialized.');
					return;
				}

				if (!args[0] || !args[1]) {
					msg.channel.sendMessage('Invalid arguments.');
					return;
				}

				const gitsource = args[0].split('#');
				const gitrepo = gitsource[0].split('/');
				const owner = gitrepo[0];
				const repo = gitrepo[1];
				const branch = gitsource[1] || 'master';
				const repopath = args[1];

				if (!owner || !repo || !branch || !repopath) {
					msg.channel.sendMessage('You are missing either `owner`, `repo`, `branch` or `repopath`.');
					return;
				}

				commands.init(msg, owner, repo, branch, repopath);
				save();
				return;
			} else if (command === 'remove') {
				if (!data.channels.hasOwnProperty(msg.channel.id)) {
					msg.channel.sendMessage('Not yet initialized.');
					return;
				}

				commands.remove(msg, msg.channel.id);
				save();
				return;
			} else if (command === 'delete') {
				if (!data.channels.hasOwnProperty(msg.channel.id)) {
					msg.channel.sendMessage('Not yet initialized.');
					return;
				}

				commands.delete(msg, msg.channel.id);
				save();
				return;
			} else if (command === 'docslink') {
				const url = args[0];

				if (!data.channels.hasOwnProperty(msg.channel.id)) {
					msg.channel.sendMessage('Not yet initialized.');
					return;
				}

				commands.docslink(msg, msg.channel.id, url);
				save();
				return;
			} else if (command === 'updatedocs') {
				if (!args[0]) {
					msg.channel.sendMessage('Invalid arguments.');
					return;
				}

				const gitsource = args[0].split('#');
				const gitrepo = gitsource[0].split('/');
				const owner = gitrepo[0];
				const repo = gitrepo[1];
				const branch = gitsource[1] || 'master';

				if (!owner || !repo) {
					msg.channel.sendMessage('You are missing either `owner`, `repo`.');
					return;
				}

				commands.updateDocs(msg, owner, repo, branch);
				return;
			} else if (command === 'update') {
				commands.update(msg);
				return;
			}
		}
		if (command === 'beautify') {
			commands.beautify(msg);
			return;
		}
		lookup.respond(msg, params);
		return;
	})
	.on('commandError', (cmd, err) => {
		if (err instanceof commando.FriendlyError) return;
		winston.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
	})
	.on('commandBlocked', (msg, reason) => {
		winston.log(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
	})
	.on('commandPrefixChange', (guild, prefix) => {
		winston.log(oneLine`
			Prefix changed to ${prefix || 'the default'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('commandStatusChange', (guild, command, enabled) => {
		winston.log(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('groupStatusChange', (guild, group, enabled) => {
		winston.log(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
	})
	.on('guildMemberAdd', member => {
		member.guild.channels.get('232305140672102400').sendMessage(`**${member}** has joined us.\n(ID: ${member.user.id} | Created at: ${moment.utc(member.user.createdAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')})`);
	})
	.on('guildMemberRemove', member => {
		member.guild.channels.get('232305140672102400').sendMessage(`**${member}** has left us.\n(ID: ${member.user.id} | Created at: ${moment.utc(member.user.createdAt).format('dddd, MMMM Do YYYY, HH:mm:ss ZZ')})`);
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

function save() {
	fs.writeFileSync('./docsdata.json', JSON.stringify(data));
}

setInterval(save, 60 * 1000);

client.login(config.token);
