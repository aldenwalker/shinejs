function circular_splice(L, i, num_to_remove, to_add) {
	//Remove the cyclic chunk of length num_to_remove from position i in L,
	//then extend by to_add
	//It tries to make it so that the number of items at the beginning
	//of the list remains the same.  If that's not possible, it puts as many
	//as it can at the beginning
	console.log('Circular splice', L, i, num_to_remove, to_add);
	if (i + num_to_remove <= L.length) {
		var args = [i, num_to_remove].concat(to_add);
		Array.prototype.splice.apply(L, args);
	} else {
		var end_remove = L.length - i;
		var beginning_remove = num_to_remove - end_remove;
		var num_to_place = to_add.length;
		var beginning_place = undefined;
		var end_place = undefined;
		if (num_to_place > beginning_remove) {
			beginning_place = beginning_remove;
			end_place = num_to_place - beginning_place;
		} else {
			beginning_place = num_to_place;
			end_place = 0;
		}
		//First do the end splice so the indices aren't messed up
		var args = [i, end_remove].concat(to_add.slice(0, end_place));
		Array.prototype.splice.apply(L, args);
		//Now the beginning
		args = [0,beginning_remove].concat(to_add.slice(end_place, to_add.length));
		Array.prototype.splice.apply(L, args);
	}
	console.log('After:', L);
}



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

function R3_dist(a, b) {
	var d = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
	return Math.sqrt( d[0]*d[0] + d[1]*d[1] + d[2]*d[2] );
}

function R3_mean_undefsafe(a, b) {
	if (a === undefined) {
		return b.slice(0);
	} else if (b === undefined) {
		return a.slice(0);
	}
  return [ 0.5*(a[0] + b[0]), 0.5*(a[1] + b[1]), 0.5*(a[2] + b[2]) ];
}

function R3_dot(a, b) {
	return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}

function R3_scalar_mul( alpha, v ) {
	return [alpha*v[0], alpha*v[1], alpha*v[2]];
}

function R3_triangle_face_upright(vert_locs, tri) {
  var cross_prod_z =  (vert_locs[tri[1]][0]-vert_locs[tri[0]][0])*(vert_locs[tri[2]][1]-vert_locs[tri[1]][1])
                     -(vert_locs[tri[1]][1]-vert_locs[tri[0]][1])*(vert_locs[tri[2]][0]-vert_locs[tri[1]][0]);
  return (cross_prod_z > 0);
}

