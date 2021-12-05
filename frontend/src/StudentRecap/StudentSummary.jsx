import { useState, useEffect } from "react";
import {
  PageHeader,
  Descriptions,
  Row,
  Col,
  Card,
  Tabs,
  Alert,
} from "antd";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useParams } from "react-router-dom";
import "./StudentSummary.css";

const StudentSummary = (props) => {
  const { student_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState();

  const loadData = () => {
    fetch(`/api/student-summary/${student_id}`, { method: "GET" })
      .then((res) => res.json())
      .then((response) => {
        console.log("received data", response);
        setData(response);
        setLoading(false);
        console.log(response);
      });
  };

  const getFullName = (student) => {
    return `${student.firstName} ${student.lastName}`;
  };

  useEffect(() => {
    loadData();
	// eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="run-page-wrapper">
      {!loading && (
        <div className="run-page-container">
          <PageHeader onBack={() => window.history.back()} title={getFullName(data.student)} subTitle="résumé">
            <Descriptions size="small" column={3}>
              <Descriptions.Item label="Ecole">{data.school_name}</Descriptions.Item>
              <Descriptions.Item label="Classe">{data.class_name}</Descriptions.Item>
              <Descriptions.Item label="Séances">{data.runs.length}</Descriptions.Item>
            </Descriptions>
          </PageHeader>
          {!loading && data.runs.length === 0 && (
            <Alert message="Aucune course associée" description="Auncune course n'a été associée à cet élève. Pour associer une course à un élève, rendez-vous sur la page de la course et selectionez un élève dans le menu déroulant en bas de celle-ci." type="warning" showIcon />
          )}
          <Row style={{ width: "100%", height: 400, marginTop: 10, maxHeight: 500 }}>
            <Col span={24} style={{ height: "100%" }}>
              <Card id="run-graph" title="Courses" size="small">
                <Tabs defaultActiveKey="1" onChange={() => {}}>
                  <Tabs.TabPane tab="Balises" key="1">
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.runs.map((run) => ({
                            name: run.session_name,
                            beacons: run.beacons.filter((b) => b.valided).length,
                          }))}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                          maxBarSize={60}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="beacons" fill="#8884d8" name="Balises validées" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Distance" key="2">
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.runs.map((run) => ({
                            name: run.session_name,
                            distance: run.distance,
                          }))}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                          maxBarSize={60}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="distance" fill="#8884d8" name="Distance parcourue (m)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Temps" key="3">
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.runs.map((run) => ({
                            name: run.session_name,
                            time: (run.time / 60).toFixed(1),
                          }))}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                          maxBarSize={60}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="time" fill="#8884d8" name="Temps (min)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Vitesse" key="4">
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.runs.map((run) => ({
                            name: run.session_name,
                            speed: run.avgSpeed.toFixed(1),
                          }))}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                          maxBarSize={60}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="speed" fill="#8884d8" name="Vitesse moyenne (km/h)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Tabs.TabPane>
                </Tabs>
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default StudentSummary;
