// Credit goes to https://github.com/kurisubrooks/midori

const Canvas = require('canvas');
const { Command } = require('discord.js-commando');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const request = require('request-promise');
const winston = require('winston');

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
			format: '<location>',
			guildOnly: true,

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

		// Because Windows is fucking stupid
		if (process.platform.startsWith('win')) {
			const Front = Canvas.Font; // eslint-disable-line no-unused-vars
		} else {
			const Font = Canvas.Font;
			const Roboto = new Font('Roboto', path.join(__dirname, '../../assets/weather/fonts/Roboto.ttf')); // eslint-disable-line no-unused-vars
		}

		if (!config.GoogleAPIKey) return msg.reply('my Commander has not set the Google API Key. Go yell at him.');
		if (!config.WeatherAPIKey) return msg.reply('my Commander has not set the Weather API Key. Go yell at him.');

		let locationURI = encodeURIComponent(location.replace(/ /g, '+'));

		return request({
			uri: `https://maps.googleapis.com/maps/api/geocode/json?address=${locationURI}&key=${config.GoogleAPIKey}`,
			headers: { 'User-Agent': `Hamakaze ${version} (https://github.com/iCrawl/Hamakaze/)` },
			json: true
		}).then(response => {
			if (response.status !== 'OK') return this.handleNotOK(msg, response.body.status);
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
				let windBearing = res.currently.windBearing;

				let canvas = new Canvas(400, 290);
				let ctx = canvas.getContext('2d');
				let base = new Image();
				let cond = new Image();

				let pointer = new Canvas(15, 15);
				let pntr = pointer.getContext('2d');
				let windDir = new Image();

				let generate = () => {
					// Environment Variables
					ctx.drawImage(base, 0, 0);
					ctx.scale(1, 1);
					ctx.patternQuality = 'billinear';
					ctx.filter = 'bilinear';
					ctx.antialias = 'subpixel';
					ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
					ctx.shadowOffsetY = 2;
					ctx.shadowBlur = 2;

					// Wind Bearing
					pntr.patternQuality = 'billinear';
					pntr.filter = 'billinear';
					pntr.antialias = 'subpixel';
					pntr.translate(7.5, 7.5);
					pntr.rotate((windBearing || 0) * Math.PI / 180 / 10);
					pntr.drawImage(windDir, -7.5, -7.5, 15, 15);

					// Time
					ctx.font = '12px Roboto';
					ctx.fillStyle = '#000000';
					ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
					ctx.fillText(datetime, 20, 30);

					if (location.length > 30) {
						ctx.font = '16px Roboto';
					} else {
						ctx.font = '18px Roboto';
					}
					ctx.fillStyle = '#FFFFFF';
					ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
					ctx.fillText(location.substr(0, 35), 25, 52);

					// Temperature
					ctx.font = '88px Roboto';
					ctx.fillText(`${temperature}°`, 19, 130);

					ctx.font = '16px Roboto';
					ctx.fillText(`High ${temperatureMax}°`, 20, 157);
					ctx.fillText(`Low ${temperatureMin}°`, 110, 157);

					// Condition
					ctx.font = '14px Roboto';
					ctx.textAlign = 'center';
					ctx.fillText(condition, 328, 148);

					// Condition Image
					ctx.shadowBlur = 5;
					ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
					ctx.drawImage(cond, 276, 22, 105, 105);

					// Details
					ctx.font = '14px Roboto';
					ctx.shadowColor = 'rgba(0, 0, 0, 0)';
					ctx.textAlign = 'left';
					ctx.fillStyle = '#000000';
					ctx.fillText('Current details', 20, 188);

					// Titles
					ctx.font = '14px Roboto';
					ctx.fillStyle = '#777777';
					ctx.fillText('Feels like', 20, 210);
					ctx.fillText('Humidity', 20, 230);
					ctx.fillText('Wind Speed', 20, 250);
					ctx.fillText('Chance of rain', 20, 270);

					// Values
					ctx.fillText(`${feelslike}°`, 170, 210);
					ctx.fillText(`${humidity}%`, 170, 230);
					ctx.fillText(`${windspeed.toFixed(2)} ${this.getUnit(response.results[0].address_components)}`, 170, 250);
					if (windspeed.toString().length < 4) {
						ctx.drawImage(pointer, 240, 237);
					} else if (windspeed.toString().length < 3) {
						ctx.drawImage(pointer, 230, 237);
					} else {
						ctx.drawImage(pointer, 250, 237);
					}
					ctx.fillText(`${chanceofrain}%`, 170, 270);
				};

				base.src = fs.readFileSync(this.getBase(icon));
				cond.src = fs.readFileSync(path.join(__dirname, `../../assets/weather/icons/${icon}.png`));
				windDir.src = fs.readFileSync(path.join(__dirname, `../../assets/weather/pointer.png`));
				generate();

				return msg.channel.sendFile(canvas.toBuffer(), `${geocodelocation}.png`)
					.catch(error => { winston.error(error); });
			}).catch(error => {
				return winston.error(error);
			});
		}).catch(error => {
			winston.error(error);
			return msg.say(`Error: Status code ${error.status || error.response} from Google.`);
		});
	}

	handleNotOK(msg, status) {
		if (status === 'ZERO_RESULTS') {
			return { plain: `${msg.author}, your request returned no results.` };
		} else if (status === 'REQUEST_DENIED') {
			return { plain: `Error: Geocode API Request was denied.` };
		} else if (status === 'INVALID_REQUEST') {
			return { plain: `Error: Invalid Request,` };
		} else if (status === 'OVER_QUERY_LIMIT') {
			return { plain: `${msg.author}, Query Limit Exceeded. Try again tomorrow.` };
		} else {
			return { plain: `Error: Unknown.` };
		}
	}

	getBase(icon) {
		if (icon === 'clear-night' || icon === 'partly-cloudly-night') return path.join(__dirname, '../../assets/weather/base/moon.png');
		if (icon === 'rain') return path.join(__dirname, '../../assets/weather/base/rain.png');
		if (icon === 'snow' || icon === 'sleet' || icon === 'fog' || icon === 'wind') return path.join(__dirname, '../../assets/weather/base/snow.png');
		if (icon === 'cloudy') return path.join(__dirname, '../../assets/weather/base/cloud.png');
		return path.join(__dirname, '../../assets/weather/base/sun.png');
	}

	getUnit(units) {
		let unit = units.find(un => un.types.includes('country'));

		if (unit === undefined) return 'm/s';
		if (unit.short_name === 'US' || unit.short_name === 'GB') return 'mph';
		if (unit.short_name === 'CA') return 'kph';
		return 'm/s';
	}
};
