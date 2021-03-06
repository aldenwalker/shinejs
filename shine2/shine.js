"use strict";

function hex_to_rgb_decimal(s) {
  return [ parseInt(s.substr(1,2),16)/255, parseInt(s.substr(3,2),16)/255, parseInt(s.substr(5,2),16)/255 ];
}



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
                  'graph': new R2Graph(),
                  'control': {'preset_select':document.getElementById('si_select_load_preset'),
                                'preset_load_button':document.getElementById('si_button_load_preset'),
                                'button_go':document.getElementById('si_button_go')}};
  var presets = this.load_preset_graph(false);
  for (var i=0; i<presets.length; i++) {
    var op = document.createElement('option');
    op.text = presets[i];
    this.si_plot.control.preset_select.add(op);
  }
  this.si_plot.control.preset_load_button.onclick = function() { this.load_preset_graph(true); }.bind(this);
  this.si_plot.control.button_go.onclick = this.load_new_surface.bind(this);
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
                        'control': {'radio_side_top': document.getElementById('left_radio_side_top'),
                                    'radio_side_bottom': document.getElementById('left_radio_side_bottom'),
                                    'button_cancel':document.getElementById('left_button_path_cancel')},
                        'input_path':undefined,
                        'upside':undefined,
                        'snap_distance':0.1 };
  this.left_plot.CC = this.left_plot.canvas.getContext('2d');
  this.left_plot.control.radio_side_top.onclick = this.side_from_html.bind(this);
  this.left_plot.control.radio_side_bottom.onclick = this.side_from_html.bind(this);
  //this.left_plot.control.radio_side_top.onchange = this.side_from_html.bind(this);
  //this.left_plot.control.radio_side_bottom.onchange = this.side_from_html.bind(this);
  this.left_plot.control.button_cancel.onclick = this.cancel_path.bind(this);
  this.side_from_html();
  this.left_plot.canvas.addEventListener('mousedown', this.left_plot_mouse.bind(this));
  this.left_plot.canvas.addEventListener('mouseup', this.left_plot_mouse.bind(this));
  this.left_plot.canvas.addEventListener('mousemove', this.left_plot_mouse.bind(this));

  this.right_plot = {'canvas': document.getElementById('right_plot_canvas'),
                    'ul': new R2Point(-3, 3),
                    'width': 6,
                    'scale_to_pixels':-1,
                    'div': document.getElementById('right_plot_div'),
                    'GL': {'canvas': document.getElementById('right_gl_plot_canvas'),
                           'inited':false,
                           'call_count':0},
                    'dragging_plot':false,
                    'view_trans':R3_trans_mat.identity(),
                    'dragging_view_trans':R3_trans_mat.identity(),
                    'view_translation':R3_trans_mat.translate(0,0,0.0),
                    'view_perspective':R3_trans_mat.perspective(4,-4),
                    'lighting_direction':[1,1,0],
                    'control': {'button_smooth':document.getElementById('right_control_smooth'),
                                'button_subdivide':document.getElementById('right_control_subdivide'),
                                'checkbox_triangles':document.getElementById('right_control_triangles'),
                                'color_triangles':document.getElementById('right_control_triangle_color'),
                                'checkbox_edges':document.getElementById('right_control_edges'),
                                'color_edges':document.getElementById('right_control_edge_color')} };
  this.right_plot.canvas.addEventListener('mousedown', this.right_plot_mouse.bind(this));
  this.right_plot.canvas.addEventListener('mouseup', this.right_plot_mouse.bind(this));
  this.right_plot.canvas.addEventListener('mousemove', this.right_plot_mouse.bind(this));
  this.right_plot.GL.canvas.addEventListener('mousewheel', this.right_plot_mouse.bind(this));
  this.right_plot.GL.canvas.addEventListener('DOMMouseScroll', this.right_plot_mouse.bind(this));
  this.right_plot.canvas.addEventListener('mousewheel', this.right_plot_mouse.bind(this));
  this.right_plot.canvas.addEventListener('DOMMouseScroll', this.right_plot_mouse.bind(this));

  this.right_plot.control.button_smooth.onclick = this.smooth_right_plot.bind(this);
  this.right_plot.control.button_subdivide.onclick = this.subdivide_right_plot.bind(this);
  this.right_plot.control.checkbox_triangles.onchange = this.redraw_right_plot.bind(this);
  this.right_plot.control.checkbox_edges.onchange = this.redraw_right_plot.bind(this);
  this.right_plot.control.color_triangles.onchange = this.redraw_right_plot.bind(this);
  this.right_plot.control.color_edges.onchange = this.redraw_right_plot.bind(this);
  
  this.surface = undefined;
  
  this.curve_list = {};
  this.curve_list.curve_info_template = document.getElementById('curve_info_template');
  this.curve_list.curve_list_html = document.getElementById('curve_list');
  this.curve_list.curve_list = [];

  document.getElementById('homeo-add').onclick = this.add_homeo.bind(this);
  this.homeo_list = {};
  this.homeo_list.homeo_template = document.getElementById('homeo_template');
  this.homeo_list.homeo_list_html = document.getElementById('homeo_list');
  this.homeo_list.homeo_list = [];
  
  
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
  this.left_plot.scale_to_pixels = w / this.left_plot.width;
  this.right_plot.scale_to_pixels = w / this.right_plot.width;
  
  this.left_plot.GL.canvas.width = w;
  this.left_plot.GL.canvas.height = w;
  this.right_plot.GL.canvas.width = w;
  this.right_plot.GL.canvas.height = w;
  
  this.left_plot.div.style.width = w;
  this.left_plot.div.style.height = w;
  this.right_plot.div.style.width = w;
  this.right_plot.div.style.height = w;
  
  if (this.right_plot.GL.inited) {
    this.right_plot.GL.GLC.viewport(0, 0, this.right_plot.GL.canvas.width, this.right_plot.GL.canvas.height);
    this.right_plot.GL.GLC.clear(this.right_plot.GL.GLC.COLOR_BUFFER_BIT | 
                                  this.right_plot.GL.GLC.DEPTH_BUFFER_BIT);
  }
  
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

