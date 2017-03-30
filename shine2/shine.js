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
                  'near_integer': undefined,
                  'selected_vertex': undefined,
                  'div': document.getElementById('si_div'),
                  'dragging_plot': false,
                  'graph': new R2Graph()};
  this.si_plot.canvas.addEventListener('mousedown', this.si_plot_mouse.bind(this));
  this.si_plot.canvas.addEventListener('mouseup', this.si_plot_mouse.bind(this));
  this.si_plot.canvas.addEventListener('mousemove', this.si_plot_mouse.bind(this));
  this.si_plot.canvas.addEventListener('mousewheel', this.si_plot_mouse.bind(this));
  this.si_plot.canvas.addEventListener('DOMMouseScroll', this.si_plot_mouse.bind(this));
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

ShineGui.prototype.R2_to_pixel = function(X, c) {
  return new Pixel( (c.x - X.ul.x) * X.scale_to_pixels,
                    -(c.y - X.ul.y) * X.scale_to_pixels );
}




ShineGui.prototype.redraw_si_plot = function() {
  var sip = this.si_plot;
  sip.CC.clearRect(0,0,sip.canvas.width,sip.canvas.height);

  //Draw a dot on every integer point
  //Get the floor of the ul
  var ul_floor = new R2Point( Math.floor(sip.ul.x), Math.floor(sip.ul.y) );
  var lr_floor = new R2Point( Math.floor(sip.ul.x + sip.width), Math.floor(sip.ul.y - sip.width)-1 );
  sip.CC.fillStyle = '#000000';
  for (var x=ul_floor.x; x<=lr_floor.x; x++) {
    for (var y=ul_floor.y; y>=lr_floor.y; y--) {
      var p = this.R2_to_pixel(sip, new R2Point(x,y));
      sip.CC.beginPath();
      sip.CC.moveTo( p.x, p.y );
      sip.CC.arc( p.x, p.y, 1, 0, 2*Math.PI);
      sip.CC.fill();
    }
  }
  
  //Draw the graph so far
  //console.log('Drawing graph:', sip.graph);
  sip.CC.strokeStyle = '#000000';
  sip.CC.lineWidth = 3;
  for (var i in sip.graph.edges) {
    var e = sip.graph.edges[i];
    var v1p = this.R2_to_pixel(sip, sip.graph.vertices[e[0]].coords);
    var v2p = this.R2_to_pixel(sip, sip.graph.vertices[e[1]].coords);
    sip.CC.beginPath();
    sip.CC.moveTo( v1p.x, v1p.y );
    sip.CC.lineTo( v2p.x, v2p.y );
    sip.CC.stroke();
  }
  for (var i in sip.graph.vertices) {
    sip.CC.fillStyle = (sip.selected_vertex == i ? '#FF0000' : '#000000');
    var vp = this.R2_to_pixel(sip, sip.graph.vertices[i].coords);
    sip.CC.beginPath();
    sip.CC.moveTo( vp.x, vp.y );
    sip.CC.arc( vp.x, vp.y, 10, 0, 2*Math.PI);
    sip.CC.fill();
    //console.log('Drew vertex at', sip.graph.vertices[i].coords.x, sip.graph.vertices[i].coords.y);
  }

  //Draw the nearest integer, if it exists
  if (sip.near_integer != undefined) {
    sip.CC.fillStyle = (sip.near_integer.as_array() in sip.graph.vertex_indices ? 'rgba(1,0,0,0.3)' : 'rgba(0,0,0,0.3)');
    var p = this.R2_to_pixel(sip, sip.near_integer);
    sip.CC.beginPath();
    sip.CC.moveTo( p.x, p.y );
    sip.CC.arc( p.x, p.y, 10, 0, 2*Math.PI);
    sip.CC.fill();
    //console.log('drew near integer at', sip.near_integer.x, sip.near_integer.y);
  }
}


