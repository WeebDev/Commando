const stripIndents = require('common-tags').stripIndents;

module.exports = class Lookup {
	constructor(data, docs) {
		this.data = data;
		this._docs = docs;
	}

	get docs() {
		return this._docs.docs;
	}

	respond(msg, params) {
		const channelData = this.data.channels[msg.channel.id];
		if (!channelData) return;
		const docs = this.docs[channelData.repo];
		const repo = this.data.repos[channelData.repo];

		if (!docs) msg.channel.sendMessage('Documentation not yet loaded. Please wait...');

		const classes = this.lowerCaseKeys(docs.classes);
		const interfaces = this.lowerCaseKeys(docs.interfaces);
		const typedefs = this.lowerCaseKeys(docs.typedefs);

		let lookup = params.join(' ').split('.');
		let lookupClass = lookup[0] ? lookup[0].toLowerCase() : undefined;
		let lookupSub = lookup[1] ? lookup[1].toLowerCase() : undefined;

		if (lookupSub) lookupSub = lookupSub.replace('()', '');

		lookupClass = classes.get(lookupClass) || interfaces.get(lookupClass) || typedefs.get(lookupClass) || null;

		if (lookupClass && lookupSub) {
			let { props, methods, events } = lookupClass;
			props = this.lowerCaseKeys(props);
			methods = this.lowerCaseKeys(methods);
			events = this.lowerCaseKeys(events);

			lookupSub = props.get(lookupSub) || methods.get(lookupSub) || events.get(lookupSub) || null;
		}

		let response;

		if (lookup[0] && lookup[0].toLowerCase() === 'help') {
			response = this.generateHelp(docs);
		} else if (lookupClass && lookupSub) {
			response = this.generateClassSub(lookupClass, lookupSub, repo);
		} else if (lookupClass && lookupSub === undefined) {
			if (['DocumentedClass', 'DocumentedInterface'].indexOf(lookupClass.constructor.name) > -1) response = this.generateClass(lookupClass, repo);
			if (lookupClass.constructor.name === 'DocumentedTypeDef') response = this.generateTypeDef(lookupClass, repo);
		} else {
			response = this.generateUnknown();
		}

		function chunkString(string, count) {
			let chunks = [];
			for (let i = 0; i < string.length; i += count) chunks.push(string.substr(i, count));
			return chunks;
		}

		chunkString(response, 2000).forEach(chunk => msg.channel.sendMessage(chunk, { split: true }));
	}

	generateHelp(docs) {
		let classes = [...docs.classes.values()].map(docsClass => `\`${docsClass.directData.name}\``).join(', ');
		let interfaces = [...docs.interfaces.values()].map(docsInterface => `\`${docsInterface.directData.name}\``).join(', ');
		let typedefs = [...docs.typedefs.values()].map(docsTypeDef => `\`${docsTypeDef.directData.name}\``).join(', ');

		if (!classes.length) classes = 'None';
		if (!interfaces.length) interfaces = 'None';
		if (!typedefs.length) typedefs = 'None';

		return stripIndents`
			**Classes**
			${classes}

			**Interfaces**
			${interfaces}

			**Typedefs**
			${typedefs}
		`;
	}

	generateClassSub(docsClass, docsSub, repo) {
		let info;

		if (docsSub.constructor.name === 'DocumentedMember') info = this.generateMember(docsSub);
		if (docsSub.constructor.name === 'DocumentedFunction') info = this.generateFunction(docsSub);
		if (docsSub.constructor.name === 'DocumentedEvent') info = this.generateEvent(docsSub);

		const className = docsClass.directData.name;
		const memberName = docsSub.directData.name;
		const type = ['DocumentedClass', 'DocumentedInterface'].indexOf(docsClass.constructor.name) > -1 ? 'class' : 'typedef';

		if (repo.docsURL) info += `\n**Docs:** ${this.generateDocsURL(repo, { type: type, name: className, member: memberName })}`;

		return info;
	}

	generateClass(docsClass, repo) {
		let { name, description, classdesc } = docsClass.directData;
		const construct = docsClass.classConstructor ? docsClass.classConstructor.directData.params.map(param => this.generateParam(param)).join('\n') : 'None';
		let properties = [...docsClass.props.values()].map(prop => `\`${prop.directData.name}\``).join(', ');
		let methods = [...docsClass.methods.values()].map(method => `\`${method.directData.name}()\``).join(', ');
		let events = [...docsClass.events.values()].map(event => `\`${event.directData.name}\``).join(', ');
		let docs;

		if (!properties.length) properties = 'None';
		if (!methods.length) methods = 'None';
		if (!events.length) events = 'None';

		if (repo.docsURL) docs = `**Docs:** ${this.generateDocsURL(repo, { type: 'class', name: name })}`;

		description = description.replace(/\r/g, ' ').replace(/<info>([\s\S]+)<\/info>/gi, '\n\nℹ $1 ℹ').replace(/<warn>([\s\S]+)<\/warn>/gi, '\n\n⚠ $1 ⚠');
		return stripIndents`
			__**\`${name}\`**__

			${description || classdesc}

			**Constructor** ${construct}

			**Properties**
			${properties}

			**Methods**
			${methods}

			**Events**
			${events}

			${docs ? docs : ''}
		`;
	}

	generateTypeDef(docsTypeDef, repo) {
		let { name, description } = docsTypeDef.directData;
		const type = this.generateVarType(docsTypeDef.directData.type);
		let docs;

		if (repo.docsURL) docs = `**Docs:** ${this.generateDocsURL(repo, { type: 'typedef', name: name })}`;

		description = description.replace(/\r/g, ' ').replace(/<info>([\s\S]+)<\/info>/gi, '\n\nℹ $1 ℹ').replace(/<warn>([\s\S]+)<\/warn>/gi, '\n\n⚠ $1 ⚠');
		return stripIndents`
			__**\`${name}\`**__
			${description}

			**Type:** ${type}

			${docs}
		`;
	}

	generateMember(docsMember) {
		let { memberof, name, description, type, returns } = docsMember.directData;
		let typeName;
		let types;

		if (type.directData) {
			typeName = 'Type';
			types = this.generateVarType(docsMember.directData.type);
		} else if (returns) {
			typeName = 'Returns';
			types = returns.map(returns => `${returns.type.names.map(name => `\`${name}\``)}`).join(', ');
		}

		description = description.replace(/\r/g, ' ').replace(/<info>([\s\S]+)<\/info>/gi, '\n\nℹ $1 ℹ').replace(/<warn>([\s\S]+)<\/warn>/gi, '\n\n⚠ $1 ⚠');
		return stripIndents`
			__**\`${memberof}.${name}\`**__

			${description}

			**${typeName}:** ${types}

		`;
	}

	generateFunction(docsFunction) {
		let { memberof, name, description, params } = docsFunction.directData;
		const returns = this.generateVarType(docsFunction.directData.returns);
		const paramsShort = params.map(param => this.generateParamShort(param)).join(', ');
		const paramsFull = params.map(param => this.generateParam(param)).join('\n');

		description = description.replace(/\r/g, ' ').replace(/<info>([\s\S]+)<\/info>/gi, '\n\nℹ $1 ℹ').replace(/<warn>([\s\S]+)<\/warn>/gi, '\n\n⚠ $1 ⚠');
		return stripIndents`
			__**\`${memberof}.${name}(${paramsShort})\`**__

			${paramsFull}

			${description}

			**Returns:** ${returns}

		`;
	}

	generateEvent(docsEvent) {
		let { memberof, name, description } = docsEvent.directData;
		const params = docsEvent.directData.params.map(param => this.generateParam(param)).join('\n');

		description = description.replace(/\r/g, ' ').replace(/<info>([\s\S]+)<\/info>/gi, '\n\nℹ $1 ℹ').replace(/<warn>([\s\S]+)<\/warn>/gi, '\n\n⚠ $1 ⚠');
		return stripIndents`
			__**\`${memberof}.${name}\`**__

			${description}

			**Params:** ${params}

		`;
	}

	generateParamShort(docsParam) {
		const { name } = docsParam.directData;

		return name;
	}

	generateParam(docsParam) {
		let { name, description, type } = docsParam.directData;

		description = description.replace(/\r/g, ' ').replace(/<info>([\s\S]+)<\/info>/gi, '\n\nℹ $1 ℹ').replace(/<warn>([\s\S]+)<\/warn>/gi, '\n\n⚠ $1 ⚠');
		return stripIndents`
			**\`${type.directData.names.join(' ')} ${name}\`**

			${description}

		`;
	}

	generateVarType(docsVarType) {
		if (!docsVarType.directData) return `\`null\``;

		let { names } = docsVarType.directData;

		if (!names) names = docsVarType.names;

		return `${names.map(name => `**\`${name}\`**`).join(', ')}`;
	}

	generateUnknown() {
		return 'Couldn\'t find entry in docs.';
	}

	generateDocsURL(repo, data) {
		let docsURL = repo.docsURL;
		const branch = repo.branch;
		const optionalMemberRegex = /\?scrollTo=\${member}/g;

		docsURL = docsURL.replace('${branch}', branch).replace('${type}', data.type).replace('${name}', data.name);

		if (data.member) {
			docsURL = docsURL.replace('${member}', data.member);
		} else {
			docsURL = docsURL.replace(optionalMemberRegex, '');
		}

		return docsURL;
	}

	lowerCaseKeys(map) {
		let modifiedMap = new Map();

		for (let [key, value] of map) modifiedMap.set(key.toLowerCase(), value);

		return modifiedMap;
	}
};