ShineGui.prototype.pixelxy_to_R2 = function(X, px, py) {
  return new R2Point( X.ul.x + (px / X.scale_to_pixels),
                       X.ul.y - (py / X.scale_to_pixels) );
}

ShineGui.prototype.xy_to_pixel = function(X, x, y) {
  return new Pixel( (x - X.ul.x) * X.scale_to_pixels,
                    -(y - X.ul.y) * X.scale_to_pixels );
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
  for (var i=0; i<sip.graph.edges.length; i++) {
    var e = sip.graph.edges[i];
    var v1p = this.R2_to_pixel(sip, sip.graph.vertices[e[0]].coords);
    var v2p = this.R2_to_pixel(sip, sip.graph.vertices[e[1]].coords);
    sip.CC.beginPath();
    sip.CC.moveTo( v1p.x, v1p.y );
    sip.CC.lineTo( v2p.x, v2p.y );
    sip.CC.stroke();
  }
  for (var i=0; i<sip.graph.vertices.length; i++) {
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
    var factor = ('wheelDelta' in evt ? (evt.wheelDelta > 0 ? 1/0.95 : 0.95)
                                      : (evt.detail > 0 ? 1/0.95 : 0.95));
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


ShineGui.prototype.load_preset_graph = function(s) {
  var preset_names = ['Genus 2', 'Once punctured torus', 'Pair of pants'];
  if (!s) {
    return preset_names;
  }
  var pname = this.si_plot.control.preset_select.value;
  var v = undefined;
  var e = undefined;
  switch (pname) {
    case 'Genus 2':
      v = [ [-2,0], [-1,-1], [-1,1], [0,0], [1,-1], [1,1], [2,0]];
      e = [ [0,1], [0,2], [1,3], [2,3], [3,4], [3,5], [4,6], [5,6] ];
      break;
    case 'Once punctured torus':
      v = [ [-2,0], [-1,-1], [-1,1], [0,0], [1,0] ];
      e = [ [0,1], [0,2], [1,3], [2,3], [3,4] ];
      break;
    case 'Pair of pants':
      v = [ [0,0], [-1,-1], [1,-1], [0,1] ];
      e = [ [0,1], [0,2], [0,3] ];
      break;
    default:
      console.log("Unknown type!");
      break;
  }
  var ans = new R2Graph();
  for (var i=0; i<v.length; i++) {
    ans.add_vertex( new R2Point(v[i][0], v[i][1]) );
  }
  for (var i=0; i<e.length; i++) {
    ans.add_edge( e[i][0], e[i][1] );
  }
  this.si_plot.graph = ans;
  this.redraw_si_plot();
}



ShineGui.prototype.load_new_surface = function() {
  console.log('loading surface!');
  toggle_visible('surface_input');
  make_visible('surface_display');
  
  this.surface = new R3Surface(this.si_plot.graph);
  
  var sh = this.surface.triangulations[0].shadow;
  var ul = new R2Point(-1,1);
  var lr = new R2Point(1,-1);
  for (var i=0; i<sh.vertex_locations.length; i++) {
    var vl = sh.vertex_locations[i];
    if (vl[0] < ul.x) ul.x = vl[0];
    if (vl[1] > ul.y) ul.y = vl[1];
    if (vl[0] > lr.x) lr.x = vl[0];
    if (vl[1] < lr.y) lr.y = vl[1];
  }
  var center = ul.add(lr).scalar_mul(0.5);
  var width = Math.max(ul.y-lr.y, lr.x-ul.x);
  width *= 1.1;
  this.left_plot.ul = center.add(new R2Point(-width/2, width/2));
  this.left_plot.width = width;
  this.left_plot.scale_to_pixels = this.left_plot.canvas.width / width;
  
  
  this.redraw_left_plot();
  this.create_right_plot();
  this.redraw_right_plot();
  
}



























ShineGui.prototype.redraw_left_plot = function(mouse_loc) {
  var lp = this.left_plot;
  lp.CC.clearRect(0,0,lp.canvas.width,lp.canvas.height);
  
  if (this.surface == undefined || this.surface.triangulations[0].shadow == undefined) {
    return;
  }
  
  var s = this.surface.triangulations[0].shadow;
  
  // //Draw the triangle edges
  lp.CC.strokeStyle = '#000000';
  lp.CC.lineWidth = 1;
  lp.CC.textAlign = 'center';
  lp.CC.font = '10px sans-serif';
  lp.CC.fillStyle = '#000000';
  for (var i=0; i<s.edges.length; i++) {
    var e = s.edges[i];
    if (s.triangle_normals[e[2]][2] < 0) continue;
    var v0 = s.vertex_locations[e[0]];
    var v1 = s.vertex_locations[e[1]];
    var p0 = this.xy_to_pixel(lp, v0[0], v0[1]);
    var p1 = this.xy_to_pixel(lp, v1[0], v1[1]);
    lp.CC.beginPath();
    lp.CC.moveTo( p0.x, p0.y );
    lp.CC.lineTo( p1.x, p1.y );
    lp.CC.stroke();
    var cp = R2_interpolate_segment_xyxy(0.5, v0[0], v0[1], v1[0], v1[1]);
    var cp = this.xy_to_pixel(lp, cp.x, cp.y);
    lp.CC.fillText(i, cp.x, cp.y);
  }

  //Draw the triangle labels
  for (var i=0; i<s.triangle_vertices.length; i++) {
  	if (s.triangle_normals[i][2] < 0) continue;
  	var tv = s.triangle_vertices[i];
  	var c = [ s.vertex_locations[tv[0]][0] + s.vertex_locations[tv[1]][0] + s.vertex_locations[tv[2]][0],
  	          s.vertex_locations[tv[0]][1] + s.vertex_locations[tv[1]][1] + s.vertex_locations[tv[2]][1], 
  	          0 ];
  	c = [(1/3)*c[0], (1/3)*c[1] ];
  	var cp = this.xy_to_pixel(lp, c[0], c[1]);
  	lp.CC.fillText(i, cp.x, cp.y);
  }


  //Draw the boundary edges
  lp.CC.strokeStyle = '#000000';
  lp.CC.lineWidth = 1;
  for (var i=0; i<s.boundary_edges.length; i++) {
    var e = s.edges[s.boundary_edges[i]];
    var v0 = s.vertex_locations[e[0]];
    var v1 = s.vertex_locations[e[1]];
    var p0 = this.xy_to_pixel(lp, v0[0], v0[1]);
    var p1 = this.xy_to_pixel(lp, v1[0], v1[1]);
    lp.CC.beginPath();
    lp.CC.moveTo( p0.x, p0.y );
    lp.CC.lineTo( p1.x, p1.y );
    lp.CC.stroke();
  }
  
  //Draw the paths already on the surface
  for (var i=0; i<this.curve_list.curve_list.length; i++) {
    var CD = this.curve_list.curve_list[i];
    if (!CD.visible.checked) continue;
    lp.CC.lineWidth = 2;
    var col = CD.color.value;
    var rgb = [ parseInt(col.substr(1,2),16), parseInt(col.substr(3,2),16), parseInt(col.substr(5,2),16) ];
    var cid = CD.id;
    var c = this.surface.curves[cid][0];
    var pts = [];
    var sides = [];
    for (var j=0; j<c.length; j++) {
      var ei = Math.abs(c[j][0])-1;
      var e = s.edges[ei];
      var t = c[j][1];
      var pt = R2_interpolate_segment_xyxy(t, s.vertex_locations[e[0]][0], s.vertex_locations[e[0]][1],
                                              s.vertex_locations[e[1]][0], s.vertex_locations[e[1]][1]);
      var ptp = this.R2_to_pixel(lp, pt);
      var tri_ind = (c[j][0] > 0 ? e[4] : e[2]);
      var side = (s.triangle_normals[tri_ind][2] > 0 ? 'top' : 'bottom');
      pts[j] = ptp;
      sides[j] = side;
    }
    for (var j=0; j<c.length; j++) {
      lp.CC.beginPath();
      lp.CC.moveTo(pts[j].x, pts[j].y);
      var jp1 = (j+1)%c.length;
      lp.CC.lineTo(pts[jp1].x, pts[jp1].y);
      var alpha = (sides[j] == lp.upside ? 1.0 : 0.3);
      var ss = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
      lp.CC.strokeStyle = ss;
      lp.CC.stroke();
    }
  }
  
  //Draw the current path, or just the mouse if not defined
  if (lp.input_path === undefined) {
    if (!(mouse_loc===undefined)) {
      var p1 = this.R2_to_pixel(lp, mouse_loc);
      lp.CC.fillStyle = 'rgba(0,0,255,0.5)';
      lp.CC.beginPath();
      lp.CC.moveTo( p1.x, p1.y );
      lp.CC.arc( p1.x, p1.y, 4, 0, 2*Math.PI);
      lp.CC.fill();
    }
  } else {
    lp.CC.lineWidth = 2;
    for (var i=0; i<lp.input_path.length; i++) {
      var IP = lp.input_path[i];
      var side = IP[0];
      var alpha = (side == lp.upside ? 1 : 0.3);
      lp.CC.strokeStyle = 'rgba(0,0,255,' + alpha + ')';
      lp.CC.fillStyle = 'rgba(0,0,255,' + alpha + ')';
      var p0 = undefined;
      if (IP[1][0] == 'point') {
        p0 = this.R2_to_pixel(lp, IP[1][1]);
      } else {
        var e = s.edges[IP[1][1]];
        var p0_real = R2_interpolate_segment_xyxy(IP[1][2], s.vertex_locations[e[0]][0], s.vertex_locations[e[0]][1],
                                                             s.vertex_locations[e[1]][0], s.vertex_locations[e[1]][1]);
        p0 = this.R2_to_pixel(lp, p0_real);
      }
      var p1 = undefined;
      if (IP[2] != undefined) {
        if (IP[2][0] == 'point') {
          p1 = this.R2_to_pixel(lp, IP[2][1]);
        } else {
          var e = s.edges[IP[2][1]];
          var p1_real = R2_interpolate_segment_xyxy(IP[2][2], s.vertex_locations[e[0]][0], s.vertex_locations[e[0]][1],
                                                               s.vertex_locations[e[1]][0], s.vertex_locations[e[1]][1]);
          p1 = this.R2_to_pixel(lp, p1_real);
        }
      }
      
      lp.CC.beginPath();
      lp.CC.moveTo( p0.x, p0.y );
      lp.CC.arc( p0.x, p0.y, 4, 0, 2*Math.PI);
      lp.CC.fill();
      if (p1 != undefined) {
        lp.CC.beginPath();
        lp.CC.moveTo( p1.x, p1.y );
        lp.CC.arc( p1.x, p1.y, 4, 0, 2*Math.PI);
        lp.CC.fill();
        lp.CC.beginPath();
        lp.CC.moveTo( p0.x, p0.y );
        lp.CC.lineTo( p1.x, p1.y );
        lp.CC.stroke();
      }
    }
    
    //if we have mouse coordinates, draw a line to it
    if (mouse_loc != undefined) {
      //draw the path
      var IP = lp.input_path[lp.input_path.length-1];
      var side = IP[0];
      var alpha = (side == lp.upside ? 1 : 0.3);
      lp.CC.strokeStyle = 'rgba(0,0,255,' + alpha + ')'
      lp.CC.fillStyle = 'rgba(0,0,255,' + alpha + ')'
      var p0 = undefined;
      if (IP[1][0] == 'point') {
        p0 = this.R2_to_pixel(lp, IP[1][1]);
      } else {
        var e = s.edges[IP[1][1]];
        p0_real = R2_interpolate_segment_xyxy(IP[1][2], s.vertex_locations[e[0]][0], s.vertex_locations[e[0]][1],
                                                        s.vertex_locations[e[1]][0], s.vertex_locations[e[1]][1]);
        p0 = this.R2_to_pixel(lp, p0_real);
      }
      var p1 = this.R2_to_pixel(lp, mouse_loc);
      if (mouse_loc.dist(lp.input_path[0][1][1]) < lp.snap_distance) {
        lp.CC.fillStyle = 'rgba(255,0,255,' + alpha + ')';
      } else if ( this.surface.find_closest_shadow_boundary(mouse_loc, lp.snap_distance) != undefined) {
        lp.CC.fillStyle = 'rgba(0,255,0,' + alpha + ')';
      }
      lp.CC.beginPath();
      lp.CC.moveTo( p0.x, p0.y );
      lp.CC.lineTo( p1.x, p1.y );
      lp.CC.stroke();
      lp.CC.beginPath();
      lp.CC.moveTo( p1.x, p1.y );
      lp.CC.arc( p1.x, p1.y, 4, 0, 2*Math.PI);
      lp.CC.fill();
    }
  }
  
}


ShineGui.prototype.left_plot_mouse = function(evt) {
  var lp = this.left_plot;
  var canvas_rect = lp.canvas.getBoundingClientRect();
  var mouse_p_x = evt.clientX - canvas_rect.left;
  var mouse_p_y = evt.clientY - canvas_rect.top;
  var mouse_real = this.pixelxy_to_R2(lp, mouse_p_x, mouse_p_y);
  if (evt.type == 'mousemove') {
    this.redraw_left_plot(mouse_real);
    return;
  }
  
  if (evt.type == 'mousedown') {
    return;
  }
  
  if (evt.type == 'mouseup') {
    if (evt.button != 0) return;
    if (lp.input_path === undefined) {
      lp.input_path = [ [lp.upside, ['point', mouse_real]] ];
      this.redraw_left_plot();
      return;
    } else {
      //If we're within a small distance of the beginning, finish the path
      if (lp.upside == lp.input_path[0][0] && mouse_real.dist(lp.input_path[0][1][1]) < lp.snap_distance) {
        lp.input_path[lp.input_path.length-1][2] = ['point', lp.input_path[0][1][1].copy()];
        this.add_curve(lp.input_path);
        lp.input_path = undefined;
        this.redraw_left_plot();
        this.create_right_plot_curves();
        this.redraw_right_plot();
        return;
      }
      //If we're within a small distance of a boundary edge, round to the edge
      //and flip the upside
      var ce = this.surface.find_closest_shadow_boundary(mouse_real, lp.snap_distance);
      if (ce != undefined) {
        var s = this.surface.triangulations[0].shadow;
        var vi0 = s.edges[ce][0];
        var v0p = new R2Point(s.vertex_locations[vi0][0], s.vertex_locations[vi0][1]);
        var vi1 = s.edges[ce][1];
        var v1p = new R2Point(s.vertex_locations[vi1][0], s.vertex_locations[vi1][1]);
        var edge_t = R2_project_segment_t(mouse_real, v0p, v1p);
        //console.log('Rounding', mouse_real, 'to edge', ce, ':', vi0, v0p, vi1, v1p, edge_t);
        if (edge_t < 0 || edge_t > 1) {
          console.log('unexpected edge_t');
        }
        lp.input_path[lp.input_path.length-1][2] = ['edge', ce, edge_t];
        lp.upside = (lp.upside == 'top' ? 'bottom' : 'top');
        this.side_to_html();
        lp.input_path.push( [lp.upside, ['edge', ce, edge_t]] );
        this.redraw_left_plot();
        return;
      }
      //Otherwise, just make a new point
      lp.input_path[lp.input_path.length-1][2] = ['point', mouse_real.copy()];
      lp.input_path.push( [lp.upside, ['point', mouse_real.copy()]] );
      this.redraw_left_plot();
      return;
    }
  }
}




ShineGui.prototype.cancel_path = function() {
  this.left_plot.input_path = undefined;
  this.redraw_left_plot();
}


ShineGui.prototype.side_from_html = function() {
  this.left_plot.upside = (this.left_plot.control.radio_side_top.checked ? 'top' : 'bottom');
  this.redraw_left_plot();
}

ShineGui.prototype.side_to_html = function() {
  this.left_plot.control.radio_side_top.checked = (this.left_plot.upside == 'top');
  this.left_plot.control.radio_side_bottom.checked = (this.left_plot.upside == 'bottom');
}




















ShineGui.prototype.redraw_right_plot = function() {
  var rp = this.right_plot;
  if (rp.GL.call_count % 2 != 0) {
    console.log('Called plot gl in parallel? aborting');
    return;
  }
  if (rp.GL.hasOwnProperty('webgl-error')) return;
  rp.GL.call_count++;
  if (this.surface == undefined) {
    rp.GL.call_count++;
    return;
  }
  if (!rp.GL.inited) this.create_right_plot();

  
  var gl = rp.GL.GLC;
  var shaders = rp.GL.shaders;
  var DD = rp.GL.display_data;

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  var uniform_trans = gl.getUniformLocation(shaders, 'u_trans');
  var final_trans = rp.dragging_view_trans.compose(rp.view_trans);
  //console.log('final transformation:', final_trans);
  var final_trans = rp.view_translation.compose(final_trans);
  //console.log('final trans:', final_trans);
  gl.uniformMatrix4fv(uniform_trans, false, new Float32Array(final_trans.transpose().M));

  var uniform_perspective = gl.getUniformLocation(shaders, 'u_perspective');
  gl.uniformMatrix4fv(uniform_perspective, false, new Float32Array(rp.view_perspective.transpose().M));

  R3_normalize_inplace(rp.lighting_direction);
  var uniform_light_dir = gl.getUniformLocation(shaders, 'u_light_dir');
  gl.uniform3fv(uniform_light_dir, new Float32Array(rp.lighting_direction));
  
  var uniform_color = gl.getUniformLocation(shaders, 'u_color');
  
  var attrib_pos =    gl.getAttribLocation(rp.GL.shaders, 'a_pos');
  var attrib_normal = gl.getAttribLocation(rp.GL.shaders, 'a_normal');

  gl.bindBuffer(gl.ARRAY_BUFFER, DD.flat_vertex_locations_buf);
  gl.enableVertexAttribArray(attrib_pos);
  gl.vertexAttribPointer(attrib_pos, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, DD.flat_vertex_normals_buf);
  gl.enableVertexAttribArray(attrib_normal);
  gl.vertexAttribPointer(attrib_normal, 3, gl.FLOAT, false, 0, 0);

  // DRAW TRIANGLES
  if (rp.control.checkbox_triangles.checked) {
    var col = hex_to_rgb_decimal(rp.control.color_triangles.value);
    gl.uniform3fv(uniform_color, new Float32Array(col));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_triangle_vertices_buf);
    gl.drawElements(gl.TRIANGLES, DD.flat_triangle_vertices.length, gl.UNSIGNED_SHORT, 0);
  }
  
  // DRAW SKELETON
  if (rp.control.checkbox_edges.checked) {
    gl.lineWidth(2);
    var col = hex_to_rgb_decimal(rp.control.color_edges.value);
    gl.uniform3fv(uniform_color, new Float32Array(col));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_edge_vertices_buf);
    gl.drawElements(gl.LINES, DD.flat_edge_vertices.length, gl.UNSIGNED_SHORT, 0);
  }

  // DRAW CURVES
  gl.bindBuffer(gl.ARRAY_BUFFER, DD.flat_curve_vertex_locations_buf);
  gl.enableVertexAttribArray(attrib_pos);
  gl.vertexAttribPointer(attrib_pos, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, DD.flat_curve_vertex_normals_buf);
  gl.enableVertexAttribArray(attrib_normal);
  gl.vertexAttribPointer(attrib_normal, 3, gl.FLOAT, false, 0, 0);

  gl.lineWidth(4);
  for (var i=0; i<DD.flat_curve_vertices_bufs.length; i++) {
    if (!this.curve_list.curve_list[i].visible.checked) continue;
    var col = this.curve_list.curve_list[i].color.value;
    var rgb = hex_to_rgb_decimal(col);
    gl.uniform3fv(uniform_color, new Float32Array(rgb));
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_curve_vertices_bufs[i]);
    gl.drawElements(gl.LINE_LOOP, DD.flat_curve_vertices[i].length, gl.UNSIGNED_SHORT, 0);
  }
  //console.log('GL redraw');

  rp.GL.call_count++;
}


