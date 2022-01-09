import json
import sys
import pandas as pd
from analyse import cleanup_data, evaluate_beacon, time, distance, average_speed



def make_raw_dataframe(data):
    cols = {}
    for run in data["runs"]:
        positions = cleanup_data(run["rawPositions"])
        prefix = run["_id"]
        cols[prefix + "_pos_x"] = [pos[0] for pos in positions]
        cols[prefix + "_pos_y"] = [pos[1] for pos in positions]
        cols[prefix + "_ts"] = [pos[2] for pos in positions]
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
    with pd.ExcelWriter("/tmp/excel.xlsx") as writer:
        raw_dataframe.to_excel(writer, sheet_name="Données brutes")
        beacons_dataframe.to_excel(writer, sheet_name="Balises")
    sys.stdout.flush()


if __name__ == "__main__":
    main()
