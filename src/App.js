import './App.css'
import DashBoard from './Dashboard'
import RunPage from "./NewRunPage"
import { BrowserRouter, HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import NewDashboard from "./NewDashboard"
import SessionSummary from './NewSessionSummary'
import StudentSummary from './NewStudentSummary'
import Settings from './NewSettings'

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
