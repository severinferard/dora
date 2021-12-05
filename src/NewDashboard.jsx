import { Layout, Menu, Breadcrumb, Tree, Divider, Row, Col, Button, Spin } from "antd";
import "./NewDashboard.css";
import { UserOutlined, LaptopOutlined, NotificationOutlined, SettingOutlined } from "@ant-design/icons";
import MyTree from "./NewTree";
import EmptyContentPanel from "./NewEmptyContentPanel";
import SchoolContentPanel from "./NewSchoolContentPanel";
import ClassContentPanel from "./NewClassContentPanel";
import SessionContentPanel from "./NewSessionContentPanel";
import { useState, useEffect } from "react";
import useDeepCompareEffect from "use-deep-compare-effect";
import { useLocation } from "react-router-dom";
const { SubMenu } = Menu;
const { Header, Content, Sider } = Layout;

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Dashboard = () => {
  const [treeData, setTreeData] = useState([]);
  const [treeNodeSelected, setTreeNodeSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelShown, setPanelShown] = useState(null);
  const [panelData, setPanelData] = useState(null);
  const query = useQuery();

  const queryPanelData = (type, id) => {
    if (type === "school") {
      for (const school of treeData) {
        if (school._id == id) {
          setPanelData(school);
          return;
        }
      }
    } else if (type === "class") {
      for (const school of treeData) {
        for (const clss of school.classes) {
          if (clss._id == id) {
            setPanelData(clss);
            return;
          }
        }
      }
    } else if (type === "session") {
      for (const school of treeData) {
        for (const clss of school.classes) {
          for (const session of clss.sessions) {
            if (session._id == id) {
              setPanelData(session);
              return;
            }
          }
        }
      }
    }
  };

  useEffect(() => {
    const panel = query.get("panel");
    const id = query.get("id");
	console.log("id", id);
    if (panel) {
      setPanelShown(panel);
      queryPanelData(panel, id);
    } else {
      setPanelShown(null);
    }
  }, [query]);

  const loadTree = () => {
    fetch(`/api/schools/`, { method: "GET" })
      .then((res) => res.json())
      .then((response) => {
        console.log(response);
        setTreeData(response);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTree();
  }, []);

  useDeepCompareEffect(() => {
    console.log("useDeepCompareEffect");
    // Update the data for the curerntly displayed panel;
    if (panelData === null) return;
    if (panelShown === "school") {
      for (const school of treeData) {
        if (school._id == panelData._id) {
          setPanelData(school);
          return;
        }
      }
    } else if (panelShown === "class") {
      for (const school of treeData) {
        for (const clss of school.classes) {
          if (clss._id == panelData._id) {
            setPanelData(clss);
            return;
          }
        }
      }
    } else if (panelShown === "session") {
      for (const school of treeData) {
        for (const clss of school.classes) {
          for (const session of clss.sessions) {
            if (session._id == panelData._id) {
              setPanelData(session);
              return;
            }
          }
        }
      }
    }

    // The element displayed has just been deleted
    window.location.href = `/#/dashboard/`;
  }, [treeData]);

  const getSessionFromRun = (run_id) => {
	for (const school of treeData) {
        for (const clss of school.classes) {
          for (const session of clss.sessions) {
            for (const run of session.runs) {
				if (run._id === run_id)
					return session
			}
          }
        }
      }
  }

  const onNodeSelected = (type, id) => {
    if (!type)
      window.location.href = `/#/dashboard/`;
    else if (type === "run")
		window.location.href = `/#/run/${getSessionFromRun(id)._id}/${id}`;
	else
    	window.location.href = `/#/dashboard?panel=${type}&id=${id}`;
    // setPanelShown(type);
    // setPanelData(node ? node.data : null);
  };

  return (
    <>
      <Layout>
        <Header className="header" theme="light">
          <Row>
            <Col span={5}>
              <Row>
                <Col span={23}>
                  <div>
                    <span className="logo">DORA</span>
                  </div>
                </Col>
                <Col span={1}>
                  <Divider orientation="center" type="vertical"></Divider>
                </Col>
              </Row>
            </Col>
            <Col span={18}>
              <Menu theme="light" mode="horizontal" defaultSelectedKeys={["1"]}>
                <Menu.Item key="1">Data</Menu.Item>
                <Menu.Item key="2">Terrain</Menu.Item>
              </Menu>
            </Col>
            <Col span={1}>
              <Button type="primary" icon={<SettingOutlined />} type="link" onClick={() => {window.location.href = "#/settings"}}/>
            </Col>
          </Row> 
        </Header>
        <Row className="main-wrapper">
          <Col span={5}>
            <Row style={{ height: "100%" }}>
              <Col span={23}>
                <div className="tree-wrapper">
                  <MyTree treeData={treeData} onNodeSelected={onNodeSelected} selected={query.get("id")}></MyTree>
                </div>
              </Col>
              <Col span={1}>
                <Divider type="vertical"></Divider>
              </Col>
            </Row>
          </Col>
          <Col span={19}>
            <div className="content-panel-wrapper">
				{loading && <Spin size="large"></Spin>}
              {!loading && (
                <div className="content-panel">
                  {panelShown === null && <EmptyContentPanel onUpdate={loadTree}></EmptyContentPanel>}
                  {panelShown === "school" && <SchoolContentPanel onUpdate={loadTree} data={panelData}></SchoolContentPanel>}
                  {panelShown === "class" && <ClassContentPanel onUpdate={loadTree} data={panelData}></ClassContentPanel>}
                  {panelShown === "session" && <SessionContentPanel onUpdate={loadTree} data={panelData}></SessionContentPanel>}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Layout>
    </>
  );
};

export default Dashboard;
