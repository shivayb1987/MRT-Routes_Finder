import React, { Component } from 'react';
import { getStationObject, getLineObject } from '../routing/findRoutes';
import './Results.css';
import PropTypes from 'prop-types';

export default class Results extends Component {
	static propTypes = {
		routes: PropTypes.array.isRequired
	};

	static defaultProps = {
		routes: []
	};

	state = {
		index: -1
	};

	getSteps (steps, showDetails, stepIndex) {
		let elements = [];
		if (!showDetails) {
			let lines = steps.filter(({ type }) => type === 'ride');
			let lineElement = [];
			lines.forEach(({ line }, i) => {
				let { color } = getLineObject(line);
				let style = {
					"color": "white", 
					"padding": "5px 2px", 
					"backgroundColor": color , 
					"fontSize": "11px",
					"borderRadius": 2,
					"margin" : "0 2px"
				};
				lineElement.push(
					<span key={"lineEl" + i}>
						<span key={"line" + i} style={ style }>{ line }</span>
						{i === lines.length - 1 ? "" : <span className="bullet">&bull;</span>}
					</span>
				);
			});
			elements.push(...lineElement);
		}

		let walkStep = steps.filter(({ type, from }) => type === 'walk' && from === 'origin');

		if (!!walkStep.length) {
			let { distance = "", to = "" } = walkStep[0];
			let { name } = getStationObject(to);

			parseFloat(distance) != 0 && elements.push(
				<div key="walk" className="walkstep step">
					<span>Start by walking {distance} </span> 
					<span>towards { name }</span>
				</div>
			);
		}
		
		if (showDetails) {
			let rides = steps.filter(({ type }) => type === "ride");
			let ridesElement = rides.map((ride, i) => {
				let { line, from, to } = ride;
				let {name: fromStation} = getStationObject(from);
				let {name: toStation} = getStationObject(to);
				let { color } = getLineObject(line);
				let { route } = getLineObject(line);
				let fromIndex = route.indexOf(from);
				let toIndex = route.indexOf(to);
				let stops = toIndex - fromIndex - 1;

				return (
					<div key={"div-ride" + i} className="ride">
						<span key={"ride" + i} style={
							{ "color": "white", 
							"padding": "5px 2px", 
							"backgroundColor": color , 
							"fontSize": "11px",
							"borderRadius": 2,
							"margin" : "0 2px" }
						}>{ line }</span>
						<span>{ fromStation }</span>
						<span>></span>
						{ stops > 0 ? 
							<span>
								<span>(After {stops} Stops)</span> 
								<span>></span>
							</span>
							: ""
						}
						<span>{ toStation } </span>
					</div>
				);
			}) || [];
			elements.push(
				<div key={"details-container" + stepIndex} className="details-container" onClick={ this.hideDetails.bind(this) }>
				 	{ ridesElement }
				</div>
			);
		}
		return elements;
	}

	showDetails (index) {
		this.setState({
			index: index
		});
	}

	hideDetails (e) {
		e.stopPropagation();
		this.setState({
			index: -1
		});
	}

	render () {
		let { routes } = this.props;

		//Showing only the top 4;
		let elements = routes.slice(0, 4).map(({ steps }, i) => {
			let className = ["steps"];
			if (i === routes.slice(0, 4).length - 1) {
				className.push("last-child");
			}
			let showDetails = this.state.index === i;
			return (
				<div key={"steps" + i} className={ className.join(" ")} onClick={ this.showDetails.bind(this, i) }>
					{ 
						this.getSteps(steps, showDetails, i)
					}
				</div>
			);
			
		});
		return (
			<div className="routes">
				<div className="label"> Suggested Routes </div>
				<div className="steps-container">
					{ elements }
				</div>
			</div>
		);
	}
}