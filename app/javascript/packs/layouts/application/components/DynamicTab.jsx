import React, {
   PureComponent,
 } from 'react';

import PropTypes from 'prop-types';

import { NavLink } from 'react-router-dom';

import {
  Set as ImmutableSet,
  Map as ImmutableMap
} from 'immutable';

import {
  MDCRipple,
  MDCRippleFoundation,
  util,
} from '@material/ripple';

import { cssClasses } from '@material/tabs/tab/constants';
import MDCTabFoundation from '@material/tabs/tab/foundation';

import '@material/tabs/dist/mdc.tabs.css';

const MATCHES = util.getMatchesProperty(HTMLElement.prototype);

export default class DynamicTab extends React.Component {

  static propTypes = {
    ids: PropTypes.string,
    classes: PropTypes.string,
    activeTabId: PropTypes.string.isRequired,
  }

  static defaultProps = {
    ids: '',
    classes: '',
  }

  state = {
    ids: new ImmutableSet(),
    classes: new ImmutableSet([
      'mdc-tab'
    ]),
    rippleCss: new ImmutableMap(),
  }

  foundation = new MDCTabFoundation({
      addClass: className => this.setState(prevState => ({
        classes: prevState.classes.add(className)
      })),
      removeClass: className => this.setState(prevState => ({
        classes: prevState.classes.remove(className)
      })),
      registerInteractionHandler: (type, handler) => {
        this.refs.root.addEventListener(type, handler)
      },
      deregisterInteractionHandler: (type, handler) => {
        this.refs.root.removeEventListener(type, handler)
      },
      getOffsetWidth: () => this.refs.root.offsetWidth,
      getOffsetLeft: () => this.refs.root.offsetLeft,
      notifySelected: () => this.emit(
        MDCTabFoundation.strings.SELECTED_EVENT,
        {tab: this},
        true
      ),
  });

  rippleFoundation = new MDCRippleFoundation(
    Object.assign(MDCRipple.createAdapter(this), {
      browserSupportsCssVars: () => util.supportsCssVariables(window),
      isUnbounded: () => false,
      isSurfaceActive: () => this.refs.root[MATCHES](':active'),
      isSurfaceDisabled: () => false,
      addClass: className => this.setState(prevState=> ({
        classes: prevState.classes.add(className)
      })),
      removeClass: className => this.setState(prevState => ({
        classes: prevState.classes.remove(className)
      })),
      registerInteractionHandler: (type, handler) => {
        this.refs.root.addEventListener(type, handler, util.applyPassive())
      },
      deregisterInteractionHandler: (type, handler) => {
        this.refs.root.removeEventListener(type, handler, util.applyPassive())
      },
      registerResizeHandler: (handler) => {
        window.addEventListener('resize', handler)
      },
      deregisterResizeHandler: (handler) => {
        window.removeEventListener('resize', handler)
      },
      updateCssVariable: (varName, value) => {
        this.setState(prevState => ({
          rippleCss: prevState.rippleCss.set(varName, value)
        }));
      },
      computeBoundingRect: () => this.refs.root.getBoundingClientRect(),
      getWindowPageOffset: () => ({x: window.pageXOffset, y: window.pageYOffset}),
    })
  );

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

  get computedWidth() {
    return this.foundation.getComputedWidth();
  }

  get computedLeft() {
    return this.foundation.getComputedLeft();
  }

  get isActive() {
    return this.foundation.isActive();
  }

  set isActive(isActive) {
    this.foundation.setActive(isActive);
  }

  get preventDefaultOnClick() {
    return this.foundation.preventsDefaultOnClick();
  }

  set preventDefaultOnClick(preventDefaultOnClick) {
    this.foundation.setPreventDefaultOnClick(preventDefaultOnClick);
  }

  componentDidMount() {
    let propsIds = this.props.ids;
    propsIds = propsIds.split(' ').filter((v) => !!v);
    let propsIdsSet = new ImmutableSet(propsIds);

    let propsClasses = this.props.classes;
    propsClasses = propsClasses.split(' ').filter((v) => !!v);
    let propsClassesSet = new ImmutableSet(propsClasses);

    this.setState(prevState => ({
      ids: prevState.ids.union(propsIdsSet),
      classes: prevState.classes.union(propsClassesSet),
    }));

    this.foundation.init();
    this.rippleFoundation.init();
  }

  componentWillUnmount() {
    this.rippleFoundation.destroy();
    this.foundation.destroy();
  }

  componentDidUpdate() {
    if(this.refs.root) {
      this.state.rippleCss.forEach((v, k) => {
        this.refs.root.style.setProperty(k, v);
      });
    }
  }

  initialSyncWithDOM() {
    this.isActive = this.refs.root.classList.contains(cssClasses.ACTIVE);
  }

  measureSelf() {
    this.foundation.measureSelf();
  }

  render() {
    return (
        <div ref="root"
          id={`${this.state.ids.toJS().join(' ')}`}
          className={`${this.state.classes.toJS().join(' ')}`}
          >
          <NavLink to={this.props.to}
            role="tab"
            aria-controls={this.props.panelId} >
            {this.props.linkText}
          </NavLink>
        </div>
    );
  }
}
