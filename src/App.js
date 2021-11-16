import './App.css'
import DashBoard from './Dashboard'
import RunPage from "./NewRunPage"
import { BrowserRouter, HashRouter, Switch, Route, Redirect } from 'react-router-dom'
import NewDashboard from "./NewDashboard"

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
        </Switch>
      </HashRouter>
    </div>
  )
}

export default App
