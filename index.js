const optionalRequire = require("optional-require")(require);
const GDAX = require('gdax');
const config = optionalRequire('./config');
const date = require('date-utils');

const sprintf = require("sprintf-js").sprintf
const blessed = require('blessed')
const contrib = require('blessed-contrib')

const apiURI = 'https://api.gdax.com';

const currencies = ['BTC-USD', 'ETH-USD', 'LTC-USD', 'ETH-BTC', 'LTC-BTC']
var authenticatedClient = null;

//if(config) {
//	authenticatedClient = new GDAX.AuthenticatedClient(config.apikey, config.base64secret, config.passphrase, apiURI)

const websocket = new GDAX.WebsocketClient(currencies);

var screen = blessed.screen()
var grid = new contrib.grid({rows: 8, cols: 5, screen: screen})

var currencyMap = {};

for (var i = 0, len = currencies.length; i < len; i++) {

	//Instantiate a currency entry
	currencyMap[currencies[i]] = {
		currentPrice: 1.0,
		logger: null
	}

	//Instantiate the logger
	currencyMap[currencies[i]].logger =
		grid.set(0, i, 3, 1, contrib.log, {
			label: sprintf("%s Trade History", currencies[i]),
			tags: true
		})
}

const lineChartProduct = 'BTC-USD';
var line = grid.set(3, 0, 5, 5, contrib.line, {label: "BTC-USD Price Chart", minY: 5500.0})
var tradeChart = {
	title: 'BTC-USD trade chart',
	style: {line: 'red'},
	x: Array(100),
	y: Array(100).fill(5500.0)
}

//Fill up the X-axis with bullshit
for (var i = 0; i < 100; i++ ) {
	tradeChart.x[i] = String(i);
}

//Provide a way to get out
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
	return process.exit(0);
});
screen.render()

// Stream all of the trades (that are filled)
const websocketPriceCallback = (data) => {

	//Just care about what's filled for now
	if (!(data.type === 'match'))
		return;

	//Sometimes fills have no price /shrug
	if ("price" in data) {

		var when = new Date(data.time)
		var logger = currencyMap[data.product_id].logger;
		var color_begin = "{green-fg}";
		var color_end = "{/green-fg}";

		currencyMap[data.product_id].currentPrice = parseFloat(data.price);

		if(data.side == "buy") {
			color_begin = "{red-fg}";
			color_end = "{/red-fg}";
		}

		if(data.product_id === 'ETH-BTC') {
			var eth_price = currencyMap['ETH-USD'].currentPrice;
			var btc_price = currencyMap['BTC-USD'].currentPrice;
			var eth_btc   = currencyMap['ETH-BTC'].currentPrice;
			logger.log(sprintf("%s%8.6f - %8.6f = %8.6f %s%s", color_begin, eth_btc, eth_price / btc_price, eth_btc - (eth_price / btc_price), when.toFormat("HH24:MI:SS"), color_end));
		}
		else if (data.product_id === 'LTC-BTC') {
			var ltc_price = currencyMap['LTC-USD'].currentPrice;
			var btc_price = currencyMap['BTC-USD'].currentPrice;
			var ltc_btc   = currencyMap['LTC-BTC'].currentPrice;
			logger.log(sprintf("%s%8.6f - %8.6f = %8.6f %s%s", color_begin, ltc_btc, ltc_price / btc_price, ltc_btc - (ltc_price / btc_price), when.toFormat("HH24:MI:SS"), color_end));
		}
		else
			logger.log(sprintf("%s %12.8f    %6.2f    %s %s", color_begin, parseFloat(data.size), parseFloat(data.price), when.toFormat("HH24:MI:SS"), color_end));
	}
}

websocket.on('message', websocketPriceCallback);

// Meanwhile let's periodically dispaly the current price in the graph
function updateChart() {
	tradeChart.y.shift()
	tradeChart.y.push(currencyMap['BTC-USD'].currentPrice)
	line.setData(tradeChart)
}

const dummycallback = (err, data) => {
	console.dir(JSON.parse(data.body))
}

setInterval( function() {
	updateChart();
	screen.render();
}, 60000);

