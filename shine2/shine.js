"use strict";

/***************************************************************
 * A pixel
 ***************************************************************/
function Pixel(x,y) {
  this.x = x;
  this.y = y;
}

Pixel.prototype.distance = function(other) {
  return Math.abs(this.x-other.x) + Math.abs(this.x-other.x);
}

/***************************************************************
 * The main gui
 ***************************************************************/
function JuliaBraidGui() {
  window.addEventListener('resize', this.resize_canvas.bind(this));
  this.left_plot = {'canvas': document.getElementById('left_plot_canvas'),
                    'scaling_factor': 0.0,
                    'width': 2.0,
                    'div': document.getElementById('left_plot_div'),
                    'GL': {'canvas': document.getElementById('left_gl_plot_canvas'),
                           'inited':false,
                           'call_count':0},
                    'ul': new Complex(-1.0,1.0),
                    'dragging_plot':false,
                    'dragging_root':-1,
                    'frame':{'index':0, 'type':'kf'},
                    'mouse_location_label': document.getElementById('left_mouse_location'),
                    'control': {'julia': document.getElementById('left_control_julia'),
                                'julia_shading': document.getElementById('left_control_julia_shading'),
                                'roots': document.getElementById('left_control_roots'),
                                'cpoints': document.getElementById('left_control_cpoints'),
                                'cpoint_images': document.getElementById('left_control_cpoint_images'),
                                'K': document.getElementById('left_control_K'),
                                'axes': document.getElementById('left_control_axes'),
                                'frame_radio_kf': document.getElementById('left_control_radio_kf'),
                                'frame_slider_kf': document.getElementById('left_control_kf'),
                                'frame_label_kf': document.getElementById('left_control_kf_label'),
                                'frame_slider_f': document.getElementById('left_control_f'),
                                'frame_label_f': document.getElementById('left_control_f_label'),
                                'roots_label': document.getElementById('left_control_roots_label'),
                                'K_label': document.getElementById('left_control_K_label') } };
  this.left_plot.CC = this.left_plot.canvas.getContext('2d');
  this.right_plot = {'canvas': document.getElementById('right_plot_canvas'),
                     'scaling_factor': 0.0,
                     'width': 2.0,
                     'div': document.getElementById('right_plot_div'),
                     'GL': {'canvas': document.getElementById('right_gl_plot_canvas'),
                             'inited':false,
                             'call_count':0},
                     'ul': new Complex(-1.0,1.0),
                     'dragging_plot':false,
                     'dragging_root':-1,
                     'frame':{'index':0, 'type':'kf'},
                     'mouse_location_label': document.getElementById('right_mouse_location'),
                      'control': {'julia': document.getElementById('right_control_julia'),
                                  'julia_shading': document.getElementById('right_control_julia_shading'),
                                  'roots': document.getElementById('right_control_roots'),
                                  'cpoints': document.getElementById('right_control_cpoints'),
                                  'cpoint_images': document.getElementById('left_control_cpoint_images'),
                                  'K': document.getElementById('right_control_K'),
                                  'axes': document.getElementById('right_control_axes'),
                                  'frame_radio_kf': document.getElementById('right_control_radio_kf'),
                                  'frame_slider_kf': document.getElementById('right_control_kf'),
                                  'frame_label_kf': document.getElementById('right_control_kf_label'),
                                  'frame_slider_f': document.getElementById('right_control_f'),
                                  'frame_label_f': document.getElementById('right_control_f_label'),
                                  'roots_label': document.getElementById('right_control_roots_label'),
                                  'K_label': document.getElementById('right_control_K_label') } };
  this.right_plot.CC = this.right_plot.canvas.getContext('2d');
  var plots = [this.left_plot, this.right_plot];
  for (var i=0; i<2; i++) {
    plots[i].canvas.addEventListener('mousedown', this.canvas_mouse.bind(this));
    plots[i].canvas.addEventListener('mouseup', this.canvas_mouse.bind(this));
    plots[i].canvas.addEventListener('mousemove', this.canvas_mouse.bind(this));
    plots[i].canvas.addEventListener('mousewheel', this.canvas_mouse.bind(this));
    //canvii[i].addEventListener('contextmenu', function(e) { e.preventDefault(); return false; });
  }
  var simplecntls = ['julia','roots','cpoints','cpoint_images', 'K','axes'];
  for (var x in simplecntls) {
    this.left_plot.control[simplecntls[x]].onchange = function() { this.redraw_plot(this.left_plot); }.bind(this);
    this.right_plot.control[simplecntls[x]].onchange = function() { this.redraw_plot(this.right_plot); }.bind(this);
  }
  this.left_plot.control.julia_shading.oninput = function() { this.redraw_plot(this.left_plot); }.bind(this);
  this.right_plot.control.julia_shading.oninput = function() { this.redraw_plot(this.right_plot); }.bind(this);
  this.left_plot.control.frame_slider_kf.oninput = function(){return this.frame_update(this.left_plot, 'frame_slider_kf');}.bind(this);
  this.left_plot.control.frame_slider_f.oninput = function(){return this.frame_update(this.left_plot, 'frame_slider_f');}.bind(this);
  this.left_plot.control.frame_radio_kf.onchange = function(){return this.frame_update(this.left_plot, 'frame_radio_kf');}.bind(this);
  document.getElementById('left_control_radio_f').onchange = function(){return this.frame_update(this.left_plot, 'frame_radio_kf');}.bind(this);
  this.right_plot.control.frame_slider_kf.oninput = function(){return this.frame_update(this.right_plot, 'frame_slider_kf');}.bind(this);
  this.right_plot.control.frame_slider_f.oninput = function(){return this.frame_update(this.right_plot, 'frame_slider_f');}.bind(this);
  this.right_plot.control.frame_radio_kf.onchange = function(){return this.frame_update(this.right_plot, 'frame_radio_kf');}.bind(this);
  document.getElementById('right_control_radio_f').onchange = function(){return this.frame_update(this.right_plot, 'frame_radio_kf');}.bind(this);
  this.program_box = document.getElementById('program-box');
  
  this.control = {'synchronize':document.getElementById('global_control_synchronize'),
                  'braid_numroots':document.getElementById('frame_control_braid_numroots'),
                  'braid_braid':document.getElementById('frame_control_braid_braid'),
                  'braid_keyframes':document.getElementById('frame_control_braid_keyframes'),
                  'single_numroots':document.getElementById('frame_control_single_numroots')};
  this.control.synchronize.onchange = function (evt) { if (this.control.synchronize.checked) { this.mirror_frame_sliders(); } }.bind(this);
  document.getElementById('frame_control_braid_go').onclick = this.reload.bind(this);
  document.getElementById('frame_control_single_go').onclick = this.reload.bind(this);
  
  //Trigger creating the new polynomial
  this.num_iframes = 200;
  document.getElementById('frame_control_single_go').click();
  
  //do it twice to handle resizing weirdness
  this.resize_canvas();
  this.resize_canvas();
  
  this.redraw_plot(this.left_plot);
  this.redraw_plot(this.right_plot);
  
}



JuliaBraidGui.prototype.resize_canvas = function() {
  //var ww = document.getElementById('plot').offsetWidth - 2;
  var ww = this.program_box.clientWidth/2 - 5;
  var wh = window.innerHeight;
  var w = (ww < wh ? ww : wh);
  this.left_plot.canvas.width = w;
  this.left_plot.canvas.height = w;
  this.right_plot.canvas.width = w;
  this.right_plot.canvas.height = w;
  this.left_plot.scaling_factor = w / this.right_plot.width;
  this.right_plot.scaling_factor = w / this.left_plot.width;
  
  this.left_plot.GL.canvas.width = w;
  this.left_plot.GL.canvas.height = w;
  this.right_plot.GL.canvas.width = w;
  this.right_plot.GL.canvas.height = w;
  
  this.left_plot.div.style.width = w;
  this.left_plot.div.style.height = w;
  this.right_plot.div.style.width = w;
  this.right_plot.div.style.height = w;
  
  this.redraw_plot(this.left_plot);
  this.redraw_plot(this.right_plot);
}




