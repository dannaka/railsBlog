import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

function getActiveTabId() {
  let current = location.pathname;
  current = current.toLowerCase();

  let activeTabId = 'tab-1';
  if (current === '/') {
    activeTabId = 'tab-1';
  } else if (current.substr(0, "/articles".length) == "/articles"){
    activeTabId = 'tab-1';
  } else if (currnet.substr(0, "/works".length) == "/works") {
    activeTabId = 'tab-2';
  } else if (current.substr(0, "/author".length) == "/author") {
    activeTabId = 'tab-3';
  }
  return activeTabId;
}

ReactDOM.render(<App activeTabId={getActiveTabId()}/>, document.getElementById('root'));
