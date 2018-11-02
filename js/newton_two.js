const newton = require('./newton.js');

var do_it = document.getElementById('do_t');
var step = document.getElementById('step');
var animate = document.getElementById('animate');
var anim = false;

var init = () => {
  step.disabled = false;
  var f_string = document.getElementById('func').value.trim();
  var point = Number(document.getElementById('guess').value);
  if (!f_string || isNaN(point) || !document.getElementById('guess').value) {
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
    newton.init(f_string, point);
    return true;
  }
}

do_it.onclick = init;


var animate_f = function(){
  if(anim && !newton.finished()){
    newton.step();
    setTimeout(animate_f, 100);
  }
}

animate.onclick = () => {
  anim = init();
  animate_f();
}

step.onclick = () => {
    newton.step();
    anim = false;
}