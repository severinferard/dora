import React, { useEffect, useState } from "react";
import "@elastic/eui/dist/eui_theme_light.css";
import {
  EuiEmptyPrompt,
  EuiPanel,
  EuiButton,
  EuiPageHeader,
  EuiListGroup,
  EuiSpacer,
  EuiHorizontalRule,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiForm,
  EuiFormRow,
  EuiFieldText,
  EuiConfirmModal,
  EuiFlexGroup,
  EuiFlexItem,
  EuiStat,
  EuiIcon,
  EuiInMemoryTable,
  EuiButtonIcon,
  EuiFieldNumber,
} from "@elastic/eui";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("./assets/markers/marker-icon-2x-red.png").default,
  iconUrl: require("./assets/markers/marker-icon-red.png").default,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").default,
});

const blueIcon = new L.Icon({
  iconRetinaUrl: require("./assets/markers/marker-icon-2x-blue.png").default,
  iconUrl: require("./assets/markers/marker-icon-blue.png").default,
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

function BeaconSelection(props) {
  const [isInSelection, setIsInSelection] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState("");
  const [newSelection, setNewSelection] = useState({ id: "", lat: "", long: "" });
  const [mapPos, setMapPos] = useState([48.857231, 2.324309]);
  const [map, setMap] = useState();
  const [hoverMarker, setHoverMarker] = useState(null);
  const [beaconArray, setBeaconArray] = useState([]);

  const columns = [
    {
      field: "firstCell",
      name: "ID",
     // ""IT AIN'T STUPID IF IT WORKS !""
      // Adding an invisible  <span> with the _id of the beacon for each row (used for the onMouseOver callbacks)
      render: (b) => (
        <>
          <span>{b.id}</span>
          <span style={{ display: "none" }} className="row-hidden-id">
            {b._id}
          </span>
        </>
      ),
	  sortable: (b) => b.id,
    },
    {
      field: "lat",
      name: "Latitude",
	  render: (val) => val.toFixed(8)
    },
    {
      field: "long",
      name: "Longitude",
	  render: (val) => val.toFixed(8)
    },
    {
      field: "action",
      name: "Action",
      render: (beacon) => (
        <>
          <EuiButtonIcon
            iconSize="m"
            size="xs"
            iconType="trash"
            aria-label="delete"
            onClick={(e) => {
              deleteBeacon(beacon._id);
            }}
          />
          <EuiButtonIcon
            iconSize="m"
            size="xs"
            iconType="pencil"
            aria-label="delete"
            onClick={(e) => {
              editBeacon(beacon);
            }}
          />
        </>
      ),
    },
  ];

  // Remove temporarly the marker that is currently being edited from the beaconArray (so that the old marker gets hidded on the map)
  useEffect(() => {
    setBeaconArray(props.beacons);
    if (isInSelection && isEdit) {
      setBeaconArray(props.beacons.filter((b) => b._id != editId));
    }
  }, [props.beacons, isEdit]);

  // Called when the "Nouvelle balise" button is pressed
  const startSelection = () => {
    setIsInSelection(true);
    const newId = Math.max(...props.beacons.map((b) => b.id)) + 1;
    setNewSelection({ id: newId, lat: map.getCenter().lat, long: map.getCenter().lng });
  };

  // Called when the "edit" button is pressed in a table row
  const editBeacon = (beacon) => {
    setIsEdit(true);
    setIsInSelection(true);
    setEditId(beacon._id);
    setNewSelection({ id: beacon.id, lat: beacon.lat, long: beacon.long });
  };

  // Called when the "save" button is pressed, whether its for a new beacon or an edit.
  // In both cases, this will trigger the onUpdate() props which should fetch the new data from the server (thus re-passing it to the props.beacons props)
  const saveSelection = () => {
    if (isEdit) {
      console.log("sending updated beacon");
      fetch(`/api/sessions/${props.sessionId}/beacons`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: editId,
          id: parseInt(newSelection.id),
          coords: [parseFloat(newSelection.lat), parseFloat(newSelection.long)],
        }),
      }).then((res) => {
        if (res.status == 200) {
          res
            .json()
            .then((response) => {
              console.log("New beacon successfully updated", response);
              props.onUpdate(response);
            })
            .finally(() => {
              setIsInSelection(false);
            });
        }
      });
      setIsEdit(false);
    } else {
      console.log("sessionId", props.sessionId);
      fetch(`api/sessions/${props.sessionId}/beacons`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: parseInt(newSelection.id), coords: [parseFloat(newSelection.lat), parseFloat(newSelection.long)] }),
      }).then((res) => {
        if (res.status == 200) {
          res.json().then((response) => {
            console.log("New beacon successfully added", response);
            props.onUpdate(response);
          }).finally(() => {
			setIsInSelection(false);
		  });
        }
      });
    }
    setNewSelection({ id: "", lat: "", long: "" });
  };

  // Called when the "delete" button is pressed in a tabler row.
  // This will trigger the onUpdate() props which should fetch the new data from the server (thus re-passing it to the props.beacons props).
  const deleteBeacon = (id) => {
    fetch(`/api/sessions/${props.sessionId}/beacons`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ _id: id }),
    }).then((res) => {
      if (res.status == 200) {
        console.log("Beacon successfully deleted");
        props.onUpdate();
        setHoverMarker(null);
      }
    });
  };

  // Hacky patch used to get a reference to the Leaflet Map element (used to get the center of the current viewport when creating a new beacon).
  const Dummy = () => {
    const map = useMapEvents({});
    useEffect(() => {
      setMap(map);
    }, []);
    return <></>;
  };

  // ""IT AIN'T STUPID IF IT WORKS !"" - the come back
  // Callback function called when a table row calls onMouseEnter, independently of the row.
  // We use the hidden _id in the row to get the beacon id and add a red marker on the map accordingly.
  const onRowHover = (e) => {
    const id = e.target.closest(".euiTableRow").querySelector(".row-hidden-id").innerText;
    const beacon = props.beacons.find((e) => e._id == id);
    setHoverMarker({ lat: beacon.lat, long: beacon.long });
  };

  // Callback function called when a table row calls onMouseLeave, independently of the row.
  // Remove the hoverMarker from the map
  const onRowHoverEnd = (e) => {
    setHoverMarker(null);
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <EuiModalHeader style={{ padding: "10px" }}>
        <EuiModalHeaderTitle>
          <h1>Balises</h1>
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiFlexGroup style={{ width: "100%", height: "90%" }}>
        <EuiFlexItem grow={false} style={{ width: "60%" }}>
          {/* ==================================================================================================================== <MAP> ============================= */}

          <MapContainer
            center={mapPos}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            eventHandlers={{
              click: () => {
                console.log("click");
              },
            }}
          >
            <Dummy />
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
            {/* Creates a Marker on the map for each beacon. */}
            {beaconArray.map((b) => {
              return (
                <Marker position={[b.lat, b.long]} icon={blueIcon} key={b._id}>
                  <Popup>{b.id}</Popup>
                </Marker>
              );
            })}
            {/* Add a new RED Marker on the map during a selection (edit or new). */}
            {isInSelection && (
              <Marker
                position={[newSelection.lat, newSelection.long]}
                icon={redIcon}
                draggable
                eventHandlers={{
                  drag: (e) => {
                    setNewSelection({ ...newSelection, lat: e.latlng.lat, long: e.latlng.lng });
                  },
                }}
              />
            )}
            {/* Create a new RED Marker on the map when a table row is hovered */}
            {hoverMarker !== null && <Marker position={[hoverMarker.lat, hoverMarker.long]} icon={redIcon} />}
          </MapContainer>

          {/* ==================================================================================================================== </MAP> ============================= */}
        </EuiFlexItem>
        <EuiFlexItem>
          {/* ==================================================================================================================== <TABLE> ============================= */}
          <EuiInMemoryTable
            tableCaption="Demo of EuiInMemoryTable"
            items={props.beacons.map((b) => {
              return { ...b, action: b, firstCell: b };
            })}
            columns={columns}
            pagination={true}
            style={{ maxWidth: "100%", maxHeight: "80%", minHeight: "75%", overflow: "scroll" }}
            noItemsMessage="Aucune balise enregistrees"
            isSelectable={false}
            compressed={true}
			sorting={{sort: {field: 'firstCell', direction: 'asc'}}}
            rowProps={{ onMouseEnter: (e) => onRowHover(e), onMouseLeave: (e) => onRowHoverEnd(e) }}
          />
          {/* ==================================================================================================================== </TABLE> ============================= */}

          {/* ==================================================================================================================== <FORM> ============================= */}
          <EuiFlexGroup>
            <EuiFlexItem grow={2} style={{ width: 100 }}>
              <EuiFormRow label="ID">
                <EuiFieldNumber
                  placeholder={1}
                  disabled={!isInSelection}
                  value={newSelection.id}
                  onChange={(e) => {
                    setNewSelection({ ...newSelection, id: e.target.value });
                  }}
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={4}>
              <EuiFormRow label="Latitude">
                <EuiFieldNumber
                  placeholder={48.852864}
                  disabled={!isInSelection}
                  value={newSelection.lat}
                  onChange={(e) => {
                    setNewSelection({ ...newSelection, lat: e.target.value });
                  }}
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem grow={4}>
              <EuiFormRow label="Longitude">
                <EuiFieldNumber
                  placeholder={2.362931}
                  disabled={!isInSelection}
                  value={newSelection.long}
                  onChange={(e) => {
                    setNewSelection({ ...newSelection, long: e.target.value });
                  }}
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiButton iconType="plusInCircle" size="s" disabled={isInSelection} onClick={startSelection}>
                Nouvelle balise
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton iconType="save" size="s" disabled={!isInSelection} onClick={saveSelection}>
                Enregistrer
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
          {/* ==================================================================================================================== </FORM> ============================= */}
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>
  );
}

export default BeaconSelection;