//Recreate the curve plots
ShineGui.prototype.create_right_plot_curves = function() {
  if (this.surface === undefined) return;
  var rp = this.right_plot;
  var T = this.surface.triangulations[this.surface.triangulations.length-1];
  var C = this.surface.curves;
  var DD = rp.GL.display_data;
  var total_curve_vertices = 0;
  for (var i=0; i<C.length; i++) {
  	if (C[i] === undefined) continue;
    total_curve_vertices += C[i][C[i].length-1].length;
  }
  DD.flat_curve_vertex_locations = new Float32Array(3*total_curve_vertices);
  DD.flat_curve_vertex_normals = new Float32Array(3*total_curve_vertices);
  DD.flat_curve_vertices = [];
  var offset = 0;
  for (var i=0; i<C.length; i++) {
  	if (C[i] === undefined) continue;
    var c = C[i][C[i].length-1];   //Each curve has its subdivision history; we want the latest
    DD.flat_curve_vertices[i] = new Uint16Array(c.length);
    //console.log('Creating curve:', c);
    for (var j=0; j<c.length; j++) {
      var ei = Math.abs(c[j][0])-1;
      var e = T.edges[ei];
      var en = T.edge_normals[ei];
      var v = R3_interpolate(c[j][1], T.vertex_locations[e[0]],  T.vertex_locations[e[1]]);
      R3_acc_multiple_inplace(v, 0.005, en);
      //console.log('edge normal', en);
      DD.flat_curve_vertex_locations[3*offset] = v[0];
      DD.flat_curve_vertex_locations[3*offset+1] = v[1];
      DD.flat_curve_vertex_locations[3*offset+2] = v[2];
      DD.flat_curve_vertex_normals[3*offset] = en[0];
      DD.flat_curve_vertex_normals[3*offset+1] = en[1];
      DD.flat_curve_vertex_normals[3*offset+2] = en[2];
      DD.flat_curve_vertices[i][j] = offset;
      offset += 1;
    }
  }

  var gl = rp.GL.GLC;

  DD.flat_curve_vertex_locations_buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, DD.flat_curve_vertex_locations_buf);
  gl.bufferData(gl.ARRAY_BUFFER, DD.flat_curve_vertex_locations, gl.STATIC_DRAW);
  //console.log("I'm loading in vertex locations:", DD.flat_curve_vertex_locations);

  DD.flat_curve_vertex_normals_buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, DD.flat_curve_vertex_normals_buf);
  gl.bufferData(gl.ARRAY_BUFFER, DD.flat_curve_vertex_normals, gl.STATIC_DRAW);

  DD.flat_curve_vertices_bufs = [];
  for (var i=0; i<C.length; i++) {
  	if (C[i] === undefined) continue;
    DD.flat_curve_vertices_bufs[i] = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_curve_vertices_bufs[i]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, DD.flat_curve_vertices[i], gl.STATIC_DRAW);
    //console.log("I'm loading in vertices:", DD.flat_curve_vertices[i]);
  }
}




