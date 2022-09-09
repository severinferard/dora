import { useState, useEffect, useRef, useMemo } from "react";
import {
  PageHeader,
  Descriptions,
  Row,
  Col,
  Empty,
  Card,
  Table,
  Tabs,
} from "antd";

import { MapContainer, TileLayer, Marker, Popup, FeatureGroup, GeoJSON } from "react-leaflet";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import L from "leaflet";
import { useParams } from "react-router-dom";
import "./SessionSummary.css";

const SATELLITE_MAP_URL = "/osm/tile/{z}/{x}/{y}.png";

const blueIcon = new L.Icon({
  iconRetinaUrl: require("../assets/markers/marker-icon-2x-blue.png").default,
  iconUrl: require("../assets/markers/marker-icon-blue.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const colorArray = [
  "#FF6633",
  "#FFB399",
  "#FF33FF",
  "#FFFF99",
  "#00B3E6",
  "#E6B333",
  "#3366E6",
  "#999966",
  "#99FF99",
  "#B34D4D",
  "#80B300",
  "#809900",
  "#E6B3B3",
  "#6680B3",
  "#66991A",
  "#FF99E6",
  "#CCFF1A",
  "#FF1A66",
  "#E6331A",
  "#33FFCC",
  "#66994D",
  "#B366CC",
  "#4D8000",
  "#B33300",
  "#CC80CC",
  "#66664D",
  "#991AFF",
  "#E666FF",
  "#4DB3FF",
  "#1AB399",
  "#E666B3",
  "#33991A",
  "#CC9999",
  "#B3B31A",
  "#00E680",
  "#4D8066",
  "#809980",
  "#E6FF80",
  "#1AFF33",
  "#999933",
  "#FF3380",
  "#CCCC00",
  "#66E64D",
  "#4D80CC",
  "#9900B3",
  "#E64D66",
  "#4DB380",
  "#FF4D4D",
  "#99E6E6",
  "#6666FF",
];

const SessionSummary = (props) => {
  const { session_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState();
  const [map, setMap] = useState();
  const featureGroupRef = useRef();
  const mapWrapperRef = useRef();
  const [averages, setAverages] = useState({});
  const tableColumns = useMemo(() => {
    return [
      {
        title: "Élève",
        dataIndex: "student",
        key: "student",
        render: (stud) => (stud !== undefined ? `${stud.firstName} ${stud.lastName}` : "-"),
      },
      {
        title: "Movuino",
        dataIndex: "id",
        key: "id",
      },
      {
        title: "Temps",
        dataIndex: "time",
        key: "time",
        render: (time) => (time !== null ? formatTime(time) : "-"),
      },
      {
        title: "Distance (m)",
        dataIndex: "distance",
        key: "distance",
        render: (dist) => dist.toFixed(0),
      },
      {
        title: "Vitesse (km/h)",
        dataIndex: "avgSpeed",
        key: "avgSpeed",
        render: (speed) => speed.toFixed(1),
      },
      {
        title: "Balises",
        dataIndex: "beacons",
        key: "beacons",
        render: (beacons) => beacons.filter((b) => b.valided).length,
      },
    ];
  }, []);

  const loadData = () => {
    fetch(`/api/teacher/${session_id}`, { method: "GET" })
      .then((res) => res.json())
      .then((response) => {
        console.log("received data", response);
        response.colorMap = new Map(response.runs.map((run) => [run.id, colorArray[Math.floor(Math.random() * colorArray.length)]]));
        setData(response);
        setLoading(false);
		setAverages({
			beacons: response.runs.map(run => run.beacons.filter(b => b.valided).length).reduce((a, b) => a + b) / response.runs.length,
			time: response.runs.map(run => run.time / 60).reduce((a, b) => a + b) / response.runs.length,
			distance: response.runs.map(run => run.distance).reduce((a, b) => a + b) / response.runs.length,
			speed: response.runs.map(run => run.avgSpeed).reduce((a, b) => a + b) / response.runs.length
		})
        console.log(response);
      });
  };

  useEffect(() => {
    loadData();
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (time) => {
    const formated = (time < 60 ? "0" : Math.floor(time / 60)) + ":" + ((time % 60).toFixed() < 10 ? "0" : "") + (time % 60).toFixed();
    return formated;
  };

  const geoJSONStyleFunc = (feature) => {
    return {
      color: data.colorMap.get(feature.properties.id),
    }
  };

  const getFullName = (student) => {
    return `${student.firstName} ${student.lastName}`;
  };

  useEffect(() => {
    if (!map || !data) return;
    if (data.beacons.length || data.rawPositions.length) map.fitBounds(featureGroupRef.current.getBounds(), { animate: false });
  }, [map, data]);

  return (
    <div className="run-page-wrapper">
      {!loading && (
        <div className="run-page-container">
          <PageHeader onBack={() => window.history.back()} title={data.session_name} subTitle="résumé">
            <Descriptions size="small" column={3}>
              <Descriptions.Item label="Séance">{data.session_name}</Descriptions.Item>
              <Descriptions.Item label="Classe">{data.class_name}</Descriptions.Item>
              <Descriptions.Item label="Date">{data.date}</Descriptions.Item>
            </Descriptions>
          </PageHeader>
          <div id="map-wrapper" ref={mapWrapperRef}>
            <MapContainer zoomControl={false} center={[0, 0]} zoom={13} style={{ height: "100%", width: "100%" }} whenCreated={setMap}>
              <TileLayer url={SATELLITE_MAP_URL}></TileLayer>
              <FeatureGroup ref={featureGroupRef}>
                {data.beacons.map((b) => {
                  return (
                    <Marker position={b.coords} key={b._id} icon={blueIcon}>
                      <Popup>{b.id}</Popup>
                    </Marker>
                  );
                })}
                <GeoJSON attribution="&copy; credits due..." data={data.geoJson} style={geoJSONStyleFunc} />
              </FeatureGroup>
            </MapContainer>
          </div>
          <Row style={{ width: "100%", height: 400, marginTop: 10, maxHeight: 500 }}>
            <Col span={24} style={{ height: "100%" }}>
              <Card id="beacon-graph" title="Balises" size="small">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.beacons.map((b) => ({ name: b.id, success: b.success }))}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 30,
                    }}
                    maxBarSize={60}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" fill="#8884d8" name="Taux de réussite (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
          <Row style={{ width: "100%", height: 400, marginTop: 10, maxHeight: 500 }}>
            <Col span={24} style={{ height: "100%" }}>
              <Card id="run-table" title="Courses" size="small">
                <Table
                  className="fixed-header-full-height-table"
                  columns={tableColumns}
                  dataSource={data.runs}
                  size="small"
                  pagination={false}
                  scroll={{ y: "100%" }}
                  locale={{
                    emptyText: <Empty description="Aucune course enregistrée"></Empty>,
                  }}
                  rowKey={(record) => record.id}
                />
              </Card>
            </Col>
          </Row>
          <Row style={{ width: "100%", height: 400, marginTop: 10, maxHeight: 500 }}>
            <Col span={24} style={{ height: "100%" }}>
              <Card id="run-graph" title="Courses" size="small">
                <Tabs defaultActiveKey="1" onChange={() => {}}>
                  <Tabs.TabPane tab="Balises" key="1">
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.runs.map((run) => ({
                            name: run.student !== undefined ? getFullName(run.student) : run.id,
                            beacons: run.beacons.filter((b) => b.valided).length,
                          }))}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                          maxBarSize={60}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="beacons" fill="#8884d8" name="Balises validées" />
						  <ReferenceLine y={averages.beacons} label={{value: "Moyenne", position: 'insideRight'}} stroke="red" strokeDasharray="3 3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Distance" key="2">
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.runs.map((run) => ({
                            name: run.student !== undefined ? getFullName(run.student) : run.id,
                            distance: run.distance,
                          }))}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                          maxBarSize={60}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="distance" fill="#8884d8" name="Distance parcourue (m)" />
						  <ReferenceLine y={averages.distance} label={{value: "Moyenne", position: 'insideRight'}} stroke="red" strokeDasharray="3 3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Temps" key="3">
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.runs.map((run) => ({
                            name: run.student !== undefined ? getFullName(run.student) : run.id,
                            time: (run.time / 60).toFixed(1),
                          }))}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                          maxBarSize={60}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="time" fill="#8884d8" name="Temps (min)" />
						  <ReferenceLine y={averages.time} label={{value: "Moyenne", position: 'insideRight'}} stroke="red" strokeDasharray="3 3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Vitesse" key="4">
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.runs.map((run) => ({
                            name: run.student !== undefined ? getFullName(run.student) : run.id,
                            speed: run.avgSpeed.toFixed(1),
                          }))}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                          maxBarSize={60}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="speed" fill="#8884d8" name="Vitesse moyenne (km/h)" />
						  <ReferenceLine y={averages.speed} label={{value: "Moyenne", position: 'insideRight'}} stroke="red" strokeDasharray="3 3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Tabs.TabPane>
                </Tabs>
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default SessionSummary;