function R3_normalize_inplace(v) {
  var n = Math.sqrt( v[0]*v[0] + v[1]*v[1] + v[2]*v[2] );
  if (n == 0) return;
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

function R3_triangle_angles(vert_locs, tri) {
	var diffs = [];
  for (var i=0; i<3; i++) {
  	diffs[i] = R3_sub( vert_locs[tri[(i+1)%3]], vert_locs[tri[i]] );
  	R3_normalize_inplace(diffs[i]);
  }
  var ans = [];
  for (var i=0; i<3; i++) {
  	var a = Math.acos(R3_dot(diffs[i], diffs[(i+2)%3]));
  	ans[i] = Math.PI - a;
  }
  return ans;
}

function R3_distance_to_and_along_segment(a, b, c) {
	// Project a to p along b->c.  Return the distance from a to p and from b to p
	var d = R3_sub(c, b);
	var aa = R3_sub(a, b);
	var t_along = R3_dot(d, aa) / R3_dot(aa, aa);
	var p = R3_interpolate(t_along, b, c);
	return [R3_dist(a, p), R3_dist(b, p)];
}

function R3_find_distance_to_and_scalar_along_segment( a, b, c) {
	// Project a to p along b->c.  Return the distance from a to p and scalar of the vector c-b from b
	var d = R3_sub(c, b);
	var aa = R3_sub(a, b);
	var t_along = R3_dot(aa, d) / R3_dot(d, d);
	var p = R3_interpolate(t_along, b, c);
	return [R3_dist(a, p), t_along];
}


function R3_acc_inplace(a, b) {
  a[0] += b[0];
  a[1] += b[1];
  a[2] += b[2];
}

function R3_acc_multiple_inplace(a, alpha, b) {
  a[0] += alpha*b[0];
  a[1] += alpha*b[1];
  a[2] += alpha*b[2];
}

function R3_combine_inplace(a, a_factor, b, b_factor) {
  a[0] = a_factor * a[0] + b_factor * b[0];
  a[1] = a_factor * a[1] + b_factor * b[1];
  a[2] = a_factor * a[2] + b_factor * b[2];
}

function R3_interpolate(t, v0, v1) {
  return [t*v1[0] + (1-t)*v0[0],
          t*v1[1] + (1-t)*v0[1],
          t*v1[2] + (1-t)*v0[2]];
}

function R3_interpolate_3way(t0, v0, t1, v1, t2, v2) {
  return [ t0*v0[0] + t1*v1[0] + t2*v2[0],
           t0*v0[1] + t1*v1[1] + t2*v2[1],
           t0*v0[2] + t1*v1[2] + t2*v2[2] ];
}


//Return a list of triples (subtri, side, t) for all the edges
//the segment from side0,t0 to side1,t1 passes through
//this *includes* the first intersection, but does not include
//the last (side1,t1) itself
//
//the subtri i has its first vertex (and side) at vertex i of the parent
//it assume the subdivision is into halves
function R3_subdivide_triangle_segment(side0, t0, side1, t1) {
  //console.log('Subdividing triangle segment', side0, t0, side1, t1);
  var start_subtri = (t0 <= 0.5 ? side0 : (side0+1)%3);
  var end_subtri = (t1 <= 0.5 ? side1 : (side1+1)%3);
  var ans = ( t0 <= 0.5 ? [ [ side0, -1, 2*t0 ] ] : [ [ (side0+1)%3, -3, 2*(t0-0.5) ] ]);
  //console.log('start,end,ans so far:', start_subtri, end_subtri, ans);
  if (start_subtri == end_subtri) {
    //No crossings
    return ans;
  }
  //Otherwise, there are some; we first leave the start subtri
  //then we enter the end_subtri
  var model_tri = [ new R2Point(0,0), new R2Point(1,0), new R2Point(0,1) ];
  var model_start = R2_interpolate_segment(t0, model_tri[side0], model_tri[(side0+1)%3]);
  var model_end = R2_interpolate_segment(t1, model_tri[side1], model_tri[(side1+1)%3]);
  var model_middles = [ [new R2Point(0.5,0), new R2Point(0,0.5)],
                        [new R2Point(0.5,0.5), new R2Point(0.5,0)],
                        [new R2Point(0,0.5), new R2Point(0.5,0.5)] ];
  var start_t = R2_segment_intersection(model_start, model_end, model_middles[start_subtri][0], model_middles[start_subtri][1])[1];
  var end_t = R2_segment_intersection(model_start, model_end, model_middles[end_subtri][0], model_middles[end_subtri][1])[1];
  //console.log('start_t, end_t', start_t, end_t);
  ans.push( [ start_subtri, 2, start_t ] );
  ans.push( [ end_subtri, -2, end_t ] );
  return ans;
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

  //Map the frustum to [-1,1]x[-1,1]x[-1,1]

  var XYS = 2/f_middle_dim;
  var ZS = -2/(f_depth);

  //console.log(f_middle_dim, f_front_dim, f_depth);
  //console.log(XYS, ZS, wscaling);

  //When z = f_depth/2, we want to expand by f_middle_dim /f_front_dim
  //Hence we need W to be f_front_dim/f_middle_dim
  //So W = 1 when z=0 and W=f_front_dim/f_middle_dim when z=f_depth/2
  //thus the z coefficient is (ff/fm)/(fd/2) - 1/(fd/2)
  //
  //Also, when z=f_depth/2, we should multiply by -2/f_depth so get 1,
  //but then we'll divide by WZ_coef*(fd/2) + 1
  //hence we need to multiply z by (-2/f_depth)*(WZ_coef*(fd/2) + 1)
  var WZ_coef = ((f_front_dim/f_middle_dim)-1) / (f_depth/2);
  var Z_coef = ZS * (WZ_coef*(f_depth/2) + 1);
  var P = new R3_trans_mat( [ XYS,   0,  0,    0,
                                0, XYS,  0,    0,
                                0,   0, Z_coef, 0,
                                0,   0, WZ_coef, 1 ] );
  //console.log( ((f_front_dim/f_middle_dim)-1) / (f_depth/2) );
  var post_trans = R3_trans_mat.translate(0,0,0.0);
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

R3Surface.prototype.replace_curve = function(curve_id, new_c) {
	//Replace the roughest triangulation curve with new_c, and subdivide down
	var ans = [new_c];
	for (var i=1; i<this.triangulations.length; i++) {
    	ans.push( this.triangulations[i].subdivide_curve( ans[ans.length-1] ) );
  	}
  	this.curves[curve_id] = ans;
}


R3Surface.prototype.smooth_curve = function(curve_id) {
	console.log('Smoothing curve', curve_id);
	var ans = [ this.triangulations[0].smooth_curve( this.curves[curve_id][0] ) ];
	for (var i=1; i<this.triangulations.length; i++) {
		var sub_curve = this.triangulations[i].subdivide_curve( ans[ ans.length-1] );
		ans.push( this.triangulations[i].smooth_curve( sub_curve ) );
	}
	this.curves[curve_id] = ans;
}

R3Surface.prototype.twist = function(ind, dir, apply_to) {
	console.log('Twist', ind, dir, apply_to);
	if (this.curves[ind] === undefined) {
		console.log("Can't twist around undefined curve");
	}
	//We apply the homeo to the curves in the most rough triangulation
	var ind_list = [];
	var target_list = [];
	if (apply_to === undefined) {
		for (var i=0; i<this.curves.length; i++) {
			if (ind == i || this.curves[i] === undefined) continue;
			ind_list.push(i);
			target_list.push(this.curves[i][0]);
		}
	} else {
		for (var j=0; j<apply_to.length; j++) {
			var i=apply_to[j];
			if (ind == i || this.curves[i] === undefined) continue;
			ind_list.push(i);
			target_list.push(this.curves[i][0]);
		}
	}
	var ans_list = this.triangulations[0].twist(this.curves[ind][0], dir, target_list);
	for (var i=0; i<ind_list.length; i++) {
		this.replace_curve(ind_list[i], ans_list[i]);
	}
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

  console.log('Created initial triangulation; creating shadow if desired');

  //Create the shadow of the surface
  if (create_shadow) {
    //console.log('Yes creating shadow');
    this.shadow = this.copy();
    var s = this.shadow;
    for (var i=0; i<s.vertex_locations.length; i++) {
      s.vertex_locations[i][2] = 0;
    }
    
    //console.log('Recomputing shadow normals');
    s.recompute_normals();
    //console.log('Done');
    
    s.boundary_edges = [];
    for (var i=0; i<s.edges.length; i++) {
      if (s.edges[i][2] === undefined || s.edges[i][4] === undefined) continue;
      var tnz0 = s.triangle_normals[ s.edges[i][2] ][2];
      var tnz1 = s.triangle_normals[ s.edges[i][4] ][2];
      if ( tnz0*tnz1 > 0 ) continue;
      
      s.boundary_edges.push(i);
    }
    //console.log('Done shadow');
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
  for (var i=0; i<this.edge_normals.length; i++) {
    T.edge_normals[i] = this.edge_normals[i].slice();
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
  this.edge_normals = [];
  for (var i=0; i<this.triangle_vertices.length; i++) {
    this.triangle_normals[i] = R3_triangle_normal( this.vertex_locations, this.triangle_vertices[i] );
    var ta = R3_triangle_angles( this.vertex_locations, this.triangle_vertices[i] );
    for (var j=0; j<3; j++) {
      var vi = this.triangle_vertices[i][j];
      var contribution = R3_scalar_mul( ta[j]/(2*Math.PI), this.triangle_normals[i]);
      if (this.vertex_normals[vi] == undefined) {
        this.vertex_normals[vi] = contribution;
      } else {
        R3_acc_inplace( this.vertex_normals[vi], contribution );
      }
    }
  }
  for (var i=0; i<this.vertex_normals.length; i++) {
    R3_normalize_inplace(this.vertex_normals[i]);
    //console.log('Vertex normal', this.vertex_normals[i], 'at', this.vertex_locations[i]);
  }
  for (var i=0; i<this.edges.length; i++) {
    var e = this.edges[i];
    this.edge_normals[i] = R3_mean_undefsafe( this.triangle_normals[e[2]], this.triangle_normals[e[4]] );
    R3_normalize_inplace(this.edge_normals[i]);
  }

  //console.log('Computed triangle normals:', this.triangle_normals);
  //console.log('Computed vertex normals:', this.vertex_normals);
  //console.log('Computed edge normals:', this.edge_normals);
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
  T.parent_triangle_mapping = [];
  T.parent = this;
  //Replace each triangle with 4 new ones
  for (var i=0; i<T.triangle_vertices.length; i++) {
    var tvi = T.triangle_vertices[i];
    var tei = T.triangle_edges[i];
    var nv = [ old_num_vertices + Math.abs(tei[0])-1,
               old_num_vertices + Math.abs(tei[1])-1,
               old_num_vertices + Math.abs(tei[2])-1 ];
    var N = new_triangle_vertices.length;
    new_triangle_vertices.push( [ tvi[0], nv[0], nv[2] ],
                                [ tvi[1], nv[1], nv[0] ],
                                [ tvi[2], nv[2], nv[1] ],
                                [ nv[0],  nv[1], nv[2] ] );
    T.parent_triangle_mapping[i] = [ N, N+1, N+2, N+3 ];
  }
  T.triangle_vertices = new_triangle_vertices;

  //compute the edge data
  T.recompute_edges();

  //Compute the triangle and vertex normals
  T.recompute_normals();
  
  return T;
}






// The input format of the curve is a list of ['edge', edge index, t] or ['point', r2point]
// We have to process this into a list [signed_edge_ind, t],
// where the t in the real curve is always relative to the actual edge coordinates
// (does not depend on the sign of the signed edge)


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
    var next_triangle = undefined;
  
    if (current_triangle != end_triangle) {
      //Find the next intersection
      var tv = s.triangle_vertices[current_triangle];
      var R2_tv = [ new R2Point( s.vertex_locations[tv[0]][0], s.vertex_locations[tv[0]][1] ),
                    new R2Point( s.vertex_locations[tv[1]][0], s.vertex_locations[tv[1]][1] ),
                    new R2Point( s.vertex_locations[tv[2]][0], s.vertex_locations[tv[2]][1] ) ]
      var tei = R2_triangle_intersection(current_point, R2_tv, end_point);
      var ste = s.triangle_edges[current_triangle][tei[0]];
      //console.log('Got ste', ste, 'as intersection', tei, 'in triangle edges', s.triangle_edges[current_triangle]);
      var e_sign = (ste > 0 ? 1 : -1);
      var e_ind = e_sign*ste-1;
      var next_triangle = s.edges[e_ind][ (e_sign>0 ? 4 : 2) ]; //Note if sign is >0 then we need to look on the OTHER side
      ans.push( [ste, (e_sign>0 ? tei[1] : 1-tei[1]), side] );
    } else {
      next_triangle = end_triangle;
    }
    
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
          ans.push( [B[1]+1, B[2], side] );
        } else {
          ans.push( [-(B[1]+1), B[2], side] );
        }
        //Find the next triangle
        side = (side == 'top' ? 'bottom' : 'top');
        next_triangle = this.find_adjacent_shadow_triangle(e, side);
        current_point = this.shadow_signed_edge_interpolate( ans[ans.length-1] );
      } else {
        current_point = B[1];
      }
      current_triangle = next_triangle;
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
    // console.log('Current curve:', ans);
    // console.log('current_triangle', current_triangle);
    // console.log('current_point', current_point);
    // console.log('end_triangle', end_triangle);
    // console.log('end_point', end_point);

  }
  //console.log('Returning curve:', ans);
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
  //Every segment is within a triangle and goes from one edge to another
  //This function goes through these segments and for each one, pushes
  //on all intersections except the last in order
  var ans = [];
  var P = this.parent;
  //console.log('Subdividing the curve', C);
  for (var i=0; i<C.length; i++) {
    var ip1 = (i+1)%C.length;
    var ei = Math.abs(C[i][0])-1;
    var parent_ti_0 = (C[i][0] > 0 ? [P.edges[ei][4], P.edges[ei][5]] : [P.edges[ei][2], P.edges[ei][3]]);
    ei = Math.abs(C[ip1][0])-1;
    var parent_ti_1 = (C[ip1][0] > 0 ? [P.edges[ei][2], P.edges[ei][3]] : [P.edges[ei][4], P.edges[ei][5]]);
    if (parent_ti_0[0] != parent_ti_1[0]) {
      console.log("I shouldn't be here");
      console.log('parent_ti:', parent_ti_0, parent_ti_1);
      console.log('C[i]:', C[i]);
      console.log('C[ip1]:',C[ip1]);
      console.log('edge0', P.edges[Math.abs(C[i][0])-1]);
      console.log('edge1', P.edges[ei]);
    }
    var parent_local_t_0 = (C[i][0] > 0 ? 1-C[i][1] : C[i][1]);
    var parent_local_t_1 = (C[ip1][0] > 0 ? C[ip1][1] : 1-C[ip1][1]);
    var parent_local_edge_data = R3_subdivide_triangle_segment(parent_ti_0[1], parent_local_t_0,
                                                                parent_ti_1[1], parent_local_t_1);
    var PTM = this.parent_triangle_mapping[parent_ti_0[0]];
    //console.log('Got parent local edge data:', parent_local_edge_data);
    for (var j=0; j<parent_local_edge_data.length; j++) {
      var pled = parent_local_edge_data[j];
      var ti = PTM[pled[0]];
      var path_signed_local_edge = pled[1];
      var tri_signed_global_edge = this.triangle_edges[ti][Math.abs(path_signed_local_edge)-1];
      var path_signed_global_edge = (path_signed_local_edge > 0 ? 1 : -1)*tri_signed_global_edge;
      var t = pled[2];
      if (tri_signed_global_edge < 0) t = 1-t;
      ans.push( [path_signed_global_edge, t] );
    }
  }
  //console.log("subdivided curve to:", ans);
  return ans;
  
}