ShineGui.prototype.create_right_plot = function(just_vertices, retain_view) {
  if (this.surface == undefined) return;
  var rp = this.right_plot;
  if (!rp.GL.inited) this.init_right_plot();
  
  var T = this.surface.triangulations[this.surface.triangulations.length-1];
  
  if (just_vertices != true) rp.GL.display_data = {};
  var DD = rp.GL.display_data;
  
  DD.flat_vertex_locations = new Float32Array(3*T.vertex_locations.length);
  for (var i=0; i<T.vertex_locations.length; i++) {
    DD.flat_vertex_locations[3*i] = T.vertex_locations[i][0];
    DD.flat_vertex_locations[3*i+1] = T.vertex_locations[i][1];
    DD.flat_vertex_locations[3*i+2] = T.vertex_locations[i][2];
  }

  DD.flat_vertex_normals = new Float32Array(3*T.vertex_normals.length);
  for (var i=0; i<T.vertex_normals.length; i++) {
    DD.flat_vertex_normals[3*i] = T.vertex_normals[i][0];
    DD.flat_vertex_normals[3*i+1] = T.vertex_normals[i][1];
    DD.flat_vertex_normals[3*i+2] = T.vertex_normals[i][2];
  }
  
  if (just_vertices != true) {
    DD.flat_triangle_vertices = new Uint16Array(3*T.triangle_vertices.length);
    for (var i=0; i<T.triangle_vertices.length; i++) {
      DD.flat_triangle_vertices[3*i] = T.triangle_vertices[i][0];
      DD.flat_triangle_vertices[3*i+1] = T.triangle_vertices[i][1];
      DD.flat_triangle_vertices[3*i+2] = T.triangle_vertices[i][2];
    }

    DD.flat_edge_vertices = new Uint16Array(6*T.triangle_vertices.length);
    for (var i=0; i<T.triangle_vertices.length; i++) {
      DD.flat_edge_vertices[6*i] = T.triangle_vertices[i][0];
      DD.flat_edge_vertices[6*i+1] = T.triangle_vertices[i][1];
      DD.flat_edge_vertices[6*i+2] = T.triangle_vertices[i][1];
      DD.flat_edge_vertices[6*i+3] = T.triangle_vertices[i][2];
      DD.flat_edge_vertices[6*i+4] = T.triangle_vertices[i][2];
      DD.flat_edge_vertices[6*i+5] = T.triangle_vertices[i][0];
    }
  }
    
  var gl = rp.GL.GLC;

  DD.flat_vertex_locations_buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, DD.flat_vertex_locations_buf);
  gl.bufferData(gl.ARRAY_BUFFER, DD.flat_vertex_locations, gl.STATIC_DRAW);

  DD.flat_vertex_normals_buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, DD.flat_vertex_normals_buf);
  gl.bufferData(gl.ARRAY_BUFFER, DD.flat_vertex_normals, gl.STATIC_DRAW);

  if (just_vertices != true) {
    DD.flat_triangle_vertices_buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_triangle_vertices_buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, DD.flat_triangle_vertices, gl.STATIC_DRAW); 
    
    DD.flat_edge_vertices_buf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, DD.flat_edge_vertices_buf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, DD.flat_edge_vertices, gl.STATIC_DRAW); 
  }

  if (retain_view != true) {
    console.log('got bbox:', T.bbox);
    var PS = R3_trans_mat.perspective_and_scale(T.bbox);
    //rp.view_trans = R3_trans_mat.scale(2/(this.left_plot.width));
    rp.view_perspective = PS[0];
    rp.view_trans = PS[1];
    rp.dragging_view_trans = R3_trans_mat.identity();
    rp.view_translation = R3_trans_mat.translate(0,0,0);
  }
  
  this.create_right_plot_curves();

  // console.log('Created right plot');
  // console.log(DD);
}


