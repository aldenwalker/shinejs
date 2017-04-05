
function pos_mod(x,n) {
  return ((x%n)+n)%n;
}

//We don't create an R3Point object because maybe this is faster?

function R3_sub(p0, p1) {
  return [p0[0] - p1[0], p0[1] - p1[1], p0[2] - p1[2] ];
}

function R3_mean(a, b) {
  return [ 0.5*(a[0] + b[0]), 0.5*(a[1] + b[1]), 0.5*(a[2] + b[2]) ];
}

function R3_triangle_face_upright(vert_locs, tri) {
  var cross_prod_z =  (vert_locs[tri[1]][0]-vert_locs[tri[0]][0])*(vert_locs[tri[2]][1]-vert_locs[tri[1]][1])
                     -(vert_locs[tri[1]][1]-vert_locs[tri[0]][1])*(vert_locs[tri[2]][0]-vert_locs[tri[1]][0]);
  return (cross_prod_z > 0);
}

function R3_normalize_inplace(v) {
  var n = Math.sqrt( v[0]*v[0] + v[1]*v[1] + v[2]*v[2] );
  v[0] /= n;
  v[1] /= n;
  v[2] /= n;
}

function R3_triangle_normal(vert_locs, tri) {
  var v0 = vert_locs[tri[0]];
  var v1 = vert_locs[tri[1]];
  var v2 = vert_locs[tri[2]];
  var d0 = R3_sub(v1, v0);
  var d1 = R3_sub(v2, v1);
  var cross_prod = [ d0[1]*d1[2] - d0[2]*d1[1], -(d0[0]*d1[2] - d0[2]*d1[0]), d0[0]*d1[1] - d0[1]*d1[0] ];
  R3_normalize_inplace(cross_prod);
  return cross_prod;
}

function R3_acc_inplace(a, b) {
  a[0] += b[0];
  a[1] += b[1];
  a[2] += b[2];
}

function R3_combine_inplace(a, a_factor, b, b_factor) {
  a[0] = a_factor * a[0] + b_factor * b[0];
  a[1] = a_factor * a[1] + b_factor * b[1];
  a[2] = a_factor * a[2] + b_factor * b[2];
}





function R3_trans_mat(m) {
  this.M = m.slice(0);
}

R3_trans_mat.identity = function() {
  return new R3_trans_mat( [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1] );
}

R3_trans_mat.scale = function(s) {
  return new R3_trans_mat( [s,0,0,0, 0,s,0,0, 0,0,s,0, 0,0,0,1] );
}

R3_trans_mat.rotate_xy = function(x_angle, y_angle) {
  var ca = Math.cos(x_angle);
  var sa = Math.sin(x_angle);
  var xm = new R3_trans_mat( [1,  0,   0, 0,
                               0, ca, -sa, 0,
                               0, sa,  ca, 0,
                               0,  0,   0, 1] );
  ca = Math.cos(y_angle);
  sa = Math.sin(y_angle);
  var ym = new R3_trans_mat( [ca,  0, -sa, 0,
                               0,   1,   0, 0,
                               sa,  0,  ca, 0,
                               0,   0,   0, 1] );
  return xm.compose(ym);
}

R3_trans_mat.translate = function(x,y,z) {
  return new R3_trans_mat( [1,0,0,x, 0,1,0,y, 0,0,1,z, 0,0,0,1] );
}

R3_trans_mat.perspective = function(near, far) {
  //var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
  var rangeInv = 1.0 / (near - far);
  return new R3_trans_mat ( [ 3, 0, 0, 0,
                              0, 3, 0, 0,
                              0, 0, 1, -0.5,
                              0, 0, 1, 1] );
}

