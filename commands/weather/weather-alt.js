// Credit goes to https://github.com/kurisubrooks/midori

const { Command } = require('discord.js-commando');
const moment = require('moment');
const request = require('request-promise');
const winston = require('winston');

const config = require('../../settings');
const version = require('../../package').version;

module.exports = class WeatherAlternativeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'weather-alt',
			aliases: ['w-alt'],
			group: 'weather',
			memberName: 'weather-alt',
			description: 'Get the weather.',
			format: '<location>',

			args: [
				{
					key: 'location',
					prompt: 'What location would you like to have information on?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const location = args.location;

		if (!config.GoogleAPIKey) return msg.reply('my Commander has not set the Google API Key. Go yell at him.');
		if (!config.WeatherAPIKey) return msg.reply('my Commander has not set the Weather API Key. Go yell at him.');

		let locationURI = encodeURIComponent(location.replace(/ /g, '+'));

		return request({
			uri: `https://maps.googleapis.com/maps/api/geocode/json?address=${locationURI}&key=${config.GoogleAPIKey}`,
			headers: { 'User-Agent': `Hamakaze ${version} (https://github.com/iCrawl/Hamakaze/)` },
			json: true
		}).then(response => {
			if (response.status !== 'OK') return this.handleNotOK(msg, response.status);
			if (response.results.length === 0) return msg.reply('I couldn\'t find a place with the location you provded me');

			let geocodelocation = response.results[0].formatted_address;

			return request({
				uri: `https://api.darksky.net/forecast/${config.WeatherAPIKey}/${response.results[0].geometry.location.lat},${response.results[0].geometry.location.lng}?exclude=minutely,hourly,flags&units=auto`,
				headers: { 'User-Agent': `Hamakaze ${version} (https://github.com/iCrawl/Hamakaze/)` },
				json: true
			}).then(res => {
				let datetime = moment().utcOffset(res.timezone).format('D MMMM, h:mma');
				let condition = res.currently.summary;
				let icon = res.currently.icon;
				let chanceofrain = Math.round((res.currently.precipProbability * 100) / 5) * 5;
				let temperature = Math.round(res.currently.temperature * 10) / 10;
				let temperatureMin = Math.round(res.daily.data[0].temperatureMin * 10) / 10;
				let temperatureMax = Math.round(res.daily.data[0].temperatureMax * 10) / 10;
				let feelslike = Math.round(res.currently.apparentTemperature * 10) / 10;
				let humidity = Math.round(res.currently.humidity * 100);
				let windspeed = res.currently.windSpeed;

				let embed = {
					color: this.getColor(icon),
					fields: [
						{
							name: `${geocodelocation.substr(0, 35)}`,
							value: `${this.getBase(icon)}`,
							inline: true
						},
						{
							name: 'Condition',
							value: `${condition}`,
							inline: true
						},
						{
							name: 'Temperature',
							value: `${temperature}° ${this.getTempUnit(response.results[0].address_components)}`,
							inline: true
						},
						{
							name: 'High / Low',
							value: `${temperatureMax}° ${this.getTempUnit(response.results[0].address_components)}\n${temperatureMin}° ${this.getTempUnit(response.results[0].address_components)}`,
							inline: true
						},
						{
							name: 'Feels like',
							value: `${feelslike}°`,
							inline: true
						},
						{
							name: 'Humidity',
							value: `${humidity}%`,
							inline: true
						},
						{
							name: 'Chance of rain',
							value: `${chanceofrain}%`,
							inline: true
						},
						{
							name: 'Windspeed',
							value: `${windspeed.toFixed(2)} ${this.getWindspeedUnit(response.results[0].address_components)} `,
							inline: true
						}
					],
					footer: {
						icon_url: msg.client.user.avatarURL, // eslint-disable-line camelcase
						text: `${datetime}`
					}
				};

				return msg.channel.sendMessage('', { embed }).catch(error => { winston.error(error); });
			}).catch(error => { winston.error(error); });
		}).catch(error => { winston.error(error); });
	}

	handleNotOK(msg, status) {
		if (status === 'ZERO_RESULTS') {
			return `${msg.author}, your request returned no results.`;
		} else if (status === 'REQUEST_DENIED') {
			return `Error: Geocode API Request was denied.`;
		} else if (status === 'INVALID_REQUEST') {
			return `Error: Invalid Request,`;
		} else if (status === 'OVER_QUERY_LIMIT') {
			return `${msg.author}, Query Limit Exceeded. Try again tomorrow.`;
		} else {
			return `Error: Unknown.`;
		}
	}

	getBase(icon) {
		if (icon === 'clear-night' || icon === 'partly-cloudly-night') return `☁`;
		if (icon === 'rain') return `🌧`;
		if (icon === 'snow' || icon === 'sleet' || icon === 'fog' || icon === 'wind') return `🌫`;
		if (icon === 'cloudy') return `☁`;
		return `☀`;
	}

	getColor(icon) {
		if (icon === 'clear-night' || icon === 'partly-cloudly-night') return 8547552;
		if (icon === 'rain') return 1277387;
		if (icon === 'snow' || icon === 'sleet' || icon === 'fog' || icon === 'wind') return 11318461;
		if (icon === 'cloudy') return 8824516;
		return 5937855;
	}

	getWindspeedUnit(units) {
		let unit = units.find(un => un.types.includes('country'));

		if (unit === undefined) return 'm/s';
		if (unit.short_name === 'US' || unit.short_name === 'GB') return 'mph';
		if (unit.short_name === 'CA') return 'kph';
		return 'm/s';
	}

	getTempUnit(units) {
		let unit = units.find(un => un.types.includes('country'));

		if (unit === undefined) return 'C';
		if (unit.short_name === 'US') return 'F';
		return 'C';
	}
};
