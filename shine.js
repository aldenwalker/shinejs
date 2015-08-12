/***************************************************************
 * A pixel and point
 ***************************************************************/
function Pixel(x,y) {
  this.x = x;
  this.y = y;
}
function Point(x,y) {
  this.x = x;
  this.y = y;
}


/*****************************************************************************
 *
 * Main Shine gui
 *
 *****************************************************************************/
function ShineGui() {
  window.addEventListener('resize', this.resize.bind(this));
  
  this.create_fd();

  this.resize();
  
}

/*****************************************************************************
 * Create the fundamental domain area
 *****************************************************************************/
ShineGui.prototype.create_fd = function() {
  this.fd = {};
  this.fd.canvas = document.getElementById('shine_left_canvas');
  this.fd.canvas_overlay = document.getElementById('shine_left_canvas_overlay');
  this.fd.canvas_overlay.addEventListener('mousemove', this.mouse_fd.bind(this));
  this.fd.canvas_overlay.addEventListener('mousedown', this.mouse_fd.bind(this));
  this.fd.canvas_overlay.addEventListener('mouseup', this.mouse_fd.bind(this));
  this.fd.OC = this.fd.canvas_overlay.getContext('2d');
  this.fd.currently_dragging = false;
  this.fd.view_trans = HyperbolicIsometry.identity();
  this.fd.view_trans_inverse = HyperbolicIsometry.identity();
  this.fd.dragging_view_trans = HyperbolicIsometry.identity();
  this.fd.dragging_view_trans_inverse = HyperbolicIsometry.identity();
  this.init_webgl_fd();
  this.fd.container = document.getElementById('shine_left');
  this.fd.container_offset = 0;
  this.fd.file_load_radios = document.getElementsByName('tab_file_load_type');
  this.fd.file_load_preset_select = document.getElementById('tab_file_load_preset');
  var presets = ['abABcdCD','aBAbcDCd','a_Ab_Bc_C']
  for (var i=0; i<presets.length; i++) {
    var op = document.createElement('option');
    op.text = presets[i];
    this.fd.file_load_preset_select.add(op);
  }
  this.fd.file_load_string = document.getElementById('tab_file_load_string');
  document.getElementById('tab_file_load_button').addEventListener('click', 
    (function() { this.load_fd(); show_tab('tab_draw'); }).bind(this));
  
  this.d3 = {};
}

/*****************************************************************************
 * Initialize the webgl in the fd canvas
 *****************************************************************************/
ShineGui.prototype.init_webgl_fd = function() {
  this.fd.GL = {'canvas':this.fd.canvas, 'inited':false};
  this.fd.GL.GLC = this.fd.GL.canvas.getContext('webgl');
  if (this.fd.GL.GLC == null) {
    this.fd.GL.GLC = this.fd.GL.canvas.getContext('experimental-webgl');
    if (this.fd.GL.GLC == null) {
      alert('No webgl support found');
      return;
    }
  }

  var gl = this.fd.GL;
  gl.vertex_shader_source = window.fd_vertex_shader_source; 
  //gl.vertex_shader_source = document.getElementById('fd_vertex_shader').text;
  gl.vertex_shader = gl.GLC.createShader(gl.GLC.VERTEX_SHADER);
  gl.GLC.shaderSource(gl.vertex_shader, gl.vertex_shader_source);
  gl.GLC.compileShader(gl.vertex_shader);
  console.log(gl.GLC.getShaderParameter(gl.vertex_shader, gl.GLC.COMPILE_STATUS));
 
  gl.fragment_shader_source = window.fd_fragment_shader_source;
  //gl.fragment_shader_source = document.getElementById('fd_fragment_shader').text;
  gl.fragment_shader = gl.GLC.createShader(gl.GLC.FRAGMENT_SHADER);
  gl.GLC.shaderSource(gl.fragment_shader, gl.fragment_shader_source);
  gl.GLC.compileShader(gl.fragment_shader);
  console.log(gl.GLC.getShaderParameter(gl.fragment_shader, gl.GLC.COMPILE_STATUS));

  gl.shaders = gl.GLC.createProgram();
  gl.GLC.attachShader(gl.shaders, gl.vertex_shader);
  gl.GLC.attachShader(gl.shaders, gl.fragment_shader);
  gl.GLC.linkProgram(gl.shaders);
  gl.GLC.useProgram(gl.shaders);  

  gl.inited = true;
}

