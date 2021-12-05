import React, { useEffect, useState } from "react";
import "@elastic/eui/dist/eui_theme_light.css";
import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiNotificationEvent } from "@elastic/eui";
import DashboardHeader from "./Dashboardheader";
import DashboardTree from "./DashboardTree";
import DashboardContentPanel from "./DashboardContentPanel";
import "./Dashboard.css";
import useDeepCompareEffect from 'use-deep-compare-effect'
import { Button } from 'antd';
import 'antd/dist/antd.css';

const loadClassSessions = (classId) => {
  fetch(`/api/sessions?class_id=${classId}`, { method: "GET" })
    .then((res) => res.json())
    .then((response) => {
      console.log("hello", response.sessions);
      return response.sessions;
    });
};

function Dashboard() {
  const [treeData, setTreeData] = useState([]);
  const [panelDisplayed, setPanelDisplayed] = useState("");
  const [panelContent, setPanelContent] = useState({});

  const fetchData = () => {
    fetch(`/api/schools/`, { method: "GET" })
      .then((res) => res.json())
      .then((response) => {
        console.log(response);
        setTreeData(response);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);


  useDeepCompareEffect(() => { // Update the data for the curerntly displayed panel
	console.log("tree data changed")
	console.log("current panel id", panelContent._id)
	if (panelDisplayed === "school") {
		treeData.forEach(school => {
			console.log("searching", school._id)
			if (school._id == panelContent._id) {
				setPanelContent(school)
				return 
			}
		})
	} else if (panelDisplayed === 'class') {
		console.log("TEST", panelContent)
		treeData.forEach(school => {
			school.classes.forEach(clss => {
				if (clss._id == panelContent._id) {
					setPanelContent(clss)
					return
				}
			})
		})
	}
	setPanelContent({})
	setPanelDisplayed("")
  }, [treeData])

  const onNodeClick = (type, node) => {
	  if (type === 'run')
	  	window.location =`/runsummary?session=${node.session_id}&id=${node._id}`
    setPanelDisplayed(type);
    setPanelContent(node);
  };

  const onClickOut = () => {
    setPanelDisplayed("");
    setPanelContent({});
  };

  return (
    <div className="container">
      <div className="wrapper">
        <DashboardHeader></DashboardHeader>
      </div>
      <div className="bottom">
        <EuiFlexGroup style={{ height: "100%" }}>
          <EuiFlexItem grow={false} style={{ marginRight: "6px" }}>
            <DashboardTree treeData={treeData} onNodeClick={onNodeClick} onClickOut={onClickOut}></DashboardTree>
          </EuiFlexItem>
          <EuiFlexItem style={{ marginLeft: "6px" }}>
            <DashboardContentPanel contentType={panelDisplayed} content={panelContent} onUpdate={fetchData}></DashboardContentPanel>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
      <EuiPanel
        paddingSize="none"
        hasShadow={true}
        style={{ maxWidth: "400px", position: "absolute", bottom: "20px", right: "20px", zIndex: "99" }}
      >
        {/* <EuiNotificationEvent
          id={"reportNotificationEventId"}
          type="Info"
          badgeColor="green"
          iconType="logoKibana"
          iconAriaLabel="Kibana"
          time="1 min ago"
          title="Une nouvelle course vient d'etre enregistree"
          primaryAction="Download"
          primaryActionProps={{
            iconType: "download",
          }}
          messages={["The reported was generated at 17:12:16 GMT+4"]}
          isRead={true}
          onRead={() => {}}
          onOpenContextMenu={() => {}}
          onClickPrimaryAction={() => {}}
          onClickTitle={() => {}}
        /> */}
      </EuiPanel>
    </div>
  );
}

export default Dashboard;