JuliaBraidGui.prototype.process_braid = function(numroots, braid) {
  var ans = {'braid':braid.split(' ').join('').split(',')};
  ans.nswaps = ans.braid.length;
  var base_roots = [...Array(numroots).keys()].map( function(x) {return new Complex(x,0);});
  ans.roots_to_base_roots = [ [...Array(numroots).keys()] ];
  for (var i=0; i<ans.braid.length; i++) {
    ans.braid[i] = ans.braid[i].split('-').map(Number);
    var new_root_poses = ans.roots_to_base_roots[ans.roots_to_base_roots.length-1].slice();
    var swapi0 = new_root_poses.indexOf(ans.braid[i][0]);
    var swapi1 = new_root_poses.indexOf(ans.braid[i][1]);
    var temp = new_root_poses[swapi0];
    new_root_poses[swapi0] = new_root_poses[swapi1];
    new_root_poses[swapi1] = temp;
    ans.roots_to_base_roots.push( new_root_poses );
  }
  ans.get_root_location = function( root_ind, swap_ind, t ) {
                            if (ans.roots_to_base_roots[swap_ind][root_ind] == ans.roots_to_base_roots[swap_ind+1][root_ind]) {
                              return base_roots[ans.roots_to_base_roots[swap_ind][root_ind]];
                            }
                            //If we are here, we definitely have to move; check if
                            //we rotate ccw or cw
                            var br0 = base_roots[ans.braid[swap_ind][0]];
                            var br1 = base_roots[ans.braid[swap_ind][1]];
                            var center = br0.add(br1).real_mul(0.5);
                            var start_root = base_roots[ans.roots_to_base_roots[swap_ind][root_ind]];
                            var CW = (ans.braid[swap_ind][1] > ans.braid[swap_ind][0]);
                            return start_root.rotate(center, t*Math.PI, CW);
                          };
  return ans;
}


JuliaBraidGui.prototype.reload = function(evt) {
  if (evt.target.id == 'frame_control_single_go') {
    var roots = [];
    var nr = Number(this.control.single_numroots.value);
    for (var i=0; i<nr; i++) {
      roots[i] = new Complex(i,0);
    }
    this.frames = [{'poly': new Polynomial(new Complex(5,0), roots)}];
    this.iframes = [];
    for (var i=0; i<this.num_iframes; i++) {
      this.iframes[i] = {'src':0, 'dest':0, 't':0};
    }
    document.getElementById('global_control_nframes_label').innerHTML = '1';
    document.getElementById('global_control_braid_label').innerHTML = 'none';
    this.reset_plots(1);
    return;
  }
  //If we got here, we need to build it from a braid
  this.frames = [];
  var nr = Number(this.control.braid_numroots.value);
  this.braid = this.process_braid(nr, this.control.braid_braid.value);
  var nframes_per_swap = Number(this.control.braid_keyframes.value);
  var nframes = (nframes_per_swap * this.braid.nswaps) + 1;
  for (var i=0; i<this.braid.nswaps; i++) {
    for (var j=0; j<nframes_per_swap; j++) {
      var roots = [];
      for (var k=0; k<nr; k++) {
        roots[k] = this.braid.get_root_location(k, i, j/nframes_per_swap);
      }
      this.frames.push( {'poly': new Polynomial(new Complex(5,0), roots)} );
    }
  }
  //Add one last frame
  var roots = [];
  for (var k=0; k<nr; k++) {
    roots[k] = this.braid.get_root_location(k, this.braid.nswaps-1, 1);
  }
  this.frames.push( {'poly': new Polynomial(new Complex(5,0), roots)} );
  
  
  this.iframes = [];
  for (var i=0; i<this.num_iframes; i++) {
    var raw_kframe = (i/this.num_iframes)*(nframes-1);
    var source_frame = Math.floor( raw_kframe );
    var dest_frame = source_frame + 1;
    var t = raw_kframe - Math.floor(raw_kframe);
    this.iframes[i] = {'src':source_frame, 'dest':dest_frame, 't':t};
  }

  document.getElementById('global_control_nframes_label').innerHTML = nframes;
  document.getElementById('global_control_braid_label').innerHTML = this.control.braid_braid.value;
  this.reset_plots(nframes);
  
}


JuliaBraidGui.prototype.reset_plots = function(nframes) {
  var plots = [this.left_plot, this.right_plot];
  for (var i=0; i<2; i++) {
    plots[i].control.frame_radio_kf.click();
    plots[i].control.frame_slider_kf.min = 0;
    plots[i].control.frame_slider_kf.max = nframes-1;
    plots[i].control.frame_slider_kf.value = 0;
    plots[i].control.frame_label_kf.innerHTML = 0;
    plots[i].control.frame_slider_f.min = 0;
    plots[i].control.frame_slider_f.max = this.num_iframes-1;
    plots[i].control.frame_slider_f.value = 0;
    plots[i].control.frame_label_f.innerHTML = 0;
    plots[i].frame.index = 0;
    plots[i].frame.type = 'kf';
    this.redraw_plot(plots[i]);
  }
}



JuliaBraidGui.prototype.frame_update = function(X, control_name) {
  var Y = (X == this.left_plot ? this.right_plot : this.left_plot);
  if (control_name == 'frame_radio_kf') {
    X.frame.type = (X.control[control_name].checked ? 'kf' : 'f');
    X.frame.index = (X.control[control_name].checked ? Number(X.control.frame_slider_kf.value) : Number(X.control.frame_slider_f.value));
  } else if (control_name == 'frame_slider_kf') {
    X.control.frame_label_kf.innerHTML = X.control.frame_slider_kf.value;
    if (X.frame.type == 'kf') { X.frame.index = Number(X.control.frame_slider_kf.value); }
    if (this.control.synchronize.checked) {
      this.fake_slider_input(Y, 'frame_slider_kf', X.control.frame_slider_kf.value);
      this.redraw_plot(Y);
    }
  } else if (control_name == 'frame_slider_f') {
    X.control.frame_label_f.innerHTML = X.control.frame_slider_f.value;
    if (X.frame.type == 'f') { X.frame.index = Number(X.control.frame_slider_f.value); }
    if (this.control.synchronize.checked) {
      this.fake_slider_input(Y, 'frame_slider_f', X.control.frame_slider_f.value);
      this.redraw_plot(Y);
    }
  }
  this.redraw_plot(X);
}

JuliaBraidGui.prototype.fake_slider_input = function(X, control_name, value) {
  X.control[control_name].value = value;
  X.control[control_name.replace('slider', 'label')].innerHTML = value;
  if (X.frame.type == control_name.split('_')[2]) {
    X.frame.index = value;
  }
}

JuliaBraidGui.prototype.mirror_frame_sliders = function() {
  this.fake_slider_input(this.right_plot, 'frame_slider_kf', this.left_plot.control.frame_slider_kf.value);
  this.fake_slider_input(this.right_plot, 'frame_slider_f', this.left_plot.control.frame_slider_f.value);
  this.redraw_plot(this.right_plot);
}


JuliaBraidGui.prototype.pixel_to_complex = function(X, p) {
  return new Complex( X.ul.real + (p.x / X.scaling_factor),
                      X.ul.imag - (p.y / X.scaling_factor) );
}

JuliaBraidGui.prototype.complex_to_pixel = function(X, c) {
  return new Pixel( (c.real - X.ul.real) * X.scaling_factor,
                    -(c.imag - X.ul.imag) * X.scaling_factor );
}


