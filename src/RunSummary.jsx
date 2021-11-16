import React, { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import AppHeader from "./AppHeader";
import "./RunSummary.css";
import {
  EuiComboBox,
  EuiButton,
  EuiFormRow,
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
  EuiStat,
  EuiSpacer,
  EuiInMemoryTable,
  EuiLink,
  EuiHealth,
  EuiCard,
  EuiIcon,
  EuiLoadingSpinner,
  EuiTextArea,
  EuiImage,
  EuiRange,
} from "@elastic/eui";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, GeoJSON } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Rainbow from "rainbowvis.js";
import Plot from "react-plotly.js";
import { Hashicon } from "@emeraldpay/hashicon-react";

import smiley1 from "./assets/1F61E.svg";
import smiley2 from "./assets/1F601.svg";
import smiley3 from "./assets/1F604.svg";
import smiley4 from "./assets/1F610.svg";
import smiley5 from "./assets/1F972.svg";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const greenIcon = new L.Icon({
  iconRetinaUrl: require("./assets/markers/marker-icon-2x-green.png").default,
  iconUrl: require("./assets/markers/marker-icon-green.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconRetinaUrl: require("./assets/markers/marker-icon-2x-red.png").default,
  iconUrl: require("./assets/markers/marker-icon-red.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RunSummary(props) {
  const [data, setData] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [formatedTime, setFormatedTime] = useState();
  const [formatedAvgSpeed, setFormatedAvgSpeed] = useState();
  const [formatedDistance, setFormatedDistance] = useState();
  const [beaconsFound, setBeaconsFound] = useState();
  const [successRate, setSuccessRate] = useState();
  const [speedPlotData, setSpeedPlotData] = useState();
  const [speedPlotLayout, setSpeedPlotLayout] = useState();
  const [textAreaValue, setTextAreaValue] = useState();
  const [rangeValue, setRangeValue] = useState(0);
  //   const [rainbow, setRainbow] = useState();

  const query = useQuery();
  const history = useHistory();

  const smileyArray = [smiley1, smiley5, smiley4, smiley3, smiley2 ]

  const makeHeaderBreadcrumbs = (data) => {
    setBreadcrumbs([
      {
        text: data.school_name,
        onClick: (e) => {
          e.preventDefault();
          history.push("/dashboard");
        },
      },
      {
        text: data.class_name,
        onClick: (e) => {
          e.preventDefault();
          history.push("/dashboard");
        },
      },
      {
        text: data.id,
      },
    ]);
  };

  const fetchData = () => {
    fetch(`/api/runs/${query.get("session")}/${query.get("id")}`, { method: "GET" })
      .then((res) => res.json())
      .then((response) => {
        console.log("received data", response);
        setData(response);
        makeHeaderBreadcrumbs(response);
      });
  };

  const saveData = () => {
	fetch(`/api/runs/${query.get("session")}/${query.get("id")}`, {
		method: "POST",
		headers: {
		  Accept: "application/json",
		  "Content-Type": "application/json",
		},
		body: JSON.stringify({rating: rangeValue / 25, comment: textAreaValue}),
	  }).then((res) => {
		if (res.status == 200) {
		  console.log("data sent successfully")
		}
	  });
  }

  const formateTime = (time) => {
    const formated = (time < 60 ? "0" : Math.floor(time / 60)) + ":" + ((time % 60).toFixed() < 10 ? "0" : "") + (time % 60).toFixed();
    return (
      <>
        {" "}
        {formated} <span style={{ fontSize: "0.8em" }}>min</span>{" "}
      </>
    );
  };

  const formateAvgSpeed = (speed) => {
    return (
      <>
        {" "}
        {speed.toFixed(1)} <span style={{ fontSize: "0.8em" }}>km/h</span>{" "}
      </>
    );
  };

  const formateDistance = (dist) => {
    return (
      <>
        {" "}
        {dist.toFixed(0)} <span style={{ fontSize: "0.8em" }}>m</span>{" "}
      </>
    );
  };

  const formateBeconsFound = (beaconArray) => {
    const score = beaconArray.filter((b) => b.valided).length;
    const total = beaconArray.length;
    return (
      <>
        {" "}
        {score} <span style={{ fontSize: "0.8em" }}>/{total}</span>{" "}
      </>
    );
  };

  const formatedSuccessRate = (beaconArray) => {
    const score = beaconArray.filter((b) => b.valided).length;
    const total = beaconArray.length;
    return (
      <>
        {" "}
        {((score / total) * 100).toFixed(1)} <span style={{ fontSize: "0.8em" }}>%</span>{" "}
      </>
    );
  };

  const formatTimeToMin = (time) => {
    return (time < 60 ? "0" : Math.floor(time / 60)) + ":" + ((time % 60).toFixed() < 10 ? "0" : "") + (time % 60).toFixed();
  };

  const makeSpeedPlotData = (data) => {
    const x = data.rawPositions.map((p) => (p[2] - data.rawPositions[0][2]) / 1000);
    const y = data.speeds;
    return [
      {
        x: x,
        y: y,
        type: "scatter",
        mode: "lines",
        marker: { color: "#55b8ff" },
        line: { shape: "spline", smoothing: 0.8, width: 3 },
      },
    ];
  };

  const makeSpeedPlotLayout = (data) => {
    const maxHeight = Math.max(...data.speeds) * 1.2;
    console.log(maxHeight);
    console.log(data.beacons.map((b) => b.time));
    return {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      height: 140,
      width: 1100,
      margin: {
        l: 50,
        r: 50,
        b: 40,
        t: 0,
        pad: 4,
      },
      xaxis: {
        tickangle: -45,
        visible: false,
        showgrid: false,
      },
      yaxis: {
        showgrid: false,
        visible: false,
      },
      shapes: data.beacons
        .filter((b) => b.valided)
        .map((b) => {
          return {
            type: "line",
            x0: b.time,
            y0: 0,
            x1: b.time,
            y1: maxHeight,
            text: "test",
            line: {
              color: "#e533db",
              width: 0, // change to show vertical bars
              dash: "solid",
            },
          };
        }),
      annotations: data.beacons
        .filter((b) => b.valided)
        .map((b) => {
          return {
            x: b.time,
            y: 0,
            xref: "x",
            yref: "paper",
            text: "<b>" + b.id + "</b>",
            showarrow: false,
            yanchor: "top",
            font: {
              size: 15,
              weight: 1,
              color: "#000",
            },
          };
        }),
    };
  };

  const geoJSONStyleFunc = (feature) => {
    return {
      color: `#${rainbow.colourAt(feature.properties.speed)}`,
      weight: 5,
    };
  };

  const rainbow = new Rainbow();
  useEffect(() => {
    fetchData();
    rainbow.setNumberRange(0, 10);
    rainbow.setSpectrum("red", "orange", "green");
  }, []);

  useEffect(() => {
    if (data) {
      setFormatedTime(formateTime(data.time));
      setFormatedAvgSpeed(formateAvgSpeed(data.avgSpeed));
      setFormatedDistance(formateDistance(data.distance));
      setBeaconsFound(formateBeconsFound(data.beacons));
      setSuccessRate(formatedSuccessRate(data.beacons));
      setSpeedPlotData(makeSpeedPlotData(data));
      setSpeedPlotLayout(makeSpeedPlotLayout(data));
	  setRangeValue(data.rating * 25);
	  setTextAreaValue(data.comment);
    }
  }, [data]);

  const headerBreadcrumbs = [
    {
      text: "Dashbord",
      href: "#",
      onClick: (e) => {
        e.preventDefault();
      },
    },
  ];

  const options = [
    {
      label: "Titan",
      "data-test-subj": "titanOption",
    },
    {
      label: "Enceladus",
    },
    {
      label: "Mimas",
    },
    {
      label: "Dione",
    },
    {
      label: "Iapetus",
    },
    {
      label: "Phoebe",
    },
    {
      label: "Rhea",
      id: "42",
    },
    {
      label: "Pandora is one of Saturn's moons, named for a Titaness of Greek mythology",
    },
    {
      label: "Tethys",
    },
    {
      label: "Hyperion",
    },
  ];

  const BeaconTableColums = [
    {
      field: "id",
      name: "ID",
      sortable: true,
    },
    {
      field: "time",
      name: "Temps (absolu)",
      sortable: true,
      render: (val) => (val ? formatTimeToMin(val) : "-"),
    },
    {
      field: "lap",
      name: "Temps (relatif)",
      sortable: true,
      render: (val) => (val ? formatTimeToMin(val) : "-"),
    },
    {
      field: "avgSpeed",
      name: "Vitess moyenne (km/h)",
      sortable: true,
      render: (val) => (val ? val.toFixed(1) : "-"),
    },
    {
      field: "valided",
      name: "Validee",
      sortable: true,
      render: (bool) => {
        const color = bool ? "success" : "danger";
        const label = bool ? "Oui" : "Non";
        return <EuiHealth color={color}>{label}</EuiHealth>;
      },
    },
  ];

  const [student, setStudent] = useState(options[2]);
  const [selectedStudent, setSelectedStudent] = useState([]);
  const [mapPos, setMapPos] = useState([48.857231, 2.324309]);

  useEffect(() => {
    setStudent(selectedStudent[0]);
  }, [selectedStudent]);

  const onChange = (e) => {
    console.log("change", e);
    setSelectedStudent([e[0]]);
  };

  return (
    <div className="container">
      <div className="wrapper">
        <AppHeader breadcrumbs={breadcrumbs}></AppHeader>
      </div>
      <div className="bottom">
          <>
            <EuiSpacer size="m" />
            <EuiPanel paddingSize="m" style={{ width: "80%", height: "80vh", maxHeight: "80vh", margin: "auto" }}>
              {data !== null &&<MapContainer
                center={mapPos}
                zoom={13}
                style={{ height: "100%", width: "100%", margin: "auto", zIndex: "10" }}
                eventHandlers={{
                  click: () => {
                    console.log("click");
                  },
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="/atlas/{z}/{x}/{y}.png"
                  eventHandlers={{
                    move: (e) => {
                      setMapPos([e.latlng.lat, e.latlng.lng]);
                      console.log([e.latlng.lat, e.latlng.lng]);
                    },
                  }}
                />
                {data.beacons.map((b) => {
                  return (
                    <Marker position={b.coords} icon={b.valided ? greenIcon : redIcon} key={b.id}>
                      <Popup>{b.id}</Popup>
                    </Marker>
                  );
                })}
                <GeoJSON attribution="&copy; credits due..." data={data.geoJson} style={geoJSONStyleFunc} />
              </MapContainer>}
            </EuiPanel>
            <EuiSpacer size="m" />
            <EuiCard
              layout="horizontal"
              title="General"
              icon={<EuiIcon size="xl" type={"visLine"} />}
              style={{ width: "80%", margin: "auto" }}
            >
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiStat title={data === null ? "" : data.id} description="Movuino" titleColor="default" isLoading={data === null}/>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiStat title={formatedTime === undefined ? "" : formatedTime} description="Temps" titleColor="default" isLoading={formatedTime === undefined}/>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiStat title={formatedAvgSpeed === undefined ? "" :formatedAvgSpeed } description="Vitesse moyenne" titleColor="default" isLoading={formatedAvgSpeed === undefined}/>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiStat title={formatedDistance === undefined ? "" : formatedDistance} description="Distance parcourue" titleColor="default" isLoading={formatedDistance === undefined}/>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiStat title={beaconsFound === undefined ? "" : beaconsFound} description="Balises trouvees" titleColor="default" isLoading={beaconsFound === undefined}/>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiStat title={successRate === undefined ? "" : successRate} description="Reussite" titleColor="default" isLoading={successRate === undefined}/>
                </EuiFlexItem>
              </EuiFlexGroup>
              <Plot data={speedPlotData} layout={speedPlotLayout}/>
            </EuiCard>
            <EuiSpacer size="m" />
            <EuiCard
              layout="horizontal"
              title="Balises"
              icon={<EuiIcon size="xl" type={"visMapCoordinate"} />}
              style={{ width: "80%", margin: "auto" }}
            >
              <EuiInMemoryTable
                tableCaption="Balises"
				loading={data === null}
                items={data === null ? [] : data.beacons}
                columns={BeaconTableColums}
                pagination={true}
                sorting={{
                  sort: {
                    field: "id",
                    direction: "asc",
                  },
                }}
              />
            </EuiCard>
            <EuiSpacer size="m" />
            <EuiPanel paddingSize="m" style={{ width: "80%", margin: "auto" }}>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiFlexGroup style={{ maxWidth: 500, paddingInline: "10px" }}>
                    <EuiFlexItem grow={3}>
                      <div style={{ width: "50px", margin: "auto" }}>
                        <Hashicon value={student !== undefined ? student.label : null} />
                      </div>
                    </EuiFlexItem>
                    <EuiFlexItem grow={7} style={{ marginInline: 0 }}>
                      <EuiFormRow label="Eleve">
                        <EuiComboBox
                          singleSelection={{ asPlainText: true }}
                          options={options}
                          selectedOptions={selectedStudent}
                          onChange={(e) => onChange(e)}
                          isClearable={false}
                          placeholder="Chuck Norris"
                          onCreateOption={() => {}}
                        />
                      </EuiFormRow>
                    </EuiFlexItem>
                    {/* <EuiFlexItem>
                  <EuiFormRow hasEmptyLabelSpace>
                    <EuiButton size="s">Enregistrer</EuiButton>
                  </EuiFormRow>
                </EuiFlexItem> */}
                  </EuiFlexGroup>
                  <EuiFlexGroup style={{ maxWidth: 500 }}>
                    <EuiFlexItem grow={true}>
                      <EuiFormRow
                        label="Ressenti sur la course"
                       
                        style={{ width: "100%", maxWidth: "100%" }}
                      >
                        <EuiTextArea
                          placeholder="Placeholder text"
                          value={textAreaValue}
                          onChange={(val) => {
                            setTextAreaValue(val.target.value);
                          }}
                          style={{ width: "100%", maxWidth: "100%" }}
                        />
                      </EuiFormRow>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>

                <EuiFlexItem>
                  <EuiFlexItem>
                    <EuiFlexGroup style={{height: "100px", maxHeight: "100px"}}>
                      <EuiFlexItem style={{margin: "auto"}} grow={7}>
                        <EuiRange step={25} showTicks aria-label="An example of EuiRange with ticks" value={rangeValue} onChange={(e) => {setRangeValue(e.target.value)}}/>
                      </EuiFlexItem>
                      <EuiFlexItem style={{margin: "auto"}} grow={3}>
                        <EuiImage alt="Smiley" src={smileyArray[rangeValue / 25]} style={{width: "100px"}} />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <div style={{height: "100%", maxWidth: "100%", display: "flex", alignItems: "center"}} >
                      <EuiButton size="s" style={{margin: "auto"}} onClick={saveData}>Enregistrer</EuiButton>
					  </div>
                  </EuiFlexItem>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </>
      </div>
    </div>
  );
}

export default RunSummary;
