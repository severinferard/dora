/**
 * DORA Server entry point
 *
 * @summary DORA Server entry point
 * @author Séverin Férard
 *
 * Created at     : 2021-10-06 18:23:48 
 * Last modified  : 2021-12-05 20:26:42
 */

const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')

require('dotenv').config({path: path.join(__dirname , '/../.env')});

const APP_PORT = process.env.PORT || 5000;

let ATLASES;
if (process.env.NODE_ENV === 'production')
	ATLASES = process.env.ATLASES_PATH_PROD;
else
	ATLASES = process.env.ATLASES_PATH_DEV;

const app = express()
app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.text());
app.use(cors())

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

app.use('/atlas',				express.static(path.join(__dirname, ATLASES, '/paris_18/')))
app.use('/atlas',				express.static(path.join(__dirname, ATLASES, '/altas/')))
app.use('/atlas',				express.static(path.join(__dirname, ATLASES, '/hauts_de_seine_17/')))
app.use('/atlas',				express.static(path.join(__dirname, ATLASES, '/parc_de_la_courneuve_18/')))
app.use('/atlas',				express.static(path.join(__dirname, ATLASES, '/parc_de_choisy_18/')))
app.use('/atlas',				express.static(path.join(__dirname, ATLASES, '/versailles_18/')))


app.use(express.static(path.join(__dirname, '/public/')))
app.get(/.*/, (req, res) => {
	res.sendFile(path.join(__dirname, '/public/index.html'))
});

console.log(`Atlases will be fetched from ${path.join(__dirname, ATLASES)}`)
app.listen(APP_PORT, () => console.log(`DORA is running on port ${APP_PORT}`));
