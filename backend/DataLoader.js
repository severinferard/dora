/**
 * This file defines the DataLoader class
 *
 * @summary This file defines the DataLoader class
 * @author Séverin Férard
 *
 * Created at     : 2021-10-06 18:25:25 
 * Last modified  : 2021-10-14 13:06:20
 */


const turfDistance = require('turf-distance')

class DataLoader {
	
  static getGeoJsonPointsFromCoords (coords) {
    return coords.map((coord) => {
      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: coord
        }
      }
    })
  }

  // km/h
  static getSpeedFromPoints (points, sampleRate) {
    return points.map((point, index) => {
      if (index === 0) return 0
      return turfDistance(point, points[index - 1]) / ((point[2] - points[index - 1][2]) / 3600000)
    })
  }

  //m
  static getDistancesFromPoints (points, sampleRate) {
    return points.map((point, index) => {
      if (index === 0) return 0
      return turfDistance(point, points[index - 1]) * 1000
    })
  }

  //m
  static getDistanceFromPoints (points) {
    const dists = points.map((point, index) => {
      if (index === 0) return 0
      return turfDistance(point, points[index - 1]) * 1000
    })
    if (!dists.length)
        return []
    return dists.reduce((a, b) => a + b)
  }

  //km/h
  static getAverageSpeed (speeds) {
	  const rectifiedSpeeds = [...speeds]
		for (let i = 0; i < rectifiedSpeeds.length; i++) {
			if (i < 2) continue
			if (rectifiedSpeeds[i] === 0)
			rectifiedSpeeds[i] = rectifiedSpeeds[i - 1]
		}
      if (!rectifiedSpeeds.length)
          return -1;
    return speeds.reduce((a, b) => a + b) / rectifiedSpeeds.length
  }

  static getLastValidedBeacon (beacons) {
    if (beacons.filter((b) => b.valided).length === 0) return 0
    return beacons.filter((b) => b.valided).sort((x, y) => x.time - y.time)[beacons.filter((b) => b.valided).length - 1]
  }

  static evaluateBeacons (points, beacons, beaconRange, speeds, sampleRate) {
    const mybeacons = beacons.map((b) => {
      return {
        id: b.id,
        valided: false,
        name: b.name,
        coords: b.coords,
        avgSpeed: null,
		time: null,
		timestamp: 0,
		index: 0,
        lap: null
      }
    })
    points.forEach((point, pi) => {
      mybeacons.forEach((beacon) => {
        if (!beacon.valided && turfDistance(point, beacon.coords) * 1000 < beaconRange) {
		  const lastValided = DataLoader.getLastValidedBeacon(mybeacons)
		  console.log("lastValided", lastValided)
          const _speeds = speeds.slice(lastValided.index || 0, pi + 1)
          beacon.avgSpeed = _speeds.reduce((a, b) => a + b) / _speeds.length
          beacon.distance = DataLoader.getDistancesFromPoints(points, sampleRate).slice(lastValided.index || 0, pi + 1).reduce((a, b) => a + b)
          beacon.valided = true
		  beacon.time = (point[2] - points[0][2]) / 1000
		  beacon.timestamp = point[2]
		  beacon.lap = beacon.time - lastValided.time || beacon.time
		  console.log('pi', pi)
		  beacon.index = pi
		  console.log('current', beacon)
        }
      })
    })
    return mybeacons
  }

  static getTime (points) {
	//   console.log(points);
	//   console.log(points[points.length - 1][2],      points[0][2]      )
	//   console.log((points[points.length - 1][2] - points[0][2]) / 1000)
    return (points[points.length - 1][2] - points[0][2]) / 1000
  }

  static getBeaconSuccess (session, beaconID) {
    let count = 0
    session.runs.forEach((run) => {
      try {
        if (run.beacons.filter((beacon) => beacon.id === beaconID)[0].valided) {
          count++
        }
      } catch (error) {}
    })
    return (count / session.runs.length) * 100
  }
}

module.exports = DataLoader