R3_trans_mat.perspective_and_scale = function(bbox) {
  //Decide on reasonable perspective and scale
  //transformations for the given bbox
  var xrange = bbox[1][0] - bbox[0][0];
  var xcenter = 0.5*(bbox[1][0] + bbox[0][0]);
  var yrange = bbox[1][1] - bbox[0][1];
  var ycenter = 0.5*(bbox[1][1] + bbox[0][1]);
  var zrange = bbox[1][2] - bbox[0][2];
  var zcenter = 0.5*(bbox[1][2] + bbox[0][2]);


  //console.log('ranges:', xrange, yrange, zrange);

  //First we translate the centers to 0,0,0
  var pre_trans = R3_trans_mat.translate(-xcenter, -ycenter, -zcenter);

  //Now we assume the range is the box centered at 0,0,0

  //The middle of the frustum must support xy_max
  var f_middle_dim = Math.max(xrange, yrange);

  //The front must support the minimum of zy_max and xz_max
  var f_front_dim = Math.min(Math.max(xrange, zrange), Math.max(yrange, zrange));

  if (f_front_dim > f_middle_dim) {
    console.log("I'm confused about front vs middle dim");
  }

  //The depth is the largest of x,y,z ranges
  var f_depth = Math.max(xrange, yrange, zrange);

  //Map the frustum to [-1,1]x[-1,1]x[-1,0]

  var XYS = 2/f_middle_dim;
  var ZS = 1/(f_depth);
  var wscaling = f_front_dim / f_middle_dim;

  //console.log(f_middle_dim, f_front_dim, f_depth);
  //console.log(XYS, ZS, wscaling);

  //We want to get w so that it's 1 at z=0 and f_front_dim/f_middle_dim at z=f_depth/2
  //Also shift so the frustum is centered at 0,0,-0.5
  var Wfactor = ((f_front_dim/f_middle_dim)-1) / (f_depth/2);
  var P = new R3_trans_mat( [ XYS,   0,  0,    0,
                                0, XYS,  0,    0,
                                0,   0, ZS*(1-Wfactor), 0,
                                0,   0, -Wfactor, 1 ] );
  //console.log( ((f_front_dim/f_middle_dim)-1) / (f_depth/2) );
  var post_trans = R3_trans_mat.translate(0,0,-0.5);
  var ans = post_trans.compose(P.compose(pre_trans));
  var S = R3_trans_mat.identity();
  return [P,S];
}


R3_trans_mat.prototype.compose = function(other) {
  var t = this.M;
  var o = other.M;
  var ans = [];
  for (var i=0; i<4; i++) {
    for (var j=0; j<4; j++) {
      ans[4*i+j] = t[4*i]*o[j] + t[4*i+1]*o[4+j] + t[4*i+2]*o[8+j] + t[4*i+3]*o[12+j];
    }
  }
  return new R3_trans_mat( ans );
}

R3_trans_mat.prototype.transpose = function() {
  var t = this.M;
  return new R3_trans_mat( [ t[0], t[4], t[8], t[12],
                              t[1], t[5], t[9], t[13],
                              t[2], t[6], t[10],t[14],
                              t[3], t[7], t[11],t[15] ] );
}















function R3Surface(graph) {
  if (graph.vertices.length == 0) {
    alert('You appear to have created an empty surface');
  }
  this.core_graph = graph;
  
  //Find the closest that a vertex ever comes to an edge not incident to it
  var closest = 1;
  for (var i=0; i<this.core_graph.vertices.length; i++) {
    var v = this.core_graph.vertices[i];
    for (var j=0; j<this.core_graph.edges.length; j++) {
      var e = this.core_graph.edges[j];
      if (e[0] == i || e[1] == i) continue;
      var d = R2_distance_to_segment(v.coords, this.core_graph.vertices[e[0]].coords, this.core_graph.vertices[e[1]].coords);
      if (d < closest) {
        closest = d;
      }
    }
  }
  //We make the tube radius 1/3 of the closest distance
  var tube_radius = (1/3)*closest;
  
  console.log("Decided on tube radius:", tube_radius);
  
  this.triangulations = [new R3Triangulation(this.core_graph, tube_radius, true)];
  
  this.curves = [];
  
}

R3Surface.prototype.smooth = function() {
  this.triangulations[this.triangulations.length-1].smooth();
}

R3Surface.prototype.subdivide = function() {
  this.triangulations.push(this.triangulations[this.triangulations.length-1].subdivide());
  for (var i=0; i<this.curves.length; i++) {
    if (this.curves[i] === undefined) continue;
    var prev_curve = this.curves[i][this.curves[i].length-1];
    this.curves[i].push( this.triangulations[this.triangulations.length-1].subdivide_curve(prev_curve) );
  }
}


