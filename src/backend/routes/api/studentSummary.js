const express = require('express')
const mongodb = require('mongodb')
const GeoJsonLoader = require('../../GeoJsonLoader')
const {Logger} = require('../../logger')
const { spawn } = require('child_process')
const { MONGO_HOST } = require('../../mongoconfig.js')

const router = express.Router()
module.exports = router

router.get('/:student_id', async (req, res) => {
  const client = await mongodb.MongoClient.connect(
    `mongodb://${MONGO_HOST}:27017/`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  try {
    const school = await client
      .db('orienteering-race-project')
      .collection('schools')
      .findOne({
        classes: {
          $elemMatch: {
            students: { $elemMatch: { _id: req.params.student_id } }
          }
        }
      })
	  

    const clss = await school.classes.find(c =>
      c.students.find(s => s._id == req.params.student_id)
    )

	const student = clss.students.find(s => s._id == req.params.student_id)

    const sessions_ran = await client
      .db('orienteering-race-project')
      .collection('sessions')
      .find({ runs: { $elemMatch: { student: req.params.student_id } } })
      .toArray()
    const runs = sessions_ran.map(sess =>
      sess.runs.find(run => run.student == req.params.student_id)
    )

    for (const session of sessions_ran) {
      const child = spawn('python3', [__dirname + '/../../analyse.py'])
      const run = session.runs.find(r => r.student == req.params.student_id)
      const arg = { run: run, beacons: session.beacons }

      child.stdin.write(JSON.stringify(arg))
      child.stdin.end()
      var stdoutChunks = [],
        stderrChunks = []
      child.stdout.on('data', data => {
        stdoutChunks = stdoutChunks.concat(data)
      })

      child.stderr.on('message', data => {
        Logger.error(data)
      })

      await new Promise((resolve, reject) => {
        child.stdout.on('end', () => {
          var stdoutContent = Buffer.concat(stdoutChunks).toString()
          const parsed = JSON.parse(stdoutContent)
          run.rawPositions = parsed.rawPositions
          run.speeds = parsed.speeds
          run.avgSpeed = parsed.avgSpeed
          run.beacons = parsed.beacons
          run.distance = parsed.distance
          run.time = parsed.time
		  run.session_name = session.session_name
          // run.geoJson = GeoJsonLoader.createGeoJson(run);
          // run.student = students.find(stud => stud._id == run.student)
          resolve()
        })
      })
    }
    res.send({
      class_name: clss.name,
      class_id: clss._id,
      school_name: school.name,
      school_id: school._id,
      runs: runs,
	  student: student
    })
  } catch (error) {
    Logger.error(error)
  } finally {
    client.close()
  }
})