//Repeatedly remove any edge-negative edge pairs until there aren't any
R3Triangulation.prototype.simplify_curve = function(C_in) {
	var i=0;
	var C = C_in.splice(0);
	while (i < C.length) {
		if (C[i][0] == -C[(i+1)%C.length][0]) {
			if (i < C.length-1) {
				C.splice(i,2);
				i = (i == 0 ? 0 : i-1);
			} else {
				C.splice(i,1);
				C.splice(0,1);
				i -= 2;
			}
		} else {
			i += 1;
		}
	}
	return C;
}


//Given a triangle, place it in R2 with edge 0 along the x-axis starting at 0
//Given two triangles, we expect an R2 triangle, a side index, and a (triangle, side) pair,
//and it puts the new triangle down with the sides matching
R3Triangulation.prototype.place_triangle_R2 = function( a, b, c ) {
	if (b === undefined) {
		console.log('initial placing triangle', a);
		console.log('With edges', this.triangle_edges[a]);
		//Place a single triangle
		var v = [ this.vertex_locations[ this.triangle_vertices[a][0] ],
		          this.vertex_locations[ this.triangle_vertices[a][1] ],
		          this.vertex_locations[ this.triangle_vertices[a][2] ] ];
		var dtaa = R3_find_distance_to_and_scalar_along_segment(v[2], v[0], v[1]);
		console.log('From points', v[2], '->', v[0], v[1]);
		console.log('Got dtaa', dtaa);
		var ans = [];
		ans[0] = new R2Point(0,0);
		ans[1] = new R2Point( R3_dist(v[0], v[1]), 0);
		ans[2] = R2_triangle_make_scalar_along_and_distance_from(dtaa[0], dtaa[1], ans[0], ans[1]);
	} else {
		console.log('placing triangle against triangle:', a);
		console.log('against edge:', b);
		console.log('Placing the (triangle, side)', c);
		//place a triangle next to another one
		var ci = c[0];
		var cedge_i = c[1];
		var v = [ this.vertex_locations[ this.triangle_vertices[ci][0] ],
		          this.vertex_locations[ this.triangle_vertices[ci][1] ],
		          this.vertex_locations[ this.triangle_vertices[ci][2] ] ];
		var dtaa = R3_find_distance_to_and_scalar_along_segment( v[(cedge_i+2)%3], v[cedge_i], v[(cedge_i+1)%3] );
		console.log('From points', v[(cedge_i+2)%3], '->', v[cedge_i], v[(cedge_i+1)%3]);
		console.log('Got dtaa', dtaa);
		var ans = [];
		ans[cedge_i] = a[(b+1)%3].copy();
		ans[(cedge_i+1)%3] = a[b].copy();
		ans[(cedge_i+2)%3] = R2_triangle_make_scalar_along_and_distance_from(dtaa[0], dtaa[1], ans[cedge_i], ans[(cedge_i+1)%3]);
	}
	return ans;
}