JuliaBraidGui.prototype.canvas_mouse = function(evt) {
  var X = undefined;
  if (evt.target.id == 'left_plot_canvas') {
    X = this.left_plot;
  } else {
    X = this.right_plot;
  }
  var param_rect = X.canvas.getBoundingClientRect();
  var p = new Pixel(evt.clientX - param_rect.left, 
                    evt.clientY - param_rect.top);
  if (evt.type == 'mousedown') {
    if (evt.button == 0) {
      var which_root = -1;
      if (X.frame.type == 'kf') {
        //Decide if we are close enough to any of the roots to grab it
        for (var i=0; i<this.frames[X.frame.index].poly.roots.length; i++) {
          var root_p = this.complex_to_pixel(X, this.frames[X.frame.index].poly.roots[i]);
          if (p.distance(root_p) < 10) { which_root = i; break; }
        }
        //Or maybe we are dragging K
        if (which_root == -1) {
          var K_p = this.complex_to_pixel(X, this.frames[X.frame.index].poly.K);
          if (p.distance(K_p) < 10) { which_root = -2; } //-2 denotes K
        }
      }
      if (which_root == -1) {
        X.dragging_plot = true;
        X.dragging_plot_pixel_start = p;
        X.dragging_plot_complex_ul_start = X.ul;
      } else {
        X.dragging_root = which_root;
      }
      return;
    }
  } else if (evt.type == 'mouseup') {
    if (evt.button == 0) {
      X.dragging_plot = false;
      X.dragging_root = -1;
    }
    return;
  }
  //if we are dragging the plot, and we got a mousemove, 
  //adjust the plot location as appropriate
  if (evt.type == 'mousemove') {
    var cp = this.pixel_to_complex(X, p);
    if (X.dragging_plot) {
      var complex_drag = new Complex( (p.x - X.dragging_plot_pixel_start.x)/X.scaling_factor,
                                      (X.dragging_plot_pixel_start.y - p.y)/X.scaling_factor );
      X.ul = X.dragging_plot_complex_ul_start.sub( complex_drag );
    } else if (X.dragging_root != -1) {
      if (X.dragging_root >= 0) {
        this.frames[X.frame.index].poly.roots[X.dragging_root] = cp;
      } else {
        this.frames[X.frame.index].poly.K = cp;
      }
    }
    X.mouse_location_label.innerHTML = cp.toStringPrecision(5);
    if (X.dragging_plot) {
      this.redraw_plot(X);
    } else if  (X.dragging_root != -1) {
      this.redraw_plot(this.left_plot);
      this.redraw_plot(this.right_plot);
    }
  }
  
  
  //If we use the wheel, zoom the plot
  if (evt.type == 'mousewheel') {
    var param_rect = X.canvas.getBoundingClientRect();
    var p = new Pixel(evt.clientX - param_rect.left, 
                      evt.clientY - param_rect.top);
    var cp = this.pixel_to_complex(X, p);
    var to_ul = X.ul.sub( cp );
    var scale = (evt.wheelDelta > 0 ? 0.9 : 1.1);
    to_ul = to_ul.real_mul( scale );
    X.width *= (evt.wheelDelta > 0 ? 0.9 : 1.1);
    X.ul = cp.add( to_ul );
    evt.preventDefault();
    X.scaling_factor = X.canvas.width / X.width;
    this.redraw_plot(X);
  }
  
}



JuliaBraidGui.prototype.redraw_plot = function(X) {
  
  X.CC.clearRect(0,0,X.canvas.width,X.canvas.height);
  
  //Get the polynomial
  var P = undefined;
  var cpoints = undefined;
  var cpoint_images = undefined;
  if (X.frame.type == 'kf') {
    P = this.frames[X.frame.index].poly;
    var old_poly_valid = false; //this.frames[X.frame.index].hasOwnProperty('polystring') &&
                                //this.frames[X.frame.index].polystring == P.toString();
    //this.frames[X.frame.index].polystring = P.toString();
    if (X.control.cpoints.checked || X.control.cpoint_images.checked) {
      if (!this.frames[X.frame.index].hasOwnProperty('Dpoly') || !old_poly_valid) {
        this.frames[X.frame.index]['Dpoly'] = P.expand().derivative();
      }
      if (!this.frames[X.frame.index].hasOwnProperty('cpoints') || !old_poly_valid) {
        this.frames[X.frame.index]['cpoints'] = this.frames[X.frame.index]['Dpoly'].find_all_roots(X.ul, X.width, X.width);
      }
      cpoints = this.frames[X.frame.index]['cpoints'];
      if (X.control.cpoint_images.checked) {
        cpoint_images = [];
        for (var i=0; i<cpoints.length; i++) {
          cpoint_images[i] = P.evaluate(cpoints[i]);
          //console.log(cpoints[i], " maps to ", cpoint_images[i], " under ", P);
        }
      }
    }
  } else {
    var src = this.iframes[X.frame.index].src;
    var dest = this.iframes[X.frame.index].dest;
    var t = this.iframes[X.frame.index].t;
    P = this.frames[src].poly.interpolate(this.frames[dest].poly, t);
    if (X.control.cpoints.checked || X.control.cpoint_images.checked) {
      var DP = P.expand().derivative();
      cpoints = DP.find_all_roots(X.ul, X.width, X.width);
      if (X.control.cpoint_images.checked) {
        cpoint_images = [];
        for (var i=0; i<cpoints.length; i++) {
          cpoint_images[i] = P.evaluate(cpoints[i]);
        }
      }
    }
  }
  
  //Record the roots and K in the control box
  X.control.K_label.innerHTML = P.K.toStringPrecision(5);
  var root_labels = [];
  for (var i=0; i<P.roots.length; i++) {
    root_labels[i] = P.roots[i].toStringPrecision(5);
  }
  X.control.roots_label.innerHTML = root_labels.join('<br>');
  
  //Draw the roots
  if (X.control.roots.checked) {
    X.CC.textAlign = 'center';
    var dotstyle = (X.control.julia.checked ? 'rgba(255, 0, 0, 0.75)' : '#FF0000');
    for (var i=0; i<P.roots.length; i++) {
      X.CC.fillStyle = dotstyle;
      var p = this.complex_to_pixel(X, P.roots[i]);
      var rad = 5;
      X.CC.beginPath();
      X.CC.arc(p.x, p.y, rad, 0, 2*Math.PI);
      X.CC.fill();
      X.CC.fillStyle = '#000000';
      X.CC.fillText(i, p.x, p.y+2);
    }
  }
  
  //Draw the critical points
  if (X.control.cpoints.checked) {
    var dotstyle = (X.control.julia.checked ? 'rgba(0, 255, 0, 0.75)' : '#00FF00');
    for (var i=0; i<cpoints.length; i++) {
      X.CC.fillStyle = dotstyle;
      var p = this.complex_to_pixel(X, cpoints[i]);
      var rad = 5;
      X.CC.beginPath();
      X.CC.arc(p.x, p.y, rad, 0, 2*Math.PI);
      X.CC.fill();
      X.CC.fillStyle = '#000000';
      X.CC.fillText(i, p.x, p.y+2);
    }
  }
  
  //Draw the critical point images
  if (X.control.cpoint_images.checked) {
    var dotstyle = (X.control.julia.checked ? 'rgba(200, 255, 200, 0.75)' : '#00FF00');
    for (var i=0; i<cpoint_images.length; i++) {
      X.CC.fillStyle = dotstyle;
      var p = this.complex_to_pixel(X, cpoint_images[i]);
      var rad = 5;
      X.CC.beginPath();
      X.CC.arc(p.x, p.y, rad, 0, 2*Math.PI);
      X.CC.fill();
      X.CC.fillStyle = '#000000';
      X.CC.fillText(i, p.x, p.y+2);
    }
  }
  
  //Draw K
  if (X.control.K.checked) {
    X.CC.fillStyle = (X.control.julia.checked ? 'rgba(231, 103, 0, 0.75)' : 'E76700');
    var p = this.complex_to_pixel(X, P.K);
    var rad = 5;
    X.CC.beginPath();
    X.CC.arc(p.x, p.y, rad, 0, 2*Math.PI);
    X.CC.fill();
  }
  
  if (X.control.axes.checked) {
    //find a good step; we want a power of 10 which divide the width up 
    //into about 10 steps, so we can take the log_10 of the width, minus 1ish
    var step_base = 5;
    var step_exponent = Math.floor(Math.log(X.width)/Math.log(step_base))-1;
    var step = Math.pow( step_base,  step_exponent );
    if (X.width / step > 20) {
      step_exponent++;
      step = Math.pow(step_base, step_exponent);
    } else if (X.width / step < 10) {
      step_exponent--;
      step = Math.pow(step_base, step_exponent);
    }
    var horiz_start = Math.ceil( X.ul.real / step );
    var horiz_tick_origin = horiz_start;
    var vert_start = Math.ceil( (X.ul.imag-X.width) / step );
    var vert_tick_origin = vert_start;
    X.CC.strokeStyle = '#000000'; X.CC.fillStyle = '#000000'; X.CC.lineWidth = 1; X.CC.font = '10px sans-serif';
    for (var x = horiz_start; x*step < X.ul.real + X.width; x++) {
      if (num_power_div(x, step_base) >= num_power_div(horiz_tick_origin, step_base) ) {
        horiz_tick_origin = x;
      }
      var tick_x = (x*step - X.ul.real) * X.scaling_factor;
      X.CC.beginPath(); X.CC.moveTo( tick_x, X.canvas.height ); X.CC.lineTo( tick_x, X.canvas.height-5 ); X.CC.stroke();
    }
    X.CC.textAlign = 'center';
    for (var x = horiz_tick_origin; x*step >= X.ul.real; x -= step_base) {
      var tick_x = (x*step - X.ul.real) * X.scaling_factor;
      X.CC.beginPath(); X.CC.moveTo( tick_x, X.canvas.height ); X.CC.lineTo( tick_x, X.canvas.height-10 ); X.CC.stroke();
      X.CC.fillText((x*step).toPrecision(2), tick_x, X.canvas.height - 15);
    }
    for (var x = horiz_tick_origin; x*step < X.ul.real + X.width; x += step_base) {
      var tick_x = (x*step - X.ul.real) * X.scaling_factor;
      X.CC.beginPath(); X.CC.moveTo( tick_x, X.canvas.height ); X.CC.lineTo( tick_x, X.canvas.height-10 ); X.CC.stroke();
      X.CC.fillText((x*step).toPrecision(2), tick_x, X.canvas.height - 15);
    }
    for (var y = vert_start; y*step < X.ul.imag; y ++) {
      if (num_power_div(y, step_base) > num_power_div(vert_tick_origin, step_base)) {
        vert_tick_origin = y;
      }
      var tick_y = (X.ul.imag - y*step) * X.scaling_factor;
      X.CC.beginPath(); X.CC.moveTo( 0, tick_y ); X.CC.lineTo(5, tick_y ); X.CC.stroke();
    }
    X.CC.textAlign = 'left';
    for (var y = vert_tick_origin; y*step <= X.ul.imag; y += step_base) {
      var tick_y = (X.ul.imag - y*step) * X.scaling_factor;
      X.CC.beginPath();X.CC.moveTo( 0, tick_y ); X.CC.lineTo( 10, tick_y ); X.CC.stroke();
      X.CC.fillText((y*step).toPrecision(2), 15, tick_y);
    }
    for (var y = vert_tick_origin; y*step > X.ul.imag - X.width; y -= step_base) {
      var tick_y = (X.ul.imag - y*step) * X.scaling_factor;
      X.CC.beginPath(); X.CC.moveTo( 0, tick_y ); X.CC.lineTo( 10, tick_y ); X.CC.stroke();
      X.CC.fillText((y*step).toPrecision(2), 15, tick_y);
    }
  }
  
  if (X.control.julia.checked) {
    this.redraw_gl_plot(X, P);
  } else {
    this.clear_gl_plot(X);
  }
  
}