ShineGui.prototype.init_right_plot = function() {
  var rp = this.right_plot;
  if (rp.GL.hasOwnProperty('GLC')) {
    console.log("Already have the gl context?");
    return;
  }
  rp.GL.GLC = rp.GL.canvas.getContext('webgl');
  if (rp.GL.GLC == null) {
    rp.GL.GLC = rp.GL.canvas.getContext('experimental-webgl');
  }
  if (rp.GL.GLC == null) {
    rp.GL['webgl-error'] = true;
    alert('WebGL support not found');
    return;
  }
  rp.GL.color = true;
  rp.GL.GLC.viewport(0, 0, rp.GL.canvas.width, rp.GL.canvas.height);
  
  var gl = rp.GL.GLC;
  rp.GL.vertex_shader_source = window.vertex_shader_source;
  rp.GL.vertex_shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(rp.GL.vertex_shader, rp.GL.vertex_shader_source);
  gl.compileShader(rp.GL.vertex_shader);

  rp.GL.fragment_shader_source = window.fragment_shader_source;
  rp.GL.fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(rp.GL.fragment_shader, rp.GL.fragment_shader_source);
  gl.compileShader(rp.GL.fragment_shader);

  rp.GL.shaders = gl.createProgram();
  gl.attachShader(rp.GL.shaders, rp.GL.vertex_shader);
  gl.attachShader(rp.GL.shaders, rp.GL.fragment_shader);
  gl.linkProgram(rp.GL.shaders);
  gl.useProgram(rp.GL.shaders);
  
  gl.enable(gl.DEPTH_TEST);
  //gl.disable(gl.CULL_FACE);
  //gl.enable(gl.CULL_FACE);
  
  rp.GL.inited = true;
}

