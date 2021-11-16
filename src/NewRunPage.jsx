import { useState, useEffect, useRef, useMemo } from "react";
import {
  PageHeader,
  Button,
  Descriptions,
  List,
  Row,
  Col,
  Empty,
  Form,
  Modal,
  Input,
  Progress,
  Card,
  Statistic,
  Table,
  Tag,
  Select,
  Avatar,
  Rate,
} from "antd";

import { ExpandOutlined } from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, FeatureGroup, GeoJSON } from "react-leaflet";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts";
import L from "leaflet";
import Rainbow from "rainbowvis.js";
import { useParams } from "react-router-dom";
import "./NewRunPage.css";

const blueIcon = new L.Icon({
  iconRetinaUrl: require("./assets/markers/marker-icon-2x-blue.png").default,
  iconUrl: require("./assets/markers/marker-icon-blue.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const GAME_MAP_URL =
  "https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i581306962!3m17!2sen-GB!3sUS!5e18!12m4!1e68!2m2!1sset!2sRoadmap!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!2zcy5lOmd8cC5jOiNmZjBhMjYzOSxzLmU6bC50fHAudjpvZmYscy5lOmwudC5mfHAuZzowLjAxfHAubDoyMCxzLmU6bC50LnN8cC5zOi0zMXxwLmw6LTMzfHAudzoyfHAuZzowLjgscy5lOmwuaXxwLnY6b2ZmLHMudDo1fHMuZTpnfHAubDozMHxwLnM6MzAscy50OjV8cy5lOmcuZnxwLnM6LTE5fHAuYzojZmYwMDMxNDgscy50OjJ8cy5lOmd8cC5zOjIwLHMudDo0MHxzLmU6Z3xwLmw6MjB8cC5zOi0yMCxzLnQ6M3xzLmU6Z3xwLmw6MTB8cC5zOi0zMCxzLnQ6M3xzLmU6Zy5mfHAuYzojZmYwMDAwMDAscy50OjN8cy5lOmcuc3xwLnM6MjV8cC5sOjI1LHMudDo0OXxzLmU6Zy5mfHAuYzojZmYxMmUxZTQscy50OjZ8cC5sOi0yMA!4e0";
const SATELLITE_MAP_URL = "/atlas/{z}/{x}/{y}.png";

const RunPage = () => {
  const { session_id, run_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [map, setMap] = useState();
  const [beaconSucess, setBeaconSuccess] = useState(0);
  const [beaconSucessRate, setBeaconSuccessRate] = useState(0);
  const [averageTime, setAverageTime] = useState(0);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [gameMode, setGameMode] = useState(true);
  const featureGroupRef = useRef();
  const reticleRef = useRef();
  const tooltipRef = useRef();
  const mapWrapperRef = useRef();
  const rainbow = new Rainbow();

  const tableColumns = useMemo(() => {
    return [
      {
        title: "Balise",
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
        title: "Temps entre balises",
        dataIndex: "lap",
        key: "lap",
        render: (time) => (time !== null ? formatTime(time) : "-"),
      },
      {
        title: "Vitesse relative",
        dataIndex: "avgSpeed",
        key: "avgSpeed",
        render: (speed) => (speed ? speed.toFixed(1) : "-"),
      },
      {
        title: "État",
        dataIndex: "valided",
        key: "valided",
        render: (valided) => <Tag color={valided ? "green" : "red"}>{valided ? "Validée" : "Non validée"}</Tag>,
      },
    ];
  }, []);

  const loadData = () => {
    fetch(`/api/runs/${session_id}/${run_id}`, { method: "GET" })
      .then((res) => res.json())
      .then((response) => {
        console.log("received data", response);
        setData(response);
        fetch(`/api/classes/${response.class_id}/students`, { method: "GET" })
          .then((res) => res.json())
          .then((studs) => {
            if (studs.filter((s) => s._id == response.student).length) setSelectedStudent(response.student);
            setStudents(studs);
            setLoading(false);
          });
      });

    console.log(session_id, run_id);
  };

  useEffect(() => {
    loadData();
    rainbow.setNumberRange(0, 10);
    rainbow.setSpectrum("red", "orange", "green");
  }, []);

  const geoJSONStyleFunc = (feature) => {
    return {
      color: `#${rainbow.colourAt(feature.properties.speed)}`,
      weight: 5,
    };
  };

  useEffect(() => {
    if (!map || !data) return;
    if (data.beacons.length || data.rawPositions.length) map.fitBounds(featureGroupRef.current.getBounds(), { animate: false });
    map.click = () => {
      console.log("click");
    };
  }, [map, data]);

  useEffect(() => {
    if (!data) return;
    // const success = data.beacons.filter((b) => b.valided).length;
    const success = 4;
    setBeaconSuccess(success);
    setBeaconSuccessRate(((success / data.beacons.length) * 100).toFixed());
    if (data.beacons.length) setAverageTime(data.beacons.reduce((prev, curr) => prev + curr) / data.beacons.length);
    else setAverageTime(-1);
  }, [data]);

  const formatTime = (time) => {
    const formated = (time < 60 ? "0" : Math.floor(time / 60)) + ":" + ((time % 60).toFixed() < 10 ? "0" : "") + (time % 60).toFixed();
    return formated;
  };

  const onFinishForm = (values) => {
    console.log(values);
    fetch(`/api/runs/${session_id}/${run_id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ student: values.student, rating: values.rate, comment: values.feedback }),
    }).then((res) => {
      if (res.status == 200) {
        console.log("data sent successfully");
      }
    });
  };
  const onFinishFormFailed = () => {};

  const moveReticle = (e) => {
    //   if (hoveredMarker !== null) return
    //   const cursorPos = map.latLngToContainerPoint(e.latlng)
    //   reticleRef.current.style.left = cursorPos.x + 'px'
    //   reticleRef.current.style.top = cursorPos.y + 'px'
    //   reticleRef.current.style.transform = "translate(-50%, -50%)"
  };

  const onMarkerHovered = (e, beacon) => {
    console.log(beacon);
    setHoveredMarker(beacon);
    const markerPos = map.latLngToContainerPoint(e.latlng);
    reticleRef.current.style.left = markerPos.x + "px";
    reticleRef.current.style.top = markerPos.y - 20 + "px";
    tooltipRef.current.style.top = markerPos.y - 40 + "px";
    tooltipRef.current.style.left = markerPos.x + 30 + "px";
    tooltipRef.current.childNodes[0].classList.add("typewriter");
  };

  const onMarkerLeave = (e) => {
    reticleRef.current.style.left = -100 + "px";
    tooltipRef.current.style.left = -200 + "px";
    tooltipRef.current.childNodes[0].classList.remove("typewriter");
  };

  useEffect(() => {
    //   if (hoveredMarker === null) return;
    //   const markerPos = map.latLngToContainerPoint(hoveredMarker.latlng)
    // const parentBounds = mapWrapperRef.current.getBoundingClientRect()
    // reticleRef.current.style.left = markerPos.x + 'px'
    // reticleRef.current.style.top = markerPos.y - 20 + 'px'
    // reticleRef.current.style.transform = "scale(1.3) translate(-16px, -16px)"
  }, [hoveredMarker]);

  function Dummy() {
    const map = useMapEvents({
      mousemove(e) {
        // console.log(e)
        moveReticle(e);
      },
    });

    return null;
  }

  return (
    <div className="run-page-wrapper">
      {!loading && (
        <div className="run-page-container">
          <PageHeader onBack={() => window.history.back()} title={data.id} subTitle={data.session_name}>
            <Descriptions size="small" column={3}>
              <Descriptions.Item label="Séance">{data.session_name}</Descriptions.Item>
              <Descriptions.Item label="Classe">{data.class_name}</Descriptions.Item>
              <Descriptions.Item label="Date">{data.date}</Descriptions.Item>
            </Descriptions>
          </PageHeader>
          <div id="map-wrapper" className={gameMode ? "map-wrapper-dark" : ""} ref={mapWrapperRef}>
            {/* <div id="map-wrapper" ref={mapWrapperRef}> */}
            <MapContainer
              zoomControl={false}
              center={[0, 0]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              eventHandlers={{
                click: () => {
                  console.log("click");
                },
              }}
              whenCreated={setMap}
            >
              <Dummy />
              <TileLayer url={gameMode ? GAME_MAP_URL : SATELLITE_MAP_URL}></TileLayer>
              <div id="reticle" ref={reticleRef}>
                <img src="https://img.icons8.com/dotty/80/ffffff/square-brackets.png"></img>
              </div>
              <div id="tooltip" ref={tooltipRef}>
                {hoveredMarker && (
                  <>
                    <div>
                      <strong>
                        Balise {hoveredMarker.id} - {hoveredMarker.valided ? "Validée" : "Non validée"}
                      </strong>
                    </div>
                  </>
                )}
                {hoveredMarker && hoveredMarker.valided && (
                  <>
                    Vitesse: {hoveredMarker.avgSpeed} <br />
                    Distance: {hoveredMarker.distance} <br />
                    Temps: {hoveredMarker.time}
                  </>
                )}
              </div>
              {/* <div id="map-overlay" onMouseMove={moveReticle}></div> */}
              <FeatureGroup ref={featureGroupRef}>
                {data.beacons.map((b) => {
                  return (
                    <Marker
                      position={b.coords}
                      key={b._id}
                      icon={blueIcon}
                      eventHandlers={{
                        mouseover: (e) => {
                          onMarkerHovered(e, b);
                        },
                        mouseout: onMarkerLeave,
                      }}
                    >
                      <Popup>{b.id}</Popup>
                    </Marker>
                  );
                })}
                <GeoJSON attribution="&copy; credits due..." data={data.geoJson} style={geoJSONStyleFunc} />
              </FeatureGroup>
            </MapContainer>
            <div id="speed-gauge" className="gauge">
              <Progress
                type="dashboard"
                percent={75}
                format={() => (
                  <>
                    {12.8} <span style={{ fontSize: 16 }}>km/h</span>
                  </>
                )}
              />
            </div>
            <div id="distance-gauge" className="gauge">
              <Progress
                type="dashboard"
                percent={75}
                format={() => (
                  <>
                    {1258} <span style={{ fontSize: 16 }}>m</span>
                  </>
                )}
              />
            </div>
            <div id="beacon-gauge" className="gauge">
              <Progress percent={beaconSucessRate} steps={data.beacons.length} strokeWidth={20} showInfo={false} />
            </div>
          </div>
          <div id="stats-wrapper">
            <Row style={{ width: "100%", height: 200 }}>
              <Col span={19} style={{ paddingRight: 5 }}>
                <Card id="beacons-card" title="Balises" size="small">
                  <div>
                    <div id="beacons-progress-wrapper">
                      <span>
                        {beaconSucess} / {data.beacons.length}
                      </span>
                      <Progress percent={beaconSucessRate} steps={data.beacons.length} strokeWidth={20} showInfo={false} />
                    </div>
                    <Progress
                      type="circle"
                      percent={beaconSucessRate}
                      strokeColor={(() => {
                        if (beaconSucessRate > 75) return "#52c41a";
                        else if (beaconSucessRate > 40) return "#faad14";
                        return "#ff4d4f";
                      })()}
                    />
                  </div>
                </Card>
              </Col>
              <Col span={5} style={{ height: "100%", paddingLeft: 5 }}>
                <Card id="time-card" title="Temps" size="small">
                  <Row gutter={12}>
                    <Col span={12}>
                      <Statistic title="Temps total" value={formatTime(data.time)} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="Temps moyen" value={averageTime >= 0 ? formatTime(averageTime) : "-"} />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
            <Row style={{ width: "100%", height: 300, paddingTop: 10 }}>
              <Col span={5} style={{ display: "flex", flexDirection: "column", paddingRight: 5, height: "100%" }}>
                <Card id="distance-card" title="Distance" size="small" style={{ marginBottom: 10 }}>
                  <Statistic title="Distance parcourue" value={data.distance.toFixed()} suffix={"m"} />
                </Card>
                <Card id="avg-speed-card" title="Vitesse moyenne" size="small">
                  <Statistic title="Vitesse moyenne (km/h)" value={data.avgSpeed.toFixed(1)} suffix={"km/h"} />
                </Card>
              </Col>
              <Col span={19} style={{ height: "100%", paddingLeft: 5 }}>
                <Card id="speed-card" title="Vitesse" size="small">
                  <div id="speed-card-inner">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        //   width={500}
                        //   height={10}
                        data={data.speeds.map((e, i) => {
                          return { data: e, index: i };
                        })}
                        margin={{
                          top: 20,
                          right: 50,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="1 3" />
                        {/* <XAxis dataKey="index" /> */}
                        <YAxis />
                        {/* <Tooltip /> */}
                        <Legend width={200} />
                        <Line type="monotone" dataKey="data" name="Vitesse (km/h)" stroke="#8884d8" />
                        {data.beacons
                          .filter((b) => b.valided)
                          .map((b) => (
                            <ReferenceLine x={b.index} stroke="red" label={b.id} />
                          ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
            </Row>
            <Row style={{ width: "100%", height: 300, paddingTop: 10 }}>
              <Col span={24} style={{ height: "100%" }}>
                <Card id="table-card" title="Détail" size="small">
                  <Table
                    className="fixed-header-full-height-table"
                    columns={tableColumns}
                    dataSource={data.beacons}
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
            <Row style={{ width: "100%", paddingTop: 10 }}>
              <Col span={24} style={{ height: "100%" }}>
                <Card id="form-card" title="Informations" size="small">
                  <Form
                    name="basic"
                    // labelCol={{ span: 8 }}
                    wrapperCol={{ span: 24 }}
                    initialValues={{ remember: true }}
                    onFinish={onFinishForm}
                    onFinishFailed={onFinishFormFailed}
                    autoComplete="off"
                  >
                    <Row>
                      <Col span={12}>
                        <Row>
                          <Col span={4}>
                            <Avatar src={`https://avatars.dicebear.com/api/bottts/${selectedStudent}.svg`}></Avatar>
                          </Col>
                          <Col span={20}>
                            <Form.Item name="student" label="" initialValue={selectedStudent}>
                              <Select
                                options={students.map((s) => ({ label: `${s.firstName} ${s.lastName}`, value: s._id }))}
                                onChange={(value) => setSelectedStudent(value)}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item name="feedback" label="" style={{ marginBottom: 0 }} initialValue={data.comment}>
                          <Input.TextArea style={{ height: 70 }} placeholder="Mon ressenti sur ma course..." />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="rate" label="" initialValue={data.rating}>
                          <Rate tooltips={["Vraiment pas bien", "Pas bien", "Bof", "Tres bien", "Super"]} allowClear={false} />
                        </Form.Item>
                        <Form.Item>
                          <Button type="primary" htmlType="submit" style={{ marginTop: 20 }}>
                            Enregister
                          </Button>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>
              </Col>
            </Row>
            <div style={{ height: 50 }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RunPage;
// {
// 	"0%": "#ff4d4f",
// 	"50%": "#faad14",
// 	"100%": "#52c41a",
//   }
