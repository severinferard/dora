const express = require('express')
const { exec } = require('child_process')

const router = express.Router()
module.exports = router

router.get('/shutdown', (req, res) => {
	Logger.warn();('Shuting Down')
	let cmd;
	if (process.env.NODE_ENV === "production")
		cmd = "shutdown -h now";
	else
		cmd = "echo 'shutdown'";
	exec(cmd, (error, stdout, stderr) => {
		// exec("sudo ls", (error, stdout, stderr) => {
		if (stderr) {
			Logger.error(`stderr: ${stderr}`);
			res.sendStatus(500)
			return;
		}
	});
})