window.vertex_shader_source =  '' +
'attribute vec3 a_pos;                                      \n'+
'attribute vec3 a_normal;                                   \n'+
'uniform   mat4 u_trans;                                    \n'+
'uniform   mat4 u_perspective;                              \n'+
'uniform   vec3 u_light_dir;                                \n'+
'varying   vec3 v_light_scale;                              \n'+
'void main() {                                              \n'+
'  vec3 normal_trans = (u_trans * vec4(a_normal,0.0)).xyz;  \n'+
'  normal_trans = normalize(normal_trans);                  \n'+
'  float d = dot(u_light_dir, normal_trans);                \n'+
'  d = max(d, 0.0);                                         \n'+
'  v_light_scale = vec3(d, d, d);                           \n'+
'  gl_Position = u_perspective * u_trans * vec4(a_pos, 1.0);                \n'+
'}                                                          \n';

window.fragment_shader_source = '' +
'precision mediump float;                    \n'+
'uniform vec3 u_color;                       \n'+
'varying vec3 v_light_scale;                 \n'+
'void main() {                               \n'+
'  vec3 sc_color = 0.5*u_color + 0.5*v_light_scale*u_color;  \n'+
'  gl_FragColor = vec4(sc_color,1.0);        \n'+
'}                                           \n';


