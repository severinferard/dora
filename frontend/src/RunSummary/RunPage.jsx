import { useState, useEffect, useRef, useMemo } from "react";
import {
  PageHeader,
  Button,
  Descriptions,
  Row,
  Col,
  Empty,
  Form,
  Input,
  Progress,
  Card,
  Statistic,
  Table,
  Tag,
  Select,
  Avatar,
  Switch,
//   Layout, 
//   Menu, 
//   Divider,
} from "antd";

// import { SettingOutlined } from "@ant-design/icons";

import { MapContainer, TileLayer, Marker, Popup, FeatureGroup, GeoJSON } from "react-leaflet";
import { LineChart, Line, YAxis, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Label } from "recharts";
import L from "leaflet";
import Rainbow from "rainbowvis.js";
import { useParams } from "react-router-dom";
import "./RunPage.css";
import smiley1 from "../assets/smiley1.svg";
import smiley2 from "../assets/smiley2.svg";
import smiley3 from "../assets/smiley3.svg";
import smiley4 from "../assets/smiley4.svg";
import smiley5 from "../assets/smiley5.svg";
import reticleImg from "../assets/reticle.png";

// const { Header } = Layout;

// Leaflet Icons
const redIcon = new L.Icon({
  iconRetinaUrl: require("../assets/markers/marker-icon-2x-red.png").default,
  iconUrl: require("../assets/markers/marker-icon-red.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const greenIcon = new L.Icon({
  iconRetinaUrl: require("../assets/markers/marker-icon-2x-green.png").default,
  iconUrl: require("../assets/markers/marker-icon-green.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Atlas URLS
const GAME_MAP_URL =
  "https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i{z}!2i{x}!3i{y}!4i256!2m3!1e0!2sm!3i581306962!3m17!2sen-GB!3sUS!5e18!12m4!1e68!2m2!1sset!2sRoadmap!12m3!1e37!2m1!1ssmartmaps!12m4!1e26!2m2!1sstyles!2zcy5lOmd8cC5jOiNmZjBhMjYzOSxzLmU6bC50fHAudjpvZmYscy5lOmwudC5mfHAuZzowLjAxfHAubDoyMCxzLmU6bC50LnN8cC5zOi0zMXxwLmw6LTMzfHAudzoyfHAuZzowLjgscy5lOmwuaXxwLnY6b2ZmLHMudDo1fHMuZTpnfHAubDozMHxwLnM6MzAscy50OjV8cy5lOmcuZnxwLnM6LTE5fHAuYzojZmYwMDMxNDgscy50OjJ8cy5lOmd8cC5zOjIwLHMudDo0MHxzLmU6Z3xwLmw6MjB8cC5zOi0yMCxzLnQ6M3xzLmU6Z3xwLmw6MTB8cC5zOi0zMCxzLnQ6M3xzLmU6Zy5mfHAuYzojZmYwMDAwMDAscy50OjN8cy5lOmcuc3xwLnM6MjV8cC5sOjI1LHMudDo0OXxzLmU6Zy5mfHAuYzojZmYxMmUxZTQscy50OjZ8cC5sOi0yMA!4e0";
const SATELLITE_MAP_URL = "/atlas/{z}/{x}/{y}.png";

// Main View
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
  const [selectedSmiley, setSelectedSmiley] = useState(1);
  const [vmaPercentage, setVmaPercentage] = useState(0);
  const featureGroupRef = useRef();
  const reticleRef = useRef();
  const tooltipRef = useRef();
  const mapWrapperRef = useRef();
  const rainbow = useMemo(() => {
    const r = new Rainbow();
    r.setNumberRange(0, 25);
    r.setSpectrum("red", "orange", "green");
    return r;
  }, []);

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

  // Fetch all data from the server when the component is first loaded
  const loadData = async () => {
    let response = await fetch(`/api/runs/${session_id}/${run_id}`, { method: "GET" });
    response = await response.json();
    setData(response);
    setSelectedSmiley(response.rating);

    let students = await fetch(`/api/classes/${response.class_id}/students`, { method: "GET" });
    students = await students.json();
    // Make sure the student exists in the server DB
    if (students.filter((s) => s._id === response.student).length)
      setSelectedStudent(students.find((s) => s._id === response.student)); // The selectedStudent state
    setStudents(students);
    setLoading(false); // Stop loading animation
  };

  // Call loadData() when the component is first loaded
  useEffect(() => {
    loadData();
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wait for the Leaflet Map object to be instanciated and change the map bounds to fit all the beacons and coordinates.
  useEffect(() => {
    if (!map || !data) return;
    if (data.beacons.length || data.rawPositions.length) map.fitBounds(featureGroupRef.current.getBounds(), { animate: false });
  }, [map, data]);

  // Set states when data is loaded
  useEffect(() => {
    if (!data) return;
    const success = data.beacons.filter((b) => b.valided).length;
    setBeaconSuccess(success);
    setBeaconSuccessRate(((success / data.beacons.length) * 100).toFixed());
    if (data.beacons.length)
		setAverageTime(data.beacons.map((b) => b.lap)
		.reduce((prev, curr) => prev + curr) / data.beacons.length);
    else setAverageTime(-1);
  }, [data]);

  // Set the VMA percentage if a student is associated with this run.
  useEffect(() => {
    if (!data || !selectedStudent) return;
    setVmaPercentage((data.avgSpeed / selectedStudent.vma) * 100);
  }, [selectedStudent, data]);

  // Function called on each GeoJSON feature. Used to set the color of each point depending of its realtive speed.
  const geoJSONStyleFunc = (feature) => {
    return {
      color: `#${rainbow.colourAt(feature.properties.speed)}`,
      weight: 5,
    };
  };

  // Format the given time passed is (s) to min:s
  const formatTime = (time) => {
    const formated = (time < 60 ? "0" : Math.floor(time / 60)) + ":" + ((time % 60).toFixed() < 10 ? "0" : "") + (time % 60).toFixed();
    return formated;
  };

  // Called when the form is submited. Send data to the server.
  const onFinishForm = (values) => {
    console.log(values);
    fetch(`/api/runs/${session_id}/${run_id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ student: values.student, rating: selectedSmiley, comment: values.feedback }),
    }).then((res) => {
      if (res.status === 200) {
        console.log("data sent successfully");
      }
    });
  };
  const onFinishFormFailed = () => {};

  //Called when a marker is hovered; Draw the reticle arround it and launch the typewritter animation.
  const onMarkerHovered = (e, beacon) => {
    setHoveredMarker(beacon);
    const markerPos = map.latLngToContainerPoint(e.latlng);
    reticleRef.current.style.left = markerPos.x - 10 + "px";
    reticleRef.current.style.top = markerPos.y - 30 + "px";
    tooltipRef.current.style.top = markerPos.y - 50 + "px";
    tooltipRef.current.style.left = markerPos.x + 40 + "px";
    tooltipRef.current.childNodes[0].classList.add("typewriter");
  };

  // Called when a marker lose hover; Hide the reticle and reset the typewritter animation.
  const onMarkerLeave = (e) => {
    reticleRef.current.style.left = -100 + "px";
    tooltipRef.current.style.left = -200 + "px";
    tooltipRef.current.childNodes[0].classList.remove("typewriter");
  };

  return (
	//   <Layout  style={{width: "100%", height: "100%"}}>
	// 	<Header className="header" theme="light">
    //       <Row>
    //         <Col span={5}>
    //           <Row>
    //             <Col span={23}>
    //               <div>
    //                 <span className="logo">DORA</span>
    //               </div>
    //             </Col>
    //             <Col span={1}>
    //               <Divider orientation="center" type="vertical"></Divider>
    //             </Col>
    //           </Row>
    //         </Col>
    //         <Col span={17}>
    //           <Menu theme="light" mode="horizontal" defaultSelectedKeys={["1"]}>
    //             <Menu.Item key="1">Data</Menu.Item>
    //           </Menu>
    //         </Col>
	// 		<Col span={1}>
	// 			v {process.env.REACT_APP_VERSION}
    //         </Col>
    //         <Col span={1}>
    //           <Button icon={<SettingOutlined />} type="link" onClick={() => {window.location.href = "#/settings"}}/>
    //         </Col>
    //       </Row> 
    //     </Header>
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
              {gameMode && <TileLayer url={GAME_MAP_URL}></TileLayer>}
              {!gameMode && <TileLayer url={SATELLITE_MAP_URL}></TileLayer>}

              <div id="reticle" ref={reticleRef}>
                <img src={reticleImg} alt=""></img>
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
                    Vitesse: {hoveredMarker.avgSpeed.toFixed(1)} km/h
                    <br />
                    Temps: {formatTime(hoveredMarker.time)}
                  </>
                )}
              </div>
              <FeatureGroup ref={featureGroupRef}>
                {data.beacons.map((b) => {
                  return (
                    <Marker
                      position={b.coords}
                      key={b._id}
                      icon={b.valided ? greenIcon : redIcon}
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
                <GeoJSON attribution="" data={data.geoJson} style={geoJSONStyleFunc} />
              </FeatureGroup>
            </MapContainer>
            <div id="speed-gauge" className="gauge">
              <Progress
                type="dashboard"
                percent={vmaPercentage}
                format={() => (
                  <>
                    {data.avgSpeed.toFixed(1)} <span style={{ fontSize: 16 }}>km/h</span>
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
                    {data.distance.toFixed()} <span style={{ fontSize: 16 }}>m</span>
                  </>
                )}
              />
            </div>
            <div id="beacon-gauge" className="gauge">
              <Progress percent={beaconSucessRate} steps={data.beacons.length} strokeWidth={20} showInfo={false} />
            </div>
            <div id="map-switch">
              <Switch
                checked={gameMode}
                onChange={() => {
                  setGameMode((curr) => !curr);
                }}
              />
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
                        if (beaconSucessRate > 70) return "#52c41a";
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
                  <Statistic title="Vitesse moyenne" value={data.avgSpeed.toFixed(1)} suffix={"km/h"} />
                </Card>
              </Col>
              <Col span={19} style={{ height: "100%", paddingLeft: 5 }}>
                <Card id="speed-card" title="Vitesse" size="small">
                  <div id="speed-card-inner">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
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
                        <YAxis />
                        <Legend width={200} />
                        <Line dot={false} type="monotone" dataKey="data" name="Vitesse (km/h)" stroke="#8884d8" />
                        {data.beacons
                          .filter((b) => b.valided)
                          .map((b) => (
                            <ReferenceLine x={b.index} stroke="red">
                              <Label value={b.id} offset={5} position="right" />
                            </ReferenceLine>
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
                            <Avatar src={`/avatars/bottts${selectedStudent !== null ? selectedStudent.avatar : 1}.svg`}></Avatar>
                          </Col>
                          <Col span={20}>
                            <Form.Item name="student" label="" initialValue={selectedStudent._id}>
                              <Select
                                options={students.map((s) => ({ label: `${s.firstName} ${s.lastName}`, value: s._id }))}
                                onChange={(value) => setSelectedStudent(students.find((s) => s._id === value))}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item name="feedback" label="" style={{ marginBottom: 0 }} initialValue={data.comment}>
                          <Input.TextArea style={{ height: 70 }} placeholder="Mon ressenti sur ma course..." />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="rate" label="" initialValue={data.rating} value>
                          <div className="smiley-rating" value={selectedSmiley}>
                            <img
                              src={smiley1}
                              alt="bad"
                              onMouseDown={() => {
                                setSelectedSmiley(1);
                              }}
                              className={selectedSmiley === 1 ? "selected" : ""}
                            />
                            <img
                              src={smiley2}
                              alt="bad"
                              onMouseDown={() => {
                                setSelectedSmiley(2);
                              }}
                              className={selectedSmiley === 2 ? "selected" : ""}
                            />
                            <img
                              src={smiley3}
                              alt="bad"
                              onMouseDown={() => {
                                setSelectedSmiley(3);
                              }}
                              className={selectedSmiley === 3 ? "selected" : ""}
                            />
                            <img
                              src={smiley4}
                              alt="bad"
                              onMouseDown={() => {
                                setSelectedSmiley(4);
                              }}
                              className={selectedSmiley === 4 ? "selected" : ""}
                            />
                            <img
                              src={smiley5}
                              alt="bad"
                              onMouseDown={() => {
                                setSelectedSmiley(5);
                              }}
                              className={selectedSmiley === 5 ? "selected" : ""}
                            />
                          </div>
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
	// </Layout>
  );
};

export default RunPage;
