/* JS file for D3-Lab by Bob Cowling, 2017 */

(function(){

    
//pseudo-global variables
var attrArray = ["BREW_PER_CAPITA", "NUM_OF_BREWIES", "PRODUCTION_PER_CAPITA", "BARRELS_PRODUCED", "ECONOMIC_IMPACT", "IMPACT_PER_CAPITA"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
//begin script when window loads

var wordWrap;
  
//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 410,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a title for each attribute
var t_brewpercapita = "Breweries Per Capita";
var t_numofbreweries = "Number of Breweries";
var t_productionpercapita = "Beer Production Per Capita";
var t_barrelsproduced = "Barrels Produced";
var t_economicimpact = "Economic Impact";    
var t_impactpercapita = "Economic Impact Per Capita";    
    
var yScale = d3.scaleLinear()
    .range([400, 0])
    .domain([0, 10]);     
    
window.onload = setMap();
//set up choropleth map
function setMap(){   
      
    
    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 460;

    //create new svg container for the map
    var map = d3.select("#mapContainer")
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
        
        
        
var width = 960, height = 500;

var data = [{label: "Beer me!",     x: width / 13, y: height / 12 }];
            

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);
        
// Append Div for tooltip to SVG
var div = d3.select("body")
		    .append("div")   
    		.attr("class", "tooltip")               
    		.style("opacity", 0);        

var button = d3.button()
    .on('press', function(d, i) { //load cities data
        d3.csv("data/beercities.csv", function(data) {
    
//create prop symbols for cities data

map.selectAll("circle")
	.data(data)
	.enter()
	.append("circle")
	.attr("cx", function(d) {
		return projection([d.Longitude, d.Latitude])[0];
	})
	.attr("cy", function(d) {
		return projection([d.Longitude, d.Latitude])[1];
	})
	.attr("r", function(d) {
		return Math.sqrt(d.Rank) * 8;
	})
		.style("fill", "rgb(245,72,24)")	
		.style("opacity", 0.7)
        .style("stroke", "black") 
        
        .on("click", function(d) {       
    	div.transition()        
      	   .duration(200)      
           .style("opacity", .9);      
           div.text(d.City + " " + "Percent Sold: " + d.PERCENTSOLD)
           .style("left", (d3.event.pageX) + "px")     
           .style("top", (d3.event.pageY - 28) + "px")
           .style("fill", "white")
             
	})   

    
    //fade out tooltip on mouse out               
    .on("mouseout", function(d) {       
           div.transition()  
           .duration(500)      
           .style("opacity", 0)                     
           
    
    });
        });
     })
        
        .on('release', function(d, i) { d3.selectAll("circle")
        .remove();}); 
        

// Add buttons
var button = svg.selectAll('.button')
    .data(data)
  .enter()
    .append('g')
    .attr('class', 'button')
    .call(button);
        
   
    };
    
        
}; //end of setMap
    
function joinData(usStates, csvData){    
        
    //variables for data join
    //var attrArray = ["BARRELS_PRODUCED"];
    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvState = csvData[i]; //the current us state
        var csvKey = csvState.STATE_ABBR; //the CSV primary key
        //loop through geojson regions to find correct region
        for (var a=0; a<usStates.length; a++){
            var geojsonProps = usStates[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.STATE_ABBR; //the geojson primary key
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
                return "addstates " + d.properties.STATE_ABBR;
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
        "#FFFFD4",
        "#FEE391",
        "#FEC44F",
        "#FE9929",
        "#D95F0E",
        "#993404"
        ];
    
  //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

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
function setChart(csvData, colorScale){
   
    //create a second svg element to hold the bar chart
    var chart = d3.select("#chart")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
      

    //create a rectangle for chart background fill
    var chartbackground = chart.append("rect")
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
            return "bar " + d.STATE_ABBR;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    
        var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');     

   //create a text element for the chart title
   var chartTitle = chart.append("text")
        .attr("x", 60)
        .attr("y", 50)       
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
        .text(function(d){
            if (d == attrArray[0]) {
				d = t_brewpercapita;
			} else if (d == attrArray[1]) {
				d = t_numofbreweries;
			} else if (d == attrArray[2]) {
				d = t_productionpercapita;
			} else if (d == attrArray[3]) {
				d = t_barrelsproduced;
			} else if (d == attrArray[5]) {
				d = t_impactpercapita;
			} else if (d == attrArray[4]) {
				d = t_economicimpact;
			};
			return d;
		});
};
    
//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;
    
    
    // Get the max value for the selected attribute
    var max = d3.max(csvData,function(d){
        return +d[expressed];});
    
    ;
   
   
// yScale is a global variable - just set the domain to 0 and the max value you found. Adjust if needed.
   
        if (expressed == attrArray[1]){
         yScale = d3.scaleLinear()
            .range([400,0])    
            .domain([0,max + 32]);            
        } else if (expressed == attrArray[5]){  
            yScale = d3.scaleLinear()
                .range([400,0]) 
                .domain([0,max + 91]);
        } else {
    
    yScale = d3.scaleLinear()
                .range([400,0]) 
                .domain([0,Math.ceil(max)]);
            
        }
    
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
            return 400 - yScale(parseFloat(d[expressed]));
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
            return 400 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });   
    
    //add title to chart based on array value
    if (expressed == attrArray[0]) {    
        var chartTitle = d3.select(".chartTitle")
            .text("Number of " + t_brewpercapita + " in each state");
    } else if (expressed == attrArray[1]) {
        var chartTitle = d3.select(".chartTitle")    
            .text(t_numofbreweries + " in each state");
    } else if (expressed == attrArray[2]) {
        var chartTitle = d3.select(".chartTitle")    
            .text(t_productionpercapita + " in each state");
    } else if (expressed == attrArray[3]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Number of " + t_barrelsproduced + " in each state");
    } else if (expressed == attrArray[4]) {
         var chartTitle = d3.select(".chartTitle")    
            .text(t_economicimpact + " in each state");
    } else if (expressed == attrArray[5]) {
         var chartTitle = d3.select(".chartTitle")    
            .text(t_impactpercapita + " in each state");
    }; 
    
  
    
  
    
    //copied from setChart, don't delete the original
    var yAxis = d3.axisLeft()
        .scale(yScale)
    //update the charts axis    
    d3.selectAll("g.axis")
    .call(yAxis);   
    
    
};

 //function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.STATE_ABBR)
        .style("fill-opacity", "0.3")
        //.style("stroke-width", "2");
         setLabel(props);
};    

//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.STATE_ABBR)
        .style("fill-opacity", function(){
            return getStyle(this, "fill-opacity")
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
    if (expressed == attrArray[0]) {    
        var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + t_brewpercapita + "</b>";
    } else if (expressed == attrArray[1]) {
         var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + t_numofbreweries + "</b>";
    } else if (expressed == attrArray[2]) {
         var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + t_productionpercapita + "</b>";
    } else if (expressed == attrArray[3]) {
         var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + t_barrelsproduced + "</b>";
    } else if (expressed == attrArray[4]) {
          var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + t_economicimpact + "</b>";
    }  else if (expressed == attrArray[5]) {
          var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + t_impactpercapita + "</b>";
    };
    
    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("FID", props.STATE_ABBR + "_label")
        .html(labelAttribute);

    var stateName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.STATE_ABBR);
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