import React from "react";
import { render } from "react-dom";

class CitySelector extends React.Component {
    componentDidMount() {
        let inputElement = document.getElementById("city-selector-input");
        let autocomplete = new google.maps.places.Autocomplete(inputElement, {
            types: ["(cities)"]
        });
        google.maps.event.addListener(autocomplete, "place_changed", () => {
            let place = autocomplete.getPlace();
            this.props.onCityChanged(place.name);
        });
    }

    render() {
        return <input type="text" id="city-selector-input" />;
    }
}

class TemperatureIndicator extends React.PureComponent {
    constructor(props) {
        super(props);
        this.fetchTemperature = this.fetchTemperature.bind(this);
        this.showTemperature = this.showTemperature.bind(this);
        this.state = { status: "select a city" };
    }

    componentWillReceiveProps(nextProps) {
        if (
            this.props.city !== nextProps.city ||
            this.props.unit !== nextProps.unit
        ) {
            this.showTemperature(nextProps.city, nextProps.unit);
        }
    }

    convertToReqUnit(tempInC) {
        return {
            C: tempInC,
            F: 9 / 5 * tempInC + 32,
            K: tempInC + 273
        };
    }

    parseResponse(res, city, unit) {
        let toJson = res.json();
        // console.log("parsing");
        toJson
            .then(data => {
                if (data["error"]) throw "Cannot Find such city!";
                const tempInC = data["current"]["temp_c"];
                const temp = this.convertToReqUnit(tempInC)[unit];
                debugger;
                if (!temp) throw "Can't get response"; // if key error!
                if (this.state.latestReqCity === city) {
                    console.log("got for ", city);
                    this.setState({
                        status: "completed",
                        fetchTemperature: temp
                    });
                }
            })
            .catch(error => {
                if (typeof error === "string") this.setState({ status: error });
                else throw "failed";
            });
    }

    fetchTemperature(city, unit) {
        console.log("fetching for ", city);
        fetch(
            `https://api.apixu.com/v1/current.json?key=25bb3610311f486e823225213181002&q=${city}`
        )
            .then(res => this.parseResponse(res, city, unit))
            .catch(rej => {
                this.setState({ status: "failed" });
            });
    }

    showTemperature(city, unit) {
        if (city) {
            this.setState({ status: "loading", latestReqCity: city });
            setTimeout(
                () => this.fetchTemperature(city, unit),
                Math.random() * 50000
            );
        } else this.setState({ status: "select a city" });
    }

    render() {
        return (
            <div>
                {this.state.status === "completed"
                    ? `Current temperature: ${this.state.fetchTemperature}`
                    : this.state.status}
            </div>
        );
    }
}

const UnitSelector = props => {
    function onUnitChange(e) {
        props.onUnitChange(e.target.value);
        // props.onUnitChange(e);
    }
    return (
        <select defaultValue={props.selected} onChange={onUnitChange}>
            <option value="C">Celsius</option>
            <option value="F">Farhenite</option>
            <option value="K">Kelvin</option>
        </select>
    );
};

class WeatherApp extends React.Component {
    constructor(props) {
        super(props);
        this.onCityChanged = this.onCityChanged.bind(this);
        this.onUnitChange = this.onUnitChange.bind(this);
        this.state = { city: "", unit: "C" };
    }

    onUnitChange(unit) {
        this.setState({ unit: unit });
    }

    onCityChanged(cityName) {
        this.setState({ city: cityName });
    }

    render() {
        return (
            <div>
                <CitySelector onCityChanged={this.onCityChanged} />
                <UnitSelector
                    selected={this.state.unit}
                    onUnitChange={this.onUnitChange}
                />
                <TemperatureIndicator city={this.state.city} unit={this.state.unit} />
            </div>
        );
    }
}

render(<WeatherApp />, document.getElementById("root"));
