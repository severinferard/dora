import json
import sys
from time import sleep
import pandas as pd
from analyse import cleanup_data, evaluate_beacon, time, distance, average_speed
import io
import base64


def make_raw_dataframe(data):
    cols = {}
    max_col = max([len(cleanup_data(run["rawPositions"])) for run in data["runs"]])
    for run in data["runs"]:
        positions = cleanup_data(run["rawPositions"])
        prefix = run["_id"]
        cols[prefix + "_pos_x"] = [pos[0] for pos in positions]
        cols[prefix + "_pos_y"] = [pos[1] for pos in positions]
        cols[prefix + "_ts"] = [pos[2] for pos in positions]
        size = len(cleanup_data(run["rawPositions"]))
        for _ in range(max_col - size):
            cols[prefix + "_pos_x"].append(0)
            cols[prefix + "_pos_y"].append(0)
            cols[prefix + "_ts"].append(0)
    return (pd.DataFrame(data=cols))


def make_beacons_dataframe(data):
    header = ['élève', 'date', 'chrono',
              'balises validées', 'distance', 'vitesse']
    beacon_ids = [b["id"] for b in data["beacons"]]
    for id in beacon_ids:
        header = header + \
            [f"temps {id}", f"temps entre balises {id}",
                f"vitesse {id}", f"validée {id}"]
                
    df = pd.DataFrame(columns=header)

    for run in data["runs"]:
        positions = cleanup_data(run["rawPositions"])
        beacons = evaluate_beacon(positions, data["beacons"])
        line = {"élève": run["_id"], "date": run["date"], "balises validées": len([beacon for beacon in beacons if beacon["valided"]]), "chrono": time(
            positions), "distance": distance(positions), "vitesse": average_speed(positions)}
        
        for beacon in beacons:
            id = beacon["id"]
            line[f"temps {id}"] = beacon["time"]
            line[f"temps entre balises {id}"] = beacon["lap"]
            line[f"vitesse {id}"] = beacon["avgSpeed"]
            line[f"validée {id}"] = beacon["valided"]
        df = df.append(line, ignore_index=True)

    return (df)


def main():
    data = sys.stdin.read()
    json_data = json.loads(data)
    raw_dataframe = make_raw_dataframe(json_data)
    beacons_dataframe = make_beacons_dataframe(json_data)

    # Create file in memory and write it as base64 to stdout
    output = io.BytesIO()
    writer = pd.ExcelWriter(output,engine='xlsxwriter')
    raw_dataframe.to_excel(writer, sheet_name="Données brutes")
    beacons_dataframe.to_excel(writer, sheet_name="Balises")
    writer.save()
    output.seek(0)
    b = base64.b64encode(output.read()).decode()
    sys.stdout.write(b)
    sys.stdout.flush()


if __name__ == "__main__":
    main()