/*****************************************************************************
 * Get a hyperbolic point from a click point (in Poincare)
 *****************************************************************************/
ShineGui.prototype.pixel_to_hyperbolic_fd = function (p) {
  var in_plane = new Point( -1 + 2*p.x / this.fd.canvas.width,
                             1 - 2*p.y / this.fd.canvas.width );
  var r = in_plane.x*in_plane.x + in_plane.y*in_plane.y;
  if (r > 0.99) return undefined;
  //scale so that (0,0,-1) + a(x,y,1) lies on the hyperbola
  var a = -2.0/(r-1.0);
  //console.log(a*in_plane.x*a*in_plane.x+ a*in_plane.y*a*in_plane.y- (a-1)*(a-1))
  var v = new HyperbolicPoint([a*in_plane.x, a*in_plane.y, a-1]);
  return v; //this.fd.view_trans_inverse.apply(v);
} 

/*****************************************************************************
 * Get a [-1,1]x[-1,1] point from a click point
 *****************************************************************************/
ShineGui.prototype.pixel_to_draw_coords_fd = function(p) {
  var in_plane = new Point( -1 + 2*p.x / this.fd.canvas.width,
                             1 - 2*p.y / this.fd.canvas.width );
  return in_plane;
}

/*****************************************************************************
 * Get a pixel from a [-1,1]x[-1,1] point
 *****************************************************************************/
ShineGui.prototype.draw_coords_to_pixel_fd = function(p) {
  return new Pixel( (0.5*p.x+0.5)*this.fd.canvas.width,
                    (0.5 - 0.5*p.y)*this.fd.canvas.width );
}

/*****************************************************************************
 * Resize the fundamental domain canvas
 *****************************************************************************/
ShineGui.prototype.resize_fd = function() {
  var x = Math.min( window.innerHeight-100, 
                    this.fd.container.clientWidth - this.fd.container_offset );
  this.fd.canvas.width = x;
  this.fd.canvas.height = x;
  this.fd.canvas_overlay.width = x;
  this.fd.canvas_overlay.height = x;
  if (this.fd.GL.inited) {
    this.fd.GL.GLC.viewport(0, 0, this.fd.GL.canvas.width, this.fd.GL.canvas.height);
    this.fd.GL.GLC.clear(this.fd.GL.GLC.COLOR_BUFFER_BIT | 
                         this.fd.GL.GLC.DEPTH_BUFFER_BIT);
  }
  this.redraw_fd();
}

/****************************************************************************
 * Resize the 3d canvas
 ****************************************************************************/
ShineGui.prototype.resize_3d = function() {
}

/****************************************************************************
 * Resize both areas
 ****************************************************************************/
ShineGui.prototype.resize = function() {
  this.resize_fd();
  this.resize_3d();
}

/****************************************************************************
 * The fundamental domain vertex and fragment shaders
 ****************************************************************************/
window.fd_vertex_shader_source =  '' +
'attribute vec3 a_pos;                                    \n'+
'uniform mat3 u_view_isom;                                \n'+
'uniform float u_depth_offset;                            \n'+
'void main() {                                            \n'+
'  vec3 isom_pos = u_view_isom*a_pos;                     \n'+
'  //Klein model:                                         \n'+
'  //vec2 proj_pos = vec2( isom_pos.x/isom_pos.z,         \n'+
'  //                      isom_pos.y/isom_pos.z );       \n'+
'  //Poincare model                                       \n'+
'  vec2 proj_pos = vec2( isom_pos.x/(isom_pos.z+1.0),     \n'+
'                        isom_pos.y/(isom_pos.z+1.0));    \n'+ 
'  gl_Position = vec4(proj_pos,u_depth_offset,1.0);       \n'+
'}                                                        \n';

window.fd_fragment_shader_source = '' +
'precision mediump float;                  \n'+
'uniform vec3 u_color;                     \n'+
'void main() {                             \n'+
'  gl_FragColor = vec4(u_color,1.0);       \n'+
'}                                         \n';

