/* eslint-disable no-console */
const childProcess = require('child_process');
const beautify = require('js-beautify').js_beautify;

module.exports = class Commands {
	constructor(data, docs) {
		this.data = data;
		this.docs = docs;
	}

	async init(msg, owner, repo, branch, path) {
		const repoName = `${owner}/${repo}#${branch}`;
		const sentMessage = await msg.channel.sendMessage('Working...');

		this.data.channels[msg.channel.id] = { repo: repoName };

		if (this.data.repos.hasOwnProperty(repoName)) {
			return msg.channel.sendMessage(`Successfully initialized for cached repository **${repoName}**.`);
		}

		this.data.repos[repoName] = {
			repoName: repoName,
			owner: owner,
			repo: repo,
			branch: branch,
			path: path
		};

		return this.docs.init(repoName).then(() => sentMessage.edit(`Successfully initialized for repository **${repoName}** with path \`${path}\`.`))
			.catch(error => {
				delete this.data.channels[msg.channel.id];
				delete this.data.repos[repoName];

				sentMessage.edit(`Failed to inizialize repository. Error: \`${error}\``);
			});
	}

	remove(msg, channelID) {
		delete this.data.channels[channelID];

		msg.channel.sendMessage(`Successfully removed in \`#${msg.channel.name}\`.`);
	}

	delete(msg, channelID) {
		const repo = this.data.channels[channelID].repo;

		for (let channel in this.data.channels) if (this.data.channels[channel].repo === repo) delete this.data.channels[channel];

		delete this.data.repos[repo];

		msg.channel.sendMessage(`Successfully **deleted** repository.`);
	}

	docslink(msg, channelID, url) {
		const repo = this.data.repos[this.data.channels[channelID].repo];

		if (!url || !url.length) {
			delete repo.docsURL;
			msg.channel.sendMessage(`Successfully **unlinked** docs.`);
		} else {
			repo.docsURL = url;
			msg.channel.sendMessage(`Successfully **linked** docs.`);
		}
	}

	updateDocs(msg, owner, repo, branch) {
		const repoName = `${owner}/${repo}#${branch}`;
		return this.docs.update(repoName).then(() => msg.channel.sendMessage(`Successfully updated docs for repository **${repo}**.`))
			.catch(error => {
				msg.channel.sendMessage(`Failed to update docs for repository. Error: \`${error}\``);
			});
	}

	update(msg) {
		msg.channel.sendMessage('Updated!').then(() => childProcess.execSync('git pull'));
	}

	beautify(msg) {
		let messages = msg.channel.messages.array().reverse().filter(msg => msg.author.id !== msg.client.user.id);
		let code;
		let codeRegex = /```(?:js|json|javascript)?\n?((?:\n|.)+?)\n?```/ig;

		for (let m = 0; m < messages.length; m++) {
			let msg = messages[m];
			let groups = codeRegex.exec(msg.content);

			if (groups && groups[1].length) {
				code = groups[1];
				break;
			}
		}

		if (!code) {
			return msg.channel.sendMessage('No Javascript codeblock found.');
		}

		let beautifiedCode = beautify(code, { indent_size: 2, brace_style: 'collapse' }); // eslint-disable-line camelcase
		beautifiedCode = this.reduceIndentation(beautifiedCode);

		return msg.channel.sendMessage(`${'```js'}\n${beautifiedCode}\n${'```'}`);
	}

	reduceIndentation(string) {
		let whitespace = string.match(/^(\s+)/);

		if (!whitespace) return string;

		whitespace = whitespace[0].replace('\n', '');

		let lines = string.split('\n');
		let reformattedLines = [];

		lines.forEach(line => reformattedLines.push(line.replace(whitespace, '')));

		return reformattedLines.join('\n');
	}
};
