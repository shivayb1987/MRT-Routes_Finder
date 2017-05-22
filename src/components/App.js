import React, { Component } from 'react';
import findRoutes from '../routing/findRoutes';
import './App.css';
import Results from './Results';

// This is only a placeholder to demonstrate the Google Maps API.
// You should reorganize and improve it.

class App extends Component {
    constructor () {
        super();
        this.origin = null;
        this.destination = null;
        this.routes = [];
    }

    componentDidMount() {
        setTimeout(() => {
            const { SearchBox } = window.google.maps.places;
            const originSearch = new SearchBox(document.getElementById('origin'));
            originSearch.addListener('places_changed', () => {
                const places = originSearch.getPlaces();
                this.origin = places[0].geometry.location.toJSON();
                console.log(this.origin);
            });
            const destination = new SearchBox(document.getElementById('destination'));
            destination.addListener('places_changed', () => {
                const places = destination.getPlaces();
                this.destination = places[0].geometry.location.toJSON();
                console.log(this.destination);
            });
        }, 100);
    }

    search(e) {
        e.preventDefault();
        this.routes = findRoutes(this.origin, this.destination);
        this.forceUpdate();
    }


    render() {
        return (
            <div id='app'>
                <div className="app-name">MRT Routes Finder</div>
                <div className="app-container">
                    <input id='origin' placeholder='From' />
                    <input id='destination' placeholder='To' />
                    <button onClick={ this.search.bind(this) }>Search</button>
                </div>
                <Results routes={this.routes}/>
            </div>
        )
    }
}

export default App;
