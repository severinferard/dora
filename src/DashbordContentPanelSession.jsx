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
  EuiFlexGroup,
  EuiFlexItem,
  EuiConfirmModal,
  EuiInMemoryTable,
  EuiStat,
  EuiIcon,
  EuiDatePicker,
  EuiButtonIcon,
  EuiLink,
  EuiHealth,
} from "@elastic/eui";
import BeaconSelection from "./BeaconSelection"
import moment from "moment";
import "./DashboardContentPanelSession.css"

function DashboardContentPanelSession(props) {
  const [modalShown, setModalShown] = useState(false);
  const [startDate, setStartDate] = useState(moment());
  const [runs, setRuns] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [beacons, setBeacons] = useState([]);
  const [beaconsModal, setBeaconsModal] = useState(false);

const columns = [
    {
      field: 'id',
      name: 'ID',
      sortable: true,
      truncateText: true,
	  render: (run) => (
		<EuiLink  href={`/runsummary?session=${props.content._id}&id=${run._id}`}>
		{run.id}
	  	</EuiLink>
	  )
    },
    {
      field: 'date',
      name: 'Date',
      truncateText: true,
    },
	  {
		field: 'valid',
		name: 'Etat',
		sortable: true,
		dataType: 'boolean',
		render: (valid) => {
			const color = valid ? 'success' : 'danger';
			const label = valid ? 'Valide' : 'Erreur';
			return <EuiHealth color={color}>{label}</EuiHealth>;
		  }
	  },
	  {
		field: 'action',
		name: 'Action',
		sortable: false,
		render: (run) => (
		  <EuiButtonIcon
		  iconSize="m"
		  size="xs"
		  iconType="trash"
		  aria-label="delete"
		  onClick={() => {
			setDeleteModal(true);
		  }}
		/>
		)
	  },
	]

  useEffect(() => {
	console.log("content", props.content)
	setRuns(props.content.runs.map(run => {
		return {
			id: run,
			date: run.date,
			valid: !!run.rawPositions.length
		}
	}))
	setBeacons(props.content.beacons.map(b => {return {...b, lat: b.coords[0], long: b.coords[1]}}))
  }, [props.content]);

  const sendDeleteSessionForm = () => {
    setDeleteModal(false);
    fetch(`/api/sessions/${props.content._id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "",
    }).then((res) => {
      if (res.status == 200) {
        console.log("Session successfully deleted");
        props.onUpdate();
      }
    });
  };

  const onUpdatedBeacons = () => {
	  console.log("onUpdatedBeacons")
	  fetch(`/api/sessions/${props.content._id}`, {
		method: "GET",
	  }).then((res) => {
		if (res.status == 200) {
			res.json().then(response => {
				console.log("Recieved new beacons", response);
				setBeacons(response.beacons.map(b => {return {...b, lat: b.coords[0], long: b.coords[1]}}))
			})
		}
	  });
  }


  return (
    <div>
        <EuiPageHeader
          pageTitle={`${props.content.school_name}  -  ${props.content.class_name}  -  ${props.content.session_name}`}
          iconType="logoKibana"
          description={<></>}
          rightSideItems={[
            <EuiButtonIcon
              iconSize="l"
              size="m"
              iconType="trash"
              aria-label="delete"
              onClick={() => {
                setDeleteModal(true);
              }}
            />,
            <EuiButtonIcon iconSize="l" size="m" iconType="gisApp" aria-label="beacons" onClick={() => {setBeaconsModal(true)}}/>,
            <EuiButtonIcon iconSize="l" size="m" iconType="reportingApp" aria-label="teacher recap" />,
          ]}
        >
          <EuiFlexGroup style={{ textAlign: "center" }}>
            <EuiFlexItem>
              <p>Seance du {props.content.date}</p>
            </EuiFlexItem>
            <EuiFlexItem>
              <p>{props.content.runs.length} courses enregistrees</p>
            </EuiFlexItem>
            <EuiFlexItem>
              <p>{beacons.length} balises enregistrees</p>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageHeader>
        <EuiHorizontalRule size="half" />
        <EuiSpacer size="xxl" />
        {/* <EuiListGroup listItems={sessionArray} /> */}
		<div>
        <EuiInMemoryTable
          tableCaption="Demo of EuiInMemoryTable"
          items={runs}
          columns={columns}
          pagination={true}
		  style={{maxWidth: "80%", margin: "auto"}}
		//   loading
		  message="Cette seance ne contient aucune course"
        //   sorting={sorting}
        />
		</div>
      {modalShown && (
        <EuiModal
          onClose={(e) => {
            setModalShown(false);
          }}
          style={{ height: "500px" }}
        >
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h1>Nouvelle Seance</h1>
            </EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            <EuiForm id="" component="form">
              <EuiFormRow label="Nom ou numero de la seance">
                <EuiFieldText name="popfirst" />
              </EuiFormRow>
              <EuiFormRow label="Selectionnez une date">
                <EuiDatePicker popoverPlacement="bottom" selected={startDate} onChange={(date) => setStartDate(date)} />
              </EuiFormRow>
            </EuiForm>
          </EuiModalBody>

          <EuiModalFooter>
            <EuiButton
              onClick={(e) => {
                setModalShown(false);
              }}
            >
              Annuler
            </EuiButton>
            <EuiButton
              onClick={(e) => {
                setModalShown(false);
              }}
              fill
            >
              Ajouter
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}

      {deleteModal && (
        <EuiConfirmModal
          title="Avertissement"
          onCancel={() => setDeleteModal(false)}
          onConfirm={() => sendDeleteSessionForm()}
          cancelButtonText="Non, annuler"
          confirmButtonText="Oui, supprimer"
          buttonColor="danger"
        >
          <p>
            Vous etes sur le point de supprimer la session '{props.content.session_name}' pour la classe {props.content.class_name}. Cela
            entrainera la perte definitive de toutes les donnes qui lui sont relatives.
          </p>
          <p>Etes-vous sur de vouloir continuer ?</p>
        </EuiConfirmModal>
      )}

{beaconsModal && <EuiModal style={{ width: "90vw", maxWidth: "none", height: "90vh", maxHeight: "90vh" }} onClose={() => {setBeaconsModal(false)}}>
  {/* <EuiModalHeader>
    <EuiModalHeaderTitle><h1>Balises</h1></EuiModalHeaderTitle>
  </EuiModalHeader> */}

  <EuiModalBody>
	  <BeaconSelection beacons={beacons} sessionId={props.content._id} onUpdate={onUpdatedBeacons}></BeaconSelection>
  </EuiModalBody>

  {/* <EuiModalFooter>
    <EuiButton onClick={() => {}} fill>Close</EuiButton>
  </EuiModalFooter> */}
</EuiModal>}
	  
    </div>
  );
}

export default DashboardContentPanelSession;