R3Surface.prototype.find_closest_shadow_boundary = function(p, dist_tol) {
  if (this.triangulations[0].shadow === undefined) {
    console.log('Shadow undefined?');
  }
  
  var s = this.triangulations[0].shadow;
  var closest_dist = undefined;
  var closest_i = undefined;
  //console.log('Finding edge closest to', p, 'tol:', tol);
  for (var i=0; i<s.boundary_edges.length; i++) {
    var vi0 = s.edges[s.boundary_edges[i]][0];
    var vi1 = s.edges[s.boundary_edges[i]][1];
    var dist = R2_distance_to_segment_xyxy_tol(p, s.vertex_locations[vi0][0], s.vertex_locations[vi0][1],
                                                  s.vertex_locations[vi1][0], s.vertex_locations[vi1][1], dist_tol);
    if (dist != undefined) {
      if (closest_dist === undefined || dist < closest_dist) {
        closest_dist = dist;
        closest_i = i;
      }
    }
  }
  return s.boundary_edges[closest_i]; 
}



R3Surface.prototype.add_curve = function(curve_data) {
  var ans = [this.triangulations[0].process_curve_input(curve_data)];
  for (var i=1; i<this.triangulations.length; i++) {
    ans.push( this.triangulations[i].subdivide_curve( ans[ans.length-1] ) );
  }
  this.curves.push(ans);
  return this.curves.length-1;
}

R3Surface.prototype.delete_curve = function(curve_id) {
  this.curves[curve_id] = undefined;
}








