import { stations, lines } from './mrt.json';
import _ from 'lodash';

/*
	Returns the best routes between the origin and destination.

	Arguments origin and destination are { lat, lng } objects.
	Returns an array of the best routes. You may define "best" using any reasonable metric and document your definition.

	Each route is an object which must contain a "steps" array. You may add additional properties as needed.
	Each step can represent a "walk", "ride" or "change", and must have at least the following properties:
	- { type: "walk", from: <stationId> or "origin", to: <stationId> or "destination" }
	- { type: "ride", line: <lineId>, from: <stationId>, to: <stationId> }
	- { type: "change", station: <stationId>, from: <lineId>, to: <lineId> }
	You may add additional properties as needed.

	Example:

	findRoutes({ lat: 1.322522, lng: 103.815403 }, { lat: 1.29321, lng: 103.852216 })

	orign: Botanic Gdns Stn, Singapore
	dest: 150 North Bridge Rd, City Hall, Singapore 179100

	should return something like:

	[
		{ steps: [
			{ type: "walk", from: "origin", to: "botanic_gardens" },
			{ type: "ride", line: "CC", from: "botanic_gardens", to: "buona_vista" },
			{ type: "change", station: "buona_vista", from: "CC", to: "EW" },
			{ type: "ride", line: "EW", from: "buona_vista", to: "bugis" },
			{ type: "walk", from: "bugis", to: "destination" }
		] },
		{ steps: [
			// worse route
		] }
	]

*/

//Find distance between 2 locations using modified form of haversine formula
function delta(obj1, obj2) {
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((obj2.lat - obj1.lat) * p)/2 + 
          c(obj1.lat * p) * c(obj2.lat * p) * 
          (1 - c((obj2.lng - obj1.lng) * p))/2;

  return (12742 * Math.asin(Math.sqrt(a))).toFixed(1); //in km
}

/*
	Find nearest stations from Origin and Destination
	origin: in paramter 
	destionation: in parameter
	returns array of stations
*/
function findNearestStations (origin, destination) {
	let originStation = { distance: Infinity, station: null };
	let destinationStation = { distance: Infinity, station: null };
	for (let key in stations) {
		let oDist = delta(origin, stations[key]);
		let dDist = delta(destination, stations[key]);

		if (oDist < originStation["distance"]) {
			originStation["distance"] = oDist;
			let { name } = stations[key];
			originStation["station"] = name;
			originStation["stationId"] = key;
		}
		if (dDist < destinationStation["distance"]) {
			destinationStation["distance"] = dDist;
			let { name } = stations[key];
			destinationStation["station"] = name;
			destinationStation["stationId"] = key;
		}
	}
	return [originStation, destinationStation];
}

/* Find all the lines connecting to given station */
function findLines ({stationId}, excludeLine = "") {
	let routeArr = [];
	for (let line in lines) {
		if (line === excludeLine) {
			continue;
		}
		let { route } = lines[line];
		if (route.includes(stationId)) {
			let stop = route.indexOf(stationId);
			routeArr.push({
				line,
				stationId,
				stop
			});
		}
	}
	return routeArr;
}

/* Get total distance for a trip */
function getTotalDistance ({ steps }) {
	return steps.reduce((total, step) => {
		let { type, distance, from, to } = step;
		if (type === 'walk') {
			total += parseFloat(distance);
		}
		if (type === 'ride') {
			let d = delta(stations[from], stations[to]);
			total += parseFloat(d);
		}
		return total;
	}, 0);
}

/*  Sort routes based on distance */	
function sortRoutes (routeObj1, routeObj2) {
	let distance1 = getTotalDistance(routeObj1);
	let distance2 = getTotalDistance(routeObj2);

	return distance1 - distance2;
}

export function getStationObject (stationId) {
	return stations[stationId];
}

export function getLineObject (line) {
	return lines[line];
}

/* Add the steps that the user needs to walk */
function addWalkSteps (initialStep, finalStep, steps) {
	steps.unshift(...initialStep);
	steps.push(...finalStep);
}

