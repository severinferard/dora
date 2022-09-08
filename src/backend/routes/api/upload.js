const express = require('express')
const mongodb = require('mongodb')
const { MONGO_HOST } = require('../../mongoconfig.js')
const {Logger} = require('../../logger')
const router = express.Router()
module.exports = router

router.get('/', async (req, res) => {
	res.send("test");
})

router.post('/', async (req, res) => {
  const client = await mongodb.MongoClient.connect(`mongodb://${MONGO_HOST}:27017/`, {
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
  res.sendStatus(200)
})