/*********************************************************************
 * Julia set webgl drawing
 *********************************************************************/
JuliaBraidGui.prototype.clear_gl_plot = function(X) {
  if (!X.GL.hasOwnProperty('GLC')) return;
  X.GL.GLC.viewport(0, 0, X.GL.canvas.width, X.GL.canvas.height);
  X.GL.GLC.clear(X.GL.GLC.COLOR_BUFFER_BIT);
}


JuliaBraidGui.prototype.redraw_gl_plot = function(X, P) {

  if (X.GL.call_count % 2 != 0) {
    console.log('Called plot gl in parallel? aborting');
    return;
  }
  if (X.GL.hasOwnProperty('webgl-error')) return;
  X.GL.call_count++;
 
  //determine whether we need to reload the shaders  
  var must_reload = !X.GL.inited;
  
  var func_string = P.toString();
  if (!X.GL.hasOwnProperty('func_string') || X.GL.func_string != func_string) {
    X.GL.func_string = func_string;
    must_reload = true;
  }
  if (!X.GL.hasOwnProperty('GLC')) {
    X.GL.GLC = X.GL.canvas.getContext('webgl');
    if (X.GL.GLC == null) {
      X.GL.GLC = X.GL.canvas.getContext('experimental-webgl');
    }
    if (X.GL.GLC == null) {
      X.GL['webgl-error'] = true;
      alert('WebGL support not found');
      return;
    }
    must_reload = true;
  }
  
  X.GL.color = true;
  X.GL.GLC.viewport(0, 0, X.GL.canvas.width, X.GL.canvas.height);
  
  //reload the shaders
  if (must_reload) {
    var gl = X.GL.GLC;
    X.GL.vertex_shader_source = document.getElementById('vertex_shader').text;
    X.GL.vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(X.GL.vertex_shader, X.GL.vertex_shader_source);
    gl.compileShader(X.GL.vertex_shader);

    //X.GL.fragment_shader_source = document.getElementById('fragment_shader').text;
    X.GL.fragment_shader_source = document.getElementById('fragment_shader_escaperate').text;
    //X.GL.fragment_shader_source = document.getElementById('fragment_shader_debug').text;
    var new_code = P.c_code();
    X.GL.fragment_shader_source = X.GL.fragment_shader_source.replace('DYNAMICALLY_SET_FUNCTION', new_code);
    //console.log(X.GL.fragment_shader_source);
    X.GL.fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(X.GL.fragment_shader, X.GL.fragment_shader_source);
    gl.compileShader(X.GL.fragment_shader);
  
    X.GL.shaders = gl.createProgram();
    gl.attachShader(X.GL.shaders, X.GL.vertex_shader);
    gl.attachShader(X.GL.shaders, X.GL.fragment_shader);
    gl.linkProgram(X.GL.shaders);
    gl.useProgram(X.GL.shaders);
    
    X.GL.inited = true;
  }
  
  this.render_gl_plot(X, P);

  X.GL.call_count++;  
}


JuliaBraidGui.prototype.render_gl_plot = function(X, P) {

  //This function does the actual rendering, assuming everything is set up
  var gl = X.GL.GLC;
  var shaders = X.GL.shaders;

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  var verts = [1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0];
  var vert_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  var vert_pos_attrib = gl.getAttribLocation(shaders, "a_vert_pos");
  gl.enableVertexAttribArray(vert_pos_attrib);
  gl.vertexAttribPointer(vert_pos_attrib, 2, gl.FLOAT, false, 0, 0);
 
  var triangle_data = [1, 2, 0, 3];
  var triangle_data_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangle_data_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_data), gl.STATIC_DRAW);
  
  //loading these uniforms is really the only thing that changes
  var plot_ul_uniform = gl.getUniformLocation(shaders, "plot_ul");
  gl.uniform2fv(plot_ul_uniform, new Float32Array([X.ul.real, X.ul.imag]) )
  var plot_width_uniform = gl.getUniformLocation(shaders, "plot_width");
  gl.uniform1f(plot_width_uniform, X.width);
  var do_color_uniform = gl.getUniformLocation(shaders, "do_color");
  gl.uniform1i(do_color_uniform, X.GL.color);
  
  var shading = gl.getUniformLocation(shaders, "shading");
  gl.uniform1f(shading, Number(X.control.julia_shading.value));
  
  var degree = gl.getUniformLocation(shaders, "degree");
  gl.uniform1f(degree, Number(P.roots.length));
  
  var basin_bound = gl.getUniformLocation(shaders, "basin_bound");
  var basin_bound_value = P.expand().basin_of_infinity(1.0);
  //console.log('Basin bound:', basin_bound_value);
  gl.uniform1f(basin_bound, basin_bound_value);
  

  gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, 0);

}







































/****************************************************************
 * this returns the power of b which divides a; the arguments must be integers
 ****************************************************************/
function num_power_div(a,b) {
  if (a===0) {
    return Number.MAX_VALUE;
  }
  var ans = 0;
  while ( (a/b)%1 === 0 ) {
    a /= b;
    ans += 1;
  }
  return ans;
}






/**********************************************************
 * parse a string {i1:a1, i2:a2, ...} to a list where the 
 * complex number ai is at index ii
 ***********************************************************/