ShineGui.prototype.right_plot_mouse = function(evt) {
  var rp = this.right_plot;
  var canvas_rect = rp.canvas.getBoundingClientRect();
  var mouse_p_x = evt.clientX - canvas_rect.left;
  var mouse_p_y = evt.clientY - canvas_rect.top;
  
  if (evt.type == 'mousemove' && !rp.dragging_plot) return;
  if (evt.type == 'mousedown') {
    if (evt.button != 0) return;
    rp.dragging_plot = true;
    rp.dragging_start = [mouse_p_x, mouse_p_y];
    //console.log('start right drag');
    return;
  } else if (evt.type == 'mouseup') {
    if (evt.button != 0) return;
    rp.dragging_plot = false;    
    rp.view_trans = rp.dragging_view_trans.compose(rp.view_trans);
    rp.dragging_view_trans = R3_trans_mat.identity();
    this.redraw_right_plot();
    //console.log('stop right drag');
    return;
  }
  //if we are dragging the plot, and we got a mousemove, 
  //adjust the plot location as appropriate
  if (evt.type == 'mousemove' && rp.dragging_plot) {
    var drag_pixels_x = mouse_p_x - rp.dragging_start[0];
    var drag_pixels_y = mouse_p_y - rp.dragging_start[1];
    var drag_angle_x = 2*(drag_pixels_x / rp.canvas.width);
    var drag_angle_y = 2*(drag_pixels_y / rp.canvas.width);
    rp.dragging_view_trans = R3_trans_mat.rotate_xy(drag_angle_y, -drag_angle_x);
    //console.log('New dragging trans:', rp.dragging_view_trans);
  }
  
  //If we got a mouse move, we need to zoom
  if (evt.type == 'mousewheel' || evt.type == 'DOMMouseScroll') {
    var scale = ('wheelDelta' in evt ? (evt.wheelDelta > 0 ? 1/0.95 : 0.95)
                                     : (evt.detail > 0 ? 1/0.95 : 0.95));
    var modifier = R3_trans_mat.scale(1/scale);
    //console.log('scaling by', 1/scale);
    rp.view_trans = modifier.compose(rp.view_trans);
    evt.preventDefault();
  }
  
  if (rp.dragging_plot || evt.type == 'mousewheel' || evt.type == 'DOMMouseScroll') {
    this.redraw_right_plot();
  }
}


ShineGui.prototype.smooth_right_plot = function() {
  this.surface.smooth();
  this.create_right_plot(true, true);
  this.redraw_right_plot();
}

ShineGui.prototype.subdivide_right_plot = function() {
  this.surface.subdivide();
  this.create_right_plot(false, true);
  this.redraw_right_plot();
}




















ShineGui.prototype.add_curve = function(path) {
  var curve_id = this.surface.add_curve(path);
  var curve_data = {'node': this.curve_list.curve_info_template.cloneNode(true)};
  curve_data.id = curve_id;
  curve_data.name = String(curve_data.id);
  var o_name = curve_data.name;
  
  //Now fix all the cloned object's IDs
  curve_data.node.id = o_name;
  var all_elements = curve_data.node.getElementsByTagName('*');
  for (var i=0; i<all_elements.length; i++) {
    var e = all_elements[i];
    if (e.id != '') {
      e.id = o_name + e.id;
    }
  }
  
  //Add it to the list and display it
  curve_data.node.style.display = 'block';
  this.curve_list.curve_list_html.appendChild(curve_data.node);
  curve_data.selected = document.getElementById(o_name + 'template-selected');
  curve_data.visible = document.getElementById(o_name + 'template-visible');
  curve_data.color = document.getElementById(o_name + 'template-color');
  curve_data.smoothed = false;
  //console.log('Made curve data:', curve_data);
  this.curve_list.curve_list.push(curve_data);
  var namenode = document.createTextNode('Name: ' + o_name);
  document.getElementById(o_name + 'template-name').appendChild(namenode);
  document.getElementById(o_name + 'template-delete').onclick = this.delete_curve.bind(this);
  document.getElementById(o_name + 'template-update').onclick = this.update_curve.bind(this);
  document.getElementById(o_name + 'template-smooth').onclick = this.smooth_curve.bind(this);
}


