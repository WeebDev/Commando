const { Command } = require('discord.js-commando');
const request = require('snekfetch');
const { oneLineTrim } = require('common-tags');

module.exports = class DocsCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'docs',
			group: 'docs',
			memberName: 'docs',
			description: 'Searches discord.js documentation.',
			throttling: {
				usages: 2,
				duration: 3
			},

			args: [
				{
					key: 'query',
					prompt: 'what would you like to find?\n',
					type: 'string'
				},
				{
					key: 'version',
					prompt: 'which version of docs would you like (stable, master, commando)?',
					type: 'string',
					parse: value => value.toLowerCase(),
					validate: value => ['master', 'stable', 'commando'].includes(value),
					default: 'stable'
				}
			]
		});

		// Cache for docs
		this.docs = {};
	}

	async fetchDocs(version) {
		if (this.docs[version]) return this.docs[version];

		const link = version === 'commando'
			? 'https://raw.githubusercontent.com/Gawdl3y/discord.js-commando/docs/master.json'
			: `https://raw.githubusercontent.com/hydrabolt/discord.js/docs/${version}.json`;

		const { text } = await request.get(link);
		const json = JSON.parse(text);

		this.docs[version] = json;
		return json;
	}

	search(docs, query) {
		query = query.split(/[#.]/);
		const mainQuery = query[0].toLowerCase();
		let memberQuery = query[1] ? query[1].toLowerCase() : null;

		const findWithin = (parentItem, props, name) => {
			let found = null;
			for (const category of props) {
				if (!parentItem[category]) continue;
				const item = parentItem[category].find(i => i.name.toLowerCase() === name);
				if (item) {
					found = { item, category };
					break;
				}
			}

			return found;
		};

		const main = findWithin(docs, ['classes', 'interfaces', 'typedefs'], mainQuery);
		if (!main) return [];

		const res = [main];
		if (!memberQuery) return res;

		let props;
		if (/\(.*?\)$/.test(memberQuery)) {
			memberQuery = memberQuery.replace(/\(.*?\)$/, '');
			props = ['methods'];
		} else {
			props = main.category === 'typedefs' ? ['props'] : ['props', 'methods', 'events'];
		}

		const member = findWithin(main.item, props, memberQuery);
		if (!member) return [];

		const rest = query.slice(2);
		if (rest.length) {
			if (!member.item.type) return [];
			const base = this.joinType(member.item.type)
				.replace(/<.+>/g, '')
				.replace(/\|.+/, '')
				.trim();

			return this.search(docs, `${base}.${rest.join('.')}`);
		}

		res.push(member);
		return res;
	}

	clean(text) {
		return text.replace(/\n/g, ' ')
			.replace(/<\/?(?:info|warn)>/g, '')
			.replace(/\{@link (.+?)\}/g, '`$1`');
	}

	joinType(type) {
		return type.map(t => t.map(a => Array.isArray(a) ? a.join('') : a).join('')).join(' | ');
	}

	getLink(version) {
		return version === 'commando'
			? 'https://discord.js.org/#/docs/commando/master/'
			: `https://discord.js.org/#/docs/main/${version}/`;
	}

	makeLink(main, member, version) {
		return oneLineTrim`
			${this.getLink(version)}
			${main.category === 'classes' ? 'class' : 'typedef'}/${main.item.name}
			?scrollTo=${member.item.scope === 'static' ? 's-' : ''}${member.item.name}
		`;
	}

	formatMain(main, version) {
		const embed = {
			description: `__**[${main.item.name}`,
			fields: []
		};

		if (main.item.extends) embed.description += ` (extends ${main.item.extends[0]})`;

		embed.description += oneLineTrim`
			](${this.getLink(version)}
			${main.category === 'classes' ? 'class' : 'typedef'}/${main.item.name})**__
		`;

		embed.description += '\n';
		if (main.item.description) embed.description += `\n${this.clean(main.item.description)}`;

		const join = it => `\`${it.map(i => i.name).join('` `')}\``;

		if (main.item.props) {
			embed.fields.push({
				name: 'Properties',
				value: join(main.item.props)
			});
		}

		if (main.item.methods) {
			embed.fields.push({
				name: 'Methods',
				value: join(main.item.methods)
			});
		}

		if (main.item.events) {
			embed.fields.push({
				name: 'Events',
				value: join(main.item.events)
			});
		}

		return embed;
	}

	formatProp(main, member, version) {
		const embed = {
			description: oneLineTrim`
				__**[${main.item.name}${member.item.scope === 'static' ? '.' : '#'}${member.item.name}]
				(${this.makeLink(main, member, version)})**__
			`,
			fields: []
		};

		embed.description += '\n';
		if (member.item.description) embed.description += `\n${this.clean(member.item.description)}`;

		const type = this.joinType(member.item.type);
		embed.fields.push({
			name: 'Type',
			value: `\`${type}\``
		});

		if (member.item.examples) {
			embed.fields.push({
				name: 'Example',
				value: `\`\`\`js\n${member.item.examples.join('```\n```js\n')}\`\`\``
			});
		}

		return embed;
	}

	formatMethod(main, member, version) {
		const embed = {
			description: oneLineTrim`
				__**[${main.item.name}${member.item.scope === 'static' ? '.' : '#'}${member.item.name}()]
				(${this.makeLink(main, member, version)})**__
			`,
			fields: []
		};

		embed.description += '\n';
		if (member.item.description) embed.description += `\n${this.clean(member.item.description)}`;

		if (member.item.params) {
			const params = member.item.params.map(param => {
				const name = param.optional ? `[${param.name}]` : param.name;
				const type = this.joinType(param.type);
				return `\`${name}: ${type}\`\n${this.clean(param.description)}`;
			});

			embed.fields.push({
				name: 'Parameters',
				value: params.join('\n\n')
			});
		}

		if (member.item.returns) {
			const desc = member.item.returns.description ? `${this.clean(member.item.returns.description)}\n` : '';
			const type = this.joinType(member.item.returns.types || member.item.returns);
			const returns = `${desc}\`=> ${type}\``;
			embed.fields.push({
				name: 'Returns',
				value: returns
			});
		} else {
			embed.fields.push({
				name: 'Returns',
				value: '`=> void`'
			});
		}

		if (member.item.examples) {
			embed.fields.push({
				name: 'Example',
				value: `\`\`\`js\n${member.item.examples.join('```\n```js\n')}\`\`\``
			});
		}

		return embed;
	}

	formatEvent(main, member, version) {
		const embed = {
			description: `__**[${main.item.name}#${member.item.name}](${this.makeLink(main, member, version)})**__\n`,
			fields: []
		};

		if (member.item.description) embed.description += `\n${this.clean(member.item.description)}`;

		if (member.item.params) {
			const params = member.item.params.map(param => {
				const type = this.joinType(param.type);
				return `\`${param.name}: ${type}\`\n${this.clean(param.description)}`;
			});

			embed.fields.push({
				name: 'Parameters',
				value: params.join('\n\n')
			});
		}

		if (member.item.examples) {
			embed.fields.push({
				name: 'Example',
				value: `\`\`\`js\n${member.item.examples.join('```\n```js\n')}\`\`\``
			});
		}

		return embed;
	}

	async run(msg, { query, version }) {
		const docs = await this.fetchDocs(version);
		const [main, member] = this.search(docs, query);

		if (!main) {
			return msg.say('Could not find that item in the docs.');
		}

		const embed = member ? {
			props: this.formatProp,
			methods: this.formatMethod,
			events: this.formatEvent
		}[member.category].call(this, main, member, version) : this.formatMain(main, version);

		const icon = 'https://cdn.discordapp.com/icons/222078108977594368/bc226f09db83b9176c64d923ff37010b.webp';
		embed.url = this.getLink(version);
		embed.author = {
			name: version === 'commando' ? 'Commando Docs' : `Discord.js Docs (${version})`,
			icon_url: icon // eslint-disable-line camelcase
		};

		return msg.embed(embed);
	}
};
