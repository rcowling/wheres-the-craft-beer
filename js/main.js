/* JS file for D3-Lab by Bob Cowling, 2017 */

(function(){
//pseudo-global variables
var attrArray = ["BREW_PER_CAPITA", "NUM_OF_BREWIES", "PRODUCTION_PER_CAPITA", "BARRELS_PRODUCED", "ECONOMIC_IMPACT", "IMPACT_PER_CAPITA", "RANK"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
//begin script when window loads
    
//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    //.range([463, 0])
    //.domain([0, 9.4]);     
    
window.onload = setMap();
//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    //create Albers equal area conic projection centered on the United States
    var projection = d3.geoAlbersUsa()
        .scale(1000)
        .translate([width / 2, height / 2]); //Keep these as one-half the <svg> width and height to keep your map centered in the container
    
    var path = d3.geoPath()
        .projection(projection);
    //use queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/breweries.csv") //load attributes from csv        
        .defer(d3.json, "data/states.topojson") //load choropleth spatial data
        .await(callback);
    
    function callback(error, csvData, us){
        var usStates = topojson.feature(us, us.objects.states).features; //convert the data back to geojson            
                
        //join csv data to GeoJSON enumeration units
        usStates = joinData(usStates, csvData);       
        
        //create the color scale
        var colorScale = makeColorScale(csvData);
        
        //add enumeration units to the map
        setEnumerationUnits(usStates, map, path, colorScale);
        
        //add coordinated visualization to the map
        setChart(csvData, colorScale);
        
        //add the dropdown menu to the map
        createDropdown(csvData);
        
        
    };
    
        
}; //end of setMap
    
function joinData(usStates, csvData){    
        
    //variables for data join
    //var attrArray = ["BARRELS_PRODUCED"];
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvState = csvData[i]; //the current us state
        var csvKey = csvState.STATE_NAME; //the CSV primary key
        //loop through geojson regions to find correct region
        for (var a=0; a<usStates.length; a++){
            var geojsonProps = usStates[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.STATE_NAME; //the geojson primary key
            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){
                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvState[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
                console.log(csvData);
               
            };
        };
    };
     return usStates;
}; 
        
function setEnumerationUnits(usStates, map, path, colorScale){
    //add States to the map
        var addstates = map.selectAll(".addstates")
            .data(usStates)
            .enter()
            .append("path")
            .attr("class", function(d){
                //return ".addstates"
                return "addstates " + d.properties.STATE_NAME;
            })
            .attr("d", path)
           .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
    
         .on("mouseover", function(d){
            highlight(d.properties);
        })
         .on("mouseout", function(d){
            dehighlight(d.properties);
        })
         .on("mousemove", moveLabel);    
        
    
        var desc = addstates.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
        
        console.log(usStates);
};   
    
 //Example 1.4 line 11...function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];
    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);
    //build two-value array of minimum and maximum expressed attribute values
    var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    //assign two-value array as scale domain
    colorScale.domain(minmax);
    return colorScale;
};
    
//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

//function to create coordinated bar chart
//function to create coordinated bar chart
function setChart(csvData, colorScale){
   
    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
   

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.STATE_NAME;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    
        var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');     

//create a text element for the chart title
   var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle");      

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale)
        //.orient("left");

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
};
    
//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};
    
//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    // Get the max value for the selected attribute
    var max = d3.max(csvData,function(d){
        return +d[expressed];});
   
// yScale is a global variable - just set the domain to 0 and the max value you found. Adjust if needed.
    yScale = d3.scaleLinear()
        .range([463,0])
        .domain([0,max]);    
    
    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var addstates = d3.selectAll(".addstates")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });

    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })    
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500)

        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        //resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    
     updateChart(bars, csvData.length, colorScale);
};
    
//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });    
    
     var chartTitle = d3.select(".chartTitle")
        .text(expressed + " in each state");
};

 //function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.STATE_NAME)
        .style("stroke", "blue")
        .style("stroke-width", "2");
         setLabel(props);
};    

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.STATE_NAME)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
                
    };
    
    //remove the info label
    d3.select(".infolabel")
        .remove();
};      
    
    
//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("FID", props.STATE_NAME + "_label")
        .html(labelAttribute);

    var stateName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.STATE_NAME);
};    
    
//function to move info label with mouse
function moveLabel(){
     //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");

};    
})();    