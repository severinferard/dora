const express = require("express");
const mongodb = require("mongodb");

const router = express.Router();
module.exports = {classes: router, deleteClass};

// Get Classes of school
router.get("/:school_id", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const collection = client.db("orienteering-race-project").collection("schools");
    const school = await collection.findOne({ _id: mongodb.ObjectID(req.params.school_id) });
    school.id = school._id;
    school.classes.forEach((cls) => {
      cls.id = cls._id;
    });
    res.send(school);
  } catch (error) {
	Logger.error(error);
  } finally {
    client.close();
  }
});

// Add new class
router.post("/:school_id", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const collection = client.db("orienteering-race-project").collection("schools");
    const newClass = {
      _id: mongodb.ObjectID(),
      name: req.body.name,
	  students: [],
    };
    await collection.updateOne({ _id: mongodb.ObjectID(req.params.school_id) }, { $push: { classes: newClass } });
    res.status(200).send({ id: newClass._id });
  } catch (error) {
    Logger.error(error);
  } finally {
	client.close();
  }
});

async function deleteClass(client, class_id) {
  const collection = client.db("orienteering-race-project").collection("schools");
  const sessions = client.db("orienteering-race-project").collection("sessions");
  await sessions.deleteOne({class_id: mongodb.ObjectID(class_id)})
  await collection.updateOne(
    {classes: {$elemMatch: {_id: mongodb.ObjectID(class_id)}}},
    { $pull: { classes: { _id: mongodb.ObjectID(class_id) } } }
  );
}

// Delete class
router.delete("/:class_id", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    await deleteClass(client, req.params.class_id);
    res.status(200).send();
  } catch (error) {
    Logger.error(error);
	res.status(500).send();
  } finally {
	client.close();
  }
});

async function addStudent(client, class_id, student) {
	const schools = client.db("orienteering-race-project").collection("schools");
	const myquery = {"classes._id": mongodb.ObjectID(class_id)}

	const _id = Math.random().toString(36).slice(-5);
    const data = {
      _id: _id,
      firstName: student.firstName,
	  lastName: student.lastName,
	  vma: student.vma,
	  avatar: (Math.random() * 20).toFixed()
    };
    const action = { $push: { 'classes.$.students': data } };
    await schools.updateOne(myquery, action)
	return data;
  }

  router.post("/:class_id/students", async (req, res) => {
	const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	  });
	const ret = await addStudent(client, req.params.class_id, req.body)
	res.status(200).send(ret);
	client.close();
  })

  async function editStudent(client, class_id, student) {
	const schools = client.db("orienteering-race-project").collection("schools");
	const myquery = {"classes._id": mongodb.ObjectID(class_id)}

	const students = (await schools.findOne(myquery)).classes.find(clss => clss._id == class_id).students
	students[students.findIndex(s => s._id === student._id)] = student

    const action = { $set: { 'classes.$.students': students } };
    await schools.updateOne(myquery, action);
	return student;
  }

  router.put("/:class_id/students", async (req, res) => {
	const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	  });
	const ret = await editStudent(client, req.params.class_id, req.body)
	res.status(200).send(ret);
	client.close();
  })

  async function deleteStudent(client, class_id, student) {
	const schools = client.db("orienteering-race-project").collection("schools");
	const myquery = {"classes._id": mongodb.ObjectID(class_id)}
	
	const students = (await schools.findOne(myquery)).classes.find(clss => clss._id == class_id).students
	students.splice(students.findIndex(s => s._id == student._id), 1)

    const action = { $set: { 'classes.$.students': students } };
    await schools.updateOne(myquery, action);
	return student;
  }

  router.delete("/:class_id/students", async (req, res) => {
	const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	  });
	const ret = await deleteStudent(client, req.params.class_id, req.body)
	res.status(200).send(ret);
	client.close();
  })

  async function getStudents(client, class_id) {
  const schools = client.db("orienteering-race-project").collection("schools");
  const myquery = {"classes._id": mongodb.ObjectID(class_id)}
  
  const students = (await schools.findOne(myquery)).classes.find(clss => clss._id == class_id).students
  return students;
}

  router.get("/:class_id/students", async (req, res) => {
	const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	  });
	const ret = await getStudents(client, req.params.class_id)
	res.status(200).send(ret);
	client.close();
  })