function R3Triangulation(graph, radius, create_shadow) {
  
  //Create all the vertices for each core vertex -------------------------------
  this.vertex_locations = [];
  var core_graph_mapping = { 'vertex_mapping':{} };
  for (var i=0; i<graph.vertices.length; i++) {
    //For each incident edge, we need to place a vertex whose angle is halfway between the edge and the next
    //(there is a special case for one edge)
    //The core graph mapping is redundant and remembers the vertices before and after each edge
    var v = graph.vertices[i];
    core_graph_mapping.vertex_mapping[i] = {};
    var num_e = Object.keys(v.incident_edges).length;
    if (num_e == 1) {
      core_graph_mapping.vertex_mapping[i].type = 'boundary';
      core_graph_mapping.vertex_mapping[i].edges_to_new_vertices = {};
      var ak = Object.keys(v.incident_edges)[0];
      var a = Number(ak);
      var R2_location_1 = v.coords.angle_dist(a + Math.PI/2, radius);
      var R2_location_2 = v.coords.angle_dist(a + 3*Math.PI/2, radius);
      this.vertex_locations.push( [R2_location_1.x, R2_location_1.y, 0] );
      this.vertex_locations.push( [R2_location_2.x, R2_location_2.y, 0] );
      core_graph_mapping.vertex_mapping[i].edges_to_new_vertices[ak] = [this.vertex_locations.length-1, this.vertex_locations.length-2];
    } else {
      core_graph_mapping.vertex_mapping[i].type = 'normal';
      core_graph_mapping.vertex_mapping[i].edges_to_new_vertices = {};
      var angles = Object.keys(v.incident_edges);
      angles.sort( function(a,b) { return Number(a) - Number(b); } );
      for (var j=0; j<angles.length; j++) {
        core_graph_mapping.vertex_mapping[i].edges_to_new_vertices[angles[j]] = [];
      }
      for (var j=0; j<angles.length; j++) {
        //Make all angles positive
        var ea0 = angles[j];
        var ea1 = angles[(j+1)%num_e];
        var a0 = pos_mod(Number(ea0), 2*Math.PI);
        var a1 = pos_mod(Number(ea1), 2*Math.PI);
        var angle_diff = a1-a0;
        var av_angle = a0 + 0.5*angle_diff;
        //we need to go out along this angle until the radius is correct
        //law of sin: sin(angle_diff/2)/radius = sin(pi/2)/dist
        var dist = radius / Math.sin(angle_diff/2);
        var R2_location = v.coords.angle_dist(av_angle, dist);
        //Add the vertex
        this.vertex_locations.push( [R2_location.x, R2_location.y, 0] );
        core_graph_mapping.vertex_mapping[i].edges_to_new_vertices[ea0][1] = this.vertex_locations.length-1;
        core_graph_mapping.vertex_mapping[i].edges_to_new_vertices[ea1][0] = this.vertex_locations.length-1;
      }
    }
    //Add vertices on the top and bottom
    this.vertex_locations.push( [ v.coords.x, v.coords.y, radius ] );
    core_graph_mapping.vertex_mapping[i].top_ind = this.vertex_locations.length-1;
    this.vertex_locations.push( [ v.coords.x, v.coords.y, -radius ] );
    core_graph_mapping.vertex_mapping[i].bottom_ind = this.vertex_locations.length-1;
  }
  
  // Create the triangle strips encircling each edge -------------------------------------
  // Facing away from the initial vertex, we start at the right and circle counterclockwise
  this.triangle_vertices = [];
  
  for (var i=0; i<graph.edges.length; i++) {
    var e = graph.edges[i];
    var a0 = e[2];
    var a1 = e[3];
    var v0i = e[0];
    var v1i = e[1];
    var cgmvm0 = core_graph_mapping.vertex_mapping[v0i];
    var cgmvm1 = core_graph_mapping.vertex_mapping[v1i];
    
    var new_triangle_vertices = [ //upper right
                                  [cgmvm0.edges_to_new_vertices[a0][0],
                                   cgmvm1.edges_to_new_vertices[a1][1],
                                   cgmvm0.top_ind],
                                  [cgmvm0.top_ind, 
                                   cgmvm1.edges_to_new_vertices[a1][1],
                                   cgmvm1.top_ind],
                                  //upper left
                                  [cgmvm0.top_ind,                       
                                   cgmvm1.top_ind,
                                   cgmvm0.edges_to_new_vertices[a0][1]],
                                  [cgmvm0.edges_to_new_vertices[a0][1],
                                   cgmvm1.top_ind,
                                   cgmvm1.edges_to_new_vertices[a1][0]],
                                  //lower left
                                  [cgmvm0.edges_to_new_vertices[a0][1],
                                   cgmvm1.edges_to_new_vertices[a1][0],
                                   cgmvm0.bottom_ind],
                                  [cgmvm0.bottom_ind,
                                   cgmvm1.edges_to_new_vertices[a1][0],
                                   cgmvm1.bottom_ind],
                                  //lower right
                                  [cgmvm0.bottom_ind,
                                   cgmvm1.bottom_ind,
                                   cgmvm0.edges_to_new_vertices[a0][0]],
                                  [cgmvm0.edges_to_new_vertices[a0][0],
                                   cgmvm1.bottom_ind,
                                   cgmvm1.edges_to_new_vertices[a1][1]] ];
    for (var j=0; j<new_triangle_vertices.length; j++) {
      this.triangle_vertices.push( new_triangle_vertices[j] );
    }
  }

  //compute the edge data
  this.recompute_edges();

  //Compute the triangle and vertex normals
  this.recompute_normals();

  //Compute the 3d box containing the surface
  this.recompute_bbox();

  //Create the shadow of the surface
  if (create_shadow) {
    this.shadow = this.copy();
    var s = this.shadow;
    for (var i=0; i<s.vertex_locations.length; i++) {
      s.vertex_locations[i][2] = 0;
    }
    
    s.recompute_normals();
    
    s.boundary_edges = [];
    for (var i=0; i<s.edges.length; i++) {
      if (s.edges[i][2] === undefined || s.edges[i][4] === undefined) continue;
      var tnz0 = s.triangle_normals[ s.edges[i][2] ][2];
      var tnz1 = s.triangle_normals[ s.edges[i][4] ][2];
      if ( tnz0*tnz1 > 0 ) continue;
      
      s.boundary_edges.push(i);
    }
  }
  
}


R3Triangulation.create_blank = function() {
  return new R3Triangulation({'edges':[], 'vertices':[]}, 0, false);
}

