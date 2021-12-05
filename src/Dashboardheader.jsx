import React from 'react';
import '@elastic/eui/dist/eui_theme_light.css';
import {
  EuiHeader,
  EuiHeaderLogo,
  EuiHeaderLinks,
  EuiHeaderLink,
} from '@elastic/eui';


function Dashboard() {
	const renderLogo = (
	  <EuiHeaderLogo
		iconType="logoElastic"
		href="#"
		onClick={(e) => e.preventDefault()}
		aria-label="Go to home page"
	  >DORA</EuiHeaderLogo>
	);

  
	const breadcrumbs = [
	  {
		text: 'Dashbord',
		href: '#',
		onClick: (e) => {
		  e.preventDefault();
		},
	  },
	];
  
	const renderLinks = (
		<EuiHeaderLinks>
		<EuiHeaderLink href="" iconType="help">Aide</EuiHeaderLink>
		<EuiHeaderLink href="" iconType="advancedSettingsApp">Reglages</EuiHeaderLink>
	  </EuiHeaderLinks>
	);
  
	const sections = [
	  {
		items: [renderLogo],
		borders: 'right',
		breadcrumbs: breadcrumbs,
		breadcrumbProps: {
		  'aria-label': 'Header sections breadcrumbs',
		},
	  },
	  {
		items: [renderLinks],
	  },
	];
  
	return <EuiHeader sections={sections} />;
  };

export default Dashboard;
