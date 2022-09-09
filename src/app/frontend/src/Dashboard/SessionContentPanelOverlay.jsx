import {
  Button,
  Row,
  Col,
  Empty,
  Form,
  Divider,
  Table,
  Space,
  InputNumber,
} from "antd";
import { useState, useEffect, useRef } from "react";
import "./SessionContentPanelOverlay.css";
import { FormOutlined, DeleteOutlined, CloseOutlined, RightOutlined } from "@ant-design/icons";
import rotating_marker from "../assets/rotating_marker.png";
import { MapContainer, TileLayer, Marker, Popup, FeatureGroup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const blueIcon = new L.Icon({
  iconRetinaUrl: require("../assets/markers/marker-icon-2x-blue.png").default,
  iconUrl: require("../assets/markers/marker-icon-blue.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconRetinaUrl: require("../assets/markers/marker-icon-2x-red.png").default,
  iconUrl: require("../assets/markers/marker-icon-red.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const Overlay = ({ beacons, sessionId, onUpdate, onClose, openOnEdit, openOnNew }) => {
  const columns = [
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
      dataIndex: "actionData",
      key: (b) => b.id,
      width: 75,
      render: (b) => (
        <Space size="middle">
          <a href="javascript:;">
            <FormOutlined
              onClick={() => {
                onEditBeacon(b);
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
  const [sidebarHidden, setSidebarHidden] = useState(openOnEdit || openOnNew ? false : true);
  const [isInSelection, setIsInSelection] = useState(openOnEdit ? true : false);
  const [selection, setSelection] = useState({
    id: "",
    lat: null,
    lng: null,
    _id: "",
  });
  const [beaconsDisplayed, setBeaconsDisplayed] = useState(beacons);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [isEdit, setIsEdit] = useState(openOnEdit ? true : false);
  const [map, setMap] = useState();

  const markerGroup = useRef();

  useEffect(() => {
    if (openOnEdit) {
      setSelection({
        ...openOnEdit,
        lat: openOnEdit.coords[0],
        lng: openOnEdit.coords[1],
      });
    } else if (openOnNew) {
      // Wait for the dummy component to mount so the map object can be accessed ; see useEffect(..., [map]).
    }
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Used to wait for the map object set by the dummy component to call onNewBeacon if the props openOnNew is true. This unsure that map.getCenter() will not throw an undefined error.
  useEffect(() => {
    if (!map) return;
    if (beacons.length) map.fitBounds(markerGroup.current.getBounds(), { animate: false });
    if (openOnNew) onNewBeacon();
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  // Used to remove the current selection from the list of beacon displayed so that the marker edited doesnt duplicate.
  useEffect(() => {
    if (isInSelection) setBeaconsDisplayed(beacons.filter((b) => b._id !== selection._id));
    else setBeaconsDisplayed(beacons);
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beacons, selection]);

  // Hide or show the sidebar
  const toggleSidebar = () => {
    setSidebarHidden((current) => {
      return !current;
    });
  };

  // Create a new empty selection. Called when the button is clicked or when the component is created with the OpenOnNew prop set to true.
  const onNewBeacon = () => {
    setIsEdit(false);
    let newId;
    if (beaconsDisplayed.length > 0)
      newId = Math.max(...beaconsDisplayed.map((b) => b.id)) + 1;
    else
      newId = 1;
    setSelection({
      id: newId,
      lat: map.getCenter().lat,
      lng: map.getCenter().lng,
    });
    setIsInSelection(true);
  };

  // Create a new selection from the beacon passed in argument. The marker representing the beacon on the map will be hidden by the useEffect(..., [beacons, selection])
  const onEditBeacon = (beacon) => {
    setIsEdit(true);
    setSelection({
      id: beacon.id,
      _id: beacon._id,
      lat: beacon.coords[0],
      lng: beacon.coords[1],
    });
    setIsInSelection(true);
  };

  //Called when the cancel button is clicked or when the overlay is closed while in selcetion.
  const onCancelSelection = () => {
    setIsInSelection(false);
    setSelection({ id: "", lat: null, lng: null, _id: "" });
  };

  // Send the current selection to the server as a POST request and end the selection process. Will call props.onUpdate() so that the parent component can re-fetch the beacons when they've been updated
  const onSaveNewBeacon = () => {
    console.log("sessionId", sessionId);
    fetch(`api/sessions/${sessionId}/beacons`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: parseInt(selection.id),
        coords: [parseFloat(selection.lat), parseFloat(selection.lng)],
      }),
    }).then((res) => {
      if (res.status === 200) {
        res
          .json()
          .then((response) => {
            console.log("New beacon successfully added", response);
            onUpdate(response);
          })
          .finally(() => {
            setIsInSelection(false);
            setSelection({ id: "", lat: null, lng: null, _id: "" });
          });
      }
    });
  };

  // Delete the beacon with the passed _id by sending a DELETE request and end the selection process. Will call props.onUpdate() so that the parent component can re-fetch the beacons when they've been updated
  const deleteBeacon = (id) => {
    fetch(`/api/sessions/${sessionId}/beacons`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _id: id }),
    }).then((res) => {
      if (res.status === 200) {
        console.log("Beacon successfully deleted");
        onUpdate();
        setHoveredMarker(null);
      }
    });
  };

  // Send the current selection to the server as a PUT request and end the selection process. Will call props.onUpdate() so that the parent component can re-fetch the beacons when they've been updated
  const onSaveEditedBeacon = () => {
    console.log("sending updated beacon");
    fetch(`/api/sessions/${sessionId}/beacons`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _id: selection._id,
        id: parseInt(selection.id),
        coords: [parseFloat(selection.lat), parseFloat(selection.lng)],
      }),
    }).then((res) => {
      if (res.status === 200) {
        res
          .json()
          .then((response) => {
            console.log("New beacon successfully updated", response);
            onUpdate(response);
          })
          .finally(() => {
            setIsInSelection(false);
            setIsEdit(false);
            setSelection({ id: "", lat: null, lng: null, _id: "" });
          });
      }
    });
  };

  return (
    <div className="overlay">
      <MapContainer
        zoomControl={false}
        center={[48.857231, 2.324309]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        eventHandlers={{
          click: () => {
            console.log("click");
          },
        }}
        whenCreated={setMap}
      >
        <TileLayer
          // attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="/osm/tile/{z}/{x}/{y}.png"
        ></TileLayer>
        <FeatureGroup ref={markerGroup}>
          {beaconsDisplayed.map((b) => {
            return (
              <Marker position={b.coords} key={b._id} icon={blueIcon}>
                <Popup>{b.id}</Popup>
              </Marker>
            );
          })}
        </FeatureGroup>
        {isInSelection && (
          <Marker
            position={[selection.lat, selection.lng]}
            key={selection._id}
            icon={redIcon}
            draggable
            eventHandlers={{
              drag: (e) => {
                setSelection({
                  ...selection,
                  lat: e.latlng.lat,
                  lng: e.latlng.lng,
                });
              },
            }}
          >
            <Popup>{selection.id}</Popup>
          </Marker>
        )}
        {hoveredMarker && (
          <Marker position={hoveredMarker.coords} key={hoveredMarker._id + "hover"} icon={redIcon}>
            <Popup>{selection.id}</Popup>
          </Marker>
        )}
      </MapContainer>
      <div className={`overlay-sidecard ${sidebarHidden ? "overlay-sidecard-hidden" : ""}`}>
        <div className="sidecard-left">
          <Button
            size="large"
            icon={<CloseOutlined style={{ fontSize: "40px", color: "#ffffff" }} />}
            type="link"
            onClick={() => {
              if (isInSelection) onCancelSelection();
              onClose();
            }}
          ></Button>
        </div>
        <div className="sidecard-middle" onClick={toggleSidebar}>
          <img id="rotating_marker" src={rotating_marker} alt=""></img>
          <Divider type="vertical"></Divider>
          <RightOutlined style={{ fontSize: "30px", color: "#1890ff" }} />
        </div>
        <div className="sidecard-right">
          <div className="table-wrapper">
            <Table
              columns={columns}
              dataSource={beacons.map((b) => {
                return { ...b, actionData: b };
              })}
              size="small"
              pagination={false}
              scroll={{ y: "70vh" }}
              locale={{
                emptyText: (
                  <Empty description="Aucune seance renseignée">
                    <Button size="small" onClick={onNewBeacon}>
                      Nouvelle balise
                    </Button>
                  </Empty>
                ),
              }}
              rowKey={(record) => record._id}
              onRow={(record, rowIndex) => {
                return {
                  onMouseEnter: (e) => setHoveredMarker(record),
                  onMouseLeave: (e) => setHoveredMarker(null),
                };
              }}
            />
          </div>
          <Form name="beacon-form" layout="inline">
            <Row gutter={10}>
              <Col span={4}>
                <InputNumber
                  placeholder="ID"
                  disabled={!isInSelection}
                  value={selection.id}
                  onChange={(val) =>
                    setSelection((curr) => {
                      return { ...curr, id: val };
                    })
                  }
                ></InputNumber>
              </Col>
              <Col span={10}>
                <InputNumber
                  placeholder="Latitude"
                  disabled={!isInSelection}
                  value={selection.lat ? selection.lat.toFixed(7) : null}
                  onChange={(val) =>
                    setSelection((curr) => {
                      return { ...curr, lat: val };
                    })
                  }
                ></InputNumber>
              </Col>
              <Col span={10}>
                <InputNumber
                  placeholder="Longitude"
                  disabled={!isInSelection}
                  value={selection.lng ? selection.lng.toFixed(7) : null}
                  onChange={(val) =>
                    setSelection((curr) => {
                      return { ...curr, lng: val };
                    })
                  }
                ></InputNumber>
              </Col>
            </Row>
          </Form>
          {!isInSelection && (
            <Button type="dashed" block style={{ marginTop: "20px" }} onClick={onNewBeacon}>
              Nouvelle balise
            </Button>
          )}
          {isInSelection && (
            <>
              <Button type="dashed" block style={{ marginTop: "20px" }} onClick={isEdit ? onSaveEditedBeacon : onSaveNewBeacon}>
                Enregistrer
              </Button>
              <Button type="dashed" block style={{ marginTop: "20px" }} onClick={onCancelSelection}>
                Annuler
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overlay;
