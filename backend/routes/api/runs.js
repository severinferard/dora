const express = require("express");
const mongodb = require("mongodb");
const GeoJsonLoader = require("../../GeoJsonLoader");
const { spawn } = require('child_process');

const router = express.Router();
module.exports = router;

function arraymove(arr, fromIndex, toIndex) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
}

// Get student data
router.get("/:session_id/:student_id", async (req, res) => {
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const sessions = client.db("orienteering-race-project").collection("sessions");
	const session = await sessions.findOne({_id: mongodb.ObjectID(req.params.session_id)});
	console.log('session', session.session_name)
	console.log('student_id', req.params.student_id)
    const run = session.runs.find((run) => run._id == req.params.student_id);
    run.class_name = session.class_name;
    run.class_id = session.class_id;
    run.school_name = session.school_name;
    run.school_id = session.school_id;
    run.session_name = session.session_name;
	run.session_date = session.date;
	
	const child = spawn("python3", [__dirname + "/../../analyse.py"])
	arg = {
		run: run,
		beacons: session.beacons
	}
	console.log(JSON.stringify(arg))
	child.stdin.write(JSON.stringify(arg))
	child.stdin.end();

	var stdoutChunks = [], stderrChunks = [];
	child.stdout.on('data', (data) => {
        stdoutChunks = stdoutChunks.concat(data);
    });
    child.stdout.on('end', () => {
        var stdoutContent = Buffer.concat(stdoutChunks).toString();
        const parsed = JSON.parse(stdoutContent)
		run.rawPositions = parsed.rawPositions
		run.speeds = parsed.speeds
		run.avgSpeed = parsed.avgSpeed
		run.beacons = parsed.beacons
		run.distance = parsed.distance
		run.time = parsed.time
		run.geoJson = GeoJsonLoader.createGeoJson(run);
		res.send(run);
    });
	// child.stderr.on('data', data => {
	// 	console.error(data.toString('utf-8'))
	// 	res.status(500).send()
	// })
  } catch (error) {
    console.log(error);
    res.status(500).send();
  } finally {
    client.close();
  }
});

// Store comment and rating
router.post("/:session_id/:student_id", async (req, res) => {
	console.log("body", req.body)
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
    const sessions = client.db("orienteering-race-project").collection("sessions");
    const myquery = { _id: mongodb.ObjectID(req.params.session_id) };
    const newvalues = {
      $set: {
        "runs.$[run].comment": req.body.comment,
        "runs.$[run].rating": req.body.rating,
		"runs.$[run].student": req.body.student,
      },
    };
    const options = { arrayFilters: [{ "run._id": mongodb.ObjectID(req.params.student_id) }] };
    await sessions.updateOne(myquery, newvalues, options);
    res.status(200).send();
  } catch (error) {
    res.status(500).send();
  } finally {
	client.close();
  }
});

// Delete run
router.delete("/:session_id/:student_id", async (req, res) => {
	console.log('std_id',req.params.student_id )
  const client = await mongodb.MongoClient.connect("mongodb://localhost:27017/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  try {
	  console.log('id to delete', req.params.student_id)
    const sessions = client.db("orienteering-race-project").collection("sessions");
    await sessions.updateOne({ _id: mongodb.ObjectID(req.params.session_id) }, { $pull: { runs: { _id: mongodb.ObjectID(req.params.student_id) } } })
    res.status(200).send();
  } catch (error) {
    res.status(500).send();
  } finally {
	client.close();
  }
});
