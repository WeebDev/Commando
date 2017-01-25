// Credit goes to that cutie ;//w//; https://github.com/kurisubrooks/midori

const Canvas = require('canvas');
const { Command } = require('discord.js-commando');
const fs = global.Promise.promisifyAll(require('fs'));
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
				duration: 30
			},

			args: [
				{
					key: 'location',
					prompt: 'what location would you like to have information on?\n',
					type: 'string'
				}
			]
		});
	}

	async run(msg, args) {
		const location = args.location;
		const Image = Canvas.Image;

		Canvas.registerFont(path.join(__dirname, '../../assets/weather/fonts/Roboto-Regular.ttf'), { family: 'Roboto' });
		Canvas.registerFont(path.join(__dirname, '../../assets/weather/fonts/RobotoCondensed-Regular.ttf'), { family: 'Roboto Condensed' });
		Canvas.registerFont(path.join(__dirname, '../../assets/weather/fonts/RobotoMono-Light.ttf'), { family: 'Roboto Mono' });

		if (!config.GoogleAPIKey) return msg.reply('my Commander has not set the Google API Key. Go yell at him.');
		if (!config.WeatherAPIKey) return msg.reply('my Commander has not set the Weather API Key. Go yell at him.');

		const locationURI = encodeURIComponent(location.replace(/ /g, '+'));

		const response = await request({
			uri: `https://maps.googleapis.com/maps/api/geocode/json?address=${locationURI}&key=${config.GoogleAPIKey}`,
			headers: { 'User-Agent': `Commando v${version} (https://github.com/WeebDev/Commando/)` },
			json: true
		});

		if (response.status !== 'OK') return msg.reply(this.handleNotOK(msg, response.status));
		if (response.results.length === 0) return msg.reply('your request returned no results.');

		let city;
		let state;

		const geocodelocation = response.results[0].formatted_address;
		const wAPIKey = config.WeatherAPIKey;
		const params = `${response.results[0].geometry.location.lat},${response.results[0].geometry.location.lng}`;

		const locality = response.results[0].address_components.find(loc => loc.types.includes('locality'));
		const governing = response.results[0].address_components.find(gov => gov.types.includes('administrative_area_level_1'));
		const country = response.results[0].address_components.find(cou => cou.types.includes('country'));

		if (locality && governing) {
			city = locality;
			state = governing;
		} else if (!locality && governing && country) {
			city = governing;
			state = country;
		} else if (locality && !governing && country) {
			city = locality;
			state = country;
		} else if (!locality && !governing && country) {
			city = country;
			state = {};
		} else {
			city = {};
			state = {};
		}

		const res = await request({
			uri: `https://api.darksky.net/forecast/${wAPIKey}/${params}?exclude=minutely,hourly,flags&units=auto`,
			headers: { 'User-Agent': `Commando v${version} (https://github.com/WeebDev/Commando/)` },
			json: true
		});

		const condition = res.currently.summary;
		const icon = res.currently.icon;
		const chanceofrain = Math.round((res.currently.precipProbability * 100) / 5) * 5;
		const temperature = Math.round(res.currently.temperature);
		const humidity = Math.round(res.currently.humidity * 100);
		/* const windBearing = res.currently.windBearing;*/

		const canvas = new Canvas(400, 180);
		/* const pointerCanvas = new Canvas(16, 16);*/
		const ctx = canvas.getContext('2d');
		/* const pntr = pointerCanvas.getContext('2d');*/
		const base = new Image();
		const cond = new Image();
		const humid = new Image();
		const precip = new Image();
		/* const pointer = new Image();*/

		let theme = 'light';
		let fontColor = '#FFFFFF';

		if (icon === 'snow') {
			theme = 'dark';
			fontColor = '#444444';
		}

		const generate = () => {
			// Environment Variables
			ctx.drawImage(base, 0, 0);
			ctx.scale(1, 1);
			ctx.patternQuality = 'billinear';
			ctx.filter = 'bilinear';
			ctx.antialias = 'subpixel';

			// City Name
			ctx.font = '20px Roboto';
			ctx.fillStyle = fontColor;
			ctx.fillText(city.long_name ? city.long_name : 'Unknown', 35, 50);

			// Prefecture Name
			ctx.font = '16px Roboto';
			ctx.fillStyle = theme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
			ctx.fillText(state.long_name ? state.long_name : '', 35, 70);

			// Temperature
			ctx.font = "48px 'Roboto Mono'";
			ctx.fillStyle = fontColor;
			ctx.fillText(`${temperature}°`, 35, 140);

			// Condition
			ctx.font = '16px Roboto';
			ctx.textAlign = 'right';
			ctx.fillText(condition, 370, 142);

			// Condition Image
			ctx.drawImage(cond, 325, 31);

			// Humidity Image
			ctx.drawImage(humid, 315, 88);

			// Precip Image
			ctx.drawImage(precip, 315, 108);

			/* // Pointer Image
			pntr.drawImage(pointer, 35, 160);
			pntr.patternQuality = 'billinear';
			pntr.filter = 'billinear';
			pntr.antialias = 'subpixel';
			pntr.translate(7.5, 7.5);
			pntr.rotate((windBearing || 0) * Math.PI / 180 / 10);*/

			// Titles
			ctx.font = "16px 'Roboto Condensed'";
			ctx.fillText(`${humidity}%`, 370, 100);
			ctx.fillText(`${chanceofrain}%`, 370, 121);
		};

		base.src = await fs.readFileAsync(this.getBase(icon));
		cond.src = await fs.readFileAsync(path.join(__dirname, '..', '..', 'assets', 'weather', 'icons', theme, `${icon}.png`));
		humid.src = await fs.readFileAsync(path.join(__dirname, '..', '..', 'assets', 'weather', 'icons', theme, 'humidity.png'));
		precip.src = await fs.readFileAsync(path.join(__dirname, '..', '..', 'assets', 'weather', 'icons', theme, 'precip.png'));
		/* pointer.src = await fs.readFileAsync(path.join(__dirname, '..', '..', 'assets', 'weather', 'icons', theme, 'pointer.png'));*/
		generate();

		return msg.channel.sendFile(canvas.toBuffer(), `${geocodelocation}.png`);
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
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'day.png');
		} else if (icon === 'clear-night' || icon === 'partly-cloudy-night') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'night.png');
		} else if (icon === 'rain') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'rain.png');
		} else if (icon === 'thunderstorm') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'thunderstorm.png');
		} else if (icon === 'snow' || icon === 'sleet' || icon === 'fog') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'snow.png');
		} else if (icon === 'wind' || icon === 'tornado') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'windy.png');
		} else if (icon === 'cloudy') {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'cloudy.png');
		} else {
			return path.join(__dirname, '..', '..', 'assets', 'weather', 'base', 'cloudy.png');
		}
	}
};