export default function findRoutes(origin, destination) {
	let [originStation, destinationStation] = findNearestStations(origin, destination);
	let originRouteArr = findLines(originStation);
	let destRouteArr = findLines(destinationStation);
	let { distance: oDistance, stationId: oStation } = originStation;
	let { distance: dDistance, stationId: dStation } = destinationStation;

	let steps = [];
	let initialStep = [];
	let finalStep = [];
	let newRoutes = [];

	initialStep.push(
		{ type: 'walk', distance: `${oDistance}km`, from: 'origin', to: oStation }
	);

	finalStep.push(
		{ type: 'walk', distance: `${dDistance}km`, from: dStation, to: "destination" }
	);

	//check if a single line exists from origin to destination
	let originLines = originRouteArr.map(({ line }) => line );
	let destinationLines = destRouteArr.map(({ line }) => line );
	let commonLines = _.intersection(originLines, destinationLines);

	commonLines.forEach(line => {
		steps.push(
			{ type: 'ride', line: line, from: oStation, to: dStation }
		);
		addWalkSteps (initialStep, finalStep, steps);
		newRoutes.push({ steps });
		steps = [];
	});

	if (!!commonLines.length) {
		return newRoutes.sort(sortRoutes);
	}

	/* 
		For each line originates from the Origin, 
		see if other lines connect the stops of current line 
	*/
	originRouteArr.forEach(({ line, stop }) => {
		let { route } = lines[line];
		route.slice(stop + 1).forEach(station => {
			destRouteArr.forEach(({ line: dline }) => {
				let { route: dRoute } = lines[dline];
				if (dRoute.includes(station)) {
					steps.push(
						{ type: 'ride', line: line, from: oStation, to: station }
					);
					steps.push(
						{ type: 'change', station: station, from: line, to: dline }
					);
					steps.push(
						{ type: 'ride', line: dline, from: station, to: dStation }
					);
					addWalkSteps (initialStep, finalStep, steps);
					newRoutes.push({
						steps
					});
					steps = [];
				}
			});
		});
	});


	/* 
		Find all lines that connect to destination
	*/
	let linesConnectingToDestStation = [];
	destRouteArr.forEach(({ line, stop, stationId }) => {
		let { route } = lines[line];
		route.forEach(station => {
			let link = findLines({ stationId: station }, line);
			link = link.map(obj => ({
				dFrom: obj["line"],
				dOriginStation: obj["stationId"],
				dDestStation: stationId,
				dTo: line,
				stop: obj["stop"]
			}));
			linesConnectingToDestStation.push.apply(linesConnectingToDestStation, link);
		});
	});

	/* 
		Find all lines that connect to origin
	*/
	let linesConnectingToOrigin = [];
	let addedLines = [];
	linesConnectingToDestStation.forEach(conObj => {
		let { dFrom } = conObj;
		let { route } = lines[dFrom];
		route.forEach(station => {
			originRouteArr.forEach(({ line: oLine, stationId: oOriginStation}) => {
				if (dFrom !== oLine) {
					let { route: oRoute } = lines[oLine];
					if (oRoute.includes(station)) {
						if (!addedLines.includes(`${dFrom}-${station}-${oLine}`)) {
							addedLines.push(`${dFrom}-${station}-${oLine}`);
							linesConnectingToOrigin.push({
								oFrom: oLine,
								oTo: dFrom,
								oOriginStation,
								oDestStation: station
							});
						}
					}
				}
			});
		});
	});

	/*
		Find the intersection of lines connecting origin and destination
	*/
	steps = [];
	linesConnectingToOrigin.forEach(({oFrom, oTo, oOriginStation, oDestStation}) => {
		linesConnectingToDestStation.forEach(({ dFrom, dTo, dOriginStation, dDestStation }) => {
			if (dFrom === oTo) {
				steps.push({
					type: "ride", line: oFrom, from: oOriginStation , to: oDestStation, step: 2
				});
				steps.push({
					type: "change", station: oDestStation, from: oFrom, to: oTo, step: 3
				});
				steps.push({
					type: "ride", line: oTo, from: oDestStation, to: dOriginStation, step: 4
				});
				steps.push({
					type: "ride", line: dTo, from: dOriginStation, to: dDestStation, step: 4
				});
				addWalkSteps (initialStep, finalStep, steps);
				newRoutes.push({
					steps: steps.slice()
				});
				steps = [];
			}
			
		});
	});

	//Sort according to the distance
	newRoutes.sort(sortRoutes);
	
	return newRoutes;
}
