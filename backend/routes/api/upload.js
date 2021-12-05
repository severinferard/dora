const express = require('express')
const mongodb = require('mongodb')

const router = express.Router()
module.exports = router

router.get('/', async (req, res) => {
	console.log("get");
	res.send("test");
})

router.post('/', async (req, res) => {
	console.log("Received post on /api/upload")
	console.log(req.body);
  const client = await mongodb.MongoClient.connect('mongodb://localhost:27017/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  const sessions = client.db('orienteering-race-project').collection('sessions')
  const currentSession = await sessions.findOne({ isSelected: true })
  const rawData = req.body
  const obj = {
	_id: mongodb.ObjectID(),
    id: rawData.id,
    firmwareVersion: rawData.firmwareVersion,
    sampleRate: rawData.sampleRate,
    rawPositions: rawData.data.map(coord => [coord[1], coord[0], coord[2]]),
    comment: '',
	rating: null,
	date: new Date().toLocaleString('fr-FR')
  }
  sessions.updateOne({ _id: currentSession._id }, { $push: { runs: obj } })
  console.log("Added data to DB");
  console.log(currentSession._id, currentSession.session_name)
  res.sendStatus(200)
})
