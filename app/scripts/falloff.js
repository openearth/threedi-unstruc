"use strict";
var svg = d3.select("#plot").append("svg");

var margin = { top: 8, right: 10, bottom: 2, left: 10 };
var config = {
    span: 3,
    n: 30,
    width: 960 - margin.left - margin.right,
    height: 400 - margin.top - margin.bottom
};

// scales
var x = d3.scale.linear()
        .domain([0, config.n])
        .range([0, config.width]);

var y = d3.scale.linear()
        .domain([-3, 3])
        .range([config.height, 0]);

// Data
var N = d3.random.normal(0, 1);
var X = d3.range(config.n);
var Y = X.map(N);
// Generate data object
var data = X.map(function(i){ return {x: X[i], y: Y[i]};});

// Plot function
var line = d3.svg.line()
        .x(function(d, index) { return x(d.x); })
        .y(function(d, index) { return y(d.y); });

// svn element
svg
    .attr("width", config.width + margin.left + margin.right)
    .attr("height", config.height + margin.top + margin.bottom);
// Plot group
var g = svg
        .datum(data)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
// Line
var path = g
        .append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", function(d){
            return line(d);
        });



var drag = d3.behavior.drag()
        .origin(function(d) {
            var origin = {y: y(d.y), x: x(d.x)};
            return origin;
        })
        .on("drag", dragmove)
        .on("dragend", dragend);


var circles = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", 5)
        .attr("cx", function(d){
            return x(d.x);
        })
        .attr("cy", function(d){
            return y(d.y);
        })
        .call(drag);

function dragmove(d) {
    // Select the span
    var span = Math.round(1.0 + Math.abs(x.invert(d3.event.x) - d.x) );
    var oldy = data[d.x].y;
    var newy = y.invert(d3.event.y);
    var dy = newy - oldy;
    d3.range(config.n).map(function(i){
        // span: 4
        // 1-1/16, 1-4/16, 1-9/16, 0,
        //
        var ratio = Math.max(1 - Math.abs(d.x - data[i].x)/Math.max(span, 1), 0);
        if (i in data) {
            data[i].y = data[i].y + dy * ratio;
        }
    });
    drawcircles();
}

function dragend(d) {
    drawcircles();
    drawlines();
}

function drawcircles() {
    circles
        .data(data)
        .attr("cx", function(d){
            return x(d.x);
        })
        .attr("cy", function(d){
            return y(d.y);
        });
}


function drawlines() {
    path
        .datum(data)
        .attr("d", function(d){
            return line(d);
        });
}