ShineGui.prototype.delete_curve = function(evt) {
  //Figure out which curve initiated it
  for (var i=0; i<this.curve_list.curve_list.length; i++) {
    if (this.curve_list.curve_list[i].node.contains(evt.target)) {
      this.surface.delete_curve(this.curve_list.curve_list[i].id);
      this.curve_list.curve_list_html.removeChild(this.curve_list.curve_list[i].node);
      this.curve_list.curve_list.splice(i,1);
      break;
    }
  }
  this.redraw_left_plot();
  this.create_right_plot_curves();
  this.redraw_right_plot();
}

ShineGui.prototype.update_curve = function(evt) {
  //Figure out which curve initiated it
  for (var i=0; i<this.curve_list.curve_list.length; i++) {
    if (this.curve_list.curve_list[i].node.contains(evt.target)) {
      break;
    }
  }
  this.redraw_left_plot();
  this.redraw_right_plot();
}


ShineGui.prototype.smooth_curve = function(evt) {
  //Figure out which curve initiated it
  for (var i=0; i<this.curve_list.curve_list.length; i++) {
    if (this.curve_list.curve_list[i].node.contains(evt.target)) {
    	var redo_all = (this.curve_list.curve_list[i].smoothed == false ? true : false);
    	this.surface.smooth_curve(this.curve_list.curve_list[i].id, redo_all);
      	break;
    }
  }
  this.redraw_left_plot();
  this.create_right_plot_curves();
  this.redraw_right_plot();
}






ShineGui.prototype.add_homeo = function() {
  var homeo_id = this.homeo_list.homeo_list.length;
  var homeo_id = 'homeo' + homeo_id;
  console.log(this.homeo_list);
  var homeo_data = {'node': this.homeo_list.homeo_template.cloneNode(true)};
  homeo_data.id = homeo_id;
  homeo_data.name = String(homeo_data.id);
  var o_name = homeo_data.name;
  
  //Now fix all the cloned object's IDs
  homeo_data.node.id = o_name;
  var all_elements = homeo_data.node.getElementsByTagName('*');
  for (var i=0; i<all_elements.length; i++) {
    var e = all_elements[i];
    if (e.id != '') {
      e.id = o_name + e.id;
    }
  }
  
  //Add it to the list and display it
  homeo_data.node.style.display = 'block';
  this.homeo_list.homeo_list_html.appendChild(homeo_data.node);
  homeo_data.selected = document.getElementById(o_name + 'template-selected');
  homeo_data.visible = document.getElementById(o_name + 'template-visible');
  homeo_data.color = document.getElementById(o_name + 'template-color');
  //console.log('Made curve data:', curve_data);
  this.homeo_list.homeo_list.push(homeo_data);
  var namenode = document.createTextNode('Name: ' + o_name);
  document.getElementById(o_name + 'template-name').appendChild(namenode);
  document.getElementById(o_name + 'template-delete').onclick = this.delete_homeo.bind(this);
  document.getElementById(o_name + 'template-apply').onclick = this.apply_homeo.bind(this);
  document.getElementById(o_name + 'template-apply-sel').onclick = this.apply_homeo_sel.bind(this);
}

ShineGui.prototype.delete_homeo = function(evt) {
 	//Figure out which homeo initiated it
  	for (var i=0; i<this.homeo_list.homeo_list.length; i++) {
    	if (this.homeo_list.homeo_list[i].node.contains(evt.target)) {
      		this.homeo_list.homeo_list_html.removeChild(this.homeo_list.homeo_list[i].node);
      		this.homeo_list.homeo_list.splice(i,1);
      		break;
    	}
  	}
}



ShineGui.prototype.apply_homeo = function(evt) {
	//Figure out which homeo initiated it
  	for (var i=0; i<this.homeo_list.homeo_list.length; i++) {
    	if (this.homeo_list.homeo_list[i].node.contains(evt.target)) {
    		this.actually_apply_homeo(i, true);
      		break;
    	}
  	}
}

ShineGui.prototype.apply_homeo_sel = function(evt) {
	//Figure out which homeo initiated it
  	for (var i=0; i<this.homeo_list.homeo_list.length; i++) {
    	if (this.homeo_list.homeo_list[i].node.contains(evt.target)) {
    		this.actually_apply_homeo(i, false);
      		break;
    	}
  	}
}


ShineGui.prototype.actually_apply_homeo = function(ind, everything) {
	var name = this.homeo_list.homeo_list[ind].name;
	var raw = document.getElementById(name + 'template-recipe').value;
	//console.log('Got recipe:' + raw);
	var lines = raw.split('\n');
	var recipe = [];
	for (var i=0; i<lines.length; i++) {
		var L = lines[i].split(' ');
		for (var j=0; j<L.length; j++) {
	  		L[j] = L[j].trim();
		}
		recipe.push(L);
	}

	var apply_to = undefined;
	if (!everything) {
		apply_to = [];
		for (var i=0; i<this.curve_list.curve_list.length; i++) {
			if (this.curve_list.curve_list[i] === undefined) continue;
			var c_name = this.curve_list.curve_list[i].name;
			var c_surface_id = this.curve_list.curve_list[i].id;
			if (document.getElementById(c_name + 'template-selected').checked) {
				apply_to.push(c_surface_id);
				this.curve_list.curve_list[i].smoothed = false;
			}
		}
	}

	for (var i=0; i<recipe.length; i++) {
		if (recipe[i][0] == 'twist') {
			var ind_to_twist = Number(recipe[i][1]);
			if (recipe[i][2] != 'pos' && recipe[i][2] != 'neg') {
				alert("Couldn't parse recipe");
				break;
			}
			var dir = recipe[i][2];
			this.surface.twist(ind_to_twist, dir, apply_to);
		} else {
			alert("Couldn't parse recipe");
			break;
		}
	}
	this.redraw_left_plot();
	this.create_right_plot_curves();
	this.redraw_right_plot();	
}



