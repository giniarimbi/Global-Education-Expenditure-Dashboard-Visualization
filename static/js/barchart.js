console.log("hello world")
var server_url = "http://education-env.eba-zpu6tvez.us-east-2.elasticbeanstalk.com"

var years;
d3.json(server_url + "/api/years").then(years => {
    console.log(years);
    d3.select("#years")
        .append("select")
        .attr("id", "YearSelector").on("change", yearchanged)
        .selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);
}
);
var slice = 10;

var newYear = 2008;
function yearchanged() {
    newYear = d3.select(this).property('value');
    console.log(newYear);
    d3.json(server_url + `/api/${newYear}`).then(props => {
        properties = props;
        updateBarChart(newYear, newProperty);
    })
}

var impacts;
d3.json(server_url + "/api/properties").then(impacts => {
    console.log(impacts);
    d3.select("#impacts")
        .append("select")
        .attr("id", "ImpactSelector").on("change", propertychanged)
        .selectAll("option")
        .data(impacts.slice(1))  // Skip over longitude
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);
}
);

var newProperty = "education_expenditures";
function propertychanged() {
    newProperty = d3.select(this).property('value');
    console.log(newProperty);
    updateBarChart(newYear, newProperty);
}

var properties;
d3.json(server_url + "/api/2008").then(props => {
    properties = props;
    updateBarChart(2008, newProperty);
})

// Update the horizontal bar chart
function updateBarChart(year, property) {
    // Set a chart title, appropriate for one or more sample bacteria
    let chart_title = `${property} in ${year}`;
    let local_properties = properties;
    local_properties.sort((a, b) => (a[property] < b[property]) ? 1 : -1);
    top10_properties = local_properties.slice(0,slice).reverse();
    let country_list = top10_properties.map(p => p.country);
    let value_list = top10_properties.map(p => p[property]);

    // Plot the counts of the bacteria samples
    var trace1 = {
        type: "bar",
        orientation: "h",
        x: value_list,
        y: country_list,
        text: country_list
    };

    var layout = {
        title: { text: chart_title, font: { size: 20 } },
        xaxis: { title: property, rangemode: 'tozero' },
        yaxis: { title: 'Country' }
    };

    var data = [trace1];
    Plotly.newPlot("bar", data, layout)
}
