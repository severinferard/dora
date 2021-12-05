const express = require('express')
const { exec } = require('child_process')

const router = express.Router()
module.exports = router

router.get('/shutdown', (req, res) => {
	console.log('shutdown')
	exec("sudo shutdown -h now", (error, stdout, stderr) => {
		// exec("sudo ls", (error, stdout, stderr) => {
		if (stderr) {
			console.log(`stderr: ${stderr}`);
			res.sendStatus(500)
			return;
		}
	});
})