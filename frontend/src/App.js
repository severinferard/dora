import './App.css'
import 'antd/dist/antd.css'
import RunPage from './RunSummary/RunPage'
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import NewDashboard from './Dashboard/Dashboard'
import SessionSummary from './TeacherRecap/SessionSummary'
import StudentSummary from './StudentRecap/StudentSummary'
import Settings from './Settings/Settings'
import { Layout, Menu, Divider, Col, Row, Button } from 'antd'
import { SettingOutlined } from "@ant-design/icons";

function App () {
  return (
	<div className='App'>
	  <Layout>
		  <Layout.Header className="header" theme="light">
          <Row>
            <Col span={5}>
              <Row>
                <Col span={23}>
                  <div className="logo-wrapper">
                    <a className="logo" href="#">DORA</a>
                  </div>
                </Col>
                <Col span={1}>
                  <Divider orientation="center" type="vertical"></Divider>
                </Col>
              </Row>
            </Col>
            <Col span={17}>
              <Menu theme="light" mode="horizontal" defaultSelectedKeys={["1"]}>
                <Menu.Item key="1">Data</Menu.Item>
              </Menu>
            </Col>
			<Col span={1}>
				v {process.env.REACT_APP_VERSION}
            </Col>
            <Col span={1}>
              <Button icon={<SettingOutlined />} type="link" onClick={() => {window.location.href = "#/settings"}}/>
            </Col>
          </Row> 
        </Layout.Header>
      <HashRouter>
        <Switch>
          <Route exact path='/'>
            <Redirect to='/dashboard' />
          </Route>
          <Route path='/dashboard' component={NewDashboard} />
          <Route exact path='/run/:session_id/:run_id' component={RunPage} />
          <Route
            exact
            path='/session-summary/:session_id'
            component={SessionSummary}
          />
          <Route
            exact
            path='/student-summary/:student_id'
            component={StudentSummary}
          />
          <Route exact path='/settings' component={Settings} />
        </Switch>
      </HashRouter>
	  </Layout>
	  </div>
  )
}

export default App
