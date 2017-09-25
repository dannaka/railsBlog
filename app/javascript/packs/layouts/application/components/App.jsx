import React, {
  PureComponent,
} from 'react';

import PropTypes from 'prop-types';

import {
  BrowserRouter as Router,
  Route,
  Link,
  NavLink,
  Switch,
} from 'react-router-dom';

import DynamicTabBar from './DynamicTabBar';
//import DynamicTab from './DynamicTab';
import DynamicTabPanel from './DynamicTabPanel';

export default class App extends PureComponent {
  static propTypes = {
    activeTabId: PropTypes.string.isRequired,
  }

  state = {
    'activeTabId': this.props.activeTabId,
  }

  render() {
    return (
      <Router>
        <header>
          <section id="dynamic-nav-bar" className="mdc-theme--primary-bg">
            <DynamicTabBar ids="dynamic-tab-bar"
              activeTabId={this.state.activeTabId} >
              <NavLink to="/articles"
                id="tab-1"
                className="mdc-tab mdc-tab--active mdc-theme--text-primary-on-primary mdc-ripple-upgraded"
                activeClassName="mdc-tab--active"
                role="tab"
                aria-controls="panel-1" >
                Blog
              </NavLink>
              <NavLink to="/works"
                id="tab-2"
                className="mdc-tab mdc-theme--text-primary-on-primary mdc-ripple-upgraded"
                activeClassName="mdc-tab--active"
                role="tab"
                aria-controls="panel-2" >
                Works
              </NavLink>
              <NavLink to="/author"
                id="tab-3"
                className="mdc-tab mdc-theme--text-primary-on-primary mdc-ripple-upgraded"
                activeClassName="mdc-tab--active"
                role="tab"
                aria-controls="panel-3" >
                Author
              </NavLink>
              <span className="mdc-tab-bar__indicator"></span>
            </DynamicTabBar>
          </section>
          <section id="dynamic-panel">
            <DynamicTabPanel ids="panel-1" />
            <DynamicTabPanel ids="panel-2" />
            <DynamicTabPanel ids="panel-3" />
          </section>
        </header>
      </Router>
    );
  }
}
