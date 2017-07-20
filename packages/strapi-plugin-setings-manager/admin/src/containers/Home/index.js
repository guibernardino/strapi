/*
 *
 * Home
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createStructuredSelector } from 'reselect';
import { findKey, includes, get, toNumber, isObject, find } from 'lodash';
import { FormattedMessage } from 'react-intl';
import Helmet from 'react-helmet';
import { router } from 'app';

// design
import ContentHeader from 'components/ContentHeader';
import EditForm from 'components/EditForm';
import HeaderNav from 'components/HeaderNav';
import List from 'components/List';

import { makeSelectSections, makeSelectEnvironments } from 'containers/App/selectors';
import selectHome from './selectors';
import { configFetch, changeInput, cancelChanges, submitChanges, languagesFetch } from './actions'
import styles from './styles.scss';
import config from './config.json';

export class Home extends React.Component { // eslint-disable-line react/prefer-stateless-function

  constructor(props) {
    super(props);
    this.customComponents = config.customComponents;
    this.components = {
      editForm: EditForm,
      list: List,
      defaultComponent: HeaderNav, // TODO change to default
    };
  }

  componentDidMount() {
    if (this.props.params.slug) {
      if (this.props.params.slug !== 'languages') {
        const apiUrl = this.props.params.env ? `${this.props.params.slug}/${this.props.params.env}` : this.props.params.slug;
        this.props.configFetch(apiUrl);
      } else {
        this.props.languagesFetch();
      }
    } else {
      router.push(`/plugins/settings-manager/${get(this.props.menuSections, ['0', 'items', '0', 'slug'])}`);
    }
  }


  componentWillReceiveProps(nextProps) {
    // check if params slug updated
    if (this.props.params.slug !== nextProps.params.slug && nextProps.params.slug) {
      if (nextProps.params.slug) {
        // get data from api if params slug updated
        if (nextProps.params.slug !== 'languages') {
          const apiUrl = nextProps.params.env ? `${nextProps.params.slug}/${nextProps.params.env}` : nextProps.params.slug;
          this.props.configFetch(apiUrl);
        } else {
          this.props.languagesFetch();
        }

      } else {
        // redirect user if no params slug provided
        router.push(`/plugins/settings-manager/${get(this.props.menuSections, ['0', 'items', '0', 'slug'])}`);
      }
    } else if (this.props.params.env !== nextProps.params.env && nextProps.params.env && this.props.params.env) {
      // get data if params env updated
      this.props.configFetch(`${this.props.params.slug}/${nextProps.params.env}`);
    }

  }

  handleChange = ({ target }) => {
    const value = target.type === 'number' ? toNumber(target.value) : target.value;
    this.props.changeInput(target.name, value);
  }

  handleCancel = () => {
    this.props.cancelChanges();
  }

  handleSubmit = () => {
    this.props.submitChanges();
  }

  // custom Row rendering for the component List
  renderRowLanguage = (props, key) => {
    const deleteIcon = props.active ? '' : <i className="fa fa-trash" />;
    const languageLabel = props.active ? 'default language' : 'set to default';
    const languageObject = find(get(this.props.home.allLanguages, ['sections', '0', 'items', '0', 'items']), ['value', props.name]);
    const languageDisplay = isObject(languageObject) ? <FormattedMessage {...{ id: languageObject.name }} /> : '';
    return (
      <tr key={key}>
        <th>{key}</th>
        <td>{languageDisplay}</td>
        <td>{props.name}</td>
        <td>{languageLabel}</td>
        <td>{deleteIcon}</td>
      </tr>
    );
  }

  renderListTitle = () => {
    const availableContentNumber = this.props.home.configsDisplay.sections.length;
    const title = availableContentNumber > 1 ? `list.${this.props.params.slug}.title.plural` : `list.${this.props.params.slug}.title.singular`;
    const titleDisplay = title ? <FormattedMessage {...{id: title}} /> : '';
    return <span>{availableContentNumber}&nbsp;{titleDisplay}</span>
  }

  renderListButtonLabel = () => `list.${this.props.params.slug}.button.label`;

  renderComponent = () => {
    // check if  settingName (params.slug) has a custom view display
    const specificComponent = findKey(this.customComponents, (value) => includes(value, this.props.params.slug)) ?
      findKey(this.customComponents, (value) => includes(value, this.props.params.slug)) : 'defaultComponent';
    // if custom view display render specificComponent
    const Component = this.components[specificComponent];
    const renderRow = this.props.params.slug === 'languages' ? this.renderRowLanguage : false;
    const listTitle = this.props.params.slug === 'languages' ? this.renderListTitle() : '';
    const listButtonLabel = this.props.params.slug === 'languages' ? this.renderListButtonLabel() : '';

    return (
      <Component
        sections={this.props.home.configsDisplay.sections}
        values={this.props.home.modifiedData}
        handleChange={this.handleChange}
        handleCancel={this.handleCancel}
        handleSubmit={this.handleSubmit}
        links={this.props.environments}
        path={this.props.location.pathname}
        slug={this.props.params.slug}
        renderRow={renderRow}
        listTitle={listTitle}
        listButtonLabel={listButtonLabel}
        handlei18n
      />
    );
  }

  render() {
    if (this.props.home.loading) {
      return <div />;
    }

    return (
      <div className={`${styles.home} col-md-9`}>
        <Helmet
          title="Home"
          meta={[
            { name: 'description', content: 'Description of Home' },
          ]}
        />
        <ContentHeader
          name={this.props.home.configsDisplay.name}
          description={this.props.home.configsDisplay.description}
        />
        {this.renderComponent()}
      </div>
    );
  }
}


const mapStateToProps = createStructuredSelector({
  environments: makeSelectEnvironments(),
  home: selectHome(),
  menuSections: makeSelectSections(),
})

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      cancelChanges,
      changeInput,
      configFetch,
      languagesFetch,
      submitChanges,
    },
    dispatch
  )
}

Home.propTypes = {
  cancelChanges: React.PropTypes.func,
  changeInput: React.PropTypes.func,
  configFetch: React.PropTypes.func.isRequired,
  environments: React.PropTypes.array,
  home: React.PropTypes.object,
  languagesFetch: React.PropTypes.func,
  location: React.PropTypes.object,
  menuSections: React.PropTypes.array,
  params: React.PropTypes.object.isRequired,
  submitChanges: React.PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
