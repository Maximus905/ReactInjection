import React, { PureComponent, Fragment} from 'react'
import PropTypes from 'prop-types'
import {FormControl, ControlLabel, FormGroup} from 'react-bootstrap'
import check from 'check-types'
import axios from "axios"

class Select extends PureComponent {

    state = {
        value: '',
        isLoading: false,
        optionsInvalidate: true,
        filter: {}
    }
    optionList = []

    setDefaultSelected = ((prevValue) => (value) => {
        if (!value || this.state.optionsInvalidate || this.state.isLoading) return
        if (prevValue === value.toString()) return
        if (this.optionList.filter((item) => item.value === value).length === 0) return
        prevValue = value.toString()
        this.setState({value: prevValue})
    })('')

    handleChange = (e) => {
        this.setState({value: e.target.value})
    }


    invokeListeners = () => {
        let {onChange} = this.props
        if (check.function(onChange)) {
            onChange = [onChange]
        }
        if (check.not.array(onChange)) return
        for (const subscriber of onChange) {
            subscriber(Object.assign({}, this.state))
        }
    }

    async updateIfNeeded() {

        const {isAsync, disabled} = this.props
        const {isLoading, optionsInvalidate} = this.state

        if (isLoading || disabled) return
        if (!optionsInvalidate) return

        if (isAsync) {
            this.setState({isLoading: true})
            this.optionList = await this.updateRemoteOptionList()
        } else {
            this.optionList = this.updateLocalOptionList()
        }
        this.setState({isLoading: false, optionsInvalidate: false})
    }

    async updateRemoteOptionList() {
        const {remoteDataFetch = this.remoteDataFetchDefault} = this.props
        try {
            const data = await remoteDataFetch(this.filter)
            return check.array(data) ? data : []
        } catch (error) {
            console.log('error in Select: ', error)
        }


    }
    updateLocalOptionList() {
        return this.props.optionList
    }

    async remoteDataFetchDefault() {
        const {remoteSourceUrl, filter={}} = this.props
        try {
            const {data} = await axios.post(remoteSourceUrl, filter)
            return check.array(data) ? data : []
        } catch (error) {
            console.log('error: ', error)
        }
    }

    buildOptionList = () => {
        const {isLoading} = this.state
        if (isLoading) return <option value={null}>Loading...</option>

        const emptyOption = <option value={this.props.emptyValue} key='empty'>{this.props.emptyLabel}</option>
        const optionsSet = this.optionList.map(
            ({value, label}, key) => {
                return <option value={value} key={key}>{label}</option>
            })
        return [emptyOption, ...optionsSet]
    }


    render() {
        const {value} = this.state
        const controlLabel = check.string(this.props.label) ? <ControlLabel>{this.props.label}</ControlLabel> : null
        return (
            <Fragment>
                <FormGroup controlId={this.props.controlId} style={this.props.style}>
                    {controlLabel}
                    <FormControl
                        onChange={this.handleChange}
                        componentClass="select"
                        placeholder="select item"
                        value={value}
                        disabled={this.props.disabled}
                    >
                        {this.buildOptionList()}
                    </FormControl>
                </FormGroup>
            </Fragment>
        );
    }
    static getDerivedStateFromProps(props, state) {
        if (JSON.stringify(state.filter) !== JSON.stringify(props.filter)) {
            return {
                filter: props.filter,
                optionsInvalidate: true
            }
        }
        return null
    }
    async componentDidMount() {
        await this.updateIfNeeded()
        this.setDefaultSelected(this.props.defaultSelected)
    }
    async componentDidUpdate() {
        await this.updateIfNeeded()
        this.setDefaultSelected(this.props.defaultSelected)
        this.invokeListeners()
    }
}

/**
 *
 * isAsync - if true, will be used  getDataUrl to get options list. optionList parameter will be ignored
 * onChange - function or array of functions, that will be invoke on state change
 */
Select.propTypes = {
    controlId: PropTypes.string,
    //local option list if isAsync = false
    optionList: PropTypes.arrayOf(PropTypes.shape(
        {
            value: PropTypes.oneOfType([
                PropTypes.number,
                PropTypes.string
            ]),
            label: PropTypes.string
        }
    )),
    disabled: PropTypes.bool,
    label: PropTypes.string,
    emptyValue: PropTypes.string,
    emptyLabel: PropTypes.string,
    defaultSelected: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    isAsync: PropTypes.bool,
    remoteSourceUrl: PropTypes.string,
    remoteDataFetch: PropTypes.func,
    onChange: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.arrayOf(PropTypes.func)
    ]),
    filter: PropTypes.shape({
        accessor: PropTypes.string,
        statement: PropTypes.string,
        value: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.string
        ])
    }),
    style: PropTypes.object
}
Select.defaultProps = {
    optionList: [],
    isAsync: false,
    onChange: [],
    emptyValue: '',
    emptyLabel: '<Не выбрано>',
    filter: {},
    selected: ''
}

export default Select
