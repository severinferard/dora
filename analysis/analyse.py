import json
import sys
import math
from typing import List, Tuple, Dict

MILLIS_TO_SEC = 1000
MS_TO_KMH = 3.6

def haversine_distance(origin, destination):
	"""
	Calculate the Haversine distance.
	Martin Thoma

	Parameters
	----------
	origin : tuple of float
		(lat, long)
	destination : tuple of float
		(lat, long)

	Returns
	-------
	distance_in_m : float

	Examples
	--------
	>>> origin = (48.1372, 11.5756)  # Munich
	>>> destination = (52.5186, 13.4083)  # Berlin
	>>> round(distance(origin, destination), 1)
	504.2

	Author
	-------
	Martin Thoma
	https://stackoverflow.com/questions/19412462/getting-distance-between-two-points-based-on-latitude-longitude

	"""
	lat1, lon1 = origin
	lat2, lon2 = destination
	radius = 6371  # km

	dlat = math.radians(lat2 - lat1)
	dlon = math.radians(lon2 - lon1)
	a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
		 math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
		 math.sin(dlon / 2) * math.sin(dlon / 2))
	c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
	d = radius * c

	return (d * 1000) # return in m

def distances(positions: List[Tuple[float, float, float]]) -> List[float]:
	"""
	Calculate the distances from raw GPS coordinates and timestamps.

	Parameters
	----------
	positions : list of 3 floats tuples
		[(lat, long, timestamp, ...)]

	Returns
	-------
	distances : list of distances in meter
	"""
	return ([haversine_distance((positions[i][0], positions[i][1]), (positions[i + 1][0], positions[i + 1][1])) for i in range(len(positions) - 1)])


def speeds(positions: List[Tuple[float, float, float]]) -> List[float]:
	"""
	Calculate the speeds from raw GPS coordinates and timestamps.

	Parameters
	----------
	positions : list of 3 floats tuples
		[(lat, long, timestamp, ...)]

	Returns
	-------
	speeds_in_ms : list of speeds in km/h
	"""
	if not positions:
		return []
	timestamps = [position[2] for position in positions]
	delays_in_sec = [(timestamps[i + 1] - timestamps[i]) / MILLIS_TO_SEC for i in range(len(timestamps) - 1)]
	distances_in_m = distances(positions)
	speeds = [(distances_in_m[i] / delays_in_sec[i]) * MS_TO_KMH for i in range(len(distances_in_m))]
	return (speeds)

def distance(positions: List[Tuple[float, float, float]]) -> float:
	"""
	Calculate the overall distance from raw GPS coordinates and timestamps.

	Parameters
	----------
	positions : list of 3 floats tuples
		[(lat, long, timestamp, ...)]

	Returns
	-------
	total_distance : float representing the total distance in meters
	"""
	if not positions:
		return 0
	return (sum(distances(positions)))

def average_speed(positions: List[Tuple[float, float, float]]) -> float:
	"""
	Calculate the average speed from raw GPS coordinates and timestamps.

	Parameters
	----------
	positions : list of 3 floats tuples
		[(lat, long, timestamp, ...)]

	Returns
	-------
	average_speed : float representing the average speed in km/h
	"""
	if not positions:
		return 0
	speeds_list = speeds(positions)
	if not speeds_list:
		return (0)
	return (sum(speeds_list) / len(speeds_list))

def time(positions: List[Tuple[float, float, float]]) -> float:
	"""
	Calculate the overall run time from raw GPS coordinates and timestamps.

	Parameters
	----------
	positions : list of 3 floats tuples
		[(lat, long, timestamp, ...)]

	Returns
	-------
	time : float representing the total time in seconds
	"""
	if not positions:
		return 0
	return ((positions[-1][2] - positions[0][2]) / MILLIS_TO_SEC)

def best_time(positions_array: List[List[Tuple[float, float, float]]]) -> float:
	"""
	Calculate the best run time from raw GPS coordinates and timestamps.

	Parameters
	----------
	positions : list of lists of 3 floats tuples
		[[(lat, long, timestamp, ...)], ...]

	Returns
	-------
	time : float representing the best time in seconds
	"""
	times_without_null = [time(pos) for pos in positions_array if time(pos) > 0]
	return (min(times_without_null) if times_without_null else 0)