//Given two edge crossings (guaranteed to be sides of the local polygon
//at the vertex across from the edge), and a direction, follow the vertex
//neighborhood in that direction and construct a new good path
//If no straight path exists between the start and end, return undefined
R3Triangulation.prototype.create_new_local_path = function( entry_edge, leave_edge, dir ) {
	console.log('Creating new local path between edges', entry_edge, leave_edge, dir);
	//---------------- place triangles
	var tris = [];
	var entry_ei = Math.abs(entry_edge[0])-1;
	var entry_ti = undefined;
	entry_ti = (entry_edge[0] > 0 ? [ this.edges[entry_ei][4], this.edges[entry_ei][5] ]
			                      : [ this.edges[entry_ei][2], this.edges[entry_ei][3] ]);
	tris[0] = this.place_triangle_R2( entry_ti[0] );
	console.log('Placed first triangle', tris[0]);
	leave_ti = [ entry_ti[0], (entry_ti[1] + (dir=='left'?2:1))%3 ];
	var entry_tis = [ entry_ti ];
	var leave_tis = [ leave_ti ];
	console.log('Created initial entry and leave', entry_tis, leave_tis);
	while (true) {
		var cur_entry_edge = this.triangle_edges[ leave_ti[0] ][ leave_ti[1] ];
		entry_ei = Math.abs(cur_entry_edge)-1;
		entry_ti = (cur_entry_edge > 0 ? [ this.edges[entry_ei][4], this.edges[entry_ei][5] ] 
			                           : [ this.edges[entry_ei][2], this.edges[entry_ei][3] ]);
		entry_tis.push( entry_ti );
		tris.push( this.place_triangle_R2( tris[tris.length-1],
			                               leave_tis[leave_tis.length-1][1],
			                               entry_tis[entry_tis.length-1] ) );
		console.log('Placed triangle', tris[tris.length-1]);
		leave_ti = [ entry_ti[0], (dir=='left' ? (entry_ti[1]+1)%3 : (entry_ti[1]+2)%3) ];
		leave_tis.push( leave_ti );
		var ind_to_check = (dir=='left' ? (entry_ti[1]+2)%3 : (entry_ti[1]+1)%3);
		if (this.triangle_edges[ entry_ti[0] ][ ind_to_check ] == leave_edge[0]) {
			//We must modify the last leave_ti
			leave_tis[leave_tis.length-1][1] = ind_to_check;
			break;
		}
	}
	console.log('Placed all triangles', tris);
	console.log('Created entry and leave', entry_tis, leave_tis);
	//--------------- Replace path
	var entry_R2_point = R2_interpolate_triangle_side( tris[0],
		                                               entry_tis[0][1],
		                                               (entry_edge[0] > 0 ? 1-entry_edge[1] : entry_edge[1]) );
	var leave_R2_point = R2_interpolate_triangle_side( tris[tris.length-1],
		                                               leave_tis[leave_tis.length-1][1],
		                                               (leave_edge[0] > 0 ? leave_edge[1] : 1-leave_edge[1]) );
	var central_vertex = tris[0][ (entry_tis[0][1]+2)%3 ];
	var orientation = R2_orientation( entry_R2_point, leave_R2_point, central_vertex );
	console.log('Got entry, leave, central vertex', entry_R2_point, leave_R2_point, central_vertex);
	console.log('orientation', orientation);
	if ( ((orientation == 1) && (dir == 'left')) ||
		 ((orientation == -1) && (dir == 'right')) ){
		return undefined;
	}
	var new_intersections = [ entry_edge ];
	for (var i=0; i<tris.length-1; i++) {
		var t = R2_triangle_segment_intersection( tris[i],
		                                          leave_tis[i][1],
		                                          entry_R2_point,
		                                          leave_R2_point );
		if (t < 0) t = 0;
		if (t > 1) t = 1;
		var ei = this.triangle_edges[ leave_tis[i][0] ][ leave_tis[i][1] ];
		if (ei < 0) {
			t = 1-t;
		}
		new_intersections.push( [ei, t] );
	}
	new_intersections.push( leave_edge );
	var metric = 0;
	var r3pts = [];
	for (var i=0; i<new_intersections.length; i++) {
		var ei = Math.abs(new_intersections[i][0])-1;
		var t = new_intersections[i][1];
		var vi0 = this.edges[ei][0];
		var vi1 = this.edges[ei][1];
		var p = R3_interpolate( t, this.vertex_locations[vi0], this.vertex_locations[vi1] );
		r3pts[i] = p;
	}
	for (var i=0; i<new_intersections.length-1; i++) {
		metric += R3_dist(r3pts[i], r3pts[i+1]);
	}
	return { 'raw': new_intersections, 'metric': metric };
}







