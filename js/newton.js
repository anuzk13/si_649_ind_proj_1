window.d3 = require('d3');
const algebra_lib = require('algebra.js');
const math_lib = require('mathjs');
const functionPlot = require('function-plot');

var current_func;
var current_deriv;
var current_zero;
var x_margin;
var y_margin;
var points;
var finished;

function newton_step (func, deriv_func, guess_point) {
  var tangent_exp = deriv_func.split('x').join(`(${guess_point})`);
  var slope = math_lib.eval(tangent_exp);
  var point_exp = func.split('x').join(`(${guess_point})`);
  var point = math_lib.eval(point_exp);
  var tang_func = algebra_lib.parse(`${slope} * ( x - (${guess_point}) ) + (${point})`);
  var intercept_eq = new algebra_lib.Equation(tang_func, 0);
  var intercept = Number(intercept_eq.solveFor("x"));
  var new_point_exp = func.split('x').join(`(${intercept})`);
  var new_point = Number(math_lib.eval(new_point_exp));
  return {intercept, new_point, tangent: tang_func.toString()};
}

function render_current_val (new_point) {
  document.getElementById('current_val_newton').innerHTML = new_point;
}

function plot_newton_step (func, deriv_func, guess_point, intercept, new_point, tangent) {
  functionPlot({
    target: '#newton',
    yAxis: {domain: [-y_margin, y_margin]},
    xAxis: {domain: [-x_margin, x_margin]},
    data: [{
      fn: func,
      derivative: {
        fn: deriv_func,
        x0: guess_point
      }
    },
    {
      fn: tangent
    },
    {
      points: [
        [intercept, 0],
        [intercept, new_point]
      ],
      fnType: 'points',
      graphType: 'polyline'
    },
    {
      points: [
        [intercept, new_point]
      ],
      fnType: 'points',
      graphType: 'scatter'
    }]
  });
}

function do_step() {
  if (Math.abs(current_zero) < 0.001) {
    finished = true;
  } else {
    var newton_data = newton_step(current_func, current_deriv, points[points.length-1]);
    points.push(newton_data.intercept);
    current_zero = newton_data.new_point;
    plot_newton_step (current_func, current_deriv, points[points.length-1],
      newton_data.intercept, newton_data.new_point, newton_data.tangent);
    render_current_val(newton_data.new_point);
  }
  
}

exports.init = (f_string, guess) => {
  current_func = f_string;
  current_zero = Number.MAX_VALUE;
  points = [guess];
  finished = false;
  current_deriv = math_lib.derivative(current_func,'x').toString();
  var y_eval = math_lib.eval(current_func.split('x').join(`(${points[0]})`));
  y_margin = Math.max(1, Math.abs(y_eval) + Math.abs(y_eval) * .1);
  x_margin = Math.max(1, Math.abs(points[0]) + Math.abs(points[0] * 0.1));
  do_step();
}
exports.step = () => {
  do_step();
}

exports.finished = () => {
  return finished;
}