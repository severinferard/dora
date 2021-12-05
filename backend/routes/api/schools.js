const express = require('express')
const mongodb = require('mongodb')
const classTool = require('./classes.js')

const router = express.Router()
module.exports = router

// Get all schools
router.get('/', async (req, res) => {
  const client = await mongodb.MongoClient.connect('mongodb://localhost:27017/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  try {
    const collection = client.db('orienteering-race-project').collection('schools')
	const sessions = client.db("orienteering-race-project").collection("sessions");
    const list = await collection.find({}).toArray()
    for (const school of list) {
		school.id = school._id 
		for (const clss of school.classes) {
			clss.school_name = school.name
			clss.sessions = await sessions.find({ class_id: mongodb.ObjectID(clss._id) }).toArray();
		}
	}
    res.send(list)
	console.log(list)
  } catch (error) {
    console.log(error)
  } finally {
    client.close()
  }
})

// Add new school
router.post('/', async (req, res) => {
  const client = await mongodb.MongoClient.connect('mongodb://localhost:27017/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  try {
    const collection = client.db('orienteering-race-project').collection('schools')
    const newSchool = {
      name: req.body.name,
      _id: new mongodb.ObjectID(),
	  city: req.body.city,
	  classes: []
    }
    collection.insertOne(newSchool, (err, re) => {
      if (err) throw err
      console.log('success')
      res.send({ id: newSchool._id })
      client.close()
    })
  } catch (error) {
    console.log(error)
    client.close()
  }
})

// Delete school
router.delete('/:school_id', async (req, res) => {
	console.log("delete")
	const client = await mongodb.MongoClient.connect('mongodb://localhost:27017/', {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	const collection = client.db('orienteering-race-project').collection('schools')
	const school = await collection.findOne({_id: mongodb.ObjectID(req.params.school_id)})
	await school.classes.forEach(cls => classTool.deleteClass(client, cls._id))
	collection.deleteOne({_id: mongodb.ObjectID(req.params.school_id)}, (err, re) => {
		client.close()
		if (err) {console.log(err); res.status(500).send();}
		else {res.status(200).send()}
		console.log("done")
	})
})
