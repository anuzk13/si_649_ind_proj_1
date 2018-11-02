const newton = require('./newton.js');
const newton_optim = require('./newton_optim.js');
const gradient = require('./gradient.js');
const parallel = require('./parallel_plot');

var do_it = document.getElementById('do_t');
var step = document.getElementById('step');
var add_to_plot = document.getElementById('add_plot');
var animate = document.getElementById('animate');
var view = document.getElementById('view');
var anim = false;

var init = () => {
  add_to_plot.disabled = true;
  step.disabled = false;
  var f_string = document.getElementById('func').value.trim();
  var point = Number(document.getElementById('guess').value);
  var alpha = Number(document.getElementById('alpha').value);
  if (!f_string || isNaN(point) || !document.getElementById('guess').value ||
        isNaN(alpha) || !document.getElementById('alpha').value) {
    alert ('Input valid expressions for equation and guess')
    return false;
  } else if (/[a-w]+|y|z/.test(f_string)) {
    alert('Only use x as the variable, use a polinomyal expression with integer exponents')
    return false;
  } else if (/x\d+|\d+x/.test(f_string)) {
    alert('Use the * sign for multiplication')
    return false;
  }
  else {
    newton_optim.init(f_string, point);
    gradient.init(f_string, point, alpha);
    return true;
  }
}

do_it.onclick = init;

add_to_plot.onclick = () => {
  var newton_data = newton_optim.data();
  var gradient_data = gradient.data();
  var datum = {
    'Function' : newton_data.current_func,
    'Newton steps' : newton_data.num_steps,
    'Gardient steps' : gradient_data.num_steps,
    'Guess' : newton_data.points[0],
    'Alpha': gradient_data.alpha
  }
  parallel.add_datum(datum);
  add_to_plot.disabled = true;
}

var animate_f = function(){
  if(anim && (!newton_optim.finished() || !gradient.finished())){
    newton_optim.step();
    gradient.step();
    setTimeout(animate_f, 100);
  }
  else if (newton_optim.finished() && gradient.finished()) {
    add_to_plot.disabled = false;
  }
}

animate.onclick = () => {
  anim = init();
  animate_f();
}

step.onclick = () => {
    newton_optim.step();
    gradient.step();
    anim = false;
    if (newton_optim.finished() && gradient.finished()) {
      add_to_plot.disabled = false;
    }
}