// Starting at curve index i, follow the curve until it leaves the neighborhood
//of the vertex across from the initial edge (i).  Record the triangles and stuff
R3Triangulation.prototype.build_triangle_strip_follow_curve = function(C, i) {
	var ans = {'entry_loc':C[i]};
	var enter_ei = Math.abs(C[i][0])-1;
	var enter_ti = undefined;
	if (C[i][0] > 0) {
		enter_ti = [ this.edges[enter_ei][4], this.edges[enter_ei][5] ];
	} else {
		enter_ti = [ this.edges[enter_ei][2], this.edges[enter_ei][3] ];
	}
	ans.vertex = this.triangle_vertices[ enter_ti[0] ][ (enter_ti[1]+2)%3 ];
	var ip1 = (i+1)%C.length;
	var leave_ei = Math.abs(C[ip1][0])-1;
	var leave_ti = undefined;
	if (C[ip1][0] > 0) {
		leave_ti = [ this.edges[leave_ei][2], this.edges[leave_ei][3] ];
	} else {
		leave_ti = [ this.edges[leave_ei][4], this.edges[leave_ei][5] ];
	}
	if (leave_ti[0] != enter_ti[0]) {
		console.log('This should be impossible');
	}
	ans.enter_ti = [ enter_ti ];
	ans.leave_ti = [ leave_ti ];
	console.log('Found first enter and leave ti:', enter_ti, leave_ti);
	console.log(enter_ti[0]);
	var ta = R3_triangle_angles( this.vertex_locations, this.triangle_vertices[enter_ti[0]] );
	ans.cumulative_angles = [ ta[(enter_ti[1]+2)%3] ];
	ans.curve_dir = ( leave_ti[1] == (enter_ti[1] + 1)%3 ? 'right' : 'left');
	console.log('Found first angle and curve dir', ans.cumulative_angles, ans.curve_dir);
	var j=i+1;
	while (true) {
		jmC = j%C.length;
		var new_enter_ei = Math.abs(C[jmC][0]) - 1;
		var new_enter_ti = undefined;
		if (C[jmC][0] > 0) {
			new_enter_ti = [ this.edges[new_enter_ei][4], this.edges[new_enter_ei][5] ];
		} else {
			new_enter_ti = [ this.edges[new_enter_ei][2], this.edges[new_enter_ei][3] ];
		}
		var jp1 = (j+1)%C.length;
		var new_leave_ei = Math.abs(C[jp1][0])-1;
		var new_leave_ti = undefined;
		if (C[jp1][0] > 0) {
			new_leave_ti = [ this.edges[new_leave_ei][2], this.edges[new_leave_ei][3] ];
		} else {
			new_leave_ti = [ this.edges[new_leave_ei][4], this.edges[new_leave_ei][5] ];
		}
		if (new_leave_ti[0] != new_enter_ti[0]) {
			console.log('This should be impossible');
		}
		ans.enter_ti.push(new_enter_ti);
		ans.leave_ti.push(new_leave_ti);
		var ta = R3_triangle_angles( this.vertex_locations, this.triangle_vertices[ new_enter_ti[0] ] );
		var new_angle = (ans.curve_dir == 'left' ? ta[(new_enter_ti[1]+1)%3] :  ta[new_enter_ti[1]]);
	    ans.cumulative_angles.push( ans.cumulative_angles[ans.cumulative_angles.length-1] + new_angle );
		var leave_dir = ( (new_leave_ti[1] == (new_enter_ti[1] + 1)%3) ? 'right' : 'left');
		if (leave_dir == ans.curve_dir) {  //This means we're leaving this polygon
			break;
		}
		j += 1;
	}
	ans.leave_loc = C[ (i + ans.leave_ti.length)%C.length ];
	ans.num_edges = ans.leave_ti.length + 1;
	console.log('Found all triangle strip', ans);
	return ans;
}



