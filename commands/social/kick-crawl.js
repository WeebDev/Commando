const { Command } = require('discord.js-commando');
const crawl = '81440962496172032';

module.exports = class KickCrawlCommand extends Command {
  constructor(client) {
    super(client, {
			name: 'kick-crawl',
			group: 'social',
			memberName: 'kick-crawl',
			description: 'Kicks Crawl because no one likes him.',
      guildOnly: true
    });
  }
  async run(msg) {
    if (!msg.guild.memers.has(crawl)) return msg.reply('uh oh, Crawl isn\'t in here.');
    await msg.guild.members.get(crawl).kick();
    msg.reply('the jobs been done sir.');
  }
}