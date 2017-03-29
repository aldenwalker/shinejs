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
function ShineGui() {
  window.addEventListener('resize', this.resize_canvases.bind(this));
  this.si_plot = {'canvas': document.getElementById('si_plot_canvas'),
                  'ul': new R2Point(-3, 3),
                  'width': 6,
                  'scale_to_pixels':-1,
                  'div': document.getElementById('si_div'),
                  'dragging_plot': false,
                  'graph': new R2Graph()};
  this.si_plot.CC = this.si_plot.canvas.getContext('2d');

  this.left_plot = {'canvas': document.getElementById('left_plot_canvas'),
                    'ul': new R2Point(-3, 3),
                    'width': 6,
                    'scale_to_pixels':-1,
                    'div': document.getElementById('left_plot_div'),
                    'GL': {'canvas': document.getElementById('left_gl_plot_canvas'),
                           'inited':false,
                           'call_count':0},
                    'dragging_plot':false,
                    'control': {} };
  this.left_plot.CC = this.left_plot.canvas.getContext('2d');

  this.right_plot = {'canvas': document.getElementById('right_plot_canvas'),
                    'ul': new R2Point(-3, 3),
                    'width': 6,
                    'scale_to_pixels':-1,
                    'div': document.getElementById('right_plot_div'),
                    'GL': {'canvas': document.getElementById('right_gl_plot_canvas'),
                           'inited':false,
                           'call_count':0},
                    'dragging_plot':false,
                    'control': {} };
  this.right_plot.CC = this.right_plot.canvas.getContext('2d');

  // for (var i=0; i<2; i++) {
  //   plots[i].canvas.addEventListener('mousedown', this.canvas_mouse.bind(this));
  //   plots[i].canvas.addEventListener('mouseup', this.canvas_mouse.bind(this));
  //   plots[i].canvas.addEventListener('mousemove', this.canvas_mouse.bind(this));
  //   plots[i].canvas.addEventListener('mousewheel', this.canvas_mouse.bind(this));
  //   //canvii[i].addEventListener('contextmenu', function(e) { e.preventDefault(); return false; });
  // }
  this.program_box = document.getElementById('program-box');
  this.si_box = document.getElementById('si_box');
  
  //do it twice to handle resizing weirdness
  this.resize_canvases();
  this.resize_canvases();
  
  this.redraw_si_plot();
  this.redraw_left_plot();
  this.redraw_right_plot();
  
}



ShineGui.prototype.resize_canvases = function() {
  //var ww = document.getElementById('plot').offsetWidth - 2;
  var ww = this.program_box.clientWidth/2 - 10;
  var wh = window.innerHeight;
  var w = (ww < wh ? ww : wh);
  this.left_plot.canvas.width = w;
  this.left_plot.canvas.height = w;
  this.right_plot.canvas.width = w;
  this.right_plot.canvas.height = w;
  this.left_plot.scale_to_pixels = w / this.right_plot.width;
  this.right_plot.scale_to_pixels = w / this.left_plot.width;
  
  this.left_plot.GL.canvas.width = w;
  this.left_plot.GL.canvas.height = w;
  this.right_plot.GL.canvas.width = w;
  this.right_plot.GL.canvas.height = w;
  
  this.left_plot.div.style.width = w;
  this.left_plot.div.style.height = w;
  this.right_plot.div.style.width = w;
  this.right_plot.div.style.height = w;
  
  this.redraw_left_plot();
  this.redraw_right_plot();

  ww = this.si_box.clientWidth/2-5;
  var w = (ww < wh ? ww : wh);
  this.si_plot.canvas.width = w;
  this.si_plot.canvas.height = w;
  this.si_plot.scale_to_pixels = w / this.si_plot.width;
  this.si_plot.div.style.width = w;
  this.si_plot.div.style.height = w;
  this.redraw_si_plot();

}






ShineGui.prototype.pixel_to_R2 = function(X, p) {
  return new R2Point( X.ul.x + (p.x / X.scale_to_pixels),
                      X.ul.y - (p.y / X.scale_to_pixels) );
}

ShineGui.prototype.complex_to_R2 = function(X, c) {
  return new Pixel( (c.x - X.ul.x) * X.scale_to_pixels,
                    -(c.y - X.ul.y) * X.scale_to_pixels );
}




ShineGui.prototype.redraw_si_plot = function() {
  var sip = this.si_plot;
  sip.CC.clearRect(0,0,sip.canvas.width,sip.canvas.height);

  //Draw a dot on every integer point
  sip.CC.beginPath();
  sip.CC.arc(20, 70, 1, 0, 2*Math.PI);
  sip.CC.fill();
  sip.CC.strokeStyle = '#000000';
  sip.CC.beginPath();
  sip.CC.moveTo( 20, 20 );
  sip.CC.lineTo( 40, 50 );
  sip.CC.stroke();
}

ShineGui.prototype.redraw_left_plot = function() {
  var sip = this.left_plot;
  sip.CC.clearRect(0,0,sip.canvas.width,sip.canvas.height);

  sip.CC.strokeStyle = '#000000';
  sip.CC.beginPath();
  sip.CC.moveTo( 20, 20 );
  sip.CC.lineTo( 40, 50 );
  sip.CC.stroke();
}

ShineGui.prototype.redraw_right_plot = function() {
  var sip = this.right_plot;
  sip.CC.clearRect(0,0,sip.canvas.width,sip.canvas.height);

  sip.CC.strokeStyle = '#000000';
  sip.CC.beginPath();
  sip.CC.moveTo( 20, 20 );
  sip.CC.lineTo( 40, 50 );
  sip.CC.stroke();
}

/*********************************************************************
 * Julia set webgl drawing
 *********************************************************************/
ShineGui.prototype.clear_gl_plot = function(X) {
  if (!X.GL.hasOwnProperty('GLC')) return;
  X.GL.GLC.viewport(0, 0, X.GL.canvas.width, X.GL.canvas.height);
  X.GL.GLC.clear(X.GL.GLC.COLOR_BUFFER_BIT);
}


ShineGui.prototype.redraw_gl_plot = function(X, P) {

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


ShineGui.prototype.render_gl_plot = function(X, P) {

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







