R3Triangulation.prototype.smooth_curve = function(C_in) {
	console.log('R3Triangulation smoothing curve');

	var tolerance = 0.000001;

	//First simplify the curve
	C = this.simplify_curve(C_in);
	console.log('Simplified curve to', C);
	//Here, 0 == left and 1 == right

	var previous_metric = 0;
	var iters = 0;
	while (true && iters < 1) {

		var current_metric = 0;
		console.log('Current smooth iteration',iters);

		for (var i=0; i<C.length; i++) {
			console.log('Building triangle strip at', i);
			var S = this.build_triangle_strip_follow_curve(C, i);

			var test_sides = [false, false];

			//If the cumulative angle of the triangle *before* exit is larger than pi
			//then we know we must go the opposite way around
			if ( S.cumulative_angles[S.cumulative_angles.length-2] > Math.PI ) {
				test_sides[(S.curve_dir == 'left' ? 1 : 0)] = true;

			//If the cumulative angle including the last triangle is <= pi, then we
			//know we do NOT need to go around
			} else if ( S.cumulative_angles[S.cumulative_angles.length-1] <= Math.PI ) {
				test_sides[(S.curve_dir == 'left' ? 0 : 1)] = true;
			
			//Otherwise, we need to actually evaluate both directions
			} else {
				test_sides = [true, true];
			}

			// Create as many solutions as we need
			var new_curve_chunks = [ undefined, undefined ];
			for (var j=0; j<2; j++) {
				if (test_sides[j]) {
					new_curve_chunks[j] = this.create_new_local_path( S.entry_loc, S.leave_loc, (j==0 ? 'left' : 'right') );
				}
			}

			//Pick the best one
			var chosen_chunk = undefined;
			if (new_curve_chunks[0] === undefined && new_curve_chunks[1] === undefined) {
				console.log("This shouldn't be possible, or it's negatively curved");
			} else if (new_curve_chunks[0] === undefined) {
				chosen_chunk = 1;
			} else if (new_curve_chunks[1] === undefined) {
				chosen_chunk = 0;
			} else {
				chosen_chunk = (new_curve_chunks[0].metric < new_curve_chunks[1].metric ? 0 : 1);
			}
			var chunk = new_curve_chunks[chosen_chunk];

			//Replace it
			if (chunk != undefined) {
				console.log('Doing a curve replacement splice');
				console.log('Before', C);
				circular_splice(C, i, S.num_edges, chunk.raw);
				console.log('After', C);
				current_metric += chunk.metric;
			} else {
				console.log("Didn't find any straight line path--ignoring");
			}
		}

		if (current_metric > previous_metric - tolerance) {
			console.log( "Didn't improve metric; bailing");
			break
		}
		iters++;
	}

	return C;
}





R3Triangulation.prototype.twist = function(C, dir, D_list) {
	//apply a dehn twist around C to the curves in D_list
	//dir == pos means that if (D,C) intersection is positive, then
	//the new curve follows C positively from that point
	console.log("Twisting");
	
	//build a array which records which edges are hit by which parts of C
	var hit_edges = [];
	for (var i=0; i<C.length; i++) {
		var ei = Math.abs(C[i][0])-1;
		if (hit_edges[ei] === undefined) hit_edges[ei] = [];
		hit_edges[ei].push(i);
	}

	//Scan through each d in D_list
	for (var i=0; i<D_list.length; i++) {
		var d = D_list[i];
		var marked_intersections = [];   //Each entry records (di edge index *before* intersection, 
		                                 //                    Ci edge index *before* intersection)
		for (var j=0; j<d.length; j++) {
			var ei = Math.abs(d[j][0])-1;
			if (hit_edges[ei] === undefined) continue;
			//We need to try intersecting the four possibilities (i,j), (i-1,j), (i,j-1), (i-1,j-1)
			//and for each of the hit_edges
			var d_eis = [d[pos_mod(j-1,d.length)], d[j], d[(j+1)%d.length]];
			var d_R3_pts = [ ]
		}
	}



}

