function obj_to_cmp_list(s) {
  //remove the {}
  s = s.replace('{','').replace('}','');
  var ssplit = s.split(',');
  var ans = []
  //console.log(ssplit);
  for (var i=0; i<ssplit.length; i++) {
    var S = ssplit[i];
    //console.log(S);
    var Ssplit = S.split(':');
    //console.log(Ssplit);
    ans[Number(Ssplit[0])] = string_to_cmp(Ssplit[1]);
  }
  return ans;
}

/****************************************************************
 * parse a string into a complex number
 ****************************************************************/
function string_to_cmp(s) {
  var imag_coef_string = s.match(/[+,-]?[0-9]*\.?[0-9]*i/i);
  imag_coef_string = (imag_coef_string != null ? imag_coef_string[0] : null);
  var real_coef_string = '';
  if (imag_coef_string === null) {
    real_coef_string = s;
    imag_coef_string = '0i';
  } else {
    real_coef_string = s.replace(imag_coef_string, '');
    if (imag_coef_string == '+i' || imag_coef_string == 'i') {
      imag_coef_string = '+1i';
    } else if (imag_coef_string == '-i') {
      imag_coef_string = '-1i';
    }
  }
  var real_coef = Number(real_coef_string);
  var imag_coef = Number(imag_coef_string.replace('i',''));
  return new Complex(real_coef, imag_coef);
}
 
/***********************************************************
 * A rational function
 * The input is a (string) ratio of lists of the form {i1:a1,...}/{i1:a1,...}
 * where each lists the coefficients to the powers
 **********************************************************/
function RationalFunction( s ) {
  if (s.search('{') == -1) {
    this.num = new Polynomial([0]);
    this.den = new Polynomial([1]);
    return;
  }
  if (s.search('/') == -1) {
    this.num = new Polynomial(obj_to_cmp_list(s));
    this.den = new Polynomial([1]);
    return;
  }
  var ssplit = s.split('/');
  var num_a = obj_to_cmp_list(ssplit[0]);
  var den_a = obj_to_cmp_list(ssplit[1]);
  this.num = new Polynomial(num_a);
  this.den = new Polynomial(den_a);
}

RationalFunction.from_polys = function(N,D) {
  var ans = new RationalFunction('');
  ans.num = new Polynomial(N.coefs);
  ans.den = new Polynomial(D.coefs);
  //console.log('Made rational function from polys' + ans.num + ' ' + ans.den);
  return ans;
}

RationalFunction.prototype.toString = function() {
  return this.num.toString() + '/' + this.den.toString();
}

RationalFunction.prototype.evaluate = function(x) {
  return this.num.evaluate(x).div( this.den.evaluate(x) );
}

RationalFunction.prototype.derivative = function() {
  var ans = new RationalFunction('');
  var num_deriv = this.num.derivative();
  var den_deriv = this.den.derivative();
  //console.log('Making derivs');
  //console.log(num_deriv);
  //console.log(den_deriv);
  var new_num = this.den.mul(num_deriv).sub( this.num.mul(den_deriv) );
  var new_den = this.den.mul(this.den);
  //console.log(new_num);
  //console.log(new_den);
  return RationalFunction.from_polys(new_num, new_den);
}

RationalFunction.prototype.iterate_with_deriv = function(iters, deriv, x) {
  var cur_deriv = new Complex(1,0);
  var cur_x = x.copy();
  for (var i=0; i<iters; i++) {
    cur_deriv.mul_equals( deriv.evaluate(cur_x) );
    cur_x = this.evaluate(cur_x);
  }
  //console.log('Returning iterate with deriv: ' + cur_x + ' ' + cur_deriv);
  return [cur_x, cur_deriv];
}

/*
 * Return a string which will compute the value of the function; 
 * it is allowed two functions cpx_mul and cpx_div for complex multiplication 
 * and division; addition and subtraction are as normal
 */
RationalFunction.prototype.c_code = function() {
  return 'cpx_div(' + this.num.c_code() + ',' + this.den.c_code() + ')';
}






/*********************************************************
 * the stuff that finds the orbit
 ********************************************************/
function OrbitSearcher( P, start_point, radius, max_period, output_area ) {
  this.P = P;
  this.start_point = start_point;
  this.radius = radius;
  this.max_period = max_period;
  this.output_area = output_area;
}

OrbitSearcher.prototype.search = function() {
  this.output_area.value = '';
  this.output_area.value += 'Rational function: ' + this.P.toString() + '\n';
  this.output_area.value += 'Start point: ' + this.start_point + '\n';
  this.output_area.value += 'Radius: ' + this.radius + '\nMax period: ' + this.max_period + '\n';
  
  var tolerance = 1e-8;
  var status_object = {'success' : false};
  var P_deriv = this.P.derivative();
  this.output_area.value += 'Derivative: ' + P_deriv.toString() + '\n';
  var x = this.start_point.copy();
  var Pnx = x.copy();
  var Pnx_deriv = new Complex(1,0);
  this.output_area.value += 'Starting orbit search.\n';
  this.output_area.value += 'Iter: 0\n  image: ' 
                           + Pnx.toStringPrecision(5) + '\n';
  for (var i=1; i<=this.max_period; i++) {
    //update the image and derivative
    Pnx_deriv = Pnx_deriv.mul(P_deriv.evaluate(Pnx));
    Pnx = this.P.evaluate(Pnx);
    if (!(typeof(Pnx) == 'object') || isNaN(Pnx.real) || isNaN(Pnx.imag) ) {
      this.output_area.value += '*** Invalid iterate; aborting ***\n';
      return status_object;
    }
    
    //check if the image is close enough
    var d = Pnx.sub(x).abs();
    var deriv_abs = Pnx_deriv.abs();
    var d_to_orbit = d * ((1.0/deriv_abs)/(1.0-(1.0/deriv_abs)));
    this.output_area.value += 'Iter: ' + i + '\n  image: ' 
                           + Pnx.toStringPrecision(5) + '\n  dist: ' 
                           + d.toPrecision(4) + '\n  deriv: ' 
                           + Pnx_deriv.toStringPrecision(5) + '\n  guess orbit dist: '
                           + d_to_orbit + '\n';
    this.output_area.scrollTop = this.output_area.scrollHeight;
    var newton_success = false;
    if (d_to_orbit < this.radius) {
      var cur_x = x.copy();
      this.output_area.value += "  Newton's method:\n"
      var newton_steps = 0;
      while (true) {
        var P_iterate_data = this.P.iterate_with_deriv(i, P_deriv, cur_x);
        var Pn_cur_x = P_iterate_data[0];
        var Pn_cur_x_deriv = P_iterate_data[1];
        var cur_x_m_x_abs = cur_x.sub(x).abs();
        this.output_area.value += '    Current x: ' + cur_x.toStringPrecision(5) + '\n';
        this.output_area.value += '            |x-start|: ' + cur_x_m_x_abs.toPrecision(5) + '\n';
        if (cur_x_m_x_abs > this.radius) {
          this.output_area.value += '    Too far from start\n';
          break;
        }
        if (newton_steps>100) {
          this.output_area.value += "    Too many steps in Newton's method\n";
          break;
        }
        var Pn_cur_x_m_cur_x = Pn_cur_x.sub(cur_x);
        this.output_area.value += '            |P^n(x)-x|: ' + Pn_cur_x_m_cur_x.abs().toPrecision(5) + '\n';
        if (Pn_cur_x_m_cur_x.abs() < tolerance) {
          this.output_area.value += '    Success!\n'
          newton_success = true;
          status_object['success'] = true;
          status_object['x'] = cur_x.copy();
          status_object['period'] = i;
          status_object['from_start'] = cur_x_m_x_abs;
          break;
        }
        var Pn_cur_x_m_cur_x_deriv = Pn_cur_x_deriv.sub(new Complex(1,0));
        this.output_area.value += "            |(P^n(x)-x)'|: " + Pn_cur_x_m_cur_x_deriv.abs().toPrecision(5) + '\n';
        this.output_area.scrollTop = this.output_area.scrollHeight;
        cur_x = cur_x.sub(Pn_cur_x_m_cur_x.div(Pn_cur_x_m_cur_x_deriv));
        newton_steps++;
      }
    }
    if (newton_success) {
      this.output_area.value += '*** Found acceptable orbit:\n    start: ' + status_object['x'] 
                                + '\n    period: ' + status_object['period'] 
                                + '\n    dist from start: ' + status_object['from_start'] +'\n';
      this.output_area.scrollTop = this.output_area.scrollHeight;
      break;
    }
  }
  if (!status_object.success) {
    this.output_area.value += '*** No acceptable orbit found ***\n';
    this.output_area.scrollTop = this.output_area.scrollHeight;
    return status_object;
  }
  
  //regenerate the orbit, for posterity
  status_object['orbit'] = [status_object['x']];
  this.output_area.value += '    0:\t' + status_object['orbit'][0] + '\n';
  for (var i=0; i<status_object.period; i++) {
    var L = status_object['orbit'].length;
    status_object['orbit'].push( this.P.evaluate( status_object['orbit'][L-1] ) );
    this.output_area.value += '    ' + (i+1) + ':\t' + status_object['orbit'][L] + '\n';
  }
  this.output_area.scrollTop = this.output_area.scrollHeight;
  return status_object;
}



















