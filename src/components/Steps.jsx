import React, { Component } from 'react';
import { getStationObject, getLineObject } from '../routing/findRoutes';
import './Results.css';

const Steps = ({steps, showDetails}) => {
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

		elements.push(
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
				<div key={"div-ride" + i} className="ride" onClick={ this.hideDetails.bind(this) }>
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
		elements.push(...ridesElement);
	}
	return (
		<div>{ elements } </div>
	);
}

export default Steps;