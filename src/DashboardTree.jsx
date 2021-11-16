import { EuiIcon, EuiTreeView, EuiToken, EuiPanel } from "@elastic/eui";
import React, { useEffect, useState } from "react";
import "./DashboardTree.css";

let DashboardTree = (props) => {
  const [treeContent, setTreecontent] = useState([]);

  useEffect(() => {
    setTreecontent(
      props.treeData.map((school) => {
        let schoolChildren = school.classes.map((clss) => {
			let classChildren = clss.sessions.map(sess => {
				let sessionChildren = sess.runs.map(run => {
					return {
						label: run.id,
						id: run._id,
						callback: () => {
							props.onNodeClick("run", {...run, session_id: sess._id});
						  },
					}
				})
				return {
					label: sess.session_name,
					id: sess._id,
					children: sessionChildren,
					callback: () => {
						props.onNodeClick("session", sess);
					  },
				}
			})
          return {
            label: clss.name,
            id: clss._id,
            children: classChildren,
            callback: () => {
              props.onNodeClick("class", clss);
            },
          };
        });
        return {
          label: school.name,
          id: school._id,
          children: schoolChildren,
          isExpanded: true,
          callback: () => {
            props.onNodeClick("school", school);
          },
        };
      })
    );
  }, [props.treeData, props.onNodeClick]);

  const onPanelClick = (e) => {
    if (e.target.nodeName === "DIV") props.onClickOut();
  };

  return (
    <EuiPanel
      element="div"
      paddingSize="m"
      style={{ height: "100%", width: "20rem" }}
      onClick={(e) => {
        onPanelClick(e);
      }}
    >
      <EuiTreeView showExpansionArrows={true} items={treeContent} aria-label="Sample Folder Tree" />
    </EuiPanel>
  );
};

export default DashboardTree;