R3Triangulation.prototype.copy = function() {
  var T = R3Triangulation.create_blank();
  for (var i=0; i<this.vertex_locations.length; i++) {
    T.vertex_locations[i] = this.vertex_locations[i].slice();
  }
  for (var i=0; i<this.vertex_normals.length; i++) {
    T.vertex_normals[i] = this.vertex_normals[i].slice();
  }
  for (var i=0; i<this.triangle_vertices.length; i++) {
    T.triangle_vertices[i] = this.triangle_vertices[i].slice();
  }
  for (var i=0; i<this.triangle_edges.length; i++) {
    T.triangle_edges[i] = this.triangle_edges[i].slice();
  }
  T.edge_lookup = {};
  for (var i=0; i<this.edges.length; i++) {
    T.edges[i] = this.edges[i].slice();
    var vi0 = this.edges[i][0];
    var vi1 = this.edges[i][1];
    T.edge_lookup[ [vi0, vi1] ] = i+1;
    T.edge_lookup[ [vi1, vi0] ] = -(i+1);
  }
  T.bbox = [ this.bbox[0].slice(), this.bbox[1].slice() ];

  //Doesn't copy the shadow?
  return T;
}


R3Triangulation.prototype.recompute_bbox = function() {
  if (this.vertex_locations.length == 0) {
    this.bbox = [ [], [] ];
    return;
  }
  this.bbox = [ this.vertex_locations[0].slice(), this.vertex_locations[0].slice() ];
  var bb = this.bbox;
  for (var i=1; i<this.vertex_locations.length; i++) {
    var vl = this.vertex_locations[i];
    if (vl[0] < bb[0][0]) bb[0][0] = vl[0];
    if (vl[1] < bb[0][1]) bb[0][1] = vl[1];
    if (vl[2] < bb[0][2]) bb[0][2] = vl[2];
    if (vl[0] > bb[1][0]) bb[1][0] = vl[0];
    if (vl[1] > bb[1][1]) bb[1][1] = vl[1];
    if (vl[2] > bb[1][2]) bb[1][2] = vl[2];
  }
}



R3Triangulation.prototype.recompute_normals = function() {
  //Create the array of vertex normals, which are the average of the
  //normals of the faces of the incident triangles
  this.triangle_normals = [];
  this.vertex_normals = [];
  for (var i=0; i<this.triangle_vertices.length; i++) {
    this.triangle_normals[i] = R3_triangle_normal( this.vertex_locations, this.triangle_vertices[i] );
    for (var j=0; j<3; j++) {
      var vi = this.triangle_vertices[i][j];
      if (this.vertex_normals[vi] == undefined) {
        this.vertex_normals[vi] = this.triangle_normals[i].slice(0);
      } else {
        R3_acc_inplace( this.vertex_normals[vi], this.triangle_normals[i] );
      }
    }
  }
  for (var i=0; i<this.vertex_normals.length; i++) {
    R3_normalize_inplace(this.vertex_normals[i]);
    //console.log('Vertex normal', this.vertex_normals[i], 'at', this.vertex_locations[i]);
  }
}


R3Triangulation.prototype.recompute_edges = function() {
  this.edges = [];
  this.edge_lookup = {}; //a list which maps pairs of vertices to indices
  this.triangle_edges = [];
  for (var i=0; i<this.triangle_vertices.length; i++) {
    this.triangle_edges[i] = [];
    for (var j=0; j<3; j++) {
      var vi0 = this.triangle_vertices[i][j];
      var vi1 = this.triangle_vertices[i][(j+1)%3];
      var ei = this.edge_lookup[ [vi0,vi1] ];
      if (ei === undefined) {
        this.edge_lookup[ [vi0, vi1] ] = this.edges.length+1;
        this.edge_lookup[ [vi1, vi0] ] = -(this.edges.length+1);
        ei = this.edges.length+1;
        this.edges.push( [vi0, vi1, i, j] );
      } else {
        if (ei > 0) {
          console.log("I don't think this can happen");
          console.log('i,j:', i,j);
          console.log('my vertices:', this.triangle_vertices[i]);
          console.log('edges:', this.edges);
          console.log('edge lookup:', this.edge_lookup);
        } else {
          this.edges[ -ei-1 ][4] = i;
          this.edges[ -ei-1 ][5] = j;
        }
      }
      this.triangle_edges[i][j] = ei; 
    }
  }
}



