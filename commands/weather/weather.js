// Credit goes to https://github.com/kurisubrooks/midori

const Canvas = require('canvas');
const { Command } = require('discord.js-commando');
const fs = global.Promise.promisifyAll(require('fs'));
const moment = require('moment');
const path = require('path');
const request = require('request-promise');

const config = require('../../settings');
const version = require('../../package').version;

module.exports = class WeatherCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'weather',
			aliases: ['w', '☁', '⛅', '⛈', '🌤', '🌥', '🌦', '🌧', '🌨', '🌩', '🌪'],
			group: 'weather',
			memberName: 'weather',
			description: 'Get the weather.',
			throttling: {
				usages: 1,
				duration: 10
			},

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
		const Image = Canvas.Image;

		Canvas.registerFont(path.join(__dirname, '../../assets/weather/fonts/Roboto.ttf'), { family: 'Roboto' });

		if (!config.GoogleAPIKey) return msg.reply('my Commander has not set the Google API Key. Go yell at him.');
		if (!config.WeatherAPIKey) return msg.reply('my Commander has not set the Weather API Key. Go yell at him.');

		const locationURI = encodeURIComponent(location.replace(/ /g, '+'));

		return request({
			uri: `https://maps.googleapis.com/maps/api/geocode/json?address=${locationURI}&key=${config.GoogleAPIKey}`,
			headers: { 'User-Agent': `Commando v${version} (https://github.com/WeebDev/Commando/)` },
			json: true
		}).then(response => {
			if (response.status !== 'OK') return msg.reply(this.handleNotOK(msg, response.status));
			if (response.results.length === 0) return msg.reply('your request returned no results.');

			const geocodelocation = response.results[0].formatted_address;
			const addressComponents = response.results[0].address_components;
			const wAPIKey = config.WeatherAPIKey;
			const params = `${response.results[0].geometry.location.lat},${response.results[0].geometry.location.lng}`;

			return request({
				uri: `https://api.darksky.net/forecast/${wAPIKey}/${params}?exclude=minutely,hourly,flags&units=auto`,
				headers: { 'User-Agent': `Commando v${version} (https://github.com/WeebDev/Commando/)` },
				json: true
			}).then(async res => {
				const datetime = moment().utcOffset(res.timezone).format('D MMMM, h:mma');
				const condition = res.currently.summary;
				const icon = res.currently.icon;
				const chanceofrain = Math.round((res.currently.precipProbability * 100) / 5) * 5;
				const temperature = Math.round(res.currently.temperature * 10) / 10;
				const temperatureMin = Math.round(res.daily.data[0].temperatureMin * 10) / 10;
				const temperatureMax = Math.round(res.daily.data[0].temperatureMax * 10) / 10;
				const feelslike = Math.round(res.currently.apparentTemperature * 10) / 10;
				const humidity = Math.round(res.currently.humidity * 100);
				const windspeed = res.currently.windSpeed;

				const canvas = new Canvas(400, 290);
				const ctx = canvas.getContext('2d');
				const base = new Image();
				const cond = new Image();

				const generate = () => {
					// Environment Variables
					ctx.drawImage(base, 0, 0);
					ctx.scale(1, 1);
					ctx.patternQuality = 'billinear';
					ctx.filter = 'bilinear';
					ctx.antialias = 'subpixel';
					ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
					ctx.shadowOffsetY = 2;
					ctx.shadowBlur = 2;

					// Time
					ctx.font = '12px Roboto';
					ctx.fillStyle = '#000000';
					ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
					ctx.fillText(datetime, 20, 30);

					// Location
					if (geocodelocation.length > 30) {
						ctx.font = '16px Roboto';
					} else {
						ctx.font = '18px Roboto';
					}
					ctx.fillStyle = '#FFFFFF';
					ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
					ctx.fillText(geocodelocation.substr(0, 35), 20, 52);

					// Temperature
					ctx.font = '88px Roboto';
					ctx.fillText(`${temperature}°${this.getTempUnit(addressComponents)}`, 20, 130);

					ctx.font = '16px Roboto';
					ctx.fillText(`High ${temperatureMax}°${this.getTempUnit(addressComponents)}`, 20, 160);
					ctx.fillText(`Low ${temperatureMin}°${this.getTempUnit(addressComponents)}`, 115, 160);

					// Condition
					ctx.font = '14px Roboto';
					ctx.textAlign = 'center';
					ctx.fillText(condition, 342, 148);

					// Condition Image
					ctx.shadowBlur = 5;
					ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
					ctx.drawImage(cond, 290, 22, 105, 105);

					// Details
					ctx.font = '14px Roboto';
					ctx.shadowColor = 'rgba(0, 0, 0, 0)';
					ctx.textAlign = 'left';
					ctx.fillStyle = '#000000';
					ctx.fillText('Current details', 20, 186);

					// Titles
					ctx.font = '14px Roboto';
					ctx.fillStyle = '#777777';
					ctx.fillText('Feels like', 20, 206);
					ctx.fillText('Humidity', 20, 226);
					ctx.fillText('Wind Speed', 20, 246);
					ctx.fillText('Chance of rain', 20, 266);

					// Values
					ctx.font = '14px Roboto';
					ctx.fillStyle = '#000000';
					ctx.fillText(`${feelslike}°${this.getTempUnit(addressComponents)}`, 170, 206);
					ctx.fillText(`${humidity}%`, 170, 226);
					ctx.fillText(`${windspeed.toFixed(2)} ${this.getWindspeedUnit(addressComponents)}`, 170, 246);
					ctx.fillText(`${chanceofrain}%`, 170, 266);
				};

				base.src = await fs.readFileAsync(this.getBase(icon));
				cond.src = await fs.readFileAsync(path.join(__dirname, `../../assets/weather/icons/partly-cloudy-night.png`));
				generate();

				return msg.channel.sendFile(canvas.toBuffer(), `${geocodelocation}.png`);
			});
		});
	}

	handleNotOK(msg, status) {
		if (status === 'ZERO_RESULTS') {
			return `your request returned no results.`;
		} else if (status === 'REQUEST_DENIED') {
			return `Geocode API Request was denied.`;
		} else if (status === 'INVALID_REQUEST') {
			return `Invalid Request,`;
		} else if (status === 'OVER_QUERY_LIMIT') {
			return `Query Limit Exceeded. Try again tomorrow.`;
		} else {
			return `Unknown.`;
		}
	}

	getBase(icon) {
		if (icon === 'clear-day' || icon === 'partly-cloudy-day') {
			return path.join(__dirname, '../../assets/weather/base/sun.png');
		} else if (icon === 'clear-night' || icon === 'partly-cloudy-night') {
			return path.join(__dirname, '../../assets/weather/base/moon.png');
		} else if (icon === 'rain') {
			return path.join(__dirname, '../../assets/weather/base/rain.png');
		} else if (icon === 'snow' || icon === 'sleet' || icon === 'fog' || icon === 'wind') {
			return path.join(__dirname, '../../assets/weather/base/snow.png');
		} else {
			return path.join(__dirname, '../../assets/weather/base/cloud.png');
		}
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
