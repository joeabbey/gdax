const GDAX = require('gdax');
const config = require('./config');

const sprintf = require("sprintf-js").sprintf
const blessed = require('blessed')
const contrib = require('blessed-contrib')

const apiURI = 'https://api.gdax.com';
const authenticatedClient = new GDAX.AuthenticatedClient(config.apikey, config.base64secret, config.passphrase, apiURI)

const BTC_USD = 'BTC-USD';
const ETH_USD = 'ETH-USD';
const LTC_USD = 'LTC-USD';

const BTC_websocket = new GDAX.WebsocketClient([BTC_USD]);
const ETH_websocket = new GDAX.WebsocketClient([ETH_USD]);
const LTC_websocket = new GDAX.WebsocketClient([LTC_USD]);

//
// Build a nice grid 8x1 (maybe find a better geometry?)
//

var screen = blessed.screen()
var grid = new contrib.grid({rows: 8, cols: 3, screen: screen})

var BTClog  = grid.set(0, 0, 3, 1, contrib.log, {label: "BTC-USD Trade History"})
var ETHlog  = grid.set(0, 1, 3, 1, contrib.log, {label: "ETH-USD Trade History"})
var LTClog  = grid.set(0, 2, 3, 1, contrib.log, {label: "LTC-USD Trade History"})

var line = grid.set(3, 0, 5, 3, contrib.line, {label: "LTC-USD Price Chart"})
var current_price = 59.0;

var tradeChart = {
	title: 'LTC-USD trade chart',
	style: {line: 'red'},
	x: Array(100),
	y: Array(100).fill(59.0)
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
const websocketCallback = (data) => {

	//Just care about what's filled for now
	if (!(data.type === 'match'))
		return;

	//Sometimes fills have no price /shrug
	if ("price" in data) {

		if(data.product_id === 'BTC-USD')
			BTClog.log(sprintf("BTC-USD: %s - %s", parseFloat(data.price).toFixed(2), data.size));

		if(data.product_id === 'ETH-USD')
			ETHlog.log(sprintf("ETH-USD: %s - %s", parseFloat(data.price).toFixed(2), data.size));

		if(data.product_id === 'LTC-USD') {
			current_price = parseFloat(data.price).toFixed(2);
			LTClog.log(sprintf("LTC-USD: %s - %s", current_price, data.size));
		}
	}
}

BTC_websocket.on('message', websocketCallback);
ETH_websocket.on('message', websocketCallback);
LTC_websocket.on('message', websocketCallback);



// Meanwhile let's periodically dispaly the current price in the graph
function updateChart() {
	tradeChart.y.shift()
	tradeChart.y.push(parseFloat(current_price))
	line.setData(tradeChart)
}

setInterval( function() {
	updateChart();
	screen.render();
}, 5000);

