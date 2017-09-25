import React, {
  PureComponent,
} from 'react';

import PropTypes from 'prop-types';

import {
  Set as ImmutableSet,
  Map as ImmutableMap
} from 'immutable';

import MDCComponent from '@material/base/component';

import {
  MDCRipple,
  MDCRippleFoundation,
} from '@material/ripple';

import {
  MDCTab,
  MDCTabFoundation
} from '@material/tabs/tab';

import MDCTabBarFoundation from '@material/tabs/tab-bar/foundation';
import '@material/tabs/dist/mdc.tabs.css';


export default class DynamicTabBar extends React.Component {

  static propTypes = {
    ids: PropTypes.string,
    classes: PropTypes.string,
    activeTabId: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
  }

  static defaultProps = {
    ids: '',
    classes: '',
  }

  state = {
    ids: new ImmutableSet(),
    classes: new ImmutableSet([
      'mdc-tab-bar',
      'mdc-tab-bar--indicator-accent',
    ]),
    activeTabId: this.props.activeTabId,
  }


  /**
   * Fires a cross-browser-compatible custom event from the component root of the given type,
   * with the given data.
   * @param {string} evtType
   * @param {!Object} evtData
   * @param {boolean=} shouldBubble
   */
  emit(evtType, evtData, shouldBubble = false) {
    let evt;
    if (typeof CustomEvent === 'function') {
      evt = new CustomEvent(evtType, {
        detail: evtData,
        bubbles: shouldBubble,
      });
    } else {
      evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(evtType, shouldBubble, false, evtData);
    }

    this.refs.root.dispatchEvent(evt);
  }

  get tabs() {
    return this.tabs_;
  }

  get activeTab() {
    const activeIndex = this.foundation.getActiveTabIndex();
    return this.tabs[activeIndex];
  }

  set activeTab(tab) {
    this.setActiveTab_(tab, false);
  }

  get activeTabIndex() {
    return this.foundation.getActiveTabIndex();
  }

  set activeTabIndex(index) {
    this.setActiveTabIndex_(index, false);
  }

  gatherTabs_(tabFactory) {
    const tabElements = [].slice.call(this.refs.root.querySelectorAll(MDCTabBarFoundation.strings.TAB_SELECTOR));
    return tabElements.map((el) => tabFactory(el));
  }

  setActiveTabIndex_(activeTabIndex, notifyChange) {
    this.foundation.switchToTabAtIndex(activeTabIndex, notifyChange);
  }

  layout() {
    this.foundation.layout();
  }

  setActiveTab_(activeTab, notifyChange) {
    const indexOfTab = this.tabs.indexOf(activeTab);
    if (indexOfTab < 0) {
      throw new Error('Invalid tab component given as activeTab: Tab not found within this component\'s tab list');
    }
    this.setActiveTabIndex_(indexOfTab, notifyChange);
  }

  /*
   *  activeTabId is 1-oriented.
   */
  activeTabId2Index_() {
    return Number(this.state.activeTabId.match(/\d+$/)[0]) - 1;
  }

  // Within the two component lifecycle methods below, we invoke the foundation's lifecycle hooks
  // so that proper work can be performed.
  componentDidMount() {
    this.indicator_ = this.refs.root.querySelector(
        MDCTabBarFoundation.strings.INDICATOR_SELECTOR
    );

    this.tabs_ = this.gatherTabs_((el) => new MDCTab(el));
    this.tabSelectedHandler_ = ({detail}) => {
      const {tab} = detail;
      this.setActiveTab_(tab, true);
    };

    /*
    console.debug(this.tabs_[this.activeTabId2Index_()])
    this.tabs_[this.activeTabId2Index_()].isActive = true;
    console.debug(this.tabs_[this.activeTabId2Index_()])
    */

    /*
     *  this.foundation must be initialized
     *    after initializing this.tabs_ and this.indicator
     */
    this.foundation = new MDCTabBarFoundation({
      addClass: className => this.setState(prevState => ({
        classes: prevState.classes.add(className)
      })),
      removeClass: className => this.setState(prevState => ({
        classes: prevState.classes.remove(className)
      })),
      bindOnMDCTabSelectedEvent: () => this.refs.root.addEventListener(
        MDCTabFoundation.strings.SELECTED_EVENT,
        this.tabSelectedHandler_
      ),
      unbindOnMDCTabSelectedEvent: () => this.refs.root.removeEventListener(
        MDCTabFoundation.strings.SELECTED_EVENT,
        this.tabSelectedHandler_
      ),
      registerResizeHandler: (handler) => window.addEventListener('resize', handler),
      deregisterResizeHandler: (handler) => window.removeEventListener('resize', handler),
      getOffsetWidth: () => this.refs.root.offsetWidth,
      setStyleForIndicator: (propertyName, value) => this.indicator_.style.setProperty(propertyName, value),
      getOffsetWidthForIndicator: () => this.indicator_.offsetWidth,
      notifyChange: (evtData) => this.emit(MDCTabBarFoundation.strings.CHANGE_EVENT, evtData),
      getNumberOfTabs: () => this.tabs.length,
      isTabActiveAtIndex: (index) => this.tabs[index].isActive,
      setTabActiveAtIndex: (index, isActive) => this.tabs[index].isActive = isActive,
      isDefaultPreventedOnClickForTabAtIndex: (index) => this.tabs[index].preventDefaultOnClick,
      setPreventDefaultOnClickForTabAtIndex: (index, preventDefaultOnClick) => this.tabs[index].preventDefaultOnClick = preventDefaultOnClick,
      measureTabAtIndex: (index) => this.tabs[index].measureSelf(),
      getComputedWidthForTabAtIndex: (index) => this.tabs[index].computedWidth,
      getComputedLeftForTabAtIndex: (index) => this.tabs[index].computedLeft,
    });

    let propsIds = this.props.ids.split(' ').filter((v) => !!v);
    let propsIdsSet = new ImmutableSet(propsIds);

    let propsClasses = this.props.classes.split(' ').filter((v) => !!v);
    let propsClassesSet = new ImmutableSet(propsClasses);

    this.setState(prevState => ({
      ids: prevState.ids.union(propsIdsSet),
      classes: prevState.classes.union(propsClassesSet),
    }));

    this.foundation.init();
    this.activeTabIndex = this.activeTabId2Index_();
  }
  componentWillUnmount() {
    this.foundation.destroy();
  }
  /*
   *  DynamicTabBar is rendered at <App />.
   *  DynamicTabBar is adapted to MDCTabBarFoundation
   *    and then, DynamicTabBar's children are MDCTab.
   */
  render() {
    return (
        <nav ref="root"
          id={`${this.state.ids.toJS().join(' ')}`}
          className={`${this.state.classes.toJS().join(' ')}`}
          role="tablist">
          {this.props.children}
        </nav>
    );
  }
}