/********************************************************
 * The gui
 ********************************************************/
function IteratorGui() {
  window.addEventListener('resize', this.resize_canvas.bind(this));
  this.canvas = document.getElementById('plot_canvas');
  this.canvas.addEventListener('mousedown', this.canvas_mouse.bind(this));
  this.canvas.addEventListener('mouseup', this.canvas_mouse.bind(this));
  this.canvas.addEventListener('mousemove', this.canvas_mouse.bind(this));
  this.canvas.addEventListener('mousewheel', this.plot_manipulate.bind(this));
  this.canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; });
  this.CC = this.canvas.getContext('2d');
  this.GL = {'canvas': document.getElementById('gl_plot_canvas'), 'inited':false, 'call_count':0};
  this.plot_ul = new Complex(-1.0,1.0);
  this.plot_width = 2.0;
  this.plot_scaling_factor = 0;
  this.func = function(z) {
                var zp = z;
                zp = zp.real_mul(-4).real_add(4);
                var zs = z.mul(z);
                //if (zs.abs() < 1e-4) zs = new Complex(1e-4,0);
                return zs.add(zp).div(zs);
              };
  this.plot_type = 'none';
  this.plot_axes_type = 'border';
  this.plot_currently_dragging_plot = false;
  this.plot_dragging_pixel_start = new Pixel(0,0);
  this.plot_dragging_complex_ul_start = new Complex(0,0);
  this.plot_currently_dragging_point = false;
  
  this.iterate_orbit_length_label = document.getElementById('iterate_orbit_length');
  this.iterate_orbit_length_label.onblur = (function() { this.iterate_orbit_generate(); this.redraw_plot(); }).bind(this);
  this.right_mouse_action_radios = [document.getElementById('right_mouse_search'),
                                    document.getElementById('right_mouse_orbit')];
  document.getElementById('iterate_orbit_clear').onclick = this.iterate_orbit_clear.bind(this);
  
  document.getElementById('recenter').onclick = this.plot_manipulate.bind(this);
  document.getElementById('zoom_in').onclick = this.plot_manipulate.bind(this);
  document.getElementById('zoom_out').onclick = this.plot_manipulate.bind(this);
  
  this.plot_julia_set = [document.getElementById('plot_julia_set_none'),
                         document.getElementById('plot_julia_set_monochrome'),
                         document.getElementById('plot_julia_set_color')]
  for (var i=0; i<3; i++) {
    this.plot_julia_set[i].onclick = this.redraw_plot.bind(this);
  }

  this.mouse_location_label = document.getElementById('mouse_location');

  this.func_label = document.getElementById('func_text');
  this.func_label.onblur = this.redraw_plot.bind(this);
  this.func_label.value = '{0:4,1:-4,2:1}/{2:1}';
  this.old_func_string = 'none';
  document.getElementById('reset_func').onclick = this.update_func.bind(this);
  document.getElementById('reset_func').style.display = 'none';
  this.search_start_point_label = document.getElementById('search_start_point');
  this.search_start_point = new Complex(0.25,0.25);
  this.search_start_point_label.innerHTML = this.search_start_point.toStringPrecision(5);
  this.search_radius_label = document.getElementById('search_radius');
  this.search_radius_label.onblur = this.redraw_plot.bind(this);
  this.search_max_period_label = document.getElementById('search_max_period');
  document.getElementById('search_go').onclick = this.search.bind(this);
  document.getElementById('search_clear').onclick = (function() { this.search_status_object.success = false; this.redraw_plot(); }).bind(this);
   
  this.search_output_area = document.getElementById('output_area');
  this.search_output_area.readOnly = true;
  this.RHS = document.getElementById('RHS');
  this.plot_div_container = document.getElementById('plot');
  
  this.search_status_object = {'success' : false};
  this.iterate_orbit_object = {'inited' : false};
  
  this.program_box = document.getElementById('program-box');

  //do it twice to handle resizing weirdness
  this.resize_canvas();
  this.resize_canvas();
}

IteratorGui.prototype.plot_complex_to_pixel = function(c) {
  return new Pixel( (c.real - this.plot_ul.real) * this.plot_scaling_factor,
                    -(c.imag - this.plot_ul.imag) * this.plot_scaling_factor );
}

IteratorGui.prototype.plot_pixel_to_complex = function(p) {
  return new Complex( this.plot_ul.real + (p.x / this.plot_scaling_factor),
                      this.plot_ul.imag - (p.y / this.plot_scaling_factor) );
}


IteratorGui.prototype.plot_pixel_indices_to_complex = function(i,j) {
  return new Complex( this.plot_ul.real + (i / this.plot_scaling_factor),
                      this.plot_ul.imag - (j / this.plot_scaling_factor) );
}


