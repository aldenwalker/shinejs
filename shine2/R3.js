
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


  console.log('ranges:', xrange, yrange, zrange);

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

  console.log(f_middle_dim, f_front_dim, f_depth);
  console.log(XYS, ZS, wscaling);

  //We want to get w so that it's 1 at z=0 and f_front_dim/f_middle_dim at z=f_depth/2
  //Also shift so the frustum is centered at 0,0,-0.5
  var Wfactor = ((f_front_dim/f_middle_dim)-1) / (f_depth/2);
  var P = new R3_trans_mat( [ XYS,   0,  0,    0,
                                0, XYS,  0,    0,
                                0,   0, ZS*(1-Wfactor), 0,
                                0,   0, -Wfactor, 1 ] );
  console.log( ((f_front_dim/f_middle_dim)-1) / (f_depth/2) );
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
  
}

R3Surface.prototype.smooth = function() {
  this.triangulations[this.triangulations.length-1].smooth();
}

R3Surface.prototype.subdivide = function() {
  this.triangulations.push(this.triangulations[this.triangulations.length-1].subdivide());
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
    this.shadow = {};
    this.shadow.vertex_locations = [];
    for (var i=0; i<this.vertex_locations.length; i++) {
      var vl = this.vertex_locations[i];
      this.shadow.vertex_locations.push( [vl[0], vl[1], 0] );
    }
    this.shadow.triangle_vertices = [];
    this.shadow.triangle_face_upright = [];
    this.shadow.edges_to_triangles = {};
    for (var i=0; i<this.triangle_vertices.length; i++) {
      var tv = this.triangle_vertices[i];
      this.shadow.triangle_vertices.push( [tv[0], tv[1], tv[2]] );
      this.shadow.triangle_face_upright.push( R3_triangle_face_upright( this.shadow.vertex_locations, tv ) );
      this.shadow.edges_to_triangles[ [tv[0], tv[1]] ] = [i,0];
      this.shadow.edges_to_triangles[ [tv[1], tv[2]] ] = [i,1];
      this.shadow.edges_to_triangles[ [tv[2], tv[0]] ] = [i,2];
    }
    //console.log(this.shadow.triangle_face_upright);
    //console.log(this.shadow.edges_to_triangles);
    //Create the boundary edges so that they all are on the top triangles
    this.shadow.boundary_edges = [];
    for (var i=0; i<this.shadow.triangle_vertices.length; i++) {
      var tv = this.shadow.triangle_vertices[i];
      if (!R3_triangle_face_upright(this.shadow.vertex_locations, tv)) continue;
      for (var j=0; j<3; j++) {
        var other_triangle = this.shadow.edges_to_triangles[ [tv[(j+1)%3], tv[j]] ]
        if (other_triangle == undefined) continue;
        other_triangle = other_triangle[0];
        if (!this.shadow.triangle_face_upright[other_triangle]) {
          this.shadow.boundary_edges.push( [tv[j], tv[(j+1)%3]] );
        }
      }
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














