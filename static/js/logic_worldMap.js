//###############################
// Variables : For Choropleth
//###############################
// Using in resetStyle method
var geojson;
// Web Service API Server URL
var server_url = "http://education-env.eba-zpu6tvez.us-east-2.elasticbeanstalk.com"
// Showing pipups on country hover inside a custom control
var info = L.control();

var streetLayer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: API_KEY
});
var grayscaleLayer = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/light-v10',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: API_KEY
});

// var myMap = L.map("map", {
//     center: [15.5994, -28.6731],
//     zoom: 3,
//     layers: [
//         layers.LITERACY,
//         layers.UNEMPLOYMENT
//     ]
// });

var baseMaps = {
    "World Map": streetLayer,
    "Grayscale": grayscaleLayer
};
//###############################
// Functions : Adjusting Markers
//###############################
function markerSize(literacy_rate) {
    return literacy_rate * 1000;
};

function markerSizeUnEmployment(unemployment_rate) {
    return unemployment_rate * 5000;
};

function markerSizeppp(unemployment_rate) {
    return unemployment_rate / 10000000;
};

function markerSizeGini(unemployment_rate) {
    return unemployment_rate * 5000;
};
//###############################
// Functions : For Chorophlet
//###############################
function getColor(d) {
    return d > 8 ? '#800026' :
        d > 7 ? '#BD0026' :
            d > 6 ? '#E31A1C' :
                d > 5 ? '#FC4E2A' :
                    d > 4 ? '#FD8D3C' :
                        d > 3 ? '#FEB24C' :
                            d > 1 ? '#FED976' :
                                '#FFEDA0';

};

// Add line into the map
function style(feature) {
    return {
        fillColor: getColor(feature.properties.Edu_Exp),
        weight: 0.5,
        opacity: 1,
        color: 'lightgray',
        dashArray: '1',
        fillOpacity: 0.7,

        // weight: 0.5


    };
};

// get access to the layer that was hovered through e.target, 
// set a thick grey border on the layer as our highlight effect
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 2,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });
    // These browser can't use .bringToFront();
    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    console.log("layer.feature=", layer.feature.properties);
    info.update(layer.feature.properties);
};

// define what happens on mouseout
// geojson.resetStyle method will reset 
// the layer style to its default state (defined by our style function).
function resetHighlight(e) {
    // what this function does
    // what is the argument
    // what it returns
    geojson.resetStyle(e.target);
    // e.target.bringToBack();
    info.update();
    console.log('resetting');
    // myMap.removeLayer(e.target);
    // e.target.addTo(myMap);
    myMap.removeLayer(geojson);
    geojson.addTo(myMap);
};

// use the onEachFeature option to add the listeners on our state layers
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
    });
};


//###############################
// Variables : Factors
//###############################

var literacyMarkers = [];
var unemploymentMarkers = [];
var pppMarkers = [];
var giniIndexMarkers = [];

//###############################
// Variables : For Maps
//###############################

var overlays;
// var myMap;

// Choropleth Map
// onEachFeature method to add the listeners on countries layers
d3.json('static/data/updated_countries.geojson').then(countryData => {
    geojson = L.geoJson(countryData, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(myMap);
    // console.log("Country Data in geoJson: ", countryData);
    // geojson.bringToFront();
});

// Facters Markers
var url = server_url + "/api/worldMapData";
d3.json(url).then(data => {

    // console.log("api data : ", data);

    for (var i = 0; i < data.length; i++) {
        var country = data[i].country;
        var literacyRate = data[i].literacy_rate;
        var unemploymentRate = data[i].unemployment_rate;
        var ppp = data[i].purchasing_power_parity;
        // console.log("ppp = ",ppp);
        var giniIndex = data[i].distribution_of_family_income;
        // console.log("gini = ", giniIndex);

        // console.log("latitude : ", data[i].latitude);
        var location = [data[i].latitude, data[i].longitude];
        // console.log("location : ", location);
        literacyMarkers.push(
            L.circle(location,
                {
                    fillOpacity: 0.75,
                    color: "gray",
                    fillColor: "green",
                    radius: markerSize(literacyRate),
                    weight: 0.5
                }

            ).bindPopup(
                `<h1>  ${country} </h1> <hr> <h3>Literacy Rate: ${literacyRate} </h3>`));

        unemploymentMarkers.push(
            L.circle(location,
                {
                    fillOpacity: 0.75,
                    color: "gray",
                    fillColor: "red",
                    radius: markerSizeUnEmployment(unemploymentRate),
                    weight: 0.5
                }

            ).bindPopup(
                `<h1>  ${country} </h1> <hr> <h3>Unemployment Rate: ${unemploymentRate} </h3>`));

        pppMarkers.push(
            L.circle(location,
                {
                    fillOpacity: 0.75,
                    color: "gray",
                    fillColor: "blue",
                    radius: markerSizeppp(ppp),
                    weight: 0.5
                }

            ).bindPopup(
                `<h1>  ${country} </h1> <hr> <h3>Purchasing Power Parity : ${ppp} </h3>`));

        giniIndexMarkers.push(
            L.circle(location,
                {
                    fillOpacity: 0.75,
                    color: "gray",
                    fillColor: "purple",
                    radius: markerSizeGini(giniIndex),
                    weight: 0.5
                }

            ).bindPopup(
                `<h1>  ${country} </h1> <hr> <h3>Distribution of Family Incoome: ${giniIndex} </h3>`));


    };

    var literacyLayer = L.layerGroup(literacyMarkers);
    var unemploymentLayer = L.layerGroup(unemploymentMarkers);
    var pppLayer = L.layerGroup(pppMarkers);
    var giniIndexLayer = L.layerGroup(giniIndexMarkers);


    overlays = {
        "Literacy (age 15 and over can read and write)": literacyLayer,
        "Unemployment Rate": unemploymentLayer,
        "Purchasing Power Parity (PPP)": pppLayer,
        "Distribution of family Income (Gini Index)": giniIndexLayer

    };
    myMap = L.map("map", {
        center: [25.0, 17.0], // latitude, longitude
        zoom: 2,
        layers: [streetLayer]

    });

    L.control.layers(baseMaps, overlays, {
        collapsed: false
    }).addTo(myMap);

    info.onAdd = function(myMap){
        this._div = L.DomUtil.create('div','info');
        this.update();
        return this._div;
    };
    
    // method that we will use to update the control based on feature properties passed
    info.update = function(props){
        this._div.innerHTML = '<h4>World Education Expenditures</h4>' +  (props ?
            '<b>' + props.ADMIN + '</b><br /><hr>' + props.Edu_Exp + ' % of GDP'
            : 'Hover over a state');
    };
    
    info.addTo(myMap);

    var legend = L.control({ position: 'bottomleft' });

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            rates = [0, 1, 3, 4, 5, 6, 7, 8],
            labels = [];

        // loop through our density intervals and generate a label with a colored square for each interval
        div.innerHTML='World Education Expenditure<br>'
        div.innerHTML+=rates[0]+'&nbsp;'.repeat(48)+rates[7]+'+'+'<br>'
        for (var i = 0; i < rates.length; i++) {
            // div.innerHTML='Education Expesnes';
            // div.innerHTML +=
            //     '<i style="background:' + getColor(rates[i] + 1) + '"></i> ' +
            //     rates[i] + (rates[i + 1] ? '&ndash;' + rates[i + 1] + '<br>' : '+');
            div.innerHTML+=
            '<i style="background:' + getColor(rates[i] + 1) + '"></i> ';
        }

        return div;
    };

    legend.addTo(myMap);
});