/****************************************************************************
 * Draw the fundamental domain
 * this.fd.hyperbolic_triangulation *must* be a hyperbolize 
 * FDTriangulation which has triangle boundary data.
 * This reloads the vertices and triangles and everything; it should only be 
 * necessary when changing the fundamental domain triangulation, not just the view
 ****************************************************************************/
ShineGui.prototype.draw_fd = function () {
  if (this.fd.embedded_hyperbolic_triangulation === undefined) return;
  var EHT = this.fd.embedded_hyperbolic_triangulation;
  var gl = this.fd.GL.GLC;
  var shaders = this.fd.GL.shaders;
  
  this.fd.GL.display_data = EHT.display_data();
  
  var isoms = EHT.isometries(6.0);

  var DD = this.fd.GL.display_data;


  //we need to translate around the fundamental domain by all the isometries
  //the length of the flat vertex locations will be 3*(number of vertices in fd)*(num isoms)
  DD.all_vertex_locations = DD.vertex_locations.slice(0);
  DD.flat_original_triangle_vertices = DD.flat_triangle_vertices;
  DD.flat_other_triangle_vertices = [];
  DD.flat_original_line_vertices = DD.flat_line_vertices.slice(0);
  DD.flat_original_thick_line_vertices = DD.flat_thick_line_vertices.slice(0);
  DD.label_locations = [];
  function ind_to_letter(ell) {
    if (ell<0) {
      return swap_case_char(EHT.HT.T.fd_identifications[-(ell+1)].name);
    } else {
      return EHT.HT.T.fd_identifications[ell-1].name;
    }
  }
  var num_added = 0;
  for (var phash in isoms) {
    var I = isoms[phash];
    DD.label_locations.push([I.point, I.word.map(ind_to_letter).join('')]);
    if (I.word.length==0) continue;
    var offset = DD.all_vertex_locations.length;
    Array.prototype.push.apply(
          DD.all_vertex_locations,
          DD.vertex_locations.map( function(p) { return I.map.apply(p); } ) );
    Array.prototype.push.apply(
          DD.flat_other_triangle_vertices,
          DD.flat_triangle_vertices.map( function(ind) { return ind+offset; } ) );
    Array.prototype.push.apply(
          DD.flat_line_vertices,
          DD.flat_original_line_vertices.map( function(ind) { return ind+offset; } ) );
    Array.prototype.push.apply(
          DD.flat_thick_line_vertices,
          DD.flat_original_thick_line_vertices.map( function(ind) { return ind+offset; } ) );
  }
  DD.flat_all_vertex_locations = new Float32Array(3*DD.all_vertex_locations.length);
  for (var i=0; i<DD.all_vertex_locations.length; i++) {
    DD.flat_all_vertex_locations[3*i] = DD.all_vertex_locations[i].v[0];
    DD.flat_all_vertex_locations[3*i+1] = DD.all_vertex_locations[i].v[1];
    DD.flat_all_vertex_locations[3*i+2] = DD.all_vertex_locations[i].v[2];
  }
  DD.flat_original_triangle_vertices = new Uint16Array(DD.flat_original_triangle_vertices);
  DD.flat_other_triangle_vertices = new Uint16Array(DD.flat_other_triangle_vertices);
  DD.flat_line_vertices = new Uint16Array(DD.flat_line_vertices);
  DD.flat_thick_line_vertices = new Uint16Array(DD.flat_thick_line_vertices);

  console.log(DD);

  //load in the vertex locations
  DD.flat_all_vertex_locations_buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, DD.flat_all_vertex_locations_buf);
  gl.bufferData(gl.ARRAY_BUFFER, DD.flat_all_vertex_locations, gl.STATIC_DRAW);
  var attrib_pos = gl.getAttribLocation(shaders, 'a_pos');
  gl.enableVertexAttribArray(attrib_pos);
  gl.vertexAttribPointer(attrib_pos, 3, gl.FLOAT, false, 0, 0);

  //load in the triangle vertices
  DD.flat_original_triangle_vertices_buf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_original_triangle_vertices_buf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, DD.flat_original_triangle_vertices, gl.STATIC_DRAW); 

  DD.flat_other_triangle_vertices_buf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_other_triangle_vertices_buf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, DD.flat_other_triangle_vertices, gl.STATIC_DRAW); 

  //load in the lines
  DD.flat_line_vertices_buf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_line_vertices_buf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, DD.flat_line_vertices, gl.STATIC_DRAW);

  //load in the thick lines
  DD.flat_thick_line_vertices_buf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_thick_line_vertices_buf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, DD.flat_thick_line_vertices, gl.STATIC_DRAW);
 
  this.redraw_fd(); 
}

