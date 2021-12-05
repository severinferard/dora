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
} from "@elastic/eui";
import useDeepCompareEffect from "use-deep-compare-effect";

function DashboardContentPanelSchool(props) {
  const [modalShown, setModalShown] = useState(false);
  const [classArray, setClassArray] = useState([]);
  const [modalData, setModalData] = useState({ name: "" });
  const [deleteModal, setDeleteModal] = useState(false);

  const sendNewClassForm = () => {
    fetch(`/api/classes/${props.content._id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modalData),
    }).then((res) => {
      if (res.status == 200) {
        console.log("New class successfully added");
        props.onUpdate();
      }
    });
  };

  const sendDeleteSchoolForm = () => {
	setDeleteModal(false);
	fetch(`/api/schools/${props.content._id}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "",
    }).then((res) => {
      if (res.status == 200) {
        console.log("School successfully deleted");
        props.onUpdate();
      }
    });
  }

  useDeepCompareEffect(() => {
    console.log("Props.content changed");
    setClassArray(
      props.content.classes.map((clss) => {
        return {
          label: clss.name,
          id: clss._id,
          href: "#",
          onClick: (e) => {
            console.log("is that a callback ?", clss._id);
          },
        };
      })
    );
  }, [props.content]);

  return (
    <>
      <>
        <EuiPageHeader
          pageTitle={props.content.name}
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
              Nouvelle Classe
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
        <EuiListGroup maxWidth="60%" listItems={classArray} />
      </>
      {modalShown && (
        <EuiModal
          onClose={(e) => {
            setModalShown(false);
          }}
        >
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h1>Nouvelle Classe</h1>
            </EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            <EuiForm id="" component="form">
              <EuiFormRow label="Nom de la classe">
                <EuiFieldText
                  name="popfirst"
                  value={modalData.name}
                  onChange={(e) => {
                    setModalData({ name: e.target.value });
                  }}
                />
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
                sendNewClassForm();
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
	   onConfirm={() => sendDeleteSchoolForm()}
	   cancelButtonText="Non, annuler"
	   confirmButtonText="Oui, supprimer"
	   buttonColor="danger">
		   <p>Vous etes sur le point de supprimer l'etablissement '{props.content.name}'. Cela entrainera la perte definitive de toutes les donnes qui lui sont relatives.</p>
        	<p>Etes-vous sur de vouloir continuer ?</p>
	 </EuiConfirmModal>
      )}
    </>
  );
}

export default DashboardContentPanelSchool;