ShineGui.prototype.si_plot_mouse = function(evt) {
  var sip = this.si_plot;
  var canvas_rect = sip.canvas.getBoundingClientRect();
  var mouse_p_x = evt.clientX - canvas_rect.left;
  var mouse_p_y = evt.clientY - canvas_rect.top;
  if (evt.type == 'mousemove' && !sip.dragging_plot) {
    var mouse_real = this.pixel_to_R2(sip, new R2Point(mouse_p_x, mouse_p_y));
    var mouse_rounded = mouse_real.round();
    var old_near_integer = sip.near_integer;
    if (Math.abs(mouse_rounded.x-mouse_real.x) < 0.25 && Math.abs(mouse_rounded.y-mouse_real.y) < 0.25) {
      sip.near_integer = mouse_rounded;
    } else {
      sip.near_integer = undefined;
    }
    if (old_near_integer == undefined || sip.near_integer == undefined) {
      if (old_near_integer != sip.near_integer) {
        this.redraw_si_plot();
      }
    } else if (!old_near_integer.equal(sip.near_integer)) {
      this.redraw_si_plot();
    }
    return;
  }
  if (evt.type == 'mousedown') {
    if (evt.button != 0) return ;
    sip.dragging_plot = true;
    sip.dragging_start = [mouse_p_x, mouse_p_y];
    sip.dragging_root = new R2Point(sip.ul.x, sip.ul.y);
    return;
  } else if (evt.type == 'mouseup') {
    if (evt.button != 0) return;
    sip.dragging_plot = false;
    if (sip.near_integer != undefined) {
      var near_vi = (sip.near_integer.as_array() in sip.graph.vertex_indices ? sip.graph.vertex_indices[sip.near_integer.as_array()] : undefined);
      //console.log('Found near_vi', near_vi, 'from', sip.near_integer.x, sip.near_integer.y);
      var created = false;
      //If we're not near any vertex, and we've clicked, create the vertex
      if (near_vi == undefined) {
        sip.graph.add_vertex(sip.near_integer);
        near_vi = sip.graph.vertex_indices[ sip.near_integer.as_array() ];
        created = true;
        //console.log('Created vertex', near_vi, 'at', sip.near_integer);
      }
      //Now we know we've clicked a vertex; if there's a selected vertex, connect it
      if (sip.selected_vertex != undefined) {
        if (near_vi != sip.selected_vertex) {
          sip.graph.add_edge(sip.selected_vertex, near_vi);
          //console.log('Created edge between vertices', near_vi, sip.selected_vertex);
        }
        sip.selected_vertex = undefined;
      } else if (!created) {      //If there's not a selected vertex, and we didn't just create it, select it
        sip.selected_vertex = near_vi;
      }
      this.redraw_si_plot();
    }
    return;
  }
  //if we are dragging the plot, and we got a mousemove, 
  //adjust the plot location as appropriate
  if (evt.type == 'mousemove' && sip.dragging_plot) {
    var drag_pixels_x = mouse_p_x - sip.dragging_start[0];
    var drag_pixels_y = mouse_p_y - sip.dragging_start[1];
    var drag_real = [drag_pixels_x / sip.scale_to_pixels,
                     -drag_pixels_y / sip.scale_to_pixels];
    sip.ul.x = sip.dragging_root.x - drag_real[0];
    sip.ul.y = sip.dragging_root.y - drag_real[1];
  }
  
  //If we got a mouse move, we need to zoom
  if (evt.type == 'mousewheel' || evt.type == 'DOMMouseScroll') {
    var mouse_real = this.pixel_to_R2(sip, new R2Point(mouse_p_x, mouse_p_y));
    var diff = sip.ul.sub(mouse_real);
    var factor = (evt.hasOwnProperty('wheelDelta') ? (evt.wheelDelta < 0 ? 1/0.95 : 0.95)
                                                               : (evt.detail < 0 ? 1/0.95 : 0.95));
    var new_diff = diff.scalar_mul( factor );
    sip.ul = mouse_real.add(new_diff);
    sip.width *= factor;
    sip.scale_to_pixels = sip.canvas.width / sip.width;
    evt.preventDefault();
  }
  
  if (sip.dragging_plot || evt.type == 'mousewheel' || evt.type == 'DOMMouseScroll') {
    this.redraw_si_plot();
  }
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







