IteratorGui.prototype.redraw_plot = function() {
  
  this.plot_scaling_factor = this.canvas.width / this.plot_width;
  
  this.CC.clearRect(0,0,this.canvas.width,this.canvas.height);
    
  if (this.plot_type == 'abs') {
    var minabs = -1;
    var maxabs = -1;
    for (var i=0; i<this.canvas.width; i++) {
      for (var j=0; j<this.canvas.height; j++) {
        var a = this.func( this.plot_pixel_indices_to_complex( i, j ) );
        this.plot_grid[i][j] = a;
        var aa = a.abs();
        if (aa > maxabs) maxabs = aa;
        if (minabs < 0 || aa < minabs) minabs = aa;     
      }
    }
    var range = maxabs - minabs;
    this.CC.clearRect(0,0,this.canvas.width,this.canvas.height);
    for (var i=0; i<this.canvas.width; i++) {
      for (var j=0; j<this.canvas.height; j++) {
        var col = 'hsl(' + 360*(this.plot_grid[i][j].abs()-minabs)/range + ',100%,50%)';
        this.CC.fillStyle = col;
        this.CC.fillRect(i,j,1,1);
      }
    }
  }
  
  //draw the highlighted point
  var psp = this.plot_complex_to_pixel(this.search_start_point);
  var psp_rad = Number(this.search_radius_label.value) * this.plot_scaling_factor;
  //console.log(psp_rad);
  this.CC.fillStyle = (!this.plot_julia_set[0].checked ? 'rgba(255, 0, 0, 0.75)' : '#FF0000');
  this.CC.beginPath();
  this.CC.arc(psp.x, psp.y, psp_rad, 0, 2*Math.PI);
  this.CC.fill();
  this.CC.fillStyle = '#000000';
  this.CC.beginPath();
  this.CC.arc(psp.x, psp.y, 2, 0, 2*Math.PI);
  this.CC.fill();
  
  //draw the success object (orbit)
  if (this.search_status_object.success) {
    var orb = this.search_status_object['orbit'];
    this.CC.fillStyle = '#FF8822';
    this.CC.strokeStyle = '#FF8822';
    this.CC.lineWidth = 1.5;
    this.CC.beginPath();
    var p = this.plot_complex_to_pixel(orb[0]);
    this.CC.moveTo(p.x, p.y);
    for (var i=1; i<orb.length; i++) {
      p = this.plot_complex_to_pixel(orb[i]);
      this.CC.lineTo(p.x, p.y);
    }
    this.CC.stroke();
    for (var i=0; i<orb.length; i++) {
      p = this.plot_complex_to_pixel(orb[i]);
      this.CC.beginPath();
      this.CC.arc(p.x, p.y, 3, 0, 2*Math.PI);
      this.CC.fill();
    }
  }
  
  //draw the iterated orbit (if it exists)
  if (this.iterate_orbit_object['inited']) {
    var orb = this.iterate_orbit_object['orbit'];
    this.CC.fillStyle = '#00DD00';
    this.CC.strokeStyle = '#00DD00';
    this.CC.lineWidth = 1.5;
    this.CC.beginPath();
    var p = this.plot_complex_to_pixel(orb[0]);
    var prev_point = p;
    for (var i=1; i<orb.length; i++) {
      p = this.plot_complex_to_pixel(orb[i]);
      this.CC.beginPath();
      this.CC.moveTo(prev_point.x, prev_point.y);
      this.CC.lineTo(p.x, p.y);
      this.CC.stroke();
      prev_point = p;
    }
    for (var i=0; i<orb.length; i++) {
      p = this.plot_complex_to_pixel(orb[i]);
      this.CC.beginPath();
      this.CC.arc(p.x, p.y, 3, 0, 2*Math.PI);
      this.CC.fill();
    }
  }
  
  //draw the axis
  if (this.plot_axes_type == 'border') {
    //find a good step; we want a power of 10 which divide the width up 
    //into about 10 steps, so we can take the log_10 of the width, minus 1ish
    var step_base = 5;
    var step_exponent = Math.floor(Math.log(this.plot_width)/Math.log(step_base))-1;
    var step = Math.pow( step_base,  step_exponent );
    if (this.plot_width / step > 20) {
      step_exponent++;
      step = Math.pow(step_base, step_exponent);
    } else if (this.plot_width / step < 10) {
      step_exponent--;
      step = Math.pow(step_base, step_exponent);
    }
    var horiz_start = Math.ceil( this.plot_ul.real / step );
    var horiz_tick_origin = horiz_start;
    var vert_start = Math.ceil( (this.plot_ul.imag-this.plot_width) / step );
    var vert_tick_origin = vert_start;
    this.CC.strokeStyle = '#000000';
    this.CC.fillStyle = '#000000';
    this.CC.lineWidth = 1;
    this.CC.font = '10px sans-serif';
    for (var x = horiz_start; x*step < this.plot_ul.real + this.plot_width; x++) {
      if (num_power_div(x, step_base) >= num_power_div(horiz_tick_origin, step_base) ) {
        horiz_tick_origin = x;
      }
      var tick_x = (x*step - this.plot_ul.real) * this.plot_scaling_factor;
      this.CC.beginPath();
      this.CC.moveTo( tick_x, this.canvas.height );
      this.CC.lineTo( tick_x, this.canvas.height-5 );
      this.CC.stroke();
    }
    this.CC.textAlign = 'center';
    for (var x = horiz_tick_origin; x*step >= this.plot_ul.real; x -= step_base) {
      var tick_x = (x*step - this.plot_ul.real) * this.plot_scaling_factor;
      this.CC.beginPath();
      this.CC.moveTo( tick_x, this.canvas.height );
      this.CC.lineTo( tick_x, this.canvas.height-10 );
      this.CC.stroke();
      this.CC.fillText((x*step).toPrecision(2), tick_x, this.canvas.height - 15);
    }
    for (var x = horiz_tick_origin; x*step < this.plot_ul.real + this.plot_width; x += step_base) {
      var tick_x = (x*step - this.plot_ul.real) * this.plot_scaling_factor;
      this.CC.beginPath();
      this.CC.moveTo( tick_x, this.canvas.height );
      this.CC.lineTo( tick_x, this.canvas.height-10 );
      this.CC.stroke();
      this.CC.fillText((x*step).toPrecision(2), tick_x, this.canvas.height - 15);
    }
    for (var y = vert_start; y*step < this.plot_ul.imag; y ++) {
      if (num_power_div(y, step_base) > num_power_div(vert_tick_origin, step_base)) {
        vert_tick_origin = y;
      }
      var tick_y = (this.plot_ul.imag - y*step) * this.plot_scaling_factor;
      this.CC.beginPath();
      this.CC.moveTo( 0, tick_y );
      this.CC.lineTo(5, tick_y );
      this.CC.stroke();
    }
    this.CC.textAlign = 'left';
    for (var y = vert_tick_origin; y*step <= this.plot_ul.imag; y += step_base) {
      var tick_y = (this.plot_ul.imag - y*step) * this.plot_scaling_factor;
      this.CC.beginPath();
      this.CC.moveTo( 0, tick_y );
      this.CC.lineTo( 10, tick_y );
      this.CC.stroke();
      this.CC.fillText((y*step).toPrecision(2), 15, tick_y);
    }
    for (var y = vert_tick_origin; y*step > this.plot_ul.imag - this.plot_width; y -= step_base) {
      var tick_y = (this.plot_ul.imag - y*step) * this.plot_scaling_factor;
      this.CC.beginPath();
      this.CC.moveTo( 0, tick_y );
      this.CC.lineTo( 10, tick_y );
      this.CC.stroke();
      this.CC.fillText((y*step).toPrecision(2), 15, tick_y);
    }
  }
  
  if (!this.plot_julia_set[0].checked) {
    this.redraw_gl_plot();
  } else {
    this.clear_gl_plot();
  }
}



IteratorGui.prototype.center_plot_on_success = function() {
  if (!this.search_status_object.success) {
    this.redraw_plot();
    return;
  }
  var orb = this.search_status_object['orbit'];
  var ul = orb[0].copy();
  var lr = orb[0].copy();
  for (var i=1; i<orb.length-1; i++) {
    if (orb[i].real < ul.real) ul.real = orb[i].real;
    if (orb[i].real > lr.real) lr.real = orb[i].real;
    if (orb[i].imag > ul.imag) ul.imag = orb[i].imag;
    if (orb[i].imag < lr.imag) lr.imag = orb[i].imag;
  }
  var desired_width = lr.real - ul.real;
  var desired_height = ul.imag - lr.imag;
  var M = Math.max(desired_width, desired_height);
  if (Math.abs(M) < 1e-8) {
    console.log('Bad window size?\n');
    return;
  }
  this.plot_ul = ul;
  this.plot_width = M;
  this.redraw_plot();
}



IteratorGui.prototype.resize_canvas = function() {
  //var ww = document.getElementById('plot').offsetWidth - 2;
  var ww = this.program_box.clientWidth-490;
  var wh = window.innerHeight;
  var w = (ww < wh ? ww : wh);
  this.canvas.width = w;
  this.canvas.height = w;
  this.plot_scaling_factor = w / this.plot_width;
  this.plot_grid = [];
  this.plot_grid.length = this.canvas.width;
  for (var i=0; i<this.canvas.width; i++) {
    this.plot_grid[i] = new Array(this.canvas.width);
  }
  
  this.GL.canvas.width = w;
  this.GL.canvas.height = w;
  //this.plot_div_container.style.width = w;
  //this.plot_div_container.style.height = w;

  //resize the RHS too
  var canvas_rect = this.canvas.getBoundingClientRect();
  var output_rect = this.search_output_area.getBoundingClientRect();
  var desired_height = canvas_rect.bottom - output_rect.top;
  if (desired_height < 50) desired_height = 50;
  //this.RHS.style.height = w;
  this.search_output_area.style.height = desired_height;
  this.redraw_plot();
}


