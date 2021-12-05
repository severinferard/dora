import React, { useState } from "react";
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
} from "@elastic/eui";
import DashboardContentPanelSchool from "./DashboardContentPanelSchool";
import DashboardContentPanelClass from "./DashboardContentPanelClass";
import DashboardContentPanelSession from "./DashbordContentPanelSession.jsx";

function DashboardContentPanel(props) {
  const [modalShown, setModalShown] = useState(false);
  const [modalData, setModalData] = useState({ name: "", city: "" });

  const sendForm = () => {
    fetch("/api/schools/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modalData),
    }).then((res) => {
      if (res.status == 200) {
        props.onUpdate();
      }
    });
  };

  return (
    <EuiPanel paddingSize="m" style={{ textAlign: "left" }}>
      {props.contentType === "" && (
        <EuiEmptyPrompt
          iconType="dataVisualizer"
          iconColor="default"
          title={<h2>Auncune donnés selectionnée</h2>}
          titleSize="xs"
          body={
            <>
              <p>
                Selectionez une école, une classe ou une séance dans l'arbre present a gauche pour obtenir des informations sur celles-ci.
              </p>
              <p>You&rsquo;ll need spice to rule Arrakis, young Atreides.</p>
            </>
          }
          actions={
            <EuiButton
              size="s"
              color="primary"
              fill
              onClick={(e) => {
                setModalShown(true);
              }}
            >
              Ajouter une école
            </EuiButton>
          }
        />
      )}
      {modalShown && (
        <EuiModal
          onClose={(e) => {
            setModalShown(false);
          }}
        >
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h1>Nouvel Etablissement</h1>
            </EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>
            <EuiForm id="" component="form">
              <EuiFormRow label="Nom de l'etablissement">
                <EuiFieldText
                  name="popfirst"
                  value={modalData.name}
                  onChange={(e) => {
                    setModalData({ name: e.target.value, city: modalData.city });
                  }}
                />
              </EuiFormRow>
              <EuiFormRow label="Ville">
                <EuiFieldText
                  name="popfirst"
                  value={modalData.city}
                  onChange={(e) => {
                    setModalData({ name: modalData.name, city: e.target.value });
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
                console.log(modalData.name, modalData.city);
                sendForm();
              }}
              fill
            >
              Ajouter
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}
      {props.contentType === "school" && <DashboardContentPanelSchool content={props.content} onUpdate={props.onUpdate}></DashboardContentPanelSchool>}
      {props.contentType === "class" && <DashboardContentPanelClass content={props.content} onUpdate={props.onUpdate}></DashboardContentPanelClass>}
      {props.contentType === "session" && <DashboardContentPanelSession content={props.content} onUpdate={props.onUpdate}></DashboardContentPanelSession>}
    </EuiPanel>
  );
}

export default DashboardContentPanel;
