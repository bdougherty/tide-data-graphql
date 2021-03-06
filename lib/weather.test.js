import { join } from 'path';
import test from 'ava';
import nock from 'nock';
import {
	bearingToCardinalDirection,
	getUvIndexRisk,
	getUvIndexColor,
	fetchWeatherForecast
} from './weather';

function bearing(t, input, expected) {
	t.is(bearingToCardinalDirection(input), expected);
}

bearing.title = (providedTitle, input, expected) => `Properly converts bearing ${input} to ${expected}`;

test(bearing, 0, 'N');
test(bearing, 22.5, 'NNE');
test(bearing, 45, 'NE');
test(bearing, 67.5, 'ENE');
test(bearing, 90, 'E');
test(bearing, 112.5, 'ESE');
test(bearing, 135, 'SE');
test(bearing, 157.5, 'SSE');
test(bearing, 180, 'S');
test(bearing, 202.5, 'SSW');
test(bearing, 225, 'SW');
test(bearing, 247.5, 'WSW');
test(bearing, 270, 'W');
test(bearing, 292.5, 'WNW');
test(bearing, 315, 'NW');
test(bearing, 337.5, 'NNW');
test(bearing, 360, 'N');

function uvIndexRisk(t, input, expected) {
	t.is(getUvIndexRisk(input), expected);
}

uvIndexRisk.title = (providedTitle, input, expected) => `Properly returns ${expected} for UV Index ${input}`;

test(uvIndexRisk, 0, 'low');
test(uvIndexRisk, 1, 'low');
test(uvIndexRisk, 2, 'low');
test(uvIndexRisk, 2.9, 'low');
test(uvIndexRisk, 3, 'moderate');
test(uvIndexRisk, 4, 'moderate');
test(uvIndexRisk, 5, 'moderate');
test(uvIndexRisk, 5.9, 'moderate');
test(uvIndexRisk, 6, 'high');
test(uvIndexRisk, 7, 'high');
test(uvIndexRisk, 7.9, 'high');
test(uvIndexRisk, 8, 'veryhigh');
test(uvIndexRisk, 9, 'veryhigh');
test(uvIndexRisk, 10, 'veryhigh');
test(uvIndexRisk, 10.9, 'veryhigh');
test(uvIndexRisk, 11, 'extreme');
test(uvIndexRisk, 12, 'extreme');

function uvIndexColor(t, input, expected) {
	t.is(getUvIndexColor(input), expected);
}

uvIndexColor.title = (providedTitle, input, expected) => `Properly returns color ${expected} for UV Index ${input}`;

test(uvIndexColor, 0, 'green');
test(uvIndexColor, 1, 'green');
test(uvIndexColor, 2, 'green');
test(uvIndexColor, 2.9, 'green');
test(uvIndexColor, 3, 'yellow');
test(uvIndexColor, 4, 'yellow');
test(uvIndexColor, 5, 'yellow');
test(uvIndexColor, 5.9, 'yellow');
test(uvIndexColor, 6, 'orange');
test(uvIndexColor, 7, 'orange');
test(uvIndexColor, 7.9, 'orange');
test(uvIndexColor, 8, 'red');
test(uvIndexColor, 9, 'red');
test(uvIndexColor, 10, 'red');
test(uvIndexColor, 10.9, 'red');
test(uvIndexColor, 11, 'violet');
test(uvIndexColor, 12, 'violet');

const lat = 39.34;
const lon = -74.47;

test('fetchWeatherForecast with no api key', async (t) => {
	process.env.DARK_SKY_API_KEY = '';
	t.deepEqual(await fetchWeatherForecast({ lat, lon }), {});
});

test('fetches dark sky weather forecast', async (t) => {
	process.env.DARK_SKY_API_KEY = 'KEY';

	const fixture = join(__dirname, '..', 'fixtures', 'darksky.json');
	nock('https://api.darksky.net')
		.get(`/forecast/KEY/${lat},${lon}`)
		.query({
			units: 'auto',
			exclude: 'minutely, daily'
		})
		.replyWithFile(200, fixture, {
			'Content-Type': 'application/json; charset=utf-8'
		});

	const forecast = await fetchWeatherForecast({ lat, lon });
	t.is(forecast.latitude, lat);
	t.is(forecast.longitude, lon);
});

test('fetches extended hourly forecast', async (t) => {
	process.env.DARK_SKY_API_KEY = 'KEY';

	const fixture = join(__dirname, '..', 'fixtures', 'darksky.json');
	nock('https://api.darksky.net')
		.get(`/forecast/KEY/${lat},${lon}`)
		.query({
			units: 'auto',
			exclude: 'minutely, daily',
			extend: 'hourly'
		})
		.replyWithFile(200, fixture, {
			'Content-Type': 'application/json; charset=utf-8'
		});

	await t.notThrowsAsync(async () => {
		await fetchWeatherForecast({ lat, lon }, {
			extendedHourly: true
		});
	}, 'Didn’t call expected API endpoint.');
});

test('fetches with specified units', async (t) => {
	process.env.DARK_SKY_API_KEY = 'KEY';

	const fixture = join(__dirname, '..', 'fixtures', 'darksky.json');
	nock('https://api.darksky.net')
		.get(`/forecast/KEY/${lat},${lon}`)
		.query({
			units: 'us',
			exclude: 'minutely, daily'
		})
		.replyWithFile(200, fixture, {
			'Content-Type': 'application/json; charset=utf-8'
		});

	await t.notThrowsAsync(async () => {
		await fetchWeatherForecast({ lat, lon }, {
			units: 'us'
		});
	}, 'Didn’t call expected API endpoint.');
});
