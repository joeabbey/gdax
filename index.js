const optionalRequire = require("optional-require")(require);
const GDAX = require('gdax');
const config = optionalRequire('./config');
const date = require('date-utils');

const sprintf = require("sprintf-js").sprintf
const blessed = require('blessed')
const contrib = require('blessed-contrib')

const apiURI = 'https://api.gdax.com';

var authenticatedClient = null;

if(config)
	authenticatedClient = new GDAX.AuthenticatedClient(config.apikey, config.base64secret, config.passphrase, apiURI)

const BTC_USD = 'BTC-USD';
const ETH_USD = 'ETH-USD';
const LTC_USD = 'LTC-USD';
const ETH_BTC = 'ETH-BTC';
const LTC_BTC = 'LTC-BTC';

const lineChartProduct = BTC_USD;

const USD_websocket = new GDAX.WebsocketClient([BTC_USD, ETH_USD, LTC_USD]);
const ETH_BTC_websocket = new GDAX.WebsocketClient([ETH_BTC]);
const LTC_BTC_websocket = new GDAX.WebsocketClient([LTC_BTC]);

//
// Build a nice grid
//

var screen = blessed.screen()
var grid = new contrib.grid({rows: 8, cols: 5, screen: screen})

var BTC_USD_log  = grid.set(0, 0, 3, 1, contrib.log, {label: "BTC-USD Trade History", tags: true})
var ETH_USD_log  = grid.set(0, 1, 3, 1, contrib.log, {label: "ETH-USD Trade History", tags: true})
var LTC_USD_log  = grid.set(0, 2, 3, 1, contrib.log, {label: "LTC-USD Trade History", tags: true})
var ETH_BTC_log  = grid.set(0, 3, 3, 1, contrib.log, {label: "ETH-BTC Trade History", tags: true})
var LTC_BTC_log  = grid.set(0, 4, 3, 1, contrib.log, {label: "LTC-BTC Trade History", tags: true})

var line = grid.set(3, 0, 5, 5, contrib.line, {label: "BTC-USD Price Chart", minY: 5500.0})

var currentPrice = {
	BTC_USD: 5500.0,
	ETH_USD: 300.0,
	LTC_USD: 60.0,
	ETH_BTC: 0.05,
	LTC_BTC: 0.01
}

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

		var logger;
		var color_begin = "{red-fg}";
		var color_end = "{/red-fg}";

		currentPrice[data.product_id] = parseFloat(data.price);

		if(data.side == "buy") {
			color_begin = "{green-fg}";
			color_end = "{/green-fg}";
		}

		if(data.product_id === 'BTC-USD')
			logger = BTC_USD_log

		if(data.product_id === 'ETH-USD')
			logger = ETH_USD_log

		if(data.product_id === 'LTC-USD')
			logger = LTC_USD_log

		logger.log(sprintf("%s %12.8f    %6.2f    %s %s", color_begin, parseFloat(data.size), parseFloat(data.price), when.toFormat("HH24:MI:SS"), color_end));
	}
}

// Stream all of the trades (that are filled)
const websocketDeltaCallback = (data) => {

	//Just care about what's filled for now
	if (!(data.type === 'match'))
		return;

	//Sometimes fills have no price /shrug
	if ("price" in data) {

		var when = new Date(data.time)

		currentPrice[data.product_id] = parseFloat(data.price);

		if(data.product_id === 'ETH-BTC')
			ETH_BTC_log.log(sprintf(" %8.6f - %8.6f = %8.6f %s", currentPrice[data.product_id] , currentPrice['ETH-USD'] / currentPrice['BTC-USD'], currentPrice[data.product_id] - (currentPrice['ETH-USD'] / currentPrice['BTC-USD']), when.toFormat("HH24:MI:SS")));

		if(data.product_id === 'LTC-BTC')
			LTC_BTC_log.log(sprintf(" %8.6f - %8.6f = %8.6f %s", currentPrice[data.product_id] , currentPrice['LTC-USD'] / currentPrice['BTC-USD'], currentPrice[data.product_id] - (currentPrice['LTC-USD'] / currentPrice['BTC-USD']), when.toFormat("HH24:MI:SS")));
    }
}

USD_websocket.on('message', websocketPriceCallback);

ETH_BTC_websocket.on('message', websocketDeltaCallback);
LTC_BTC_websocket.on('message', websocketDeltaCallback);



// Meanwhile let's periodically dispaly the current price in the graph
function updateChart() {
	tradeChart.y.shift()
	tradeChart.y.push(currentPrice['BTC-USD'])
	line.setData(tradeChart)
}

const dummycallback = (err, data) => {
	console.dir(JSON.parse(data.body))
}

setInterval( function() {
	updateChart();
	screen.render();
}, 60000);

