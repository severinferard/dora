const winston = require('winston')
const expressWinston = require('express-winston');


const myFormat = winston.format.printf(info => {
	return `${info.timestamp} ${info.label} ${info.level}: ${info.message}`;
  });

const ExpressLogger = expressWinston.logger({
	transports: [
	  new winston.transports.Console({colorize: true})
	],
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.label({ label: '[app-server]' }),
		winston.format.timestamp(),
		winston.format.splat(),
	  myFormat
	),
	meta: false, // optional: control whether you want to log the meta data about the request (default to true)
	msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
	expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
	colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
	ignoreRoute: function (req, res) { return req.url.includes("atlas") || req.url.includes("static") } 
})

const Logger = winston.createLogger({
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.label({ label: '[DORA Server]' }),
		winston.format.timestamp(),
		winston.format.splat(),
	  myFormat
	),
	transports: [new winston.transports.Console()]
  }); 

module.exports = {ExpressLogger, Logger}