/****************************************************************************
 * RE-draw the fundamental domain; this assumes that all the triangles and 
 * everything have been loaded and it is only necessary to update the 
 * view isometry
 ****************************************************************************/
ShineGui.prototype.redraw_fd = function() {
  if (!this.fd.GL.inited) return;
  var gl = this.fd.GL.GLC;
  var shaders = this.fd.GL.shaders;
  var DD = this.fd.GL.display_data;

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //gl.disable(gl.CULL_FACE);

  var EHT = this.fd.embedded_hyperbolic_triangulation;
  if (EHT === undefined) return;

  var uniform_view_isom = gl.getUniformLocation(shaders, 'u_view_isom');
  var final_trans = this.fd.dragging_view_trans.compose(this.fd.view_trans);
  gl.uniformMatrix3fv(uniform_view_isom, false, new Float32Array(final_trans.transpose().M));
  //console.log('Mat: ' + this.fd.view_transformation.M);

  var uniform_color = gl.getUniformLocation(shaders, 'u_color');
  var uniform_depth_offset = gl.getUniformLocation(shaders, 'u_depth_offset');

  //draw the original fundamental domain
  gl.uniform3fv(uniform_color, new Float32Array([0,0,1]));
  gl.uniform1f(uniform_depth_offset, 0.0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_original_triangle_vertices_buf);
  gl.drawElements(gl.TRIANGLES, DD.flat_original_triangle_vertices.length, gl.UNSIGNED_SHORT, 0);

  //draw the other triangles
  gl.uniform3fv(uniform_color, new Float32Array([0.7,0.7,1]));
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_other_triangle_vertices_buf);
  gl.drawElements(gl.TRIANGLES, DD.flat_other_triangle_vertices.length, gl.UNSIGNED_SHORT, 0);

  //draw the lines
  gl.lineWidth(1);
  gl.uniform1f(uniform_depth_offset, 0.1);
  gl.uniform3fv(uniform_color, new Float32Array([0,0,0]));
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_line_vertices_buf);
  gl.drawElements(gl.LINES, DD.flat_line_vertices.length, gl.UNSIGNED_SHORT, 0);

  //draw the thick lines
  gl.lineWidth(3);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_thick_line_vertices_buf);
  gl.drawElements(gl.LINES, DD.flat_thick_line_vertices.length, gl.UNSIGNED_SHORT, 0);


  //draw the overlay stuff
  var oc = this.fd.OC;
  oc.clearRect(0,0,this.fd.canvas_overlay.width, this.fd.canvas_overlay.height);
  
  //draw the circle
  var center = this.draw_coords_to_pixel_fd(new Point(0,0));
  oc.strokeStyle = '#000000';
  oc.lineWidth = 1;
  oc.beginPath();
  oc.arc(center.x, center.y, this.fd.canvas_overlay.width/2.0-0.5, 0, 2*Math.PI);
  oc.stroke();

  //draw the labels
  oc.textAlign = 'center';
  oc.font = '10px sans-serif';
  oc.fillStyle = '#000000';
  for (var i=0; i<DD.label_locations.length; i++) {
    var p = DD.label_locations[i][0];
    var w = DD.label_locations[i][1];
    var tp = final_trans.apply(p);
    var projtp = new Point( tp.v[0]/(tp.v[2]+2), tp.v[1]/(tp.v[2]+2) );
    var loc = this.draw_coords_to_pixel_fd(projtp);
    oc.fillText(w, loc.x, loc.y);
  }
}

/****************************************************************************
 * Redraw the 3d canvas
 ****************************************************************************/
