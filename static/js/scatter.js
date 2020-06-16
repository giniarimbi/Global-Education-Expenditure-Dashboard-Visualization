var server_url = "http://education-env.eba-zpu6tvez.us-east-2.elasticbeanstalk.com"

// Lay out as much of the plot as possible, once,
// when the HTML and Javascript are loaded.
var svgWidth = 1000;
var svgHeight = 700;

var margin = {
  top: 20,
  right: 40,
  bottom: 100,
  left: 150
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
// and shift the latter by left and top margins.
var svg = d3
  .select(".chart")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Add a static x axis label
chartGroup.append("text")
  .attr("x", 400)
  .attr("y", 650)
  .text("Education Expenditures (%)");

var xAxisGroup = chartGroup.append("g")
  .classed("x-axis", true)
  .attr("transform", `translate(0, ${height})`);

// three y label
var labelsGroup = chartGroup.append("g")
  .attr("transform", "rotate(-90)");

var ylabel1Group = labelsGroup.append("text")
  .attr("y", 0 - 150)
  .attr("x", 0 - (height / 1.8))
  .attr("dy", "1em")
  .attr("value", "literacy_rate") // value to grab for event listener
  .classed("active", true)
  .text("Literacy Rate (%)");

var ylabel2Group = labelsGroup.append("text")
  .attr("y", 0 - 100)
  .attr("x", 0 - (height / 1.6))
  .attr("dy", "1em")
  .attr("value", "unemployment_rate") // value to grab for event listener
  .classed("inactive", true)
  .text("Unemployment Rate (%)");

var ylabel3Group = labelsGroup.append("text")
  .attr("y", 0 - 50)
  .attr("x", 0 - (height / 1.4))
  .attr("dy", "1em")
  .attr("value", "distribution_of_family_income") // value to grab for event listener
  .classed("inactive", true)
  .text("Distribution Family Income Index");

// Add y-axis labels event listener
labelsGroup.selectAll("text")
  .on("click", yAxisChanged);

var yAxisGroup = chartGroup.append("g")
  .classed("y-axis", true);

// Initial Params
var chosenYAxis = "literacy_rate";

// Callback function fo y-axis
function yAxisChanged() {
  // get value of selection
  let value = d3.select(this).attr("value");
  console.log(`yAxisChanged:  yAxis value is ${value}.`);
  if (value !== chosenYAxis) {

    // replaces chosenXAxis with value
    chosenYAxis = value;

    // updates y scale for new data
    let yLinearScale = yScale();

    // updates y axis with transition
    renderYAxes(yLinearScale);

    // updates circles with new y values
    renderCircles(yLinearScale);

    // updates tooltips with new info
    updateToolTip();

    // changes classes to change bold text
    if (chosenYAxis === "literacy_rate") {
      ylabel1Group
        .classed("active", true)
        .classed("inactive", false);
      ylabel2Group
        .classed("active", false)
        .classed("inactive", true);
      ylabel3Group
        .classed("active", false)
        .classed("inactive", true);
    }
    else if (chosenYAxis === "unemployment_rate") {
      ylabel1Group
        .classed("active", false)
        .classed("inactive", true);
      ylabel2Group
        .classed("active", true)
        .classed("inactive", false);
      ylabel3Group
        .classed("active", false)
        .classed("inactive", true);
    }
    else {
      ylabel1Group
        .classed("active", false)
        .classed("inactive", true);
      ylabel2Group
        .classed("active", false)
        .classed("inactive", true);
      ylabel3Group
        .classed("active", true)
        .classed("inactive", false);
    }
  }
}

// Add a drop-down for Year Selection
var years;
d3.json(server_url + "/api/years").then(years => {
  console.log(years);
  d3.select("#selYear")
    .append("select")
    .attr("id", "YearSelector").on("change", yearchanged)
    .selectAll("option")
    .data(years)
    .enter()
    .append("option")
    .attr("value", function (year) { return year })
    .text(year => year);
}
);

var newYear;
function yearchanged() {
  newYear = d3.select(this).property('value');
  console.log(`In yearChanged:  The newYear is ${newYear}`);
  d3.json(server_url + `/api/${newYear}`).then(data => {
    cachedEduData = data;
    convertStringsToNumbers(cachedEduData);
    DrawPlot();
  });
}

// Retrieve data from the CSV file and initialize the plot
var cachedEduData;
d3.json(server_url + "/api/2010").then(data => {
  cachedEduData = data;
  convertStringsToNumbers(cachedEduData);
  DrawPlot();
});

var circlesGroup;
function DrawPlot() {
  // Update the x scale function
  let xLinearScale = d3.scaleLinear()
    .domain([-1, d3.max(cachedEduData, d => d.education_expenditures)])
    .range([0, width]);

  // Update the y scale function
  let yLinearScale = yScale();

  // Create axes functions
  let bottomAxis = d3.axisBottom(xLinearScale);
  let leftAxis = d3.axisLeft(yLinearScale);

  // Update axes
  xAxisGroup.call(bottomAxis);
  yAxisGroup.call(leftAxis);

  // append initial circles
  circlesGroup = chartGroup.selectAll("circle")
    .data(cachedEduData);

  circlesGroup.enter()
    .append("circle")
    //.merge(circlesGroup)
    .attr("cy", d => yLinearScale(d[chosenYAxis]))
    .attr("cx", d => xLinearScale(d.education_expenditures))
    .attr("country", d => d.country)
    .attr("r", 10)
    .attr("fill", "orange")
    .attr("opacity", "3");

  circlesGroup.exit().remove();

  // Update the pop-up text
  updateToolTip();
}

// Utility Functions

// For the four charted properties in the data set, convert strings to numbers
function convertStringsToNumbers(data) {
  data.forEach(function (country) {
    // data.country=+data.country;
    country.education_expenditures = +country.education_expenditures;
    country.literacy_rate = +country.literacy_rate;
    country.unemployment_rate = +country.unemployment_rate;
    country.distribution_of_family_income = +country.distribution_of_family_income;
  });
}

// function used for updating x-scale var upon click on axis label
function yScale() {
  console.log(`In yScale, the chosenYAxis is ${chosenYAxis}.`)
  // create scales
  let yLinearScale = d3.scaleLinear()
    .domain([d3.min(cachedEduData, d => d[chosenYAxis]),
    d3.max(cachedEduData, d => d[chosenYAxis]) * 1.2
    ])
    .range([height, 0]);

  return yLinearScale;
}

// function used for updating yAxis var upon click on axis label
function renderYAxes(newYScale) {
  console.log(`In renderYAxes:  yAxisGroup is ${yAxisGroup}.`);
  let leftAxis = d3.axisLeft(newYScale);

  yAxisGroup.transition()
    .duration(1000)
    .call(leftAxis);
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(newYScale) {
  circlesGroup.transition()
    .duration(1000)
    .attr("cy", d => newYScale(d[chosenYAxis]));
}

// function used for updating circles group with new tooltip
function updateToolTip() {
  var label;
  if (chosenYAxis === "literacy_rate") {
    label = "Literacy Rate (%)";
  }
  else if (chosenYAxis === "unemployment_rate") {
    label = "Unemployment Rate (%)";
  }
  else {
    label = "Distribution Family Income Index";
  }

  //console.log(circlesGroup);
  //console.log(`In updateToolTip:  label is ${label}, chosenYAxis = ${chosenYAxis}, and circlesGroup = ${circlesGroup}.`);

  let toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([80, -60])
    .html(function (d) {
      //console.log(`${d.country}<br>${label} ${d[chosenYAxis]}`);
      return (`${d.country}<br>${label} ${d[chosenYAxis]}`);
    });

  console.log(`The type of circlesGroup is ${typeof(circlesGroup)}`);
  //circlesGroup.call(toolTip);

  // circlesGroup.on("mouseover", function (data) {
  //   toolTip.show(data);
  // })
  //   // onmouseout event
  //   .on("mouseout", function (data, index) {
  //     toolTip.hide(data);
  //   });
}


d3.json("http://education-env.eba-zpu6tvez.us-east-2.elasticbeanstalk.com/api/2019").then(function (data3) {
    edu2019 = data3.map(row=>row.education_expenditures);
    console.log(ss.mode(edu2019))
    literacy2019 = data3.map(row=>row.literacy_rate);
    // console.log(literacy2019)
    distribution2019 = data3.map(row=>row.distribution_of_family_income);
    // console.log(distribution2019)
    unemployment2019 = data3.map(row=>row.unemployment_rate);

    // console.log(ppp2019)

    //Statistical Number

    edu2019_min = (ss.min(edu2019)).toFixed(2);
    edu2019_max = (ss.max(edu2019)).toFixed(2);
    edu2019_mean = (ss.mean(edu2019)).toFixed(2);
    edu2019_mode = (ss.mode(edu2019)).toFixed(2);
    edu2019_std = (ss.standardDeviation(edu2019)).toFixed(2);

    literacy2019_min = (ss.min(literacy2019)).toFixed(2);
    literacy2019_max = (ss.max(literacy2019)).toFixed(2);
    literacy2019_mean = (ss.mean(literacy2019)).toFixed(2);
    literacy2019_mode = (ss.mode(literacy2019)).toFixed(2);
    literacy2019_std = (ss.standardDeviation(literacy2019)).toFixed(2);

    unemployment2019_min = (ss.min(unemployment2019)).toFixed(2);
    unemployment2019_max = (ss.max(unemployment2019)).toFixed(2);
    unemployment2019_mean = (ss.mean(unemployment2019)).toFixed(2);
    unemployment2019_mode = (ss.mode(unemployment2019)).toFixed(2);
    unemployment2019_std = (ss.standardDeviation(unemployment2019)).toFixed(2);

    distribution2019_min = (ss.min(distribution2019)).toFixed(2);
    distribution2019_max = (ss.max(distribution2019)).toFixed(2);
    distribution2019_mean = (ss.mean(distribution2019)).toFixed(2);
    distribution2019_mode = (ss.mode(distribution2019)).toFixed(2);
    distribution2019_std = (ss.standardDeviation(distribution2019)).toFixed(2);




// Statistical Correlation


literacy_reg = ss.linearRegression([edu2019, literacy2019]);
literacy_m=literacy_reg.m.toFixed(2);
literacy_b=(literacy_reg.b).toFixed(2);
literacy_cor =ss.sampleCorrelation(edu2019, literacy2019).toFixed(3);
literacy_rsquared=Math.pow(literacy_cor,2).toFixed(3);

unemployment_reg = ss.linearRegression([edu2019, unemployment2019]);
unemployment_m=unemployment_reg.m.toFixed(2);
unemployment_b=(unemployment_reg.b).toFixed(2);
unemployment_cor =ss.sampleCorrelation(edu2019, unemployment2019).toFixed(3);
unemployment_rsquared=Math.pow(unemployment_cor,2).toFixed(3);


distribution_reg = ss.linearRegression([edu2019, distribution2019]);
distribution_m=distribution_reg.m.toFixed(2);
distribution_b=(distribution_reg.b).toFixed(2);
distribution_cor =ss.sampleCorrelation(edu2019, distribution2019).toFixed(3);
distribution_rsquared=Math.pow(distribution_cor,2).toFixed(3);


let statistics = [
    { parameter: "Education Expenditures", min: edu2019_min, max: edu2019_max, mean: edu2019_mean, mode: edu2019_mode, 
    StandardDev: edu2019_std},
    
    { parameter: "Literacy Rate", min: literacy2019_min, max: literacy2019_max, mean: literacy2019_mean, mode: literacy2019_mode,
    StandardDev: literacy2019_std},

    { parameter: "Unemployment Rate", min: unemployment2019_min, max: unemployment2019_max, mean: unemployment2019_mean, mode: unemployment2019_mode, 
    StandardDev: unemployment2019_std},

    { parameter: "Distribution Rate", min: distribution2019_min, max: distribution2019_max, mean: distribution2019_mean, mode: distribution2019_mode, 
    StandardDev: distribution2019_std},


  ];
  
  function generateTableHead(table, data) {
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let key of data) {
      let th = document.createElement("th");
      let text = document.createTextNode(key);
      th.appendChild(text);
      row.appendChild(th);
    }
  }
  
  function generateTable(table, data) {
    for (let element of data) {
      let row = table.insertRow();
      for (key in element) {
        let cell = row.insertCell();
        let text = document.createTextNode(element[key]);
        cell.appendChild(text);
      }
    }
  }
  
  let table = document.querySelector("table");
  let data = Object.keys(statistics[0]);
  generateTableHead(table, data);
  generateTable(table, statistics);



  let statistics2 = [
    { correlation: "Education Exp vs Literacy Rate", slope: literacy_m, 
    intercept: literacy_b, r: literacy_cor, Rsquared: literacy_rsquared},

    { correlation: "Education Exp vs Unemployment Rate", slope: unemployment_m, 
    intercept: unemployment_b, r: unemployment_cor, Rsquared: unemployment_rsquared},
    
    { correlation: "Education Exp vs Distribution Rate", slope: distribution_m, 
    intercept: distribution_b, r: distribution_cor, Rsquared: distribution_rsquared}

  ];
  
  function generateTableHead(table2, data) {
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let key of data) {
      let th = document.createElement("th");
      let text = document.createTextNode(key);
      th.appendChild(text);
      row.appendChild(th);
    }
  }
  
  function generateTable(table2, data) {
    for (let element of data) {
      let row = table.insertRow();
      for (key in element) {
        let cell = row.insertCell();
        let text = document.createTextNode(element[key]);
        cell.appendChild(text);
      }
    }
  }
  
  let table2 = document.querySelector(".tabletwo");
  let data4 = Object.keys(statistics2[0]);
  generateTableHead(table2, data4);
  generateTable(table2, statistics2);


});