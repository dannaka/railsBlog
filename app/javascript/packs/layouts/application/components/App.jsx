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
import DynamicTabPanel from './DynamicTabPanel';

export default class App extends PureComponent {
  static propTypes = {
    activeTabId: PropTypes.string.isRequired,
  }

  state = {
    'activeTabId': this.props.activeTabId,
  }

  get tabDefaultClasses() {
    return "mdc-tab mdc-theme--text-primary-on-primary mdc-ripple-upgraded";
  }

  getTabClasses(tabId) {
    console.debug(this.state.activeTabId);
    return this.tabDefaultClasses + (this.state.activeTabId == tabId ? ' mdc-tab--active' : '');
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
                className={this.getTabClasses('tab-1')}
                activeClassName="mdc-tab--active"
                role="tab"
                aria-controls="panel-1" >
                Blog
              </NavLink>
              <NavLink to="/works"
                id="tab-2"
                className={this.getTabClasses('tab-2')}
                activeClassName="mdc-tab--active"
                role="tab"
                aria-controls="panel-2" >
                Works
              </NavLink>
              <NavLink to="/author"
                id="tab-3"
                className={this.getTabClasses('tab-3')}
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
