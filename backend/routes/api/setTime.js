const express = require("express");
const { exec } = require('child_process')
const router = express.Router();
module.exports = router;
let isSet = false;

// Get student data
router.post("/", async (req, res) => {
//   if (!isSet)
// 	{
//     console.log(`sudo timedatectl set-time '${req.body.date} ${req.body.time}'`)
//     exec(`sudo timedatectl set-time '${req.body.date} ${req.body.time}'`, (error, stdout, stderr) => {
//       if (error) {
//         console.log(`error: ${error.message}`);
//         return;
//       }
//       if (stderr) {
//         console.log(`stderr: ${stderr}`);
//         return;
//       }
//       console.log(`stdout: ${stdout}`);
//       isSet = true;
//     });
//  }
});