def best_distance(positions_array: List[List[Tuple[float, float, float]]]):
	"""
	Calculate the best (shortest) run distance from raw GPS coordinates and timestamps.

	Parameters
	----------
	positions : list of lists of 3 floats tuples
		[[(lat, long, timestamp, ...)], ...]

	Returns
	-------
	time : float representing the shortest distance in meters
	"""
	distances_without_null = [distance(pos) for pos in positions_array if pos]
	return (min(distances_without_null) if distances_without_null else 0)

def evaluate_beacon(positions: List[Tuple[float, float, float]], beacons: List[Dict], BEACON_RADIUS_M=30) -> List[Dict]:
	"""
	Check whether each beacon has beem reached and if so generate the according data.

	Parameters
	----------
	positions : list of 3 floats tuples
		[(lat, long, timestamp, ...)]
	beacons : list of dict representing each beacon
		[{"id": ..., "name": ..., "coords": [lat, long]}, ...]
	BEACON_RADIUS_M : detection radius for the beacons in meters
		int

	Returns
	-------
	beacons : List or dict representing each beacons passed as argument
	"""
	ret = [{
		"id": b["id"],
		"valided": False,
		"name": b["name"],
		"coords": b["coords"],
		"avgSpeed": None,
		"time": None,
		"timestamp": 0,
		"index": 0,
		"lap": None
	  } for b in beacons]

	for idx, pos in enumerate(positions):
		for beacon in ret:
			if beacon["valided"]:
				continue
			if haversine_distance((pos[1], pos[0]), (beacon["coords"][0], beacon["coords"][1])) < BEACON_RADIUS_M: # switched lat and long
				already_valided_beacons = [b for b in ret if b["time"] is not None]
				last_valided = sorted(already_valided_beacons, key=lambda x: x["time"], reverse=True)[-1] if len(already_valided_beacons) else None
				beacon["valided"] = True
				beacon["index"] = idx
				beacon["timestamp"] = pos[2]
				beacon["avgSpeed"] = average_speed(positions[last_valided["index"] if last_valided else 0 : beacon["index"]])
				beacon["time"] = (pos[2] - positions[0][2]) / MILLIS_TO_SEC
	# 			beacon["lap"] = beacon["time"] - last_valided["time"] if last_valided else beacon["time"]
	return (ret)

def remove_incorrect(positions, max_radius):
	ret = [positions[i] for i in range(len(positions) - 1) if haversine_distance((positions[i][0], positions[i][1]), (positions[i + 1][0], positions[i + 1][1])) < max_radius]
	return ret

def remove_duplicates(arr, dup_threshold):
	i = 0
	ret = []
	while i < len(arr) - dup_threshold:
		curr = arr[i]
		if curr[:2] == arr[i + 1][:2]:
			if [curr[:2] for _ in range(dup_threshold)] == [pos[:2] for pos in arr[i : i + dup_threshold]]:
				ret = ret + arr[i : i + dup_threshold]
				i += dup_threshold
			else:
				i += 1
		else:
			ret.append(curr)
			i += 1
	return ret

def cleanup_data(positions):
	pos = remove_incorrect(positions, 5)
	pos = remove_duplicates(pos, 5)
	return pos

def main():
	data = sys.stdin.read()
	json_data = json.loads(data)
	beacons = json_data["beacons"]
	run = json_data["run"]
	positions = cleanup_data(run["rawPositions"])[1:]
	obj = {
		"rawPositions": positions,
		"speeds": speeds(positions),
		"avgSpeed": average_speed(positions),
		"beacons": evaluate_beacon(positions, beacons),
		"time": time(positions),
		"distance": distance(positions),
		'bestTime': 0,
		'bestDistance': 0
		# "bestTime": best_time([run["rawPositions"] for run in runs]),
		# "bestDistance": best_distance([run["rawPositions"] for run in runs])
	}
	print(json.dumps(obj))
	sys.stdout.flush()

if __name__ == "__main__":
	main()