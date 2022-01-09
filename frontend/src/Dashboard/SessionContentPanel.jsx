import {
  PageHeader,
  Button,
  Descriptions,
  Row,
  Col,
  Empty,
  Modal,
  Divider,
  Table,
  Space,
  Radio,
} from "antd";
import { useState, useEffect, useRef, useMemo } from "react";
import "./SessionContentPanel.css";
import { FullscreenOutlined, FormOutlined, DeleteOutlined, SelectOutlined } from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, Popup, FeatureGroup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import MapOverlay from "./SessionContentPanelOverlay";

const blueIcon = new L.Icon({
  iconRetinaUrl: require("../assets/markers/marker-icon-2x-blue.png").default,
  iconUrl: require("../assets/markers/marker-icon-blue.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const NewSessionContentPanel = (props) => {
  // Columns for the beacons table
  const beaconsColumns = useMemo(() => {
    return [
      {
        title: "ID",
        dataIndex: "id",
        key: "id",
        width: 50,
      },
      {
        title: "Latitude",
        dataIndex: "coords",
        key: (b) => b[0],
        render: (b) => b[0].toFixed(7),
      },
      {
        title: "Longitude",
        dataIndex: "coords",
        key: (b) => b[1],
        render: (b) => b[1].toFixed(7),
      },
      {
        title: "Actions",
        dataIndex: "actionsData",
        key: (b) => b.id,
        width: 75,
        render: (b) => (
          <Space size="middle">
            <a href="javascript:;">
              <FormOutlined
                onClick={() => {
                  editBeacon(b);
                }}
              />
            </a>
            <a href="javascript:;">
              <DeleteOutlined
                onClick={() => {
                  deleteBeacon(b._id);
                }}
              />
            </a>
          </Space>
        ),
      },
    ];
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Colums for the runs table
  const runsColumns = [
      {
        title: "Élève",
        dataIndex: "student",
        key: "id",
		render: (_, record) =>{
			if (record.student !== undefined && students.length) {
				return getStudentFullName(students.find(s => s._id === record.student))
			} else
				return record.id
		}
      },
      {
        title: "Movuino",
        dataIndex: "id",
        key: "id",
      },
      {
        title: "Date",
        dataIndex: "date",
        key: "date",
      },
      {
        title: "Actions",
        dataIndex: "actionsData",
        key: (b) => b._id,
        render: (b) => (
          <Space size="middle">
            <a>
              <SelectOutlined onClick={(e) => {
				  e.stopPropagation()
				  window.open(`/#/run/${props.data._id}/${b._id}`, '_blank').focus();
				  }} />
            </a>
            <a>
              <DeleteOutlined onClick={(e) => {e.stopPropagation(); deleteRun(b._id)}} />
            </a>
          </Space>
        ),
      },
    ];

  const [map, setMap] = useState();
  const [showOverlay, setShowOverlay] = useState(false);
  const [openOverlayOnEdit, setOpenOverlayOnEdit] = useState(null);
  const [openOverlayOnNew, setOpenOverlayOnNew] = useState(false);
  const [beacons, setBeacons] = useState(props.data ? props.data.beacons : []);
  const [students, setStudents] = useState([]);
  const markerGroup = useRef();

  // Updated the component state when the data props is updated.
  useEffect(() => {
    if (!props.data) return;
    setBeacons(props.data.beacons);
	console.log(props.data)
	fetch(`/api/classes/${props.data.class_id}/students`, { method: "GET" })
          .then((res) => res.json())
          .then((studs) => {
			  console.log("HERERERRE", studs);
            setStudents(studs);
          });
  }, [props.data]);

  // When the map component has been rendered, update the map viewport to fit all the beacons.
  useEffect(() => {
    if (!map) return;
    if (beacons.length) map.fitBounds(markerGroup.current.getBounds(), { animate: false, padding: [100, 10] });
  }, [map, beacons]);

  // Called when the 'edit' button of a beacon is pressed. Will open the map overlay with an edit ongoing.
  const editBeacon = (beacon) => {
    setOpenOverlayOnEdit(beacon);
    setShowOverlay(true);
  };

  // Send a DELETE request to the server to delete the current session. Will also call the props.onUpdate() function.
  const onDeleteSessionConfirm = (sess) => {
    fetch(`/api/sessions/${sess._id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "",
    }).then((res) => {
      if (res.status === 200) {
        console.log("Session successfully deleted");
        props.onUpdate();
      }
    });
  };

  const getStudentFullName = (student) => {
	  return `${student.firstName} ${student.lastName}`
  }

  // Called when the delete button of the page is pressed. Will prompte the user with a confirmation box.
  const onDeleteSession = (sess) => {
    Modal.confirm({
      title: "Avertissement",
      content: (
        <p>
          Vous êtes sur le point de supprimer la séance <strong>{sess.session_name}</strong> pour la classe{" "}
          <strong>{props.data.class_name}</strong>
          . Cela entrainera la suppression de toutes les données qui lui sont relatives. <br />
          <br />
          Êtes vous sûr de vouloir continuer ?
        </p>
      ),
      onOk: () => {
        onDeleteSessionConfirm(sess);
      },
      okText: "Oui, supprimer",
      cancelText: "Non, annuler",
    });
  };

  // Delete a beacon directly without confiramtion. Send a DELETE request to the server. Will call props.onUpdate() on success.
  const deleteBeacon = (id) => {
    fetch(`/api/sessions/${props.data._id}/beacons`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _id: id }),
    }).then((res) => {
      if (res.status === 200) {
        console.log("Beacon successfully deleted");
        props.onUpdate();
      }
    });
  };

  const setSessionAsSelected = () => {
	fetch(`/api/targetSession`, {
		method: "POST",
		headers: {
		  Accept: "application/json",
		  "Content-Type": "application/json",
		},
		body: JSON.stringify({id: props.data._id}),
	  }).then((res) => {
		if (res.status === 200) {
		  console.log("Session successfully selected");
		  props.onUpdate();
		}
	  });
  }

  const deleteRun = (id) => {
	fetch(`/api/runs/${props.data._id}/${id}`, {
		method: "DELETE",
		headers: {
		  Accept: "application/json",
		  "Content-Type": "application/json",
		},
		body: "",
	  }).then((res) => {
		if (res.status === 200) {
		  console.log("Run successfully deleted");
		  props.onUpdate();
		}
	  });
  }

  const downloadExcel = () => {
    window.location.href = `/api/excel/session/${props.data._id}`
  }

  return (
    <div className="session-panel-wrapper">
      {/* <a href="http://localhost:5000/api/excel/session/61d9d57366d7ea6e6e1900c3" download="proposed_file_name">Download</a> */}
      <PageHeader
        ghost={false}
        onBack={() => window.history.back()}
        title={props.data.session_name}
        subTitle={props.data.class_name}
        extra={[
          <Space key="1">
            <p style={{ marginBottom: 0 }}>Téléverser vers cette seance</p>
			<Radio.Group onChange={setSessionAsSelected} value={props.data.isSelected}>
            	<Radio value={true}></Radio>
			</Radio.Group>
          </Space>,
          <Button key="2" onClick={() => downloadExcel()}>
          Excel
        </Button>,
          <Button key="2" onClick={() => onDeleteSession(props.data)}>
            Supprimer
          </Button>,
        ]}
      >
        <Descriptions size="small" column={3}>
          <Descriptions.Item label="Nombre de courses">{props.data.runs.length}</Descriptions.Item>
          <Descriptions.Item label="Nombre de balises">{beacons.length}</Descriptions.Item>
        </Descriptions>
      </PageHeader>
      <Row>
        <Col span={10}>
          <div className="map-col-outer">
            <Divider type="vertical"></Divider>
            <div className="map-col-inner">
              <div className="map-wrapper">
                <Button
                  id="fullscreen-btn"
                  type="link"
                  icon={<FullscreenOutlined style={{ fontSize: "25px", color: "#fff" }} />}
                  onClick={() => {
                    setShowOverlay(true);
                  }}
                ></Button>
                <MapContainer zoomControl={false} center={[48.857231, 2.324309]} zoom={13} style={{ height: "100%", width: "100%" }} whenCreated={setMap}>
                  <FeatureGroup ref={markerGroup}>
                    {beacons.map((b) => {
                      return (
                        <Marker position={b.coords} key={b._id} icon={blueIcon}>
                          <Popup>{b.id}</Popup>
                        </Marker>
                      );
                    })}
                  </FeatureGroup>
                  <TileLayer
                    // attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="/atlas/{z}/{x}/{y}.png"
                  ></TileLayer>
                </MapContainer>
              </div>
              <div className="table-wrapper">
                <Table
                  className="fixed-header-full-height-table"
                  columns={beaconsColumns}
                  dataSource={beacons.map((b) => {
                    return { ...b, actionsData: b };
                  })}
                  size="small"
                  pagination={false}
                  scroll={{ y: "100%" }}
                  locale={{
                    emptyText: <Empty description="Aucune balise"></Empty>,
                  }}
                  rowKey={(record) => record._id}
                />
              </div>
              <Button
                type="dashed"
                onClick={() => {
                  setOpenOverlayOnNew(true);
                  setShowOverlay(true);
                }}
              >
                Nouvelle balise
              </Button>
            </div>
          </div>
        </Col>
        <Col span={14}>
          <div className="run-table-wrapper">
            <Table
              className="fixed-header-full-height-table"
              columns={runsColumns}
              dataSource={props.data.runs.map((run) => {
                return { ...run, actionsData: run };
              })}
              size="small"
              pagination={false}
              scroll={{ y: "100%" }}
              locale={{
                emptyText: <Empty description="Aucune course enregistrée"></Empty>,
              }}
              rowKey={(record) => record._id}
			  onRow={(record, rowIndex) => {
				  return {
					  onClick: e => {window.location.href = `/#/run/${props.data._id}/${record._id}`}
				  }
			  }}
			  rowClassName={"hoverable-row"}
            />
          </div>
        </Col>
      </Row>
      {showOverlay && (
        <MapOverlay
          beacons={beacons}
          sessionId={props.data._id}
          onUpdate={props.onUpdate}
          onClose={() => {
            setShowOverlay(false);
            setOpenOverlayOnEdit(null);
            setOpenOverlayOnNew(false);
          }}
          openOnEdit={openOverlayOnEdit}
          openOnNew={openOverlayOnNew}
        />
      )}
    </div>
  );
};

export default NewSessionContentPanel;
