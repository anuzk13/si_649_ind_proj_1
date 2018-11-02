var d3 = require('d3');

var steps_data = [];

var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 960 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

var x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    dragging = {};

var line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    n_points,
    g_points,
    foreground;

var colors = d3.scale.linear().domain([0,22])
            .interpolate(d3.interpolateHcl)
            .range([d3.rgb("#00f1ff"), d3.rgb('#ff0000')]);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("margin-left", "calc(30% - 250px)")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function refresh_data() {
    svg.empty();
}

function viz_data() {
    x = d3.scale.ordinal().rangePoints([0, width], 1);
    y = {};
    dragging = {};

    svg.selectAll(".background").remove();
    svg.selectAll(".foreground").remove();
    svg.selectAll(".dimension").remove();
    svg.selectAll(".axis").remove();
    svg.selectAll(".brush").remove();
    svg.selectAll(".dot").remove();

    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(steps_data[0]).filter(function(d) {
        var steps_data2 = steps_data.concat({"Newton steps":0,"Gardient steps":0,"Guess":0,"Alpha":0})
        if (!isNaN(steps_data[0][d])) {
            y[d] = d3.scale.linear()
                .domain(d3.extent(steps_data2, function(p) { return +p[d]; }))
                .range([height, 0]);
        } else {
            y[d] = d3.scale.ordinal().range([height, 0]);
        }
        return true;
    }));
    
    // Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(steps_data)
        .enter().append("path")
        .attr("d", path);
    
    // Add blue foreground lines for focus.
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(steps_data)
        .enter().append("path")
        .attr("d", path);

    n_points = svg.selectAll("dot")
        .data(steps_data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("fill", d=>colors(d["Gardient steps"]))
        .attr("cx", function(d) { return x("Gardient steps"); })
        .attr("cy", function(d) { return y["Gardient steps"](d["Gardient steps"]); });
    
    g_points = svg.selectAll("dot")
        .data(steps_data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", 3.5)
        .attr("fill", d=>colors(d["Newton steps"]))
        .attr("cx", function(d) { return x("Newton steps"); })
        .attr("cy", function(d) { return y["Newton steps"](d["Newton steps"]); });
    
    
    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        .call(d3.behavior.drag()
            .origin(function(d) { return {x: x(d)}; })
            .on("dragstart", function(d) {
                dragging[d] = x(d);
                background.attr("visibility", "hidden");
            })
            .on("drag", function(d) {
                dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                foreground.attr("d", path);
                dimensions.sort(function(a, b) { return position(a) - position(b); });
                x.domain(dimensions);
                g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
            })
            .on("dragend", function(d) {
            delete dragging[d];
            transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
            transition(foreground).attr("d", path);
            background
                .attr("d", path)
                .transition()
                .delay(500)
                .duration(0)
                .attr("visibility", null);
            }));
    
    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) {
            d3.select(this).call(axis.scale(y[d])); 
        })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; });
    
    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(
                y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush)
            );
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);
}

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
  n_points.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
}

exports.add_datum = (datum) => {
    steps_data.push(datum);
    viz_data();
}

exports.viz_data = () => {
    viz_data();
}
