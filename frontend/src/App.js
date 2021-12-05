import './App.css'
import 'antd/dist/antd.css';
import RunPage from "./RunSummary/RunPage"
import { HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import NewDashboard from "./Dashboard/Dashboard"
import SessionSummary from './TeacherRecap/SessionSummary'
import StudentSummary from './StudentRecap/StudentSummary'
import Settings from './Settings/Settings'

function App () {
  return (
    <div className='App'>
      <HashRouter>
        <Switch>
          <Route exact path='/'>
            <Redirect to='/dashboard' />
          </Route>
          <Route path='/dashboard' component={NewDashboard} />
		  <Route exact path='/run/:session_id/:run_id' component={RunPage} /> 
		  <Route exact path='/session-summary/:session_id' component={SessionSummary} />
		  <Route exact path='/student-summary/:student_id' component={StudentSummary} /> 
		  <Route exact path='/settings' component={Settings} /> 
        </Switch>
      </HashRouter>
    </div>
  )
}

export default App