IteratorGui.prototype.canvas_mouse = function(evt) {
  var param_rect = this.canvas.getBoundingClientRect();
  var p = new Pixel(evt.clientX - param_rect.left, 
                    evt.clientY - param_rect.top);
  if (evt.type == 'mousedown') {
    if (evt.button == 0) {
      this.plot_currently_dragging_plot = true;
      this.plot_dragging_pixel_start = p;
      this.plot_dragging_complex_ul_start = this.plot_ul;
      return;
    } else {
      this.plot_currently_dragging_point = true;
    }
  } else if (evt.type == 'mouseup') {
    if (evt.button == 0) {
      this.plot_currently_dragging_plot = false;
    } else {
      this.plot_currently_dragging_point = false;
    }
    return;
  }
  //if we are dragging the plot, and we got a mousemove, 
  //adjust the plot location as appropriate
  if (evt.type == 'mousemove' && this.plot_currently_dragging_plot) {
    var complex_drag = new Complex( (p.x - this.plot_dragging_pixel_start.x)/this.plot_scaling_factor,
                                    (this.plot_dragging_pixel_start.y - p.y)/this.plot_scaling_factor );
    this.plot_ul = this.plot_dragging_complex_ul_start.sub( complex_drag );
  }
  var cp = this.plot_pixel_to_complex(p);
  //if we are dragging the point, adjust it
  if (this.plot_currently_dragging_point) {
    if (this.right_mouse_action_radios[0].checked) {
      this.search_start_point = cp;
      this.search_start_point_label.innerHTML = cp.toStringPrecision(5);
      this.search();
    } else {
      this.iterate_orbit_generate(cp);
    }
  }
  this.mouse_location_label.innerHTML = cp.toStringPrecision(5);
  if (this.plot_currently_dragging_plot || this.plot_currently_dragging_point) {
    this.redraw_plot();
  }
}
    

IteratorGui.prototype.plot_manipulate = function(evt) {
  if (evt.target.id == 'recenter') {
    this.plot_ul = new Complex(this.search_start_point.real - this.plot_width/2,
                               this.search_start_point.imag + this.plot_width/2);
  } else {
    if (evt.type == 'click') {
      var plot_center = new Complex(this.plot_ul.real + this.plot_width/2,
                                    this.plot_ul.imag - this.plot_width/2);
      this.plot_width *= (evt.target.id == 'zoom_in' ? 0.625 : 1.6);
      this.plot_ul = new Complex(plot_center.real - this.plot_width/2,
                                 plot_center.imag + this.plot_width/2);
    } else {
      var param_rect = this.canvas.getBoundingClientRect();
      var p = new Pixel(evt.clientX - param_rect.left, 
                        evt.clientY - param_rect.top);
      var cp = this.plot_pixel_to_complex(p);
      var to_ul = this.plot_ul.sub( cp );
      var scale = (evt.wheelDelta > 0 ? 0.625 : 1.6);
      to_ul = to_ul.real_mul( scale );
      this.plot_width *= (evt.wheelDelta > 0 ? 0.625 : 1.6);
      this.plot_ul = cp.add( to_ul );
      evt.preventDefault();
    }
  }
  this.redraw_plot();
}

IteratorGui.prototype.update_func = function() {
  if (this.func_label.value == this.old_func_string) return;
  this.func = new RationalFunction( this.func_label.value );
  this.old_func_string = this.func_label.value;
  this.redraw_plot();
}


IteratorGui.prototype.search = function() {
  this.update_func();
  var OS = new OrbitSearcher(this.func, 
                             this.search_start_point, 
                             Number(this.search_radius_label.value), 
                             Math.round(Number(this.search_max_period_label.value)),
                             this.search_output_area);
  this.search_status_object = OS.search();
  //if (!this.search_status_object.success) return;
  //console.log('Got status object:');
  //console.log(this.search_status_object);
  //this.center_plot_on_success();
  this.redraw_plot();
}

IteratorGui.prototype.iterate_orbit_clear = function() { 
  this.iterate_orbit_object['inited'] = false; 
  this.redraw_plot(); 
}

IteratorGui.prototype.iterate_orbit_generate = function(x) {
  this.update_func();
  if (x===undefined) {
    if (!this.iterate_orbit_object.hasOwnProperty('start')) {
      this.iterate_orbit_object['inited'] = false;
      return;
    }
  } else {
    this.iterate_orbit_object['start'] = x;
  }
  this.iterate_orbit_object['length'] = Number(this.iterate_orbit_length_label.value);
  this.iterate_orbit_object['orbit'] = [this.iterate_orbit_object['start']];
  for (var i = 1; i<this.iterate_orbit_object['length']; i++) {
    this.iterate_orbit_object['orbit'][i] = this.func.evaluate( this.iterate_orbit_object['orbit'][i-1] );
  }
  this.iterate_orbit_object['inited'] = true;
}






/*********************************************************************
 * Julia set webgl drawing
 *********************************************************************/
IteratorGui.prototype.clear_gl_plot = function() {
  if (!this.GL.hasOwnProperty('GLC')) return;
  this.GL.GLC.viewport(0, 0, this.GL.canvas.width, this.GL.canvas.height);
  this.GL.GLC.clear(this.GL.GLC.COLOR_BUFFER_BIT);
}


IteratorGui.prototype.redraw_gl_plot = function() {

  if (this.GL.call_count % 2 != 0) {
    console.log('Called plot gl in parallel? aborting');
    return;
  }
  if (this.GL.hasOwnProperty('webgl-error')) return;
  this.GL.call_count++;
 
  //determine whether we need to reload the shaders  
  var must_reload = !this.GL.inited;
  this.update_func();
  this.GL.func_string = this.func_label.value;
  this.GL.func = this.func;
  if (!this.GL.hasOwnProperty('old_func_string') || this.GL.old_func_string != this.GL.func_string) {
    this.GL.old_func_string = this.GL.func_string;
    must_reload = true;
  }
  if (!this.GL.hasOwnProperty('GLC')) {
    this.GL.GLC = this.GL.canvas.getContext('webgl');
    if (this.GL.GLC == null) {
      this.GL.GLC = this.GL.canvas.getContext('experimental-webgl');
    }
    if (this.GL.GLC == null) {
      this.GL['webgl-error'] = true;
      console.log('WebGL support not found');
      return;
    }
    must_reload = true;
  }
  
  this.GL.color = this.plot_julia_set[2].checked;
  this.GL.GLC.viewport(0, 0, this.GL.canvas.width, this.GL.canvas.height);
  
  //reload the shaders
  if (must_reload) {
    var gl = this.GL.GLC;
    this.GL.vertex_shader_source = document.getElementById('vertex_shader').text;
    this.GL.vertex_shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(this.GL.vertex_shader, this.GL.vertex_shader_source);
    gl.compileShader(this.GL.vertex_shader);

    this.GL.fragment_shader_source = document.getElementById('fragment_shader').text;
    //console.log(this.GL.fragment_shader_source);
    var new_code = this.GL.func.c_code();
    this.GL.fragment_shader_source = this.GL.fragment_shader_source.replace('DYNAMICALLY_SET_FUNCTION', new_code);
    //console.log(this.GL.fragment_shader_source);
    this.GL.fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(this.GL.fragment_shader, this.GL.fragment_shader_source);
    gl.compileShader(this.GL.fragment_shader);
  
    this.GL.shaders = gl.createProgram();
    gl.attachShader(this.GL.shaders, this.GL.vertex_shader);
    gl.attachShader(this.GL.shaders, this.GL.fragment_shader);
    gl.linkProgram(this.GL.shaders);
    gl.useProgram(this.GL.shaders);
    
    this.GL.inited = true;
  }
  
  this.render_gl_plot();

  this.GL.call_count++;  
}


IteratorGui.prototype.render_gl_plot = function() {

  //This function does the actual rendering, assuming everything is set up
  var gl = this.GL.GLC;
  var shaders = this.GL.shaders;

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  var verts = [1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0];
  var vert_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  var vert_pos_attrib = gl.getAttribLocation(shaders, "a_vert_pos");
  gl.enableVertexAttribArray(vert_pos_attrib);
  gl.vertexAttribPointer(vert_pos_attrib, 2, gl.FLOAT, false, 0, 0);
 
  var triangle_data = [1, 2, 0, 3];
  var triangle_data_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangle_data_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_data), gl.STATIC_DRAW);
  
  //loading these uniforms is really the only thing that changes
  var plot_ul_uniform = gl.getUniformLocation(shaders, "plot_ul");
  gl.uniform2fv(plot_ul_uniform, new Float32Array([this.plot_ul.real, this.plot_ul.imag]) )
  var plot_width_uniform = gl.getUniformLocation(shaders, "plot_width");
  gl.uniform1f(plot_width_uniform, this.plot_width);
  var do_color_uniform = gl.getUniformLocation(shaders, "do_color");
  gl.uniform1i(do_color_uniform, this.GL.color);

  gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, 0);

}


