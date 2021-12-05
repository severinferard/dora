const express = require("express");
const mongodb = require("mongodb");

const router = express.Router();
module.exports = router;

// Add new school
router.post("/", async (req, res) => {
	console.log("targetSession")
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const collection = client.db("orienteering-race-project").collection("sessions");
    await collection.updateMany({}, { $set: { isSelected: false } });
    await collection.updateOne({ _id: mongodb.ObjectID(req.body.id) }, { $set: { isSelected: true } });
    res.status(200).send();
  } catch (error) {
	console.log(error);
	res.status(500).send();
  } finally {
	  client.close()
  }
});
