import React, { useState, useEffect } from "react";
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
  EuiDatePicker,
} from "@elastic/eui";

import moment from 'moment';

function DashboardContentPanelClass(props) {
  const [modalShown, setModalShown] = useState(false);
  const [sessionArray, setSessionArray] = useState([]);
  const [modalData, setModalData] = useState({ name: "", date: moment()});
  const [deleteModal, setDeleteModal] = useState(false);


  useEffect(() => {
	setSessionArray(props.content.sessions.map(sess => {return {label: sess.session_name, id: sess._id, href: "#", iconType: "users"}}))
}, [props.content])

const sendForm = () => {
    fetch(`/api/sessions?class_id=${props.content._id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({...modalData, session_name: modalData.name}),
    }).then((res) => {
      if (res.status == 200) {
		  console.log("New Session successfullty created")
        props.onUpdate();
      }
    });
  };

  const sendDeleteClassForm = () => {
	setDeleteModal(false);
	fetch(`/api/classes/${props.content._id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "",
    }).then((res) => {
      if (res.status == 200) {
        console.log("Class successfully deleted");
        props.onUpdate();
      }
    });
  }

  return (
    <>
        <>
          <EuiPageHeader
            pageTitle={`${props.content.school_name} - ${props.content.name}`}
            iconType="logoKibana"
            description=""
            rightSideItems={[
				<EuiButton
				iconType="plusInCircle"
				onClick={(e) => {
				  setModalShown(true);
				}}
				fill
			  >
				Nouvelle Seance
			  </EuiButton>,
			  <EuiButton
				iconType="trash"
				onClick={(e) => {
				  setDeleteModal(true);
				}}
			  >
				Supprimer
			  </EuiButton>,
            ]}
          />
          <EuiHorizontalRule size="half" />
          <EuiSpacer size="xxl" />
          <EuiListGroup
            listItems={sessionArray}
          />
        </>
      {modalShown && (
        <EuiModal
          onClose={(e) => {
            setModalShown(false);
          }}
		  style={{height: "500px"}}
        >
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h1>Nouvelle Seance</h1>
            </EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            <EuiForm id="" component="form">
              <EuiFormRow label="Nom ou numero de la seance">
			  <EuiFieldText
                  name="popfirst"
                  value={modalData.name}
                  onChange={(e) => {
                    setModalData({ name: e.target.value, date: modalData.date });
                  }}
                />
              </EuiFormRow>
			  <EuiFormRow label="Selectionnez une date">
				<EuiDatePicker popoverPlacement="bottom" selected={modalData.date} onChange={(date) => {
                    setModalData({ name: modalData.name, date: date });
                  }} />
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
				sendForm()
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
	   onConfirm={() => sendDeleteClassForm()}
	   cancelButtonText="Non, annuler"
	   confirmButtonText="Oui, supprimer"
	   buttonColor="danger">
		   <p>Vous etes sur le point de supprimer la classe '{props.content.name}' pour l'etablissement {props.content.school_name}. Cela entrainera la perte definitive de toutes les donnes qui lui sont relatives.</p>
        	<p>Etes-vous sur de vouloir continuer ?</p>
	 </EuiConfirmModal>
      )}
    </>
  );
}

export default DashboardContentPanelClass;
