/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const parse = require('jsdoc-parse');
const Documentation = require('../docs/documentation.js');

module.exports = class Docs {
	constructor(data) {
		this.data = data;
		this.docs = {};

		console.log('Caching docs...');

		for (let repo in data.repos) {
			console.log(`Caching docs for ${repo}`);
			this.cacheDocs(repo);
		}

		console.log('Finished caching docs.');

		if (!fs.existsSync('./repos')) {
			console.log('No repos directory found. Creating...');
			fs.mkdirSync('./repos');
		}
	}

	init(repo) {
		const repoData = this.data.repos[repo];

		return new Promise((resolve, reject) => {
			if (fs.existsSync(`./repos/${repoData.repoName}`)) return resolve();

			console.log(`Cloning repo ${repo}...`);

			try {
				const clone = `git clone -b ${repoData.branch} --single-branch https://github.com/${repoData.owner}/${repoData.repo}.git ${repoData.repoName}`;

				console.log(`Running ${clone}`);
				childProcess.execSync(clone, { cwd: path.resolve(__dirname, '../repos') });
			} catch (error) {
				return reject(error);
			}

			console.log('Cloned successfully.');

			return this.cacheDocs(repo).then(resolve).catch(reject);
		});
	}

	update(repo) {
		const repoData = this.data.repos[repo];
		const sourcePath = path.resolve(__dirname, '../repos', repoData.repoName);

		console.log(`Pulling repo ${repo}...`);

		return new Promise((resolve, reject) => {
			try {
				childProcess.execSync(`git pull`, { cwd: sourcePath });
			} catch (error) {
				return reject(error);
			}

			console.log(`Pulled successfully.`);

			return this.cacheDocs(repo).then(resolve).catch(reject);
		});
	}

	cacheDocs(repo) {
		const repoData = this.data.repos[repo];
		const sourcePath = path.resolve(__dirname, '../repos', repoData.repoName, repoData.path, '**');

		console.log(`Caching docs at path: ${sourcePath}`);

		let data = '';

		return new Promise((resolve, reject) => {
			let stream = parse({ src: sourcePath });

			stream.on('data', chunk => {
				data += chunk;
			})
				.on('error', error => {
					console.log(`Error while parsing docs: ${error}`);
					reject(error);
				})
				.on('end', () => {
					console.log(`Finished caching docs for ${repo}`);
					data = JSON.parse(data);

					try {
						this.docs[repo] = new Documentation(data, {});
						resolve();
					} catch (error) {
						console.error(error.stack);
						reject(error);
					}
				});
		});
	}
};
