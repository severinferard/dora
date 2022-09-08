const express = require("express");
const mongodb = require("mongodb");
const {Logger} = require('../../logger')
const { MONGO_HOST } = require('../../mongoconfig.js')

const router = express.Router();
module.exports = router;

// Add new school
router.post("/", async (req, res) => {
  const client = await mongodb.MongoClient.connect(`mongodb://${MONGO_HOST}:27017/`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const collection = client.db("orienteering-race-project").collection("sessions");
    await collection.updateMany({}, { $set: { isSelected: false } });
    await collection.updateOne({ _id: mongodb.ObjectId(req.body.id) }, { $set: { isSelected: true } });
    res.status(200).send();
  } catch (error) {
	Logger.error(error);
	res.status(500).send();
  } finally {
	  client.close()
  }
});
