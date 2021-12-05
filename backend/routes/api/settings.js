const express = require('express')
const { exec } = require('child_process')

const router = express.Router()
module.exports = router

router.get('/shutdown', (req, res) => {
	console.log('shutdown')
	if (process.env.NODE_ENV === "production")
		const cmd = "shutdown -h now";
	else
		const cmd = "echo 'shutdown'";
	exec(cmd, (error, stdout, stderr) => {
		// exec("sudo ls", (error, stdout, stderr) => {
		if (stderr) {
			console.log(`stderr: ${stderr}`);
			res.sendStatus(500)
			return;
		}
	});
})