R3Triangulation.prototype.smooth = function() {
  var vertex_sums = [];
  var vertex_sum_counts = [];
  for (var i=0; i<this.edges.length; i++) {
    var vi0 = this.edges[i][0];
    var vi1 = this.edges[i][1];
    if (vertex_sums[vi0] === undefined) {
      vertex_sums[vi0] = this.vertex_locations[vi1].slice(0);
      vertex_sum_counts[vi0] = 1;
    } else {
      R3_acc_inplace(vertex_sums[vi0], this.vertex_locations[vi1]);
      vertex_sum_counts[vi0]++;
    }
    if (vertex_sums[vi1] === undefined) {
      vertex_sums[vi1] = this.vertex_locations[vi0].slice(0);
      vertex_sum_counts[vi1] = 1;
    } else {
      R3_acc_inplace(vertex_sums[vi1], this.vertex_locations[vi0]);
      vertex_sum_counts[vi1]++;
    }
  }
  for (var i=0; i<this.vertex_locations.length; i++) {
    R3_combine_inplace(this.vertex_locations[i], 0.9, vertex_sums[i], 0.1/vertex_sum_counts[i]);
  }
}





R3Triangulation.prototype.subdivide = function() {
  var T = this.copy();
  //Add in a vertex for every edge
  var old_num_vertices = T.vertex_locations.length;
  for (var i=0; i<T.edges.length; i++) {
    T.vertex_locations[old_num_vertices + i] = R3_mean(T.vertex_locations[T.edges[i][0]],
                                                       T.vertex_locations[T.edges[i][1]]);
  }
  var new_triangle_vertices = [];
  //Replace each triangle with 4 new ones
  for (var i=0; i<T.triangle_vertices.length; i++) {
    var tvi = T.triangle_vertices[i];
    var tei = T.triangle_edges[i];
    var nv = [ old_num_vertices + Math.abs(tei[0])-1,
               old_num_vertices + Math.abs(tei[1])-1,
               old_num_vertices + Math.abs(tei[2])-1 ];
    new_triangle_vertices.push( [ tvi[0], nv[0], nv[2] ],
                                [ tvi[1], nv[1], nv[0] ],
                                [ tvi[2], nv[2], nv[1] ],
                                [ nv[0],  nv[1], nv[2] ] );
  }
  T.triangle_vertices = new_triangle_vertices;

  //compute the edge data
  T.recompute_edges();

  //Compute the triangle and vertex normals
  T.recompute_normals();

  return T;
}









