const express = require("express");
const mongodb = require("mongodb");

const router = express.Router();
module.exports = router;

router.get("/", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const sessions = client.db("orienteering-race-project").collection("sessions");
    const list = await sessions.find({ class_id: mongodb.ObjectID(req.query.class_id) }).toArray();
    const clss = await client
      .db("orienteering-race-project")
      .collection("schools")
      .findOne({ classes: { $elemMatch: { _id: mongodb.ObjectID(req.query.class_id) } } });
    list.forEach((v) => {
      delete v.runs;
      delete v.geosJon;
      v.id = v._id;
    });
    let ret = {
      class_name: clss.classes.filter((c) => c._id == req.query.class_id)[0].name,
      class_id: mongodb.ObjectID(req.query.class_id),
      school_name: clss.name,
      school_id: clss._id,
      sessions: list,
    };
    res.send(ret);
  } catch (error) {
    console.log(error);
  } finally {
    client.close();
  }
});

// New session
router.post("/", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const sessions = client.db("orienteering-race-project").collection("sessions");
    const clss = await client
      .db("orienteering-race-project")
      .collection("schools")
      .findOne({ classes: { $elemMatch: { _id: mongodb.ObjectID(req.query.class_id) } } });
    const newSession = {
      school_name: clss.name,
      school_id: clss._id,
      class_id: mongodb.ObjectID(req.query.class_id),
      class_name: clss.classes.filter((c) => c._id == req.query.class_id)[0].name,
      session_name: req.body.session_name,
      _id: mongodb.ObjectID(),
      date: req.body.date,
      beacons: [],
	  runs: [],
	  isSelected: false
    };
    console.log("schoolname", newSession.school_name);
    console.log("classname", newSession.class_name);
    sessions.insertOne(newSession, (err, res) => {
      if (err) throw err;
      console.log("success");
      client.close();
    });
    res.send({ id: newSession._id });
  } catch (error) {
    console.log(error);
    client.close();
  }
});

// Get session
router.get("/:session_id", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const sessions = client.db("orienteering-race-project").collection("sessions");
    const schools = client.db("orienteering-race-project").collection("schools");
    const session = await sessions.findOne({ _id: mongodb.ObjectID(req.params.session_id) });
    const school = await schools.findOne({ classes: { $elemMatch: { _id: mongodb.ObjectID(session.class_id) } } });
	session.schoolId = school._id;
    res.send(session);
  } catch (error) {
    console.log(error);
  } finally {
    client.close();
  }
});

async function deleteSession(client, session_id) {
	const sessions = client.db("orienteering-race-project").collection("sessions");
    const schools = client.db("orienteering-race-project").collection("schools");
    await sessions.deleteOne({ _id: mongodb.ObjectID(session_id) });
}

//Delete session
router.delete("/:session_id", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await deleteSession(client, req.params.session_id)
    res.status(200).send();
  } catch (error) {
	console.log(error);
	res.status(500).send()
  } finally {
    client.close();
  }
});

// Edit beacon
router.put("/:session_id/beacons", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const sessions = client.db("orienteering-race-project").collection("sessions");
    const myquery = { _id: mongodb.ObjectID(req.params.session_id) };
    const data = {
      _id: req.body._id,
      id: req.body.id,
      name: "",
      coords: req.body.coords,
    };
    const action = { $set: { "beacons.$[beacon]": data } };
    const options = { arrayFilters: [{ "beacon._id": data._id }] };
    sessions.updateOne(myquery, action, options, (err, res) => {
      if (err) throw err;
      client.close();
    });
    res.status(200).send(data);
  } catch (error) {
    console.log(error);
    res.status(500).send();
    client.close();
  }
});

// new beacon
router.post("/:session_id/beacons", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const sessions = client.db("orienteering-race-project").collection("sessions");
    const myquery = { _id: mongodb.ObjectID(req.params.session_id) };
	const _id = Math.random().toString(36).slice(-5);
    const data = {
      _id: _id,
      id: req.body.id,
      name: "",
      coords: req.body.coords,
    };
    const action = { $push: { beacons: data } };
    sessions.updateOne(myquery, action, (err, res) => {
      if (err) throw err;
    });
    res.status(200).send(data);
  } catch (error) {
    console.log(error);
    res.status(500).send();
    client.close();
  }
});

// delete beacon
router.delete("/:session_id/beacons", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const sessions = client.db("orienteering-race-project").collection("sessions");
    const myquery = { _id: mongodb.ObjectID(req.params.session_id) };
    const data = { _id: req.body._id };
    const action = { $pull: { beacons: { _id: data._id } } };
    sessions.updateOne(myquery, action, (err, res) => {
      if (err) throw err;
      client.close();
    });
    res.status(200).send();
  } catch (error) {
    console.log(error);
    res.status(500).send();
    client.close();
  }
});
