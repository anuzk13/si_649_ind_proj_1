window.d3 = require('d3');
const algebra_lib = require('algebra.js');
const math_lib = require('mathjs');
const functionPlot = require('function-plot');

var current_func;
var c_first_deriv;
var c_second_deriv;
var current_min;
var prev_min;
var x_margin;
var y_margin;
var points;
var num_steps;
var finished;

function newton_step (func, first_deriv, second_deriv, guess_point) {
  var first_deriv_exp = first_deriv.split('x').join(`(${guess_point})`);
  var first_deriv_eval = math_lib.eval(first_deriv_exp);
  var second_deriv_exp = second_deriv.split('x').join(`(${guess_point})`);
  var second_deriv_eval = math_lib.eval(second_deriv_exp);
  var new_point = guess_point - first_deriv_eval/second_deriv_eval;
  var guess_point_eval_exp = func.split('x').join(`(${guess_point})`);
  var guess_point_eval = math_lib.eval(guess_point_eval_exp);
  var new_point_eval_exp = func.split('x').join(`(${new_point})`);
  var new_point_eval = math_lib.eval(new_point_eval_exp);
  var quadratic_approximation = 
    `${guess_point_eval} + ${first_deriv_eval} * (x - ${guess_point}) + (${second_deriv_eval}/2) * (x - ${guess_point})^2`;
  return {guess_point_eval, new_point_eval, quadratic_approximation, new_point};
}

function plot_newton_step (func, deriv_func, quadratic_approx, guess_point_eval, guess_point, new_point_eval, new_point) {
  functionPlot({
    target: '#newton',
    height: 250,
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
      fn: quadratic_approx
    },
    {
      points: [
        [guess_point, guess_point_eval],
        [new_point, new_point_eval]
      ],
      fnType: 'points',
      graphType: 'polyline'
    },
    {
      points: [
        [guess_point, guess_point_eval],
        [new_point, new_point_eval]
      ],
      fnType: 'points',
      graphType: 'scatter'
    }]
  });
}

function do_step() {
  if (!finished) {
    var newton_data = newton_step (current_func, c_first_deriv, c_second_deriv, points[points.length-1])
    plot_newton_step (
        current_func, c_first_deriv, newton_data.quadratic_approximation,
        newton_data.guess_point_eval, points[points.length-1], newton_data.new_point_eval, newton_data.new_point);
    document.getElementById('current_val_newton').innerHTML = newton_data.new_point_eval;
    points.push(newton_data.new_point);
    prev_min = newton_data.guess_point_eval;
    current_min = newton_data.new_point_eval;
    num_steps ++;
    if (Math.abs(current_min - prev_min) < 0.0001) {
        document.getElementById('current_val_newton').style = 'color: green;';
        var prev_cont = document.getElementById('current_val_newton').innerHTML;
        document.getElementById('current_val_newton').innerHTML = prev_cont + ' Minimum found';
        finished = true;
    } else if (num_steps > 20) {
        document.getElementById('current_val_newton').style = 'color: red;';
        var prev_cont = document.getElementById('current_val_newton').innerHTML
        document.getElementById('current_val_newton').innerHTML = prev_cont + ' Max iterations reached';
        finished = true;
    } 
  }
}

exports.init = (f_string, guess) => {
  document.getElementById('current_val_newton').style = 'color: black;';
  current_func = f_string;
  current_min = 0;
  prev_min = Number.MAX_VALUE;
  finished = false;
  num_steps = 0;
  points = [guess];
  c_first_deriv = math_lib.derivative(current_func,'x').toString();
  c_second_deriv =math_lib.derivative(c_first_deriv,'x').toString(); 
  var y_eval = math_lib.eval(current_func.split('x').join(`(${points[0]})`));
  y_margin = Math.max(1, Math.abs(y_eval) + Math.abs(y_eval) * .5);
  x_margin = Math.max(1, Math.abs(points[0]) + Math.abs(points[0] * 0.5));
  do_step();
}

exports.step = () => {
  do_step();
}

exports.finished = () => finished;

exports.data = () => {
  return {points,
  current_min,
  current_func,
  num_steps}
}