R3Triangulation.prototype.process_curve_input = function(C) {
  //console.log('processing', C)
  if (this.shadow === undefined) {
    console.log("Can't process curve input without shadow");
    return undefined;
  }
  var s = this.shadow;
  var ans = [];
  var i=0;
  var A = C[0][1];
  var B = C[0][2];
  var side = C[0][0];
  var current_triangle = undefined;
  if (A[0] != 'point') {
    console.log("Can't start on an edge");
    return;
  } else {
    current_triangle = this.find_shadow_triangle(side, A[1]);
  }
  var current_point = A[1];
  var end_point = undefined;
  var end_triangle = undefined;
  if (B[0] == 'point') {
    end_point = B[1];
    end_triangle = this.find_shadow_triangle(side, B[1]);
  } else {
    var e = s.edges[B[1]];
    end_point = R2_interpolate_segment_xyxy(B[2], s.vertex_locations[e[0]][0], s.vertex_locations[e[0]][1],
                                                  s.vertex_locations[e[1]][0], s.vertex_locations[e[1]][1]);
    end_triangle = this.find_adjacent_shadow_triangle(e, side);
  }
  
  while (true) {
    //Find the next intersection
    var tv = s.triangle_vertices[current_triangle];
    var R2_tv = [ new R2Point( s.vertex_locations[tv[0]][0], s.vertex_locations[tv[0]][1] ),
                  new R2Point( s.vertex_locations[tv[1]][0], s.vertex_locations[tv[1]][1] ),
                  new R2Point( s.vertex_locations[tv[2]][0], s.vertex_locations[tv[2]][1] ) ]
    var tei = R2_triangle_intersection(current_point, R2_tv, end_point);
    var ste = s.triangle_edges[current_triangle][tei[0]];
    var e_sign = (ste > 0 ? 1 : -1);
    var e_ind = e_sign*ste-1;
    var next_triangle = s.edges[e_ind][ (e_sign>0 ? 4 : 2) ]; //Note if sign is >0 then we need to look on the OTHER side
    ans.push( [ste, (e_sign>0 ? tei[1] : 1-tei[1])] );
    
    if (next_triangle != end_triangle) {
      current_triangle = next_triangle;
      current_point = this.shadow_signed_edge_interpolate( ans[ans.length-1] );
    
    } else {  //if (next_triangle == end_triangle) {
      //NEXT STEP
      if (i == C.length-1) break;
      
      if (B[0] == 'edge') {
        //Push on this edge with the correct sign
        var e = s.edges[B[1]];
        if (e[2] == end_triangle) {
          ans.push( [B[1]+1, B[2]] );
        } else {
          ans.push( [-(B[1]+1), B[2]] );
        }
        //Find the next triangle
        side = (side == 'top' ? 'bottom' : 'top');
        next_triangle = this.find_adjacent_shadow_triangle(e, side);
      }
      current_triangle = next_triangle;
      current_point = this.shadow_signed_edge_interpolate( ans[ans.length-1] );
      A = B;
      i += 1;
      B = C[i][2];
      if (B[0] == 'point') {
        end_point = B[1];
        end_triangle = this.find_shadow_triangle(side, B[1]);
      } else {
        var e = s.edges[B[1]];
        end_point = R2_interpolate_segment_xyxy(B[2], s.vertex_locations[e[0]][0], s.vertex_locations[e[0]][1],
                                                      s.vertex_locations[e[1]][0], s.vertex_locations[e[1]][1]);
        end_triangle = this.find_adjacent_shadow_triangle(e, side);
      }
    }
    console.log('Current curve:', ans);
    console.log('current_triangle', current_triangle);
    console.log('current_point', current_point);
    console.log('end_triangle', end_triangle);
    console.log('end_point', end_point);

  }
  console.log('Returning curve:', ans);
  return ans;
}


R3Triangulation.prototype.shadow_signed_edge_interpolate = function(se) {
  var s = this.shadow;
  var e = s.edges[Math.abs(se[0])-1];
  return R2_interpolate_segment_xyxy(se[1], s.vertex_locations[e[0]][0], s.vertex_locations[e[0]][1],
                                            s.vertex_locations[e[1]][0], s.vertex_locations[e[1]][1]);
}


R3Triangulation.prototype.find_shadow_triangle = function(side, p) {
  var s = this.shadow;
  for (var i=0; i<s.triangle_vertices.length; i++) {
    var t_side = (s.triangle_normals[i][2] > 0 ? 'top' : 'bottom');
    var tv = s.triangle_vertices[i];
    if (side != t_side) continue;
    var R2_tv =  [new R2Point( s.vertex_locations[tv[0]][0], s.vertex_locations[tv[0]][1] ),
                  new R2Point( s.vertex_locations[tv[1]][0], s.vertex_locations[tv[1]][1] ),
                  new R2Point( s.vertex_locations[tv[2]][0], s.vertex_locations[tv[2]][1] ) ];
    if (R2_triangle_contains(R2_tv, p)) return i;
  }
  console.log("I should have been able to find a triangle");
  return -1;
}



R3Triangulation.prototype.find_adjacent_shadow_triangle = function(edge, side) {
  var ti0 = edge[2];
  var ti1 = edge[4];
  var s = this.shadow;
  var ti0_side = ( (ti0 != undefined) ? (s.triangle_normals[ti0][2]>0 ? 'top' : 'bottom') : undefined);
  if (ti0_side != undefined && side == ti0_side ) {
    return ti0;
  }
  var ti1_side = ( (ti1 != undefined) ? (s.triangle_normals[ti1][2]>0 ? 'top' : 'bottom') : undefined);
  if (ti1_side != undefined && side == ti1_side) {
    return ti1;
  }
  console.log("I shouldn't be here");
  return undefined;
}







R3Triangulation.prototype.subdivide_curve = function(C) {
  return [];
}










