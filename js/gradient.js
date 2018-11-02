window.d3 = require('d3');
const math_lib = require('mathjs');
const functionPlot = require('function-plot');

var current_func;
var current_deriv;
var current_min;
var prev_min;
var x_margin;
var y_margin;
var points;
var alpha;
var num_steps;
var finished;

function gradient_step (func, deriv_func, guess_point) {
    var tangent_exp = deriv_func.split('x').join(`(${guess_point})`);
    var slope = math_lib.eval(tangent_exp);
    var new_point = guess_point - slope * alpha;
    var guess_eval_exp = func.split('x').join(`(${guess_point})`);
    var guess_eval = math_lib.eval(guess_eval_exp);
    var new_point_exp = func.split('x').join(`(${new_point})`);
    var new_point_eval = math_lib.eval(new_point_exp);
     
    return {new_point, guess_eval, new_point_eval}
}

function plot_gradient_step (func, deriv_func, guess_point, new_point, guess_eval, new_point_eval) {
  functionPlot({
    target: '#gradient',
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
      points: [
        [guess_point, guess_eval],
        [new_point, new_point_eval]
      ],
      fnType: 'points',
      graphType: 'polyline'
    },
    {
      points: [
        [guess_point, guess_eval]
      ],
      fnType: 'points',
      graphType: 'scatter'
    }]
  });
}

function do_step() {
  if (!finished) {
    var gradient_data = gradient_step(current_func, current_deriv, points[points.length-1]);
    plot_gradient_step (current_func, current_deriv, points[points.length-1],
        gradient_data.new_point, gradient_data.guess_eval, gradient_data.new_point_eval)
    document.getElementById('current_val_gradient').innerHTML = gradient_data.new_point_eval;
    points.push(gradient_data.new_point);
    prev_min = gradient_data.guess_eval;
    current_min = gradient_data.new_point_eval;
    num_steps ++;
    if (Math.abs(current_min - prev_min) < 0.0001) {
        document.getElementById('current_val_gradient').style = 'color: green;';
        var prev_cont = document.getElementById('current_val_gradient').innerHTML;
        document.getElementById('current_val_gradient').innerHTML = prev_cont + ' Minimum found';
        finished = true;
    } else if (num_steps > 20) {
        document.getElementById('current_val_gradient').style = 'color: red;';
        var prev_cont = document.getElementById('current_val_gradient').innerHTML
        document.getElementById('current_val_gradient').innerHTML = prev_cont + ' Max iterations reached';
        finished = true;
    } 
  }
}

exports.init = (f_string, guess, alp) => {
  document.getElementById('current_val_gradient').style = 'color: black;';
  alpha = alp;
  current_func = f_string;
  current_min = 0;
  finished = false;
  num_steps = 0;
  prev_min = Number.MAX_VALUE;
  points = [guess];
  current_deriv = math_lib.derivative(current_func,'x').toString();
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
  alpha,
  num_steps}
}
