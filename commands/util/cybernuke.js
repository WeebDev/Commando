const { Command } = require('discord.js-commando');
const { Collection } = require('discord.js');
const { stripIndents } = require('common-tags');
const winston = require('winston');

module.exports = class LaunchCybernukeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'launch-cybernuke',
			aliases: ['cybernuke'],
			group: 'util',
			memberName: 'cybernuke',
			description: 'Bans all members that have joined recently, with new accounts.',
			guildOnly: true,

			args: [
				{
					key: 'join',
					prompt: 'How old (in minutes) should a member be for the cybernuke to ignore (server join date)?',
					type: 'float',
					min: 0.1,
					max: 120
				},
				{
					key: 'age',
					prompt: 'How old (in minutes) should a member\'s account be for the cybernuke to ignore it (account age)?',
					type: 'float',
					min: 0.1
				}
			]
		});
	}

	hasPermission(msg) {
		return this.client.options.owner === msg.author.id || msg.member.hasPermission('ADMINISTRATOR');
	}

	async run(msg, args) {
		const statusMsg = await msg.reply('Calculating targeting parameters for cybernuke...');
		await msg.guild.fetchMembers();

		const memberCutoff = Date.now() - (args.join * 60000);
		const ageCutoff = Date.now() - (args.age * 60000);
		const members = msg.guild.members.filter(
			mem => mem.joinedTimestamp > memberCutoff && mem.user.createdTimestamp > ageCutoff
		);
		const booleanType = this.client.registry.types.get('boolean');

		await statusMsg.edit(`Cybernuke will strike ${members.size} members; proceed?`);
		let response;
		let statusMsg2;

		while(!statusMsg2) {
			const responses = await msg.channel.awaitMessages(msg2 => msg2.author.id === msg.author.id, {
				maxMatches: 1,
				time: 10
			});

			if(!responses || responses.size !== 1) {
				await msg.reply('Cybernuke cancelled.');
				return null;
			}
			response = responses.first();

			if(booleanType.validate(response.content)) {
				if(!booleanType.parse(response.content)) {
					await response.reply('Cybernuke cancelled.');
					return null;
				}

				statusMsg2 = await response.reply('Launching cybernuke...');
			} else {
				await response.reply('Unknown response. Please confirm the cybernuke launch with a simple "yes" or "no".');
			}
		}

		const fatalities = new Collection();
		const survivors = new Collection();
		let processed = 0;

		for(const member of members) {
			await member.sendMessage(stripIndents`
				Sorry, but you've been automatically targetted by the cybernuke in the "${msg.guild.name}" server.
				This means that you have been banned, likely in the case of a server raid.
				Please contact them if you believe this ban to be in error.
			`).catch(winston.error);

			member.ban()
				.then(() => {
					fatalities.set(member.id, member);
				})
				.catch(err => {
					winston.error(err);
					survivors.set(member.id, {
						member: member.id,
						error: err
					});
				})
				.then(() => {
					if(members.size <= 5) return;
					processed++;
					if(processed % 5 === 0) {
						statusMsg2.edit(`Launching cybernuke (${Math.round(processed / members.size * 100)}%)...`);
					}
				});
		}

		await statusMsg2.edit('Cybernuke impact confirmed. Casualty report incoming...');
		await response.reply(stripIndents`
			__**Fatalities**__
			${fatalities.size > 0 ? stripIndents`
				${fatalities.size} confirmed KIA.

				${fatalities.map(fat => `**-** ${fat.displayName} (fat.id)`).join('\n')}
			` : 'None'}


			${survivors.size > 0 ? stripIndents`
				__**Survivors**__
				${survivors.size} left standing.

				${survivors.map(srv => `**-** ${srv.member.displayName} (srv.member.id): \`${srv.error}\``).join('\n')}
			` : ''}
		`, { split: true });

		return null;
	}
};
