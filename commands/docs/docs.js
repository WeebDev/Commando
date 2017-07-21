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
					prompt: 'which version of docs would you like (stable, master)?',
					type: 'string',
					parse: value => value.toLowerCase(),
					validate: value => ['master', 'stable'].includes(value),
					default: 'stable'
				}
			]
		});

		// Cache for docs
		this.docs = {};
	}

	async fetchDocs(version) {
		if (this.docs[version]) return this.docs[version];

		const link = `https://raw.githubusercontent.com/hydrabolt/discord.js/docs/${version}.json`;
		const { text } = await request.get(link);
		const json = JSON.parse(text);

		this.docs[version] = json;
		return json;
	}

	search(docs, query) {
		query = query.split(/[#.]/);
		const mainQuery = query[0].toLowerCase();
		const memberQuery = query[1] ? query[1].toLowerCase() : null;

		const findWithin = (parentItem, props, name) => {
			let found = null;
			for (const type of props) {
				if (!parentItem[type]) continue;
				const item = parentItem[type].find(i => i.name.toLowerCase() === name);
				if (item) {
					found = { item, type };
					break;
				}
			}

			return found;
		};

		const main = findWithin(docs, ['classes', 'interfaces', 'typedefs'], mainQuery);
		if (!main) return [];

		const res = [main];
		if (!memberQuery) return res;

		const member = findWithin(main.item, {
			classes: ['props', 'methods', 'events'],
			interfaces: ['props', 'methods', 'events'],
			typedefs: ['props']
		}[main.type], memberQuery);

		if (!member) return [];
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

	makeLink(mainItem, item, version) {
		return oneLineTrim`
			https://discord.js.org/#/docs/main/${version}/class/${mainItem.name}
			?scrollTo=${item.scope === 'static' ? 's-' : ''}${item.name}
		`;
	}

	formatMain(item, version) {
		const embed = {
			description: `__**[${item.name}`,
			fields: []
		};

		if (item.extends) embed.description += ` (extends ${item.extends[0]})`;
		embed.description += `](https://discord.js.org/#/docs/main/${version}/class/${item.name})**__\n`;
		if (item.description) embed.description += `\n${this.clean(item.description)}`;

		const join = it => `\`${it.map(i => i.name).join('` `')}\``;

		if (item.props) {
			embed.fields.push({
				name: 'Properties',
				value: join(item.props)
			});
		}

		if (item.methods) {
			embed.fields.push({
				name: 'Methods',
				value: join(item.methods)
			});
		}

		if (item.events) {
			embed.fields.push({
				name: 'Events',
				value: join(item.events)
			});
		}

		return embed;
	}

	formatProp(item, mainItem, version) {
		const embed = {
			description: oneLineTrim`
				__**[${mainItem.name}${item.scope === 'static' ? '.' : '#'}${item.name}]
				(${this.makeLink(mainItem, item, version)})**__
			`,
			fields: []
		};

		embed.description += '\n';
		if (item.description) embed.description += `\n${this.clean(item.description)}`;

		const type = this.joinType(item.type);
		embed.fields.push({
			name: 'Type',
			value: `\`${type}\``
		});

		return embed;
	}

	formatMethod(item, mainItem, version) {
		const embed = {
			description: oneLineTrim`
				__**[${mainItem.name}${item.scope === 'static' ? '.' : '#'}${item.name}()]
				(${this.makeLink(mainItem, item, version)})**__
			`,
			fields: []
		};

		embed.description += '\n';
		if (item.description) embed.description += `\n${this.clean(item.description)}`;

		if (item.params) {
			const params = item.params.map(param => {
				const name = param.optional ? `[${param.name}]` : param.name;
				const type = this.joinType(param.type);
				return `\`${name}: ${type}\`\n${this.clean(param.description)}`;
			});

			embed.fields.push({
				name: 'Parameters',
				value: params.join('\n\n')
			});
		}

		if (item.returns) {
			const desc = item.returns.description ? `${this.clean(item.returns.description)}\n` : '';
			const type = this.joinType(item.returns.types || item.returns);
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

		return embed;
	}

	formatEvent(item, mainItem, version) {
		const embed = {
			description: `__**[${mainItem.name}#${item.name}](${this.makeLink(mainItem, item, version)})**__\n`,
			fields: []
		};

		if (item.description) embed.description += `\n${this.clean(item.description)}`;

		if (item.params) {
			const params = item.params.map(param => {
				const type = this.joinType(param.type);
				return `\`${param.name}: ${type}\`\n${this.clean(param.description)}`;
			});

			embed.fields.push({
				name: 'Parameters',
				value: params.join('\n\n')
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
		}[member.type].call(this, member.item, main.item, version) : this.formatMain(main.item, version);

		const icon = 'https://cdn.discordapp.com/icons/222078108977594368/bc226f09db83b9176c64d923ff37010b.webp';
		embed.url = `https://discord.js.org/#/docs/main/${version}`;
		embed.author = {
			name: `Discord.js Docs (${version})`,
			icon_url: icon // eslint-disable-line camelcase
		};

		return msg.embed(embed);
	}
};