ShineGui.prototype.redraw_3d = function () {

}

/****************************************************************************
 * Redraw both
 ****************************************************************************/
ShineGui.prototype.redraw = function () {
  this.redraw_3d();
  this.redraw_fd();
}

/****************************************************************************
 * Load the fundamental domain
 ****************************************************************************/
ShineGui.prototype.load_fd = function() {
  if (this.fd.file_load_radios[0].checked) {
    this.load_fd_string(this.fd.file_load_preset_select.value);
  } else if (this.fd.file_load_radios[1].checked) {
    this.load_fd_string(this.fd.file_load_string.value);
  } else {
    console.log('no option');
  }
  this.fd.view_trans = HyperbolicIsometry.identity();
  this.draw_fd();
  this.load_3d();
}

/****************************************************************************
 * Load the fundamental domain from a polygon word
 ****************************************************************************/
ShineGui.prototype.load_fd_string = function(s) {
  console.log('Loading fd string: ' + s);
  this.fd.triangulation = FDTriangulation.from_polygon_word(s);
  console.log('Got triangulation: \n' + this.fd.triangulation);
  this.fd.hyperbolic_triangulation = HyperbolicTriangulation.hyperbolize_triangulation(this.fd.triangulation);
  console.log('Got hyperbolic triangulation: \n' + this.fd.hyperbolic_triangulation);
  this.fd.embedded_hyperbolic_triangulation = EmbeddedHyperbolicTriangulation.embed_hyperbolic_triangulation(this.fd.hyperbolic_triangulation);
  console.log('Got embedded hyperbolic triangulation: \n' + this.fd.embedded_hyperbolic_triangulation);
}

/****************************************************************************
 * Handle mouse events in the fudamental domain
 ****************************************************************************/
ShineGui.prototype.mouse_fd = function(evt) {
  var param_rect = this.fd.canvas.getBoundingClientRect();
  var p = new Pixel(evt.clientX - param_rect.left, 
                    evt.clientY - param_rect.top);
  evt.preventDefault();
  if (evt.type == 'mouseup') {
    this.fd.currently_dragging = false;
    this.fd.view_trans = this.fd.dragging_view_trans.compose(this.fd.view_trans);
    this.fd.view_trans_inverse = this.fd.view_trans_inverse.compose(this.fd.dragging_view_trans_inverse);
    this.fd.dragging_view_trans = HyperbolicIsometry.identity();
    this.fd.dragging_view_trans_inverse = HyperbolicIsometry.identity();
    //console.log('mouse up'); 
    return true;
  }
  if (evt.type == 'mousedown') {
    this.fd.drag_origin = this.pixel_to_hyperbolic_fd(p);
    if (this.fd.drag_origin !== undefined) this.fd.currently_dragging = true;
    //this.fd.dragging_view_trans = HyperbolicIsometry.identity();
    //this.fd.dragging_view_trans_inverse = HyperbolicIsometry.identity();
    //console.log('mouse down');
    return false;
  }
  //console.log('Mouse: ' + this.pixel_to_hyperbolic_fd(p).v);
  if (!this.fd.currently_dragging) return;
  var current_point = this.pixel_to_hyperbolic_fd(p);
  this.fd.dragging_view_trans = HyperbolicIsometry.translate(this.fd.drag_origin, current_point);
  this.fd.dragging_view_trans_inverse = HyperbolicIsometry.translate(current_point, this.fd.drag_origin);
  //console.log('Origin: ' + this.fd.drag_origin.v + '\nCurrent: ' + current_point.v + 
  //            'Image of origin: ' + this.fd.dragging_view_trans.apply(this.fd.drag_origin).v);
  //console.log('Start ' + this.fd.drag_origin.v + '\nEnd '  + current_point.v);
  this.redraw_fd();
  return false;
}

/****************************************************************************
 * Load the 3d view
 ****************************************************************************/
ShineGui.prototype.load_3d = function() {
  if (!this.fd.hasOwnProperty('triangulation')) return;
  this.d3.embedded_triangulation = EmbeddedR3Triangulation.embed_triangulation(this.fd.triangulation);
  console.log('Embedded 3D');
}

















