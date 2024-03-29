/**
 * DORA Server entry point
 *
 * @summary DORA Server entry point
 * @author Séverin Férard
 *
 * Created at     : 2021-10-06 18:23:48 
 * Last modified  : 2021-12-07 16:55:23
 */

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
const {ExpressLogger, Logger} = require('./logger.js')

const proxy = require('express-http-proxy')

require('dotenv').config({path: path.join(__dirname , '/../.env')});

const APP_PORT = process.env.PORT || 5000;

const app = express()
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.text());
app.use(cors())

app.use(ExpressLogger);

app.use('/api/sessions',		require('./routes/api/sessions'))
app.use('/api/runs',			require('./routes/api/runs'))
app.use('/api/upload', 			require('./routes/api/upload'))
app.use('/api/teacher',			require('./routes/api/teacher'))
app.use('/api/schools',			require('./routes/api/schools'))
app.use('/api/classes',			require('./routes/api/classes').classes)
app.use('/api/student-summary',	require('./routes/api/studentSummary'))
app.use('/api/targetSession', 	require('./routes/api/targetSession'))
app.use('/api/excel',			require('./routes/api/excelCreator'))
app.use('/api/setTime',			require('./routes/api/setTime'))
app.use('/api/settings',		require('./routes/api/settings'))

app.use('/osm', proxy("http://osm"))


app.use(express.static(path.join(__dirname, '/public/')))
app.get(/.*/, (req, res) => {
	res.sendFile(path.join(__dirname, '/public/index.html'))
});

// Logger.info(`Atlases will be fetched from ${path.join(__dirname, ATLASES)}`)
app.listen(APP_PORT, () => Logger.info(`DORA is running on port ${APP_PORT}`));
