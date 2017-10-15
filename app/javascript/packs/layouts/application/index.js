import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';


var current = location.pathname;
current = current.toLowerCase();

function getActiveTabId() {

  let activeTabId = 'tab-1';
  if (current === '/') {
    activeTabId = 'tab-1';
  } else if (current.substr(0, "/articles".length) == "/articles"){
    activeTabId = 'tab-1';
  } else if (current.substr(0, "/works".length) == "/works") {
    activeTabId = 'tab-2';
  } else if (current.substr(0, "/author".length) == "/author") {
    activeTabId = 'tab-3';
  } else {
    activeTabId = 'tab-1';
  }
  return activeTabId;
}

if(current != '/firework'){
  ReactDOM.render(<App activeTabId={getActiveTabId()}/>, document.getElementById('root'));
}
