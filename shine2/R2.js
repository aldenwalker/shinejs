function R2Point(x,y) {
  this.x = x;
  this.y = y;
}

R2Point.prototype.add = function(p) {
  return new R2Point(this.x + p.x, this.y + p.y);
}

R2Point.prototype.sub = function(p) {
  return new R2Point(this.x - p.x, this.y - p.y);
}

R2Point.prototype.dist = function(p) {
  var dx = p.x - this.x;
  var dy = p.y - this.y;
  return Math.sqrt(dx*dx + dy*dy);
}

R2Point.prototype.angle = function() {
  return Math.atan2(this.y, this.x);
}

R2Point.prototype.angle_dist = function(angle, dist) {
  var diff = new R2Point(Math.cos(angle), Math.sin(angle));
  diff = diff.scalar_mul(dist);
  return this.add(diff);
}

R2Point.prototype.scalar_mul = function(s) {
  return new R2Point(s*this.x, s*this.y);
}

R2Point.prototype.round = function() {
  return new R2Point(~~Math.round(this.x), ~~Math.round(this.y));
}


R2Point.prototype.equal = function(p) {
  return this.x == p.x && this.y == p.y;
}

R2Point.prototype.dot = function(p) {
  return this.x*p.x + this.y*p.y;
}

R2Point.prototype.copy = function() {
  return new R2Point(this.x, this.y);
}

R2Point.prototype.norm = function() {
  return Math.sqrt(this.x*this.x + this.y*this.y);;
}

R2Point.prototype.perp = function() {
  return new R2Point(-this.y, this.x);
}

R2Point.prototype.as_array = function() {
  return [this.x, this.y];
}

function R2_distance_to_segment(p, a0, a1) {
  //translate so a0 is at the origin
  var pt = p.sub(a0);
  var a1t = a1.sub(a0);
  //project pt to the span of a1t
  var scalar = pt.dot(a1t)/a1t.dot(a1t);
  //Note if the scalar is <=0, then the closest point is a0
  if (scalar <= 0) {
    return pt.norm();
  }
  //if the scalar is >=1, then the closest point is a1
  if (scalar >= 1) {
    return p.sub(a1).norm();
  }
  var ptp = a1t.scalar_mul(scalar);
  var diff = pt.sub(ptp);
  return diff.norm();
}

function R2_distance_to_segment_xyxy_tol(p, x0, y0, x1, y1, tol) {
  var a0 = new R2Point(x0,y0);
  var a1 = new R2Point(x1,y1);
  var d = a0.dist(a1);
  if (a0.dist(p) > d + tol || a1.dist(p) > d + tol) {
    return undefined;
  }
  var real_dist = R2_distance_to_segment(p, a0, a1);
  if (real_dist < tol) return real_dist;
  else return undefined;
}


function R2_interpolate_segment_xyxy(t, x0, y0, x1, y1) {
  var dx = x1-x0;
  var dy = y1-y0;
  return new R2Point(x0 + t*dx, y0 + t*dy);
}

function R2_interpolate_segment(t, a, b) {
  var dx = b.x-a.x;
  var dy = b.y-a.y;
  return new R2Point(a.x + t*dx, a.y + t*dy);
}

function R2_interpolate_triangle_side(tri, side, t) {
	return R2_interpolate_segment( t, tri[side], tri[(side+1)%3] );
}


function R2_project_segment_t(p, a0, a1) {
  //translate so a0 is at the origin
  var pt = p.sub(a0);
  var a1t = a1.sub(a0);
  //project pt to the span of a1t
  var scalar = pt.dot(a1t)/a1t.dot(a1t);
  return scalar;
}

function R2_segment_intersection(a, b, c, d) {
  //Return the t-values of the intersection point between a->b and c->d
  var M = [ b.x-a.x, c.x-d.x, b.y-a.y, c.y-d.y ];
  var det = M[0]*M[3] - M[1]*M[2];
  if (det == 0) {
    return undefined;
  }
  var MI = [ M[3], -M[1], -M[2], M[0] ];
  var ca = [ c.x-a.x, c.y-a.y ];
  var ans = [ (1/det) * (MI[0]*ca[0] + MI[1]*ca[1]),  (1/det) * (MI[2]*ca[0] + MI[3]*ca[1]) ];
  return ans;
}

function R2_triangle_segment_intersection( tri, side, a, b ) {
	return R2_segment_intersection( tri[side], tri[(side+1)%3], a, b)[1];
}


function R2_triangle_intersection(current_point, verts, end_point) {
  //console.log("Finding triangle intersection", current_point, verts, end_point);
  for (var i=0; i<3; i++) {
    var si = R2_segment_intersection(current_point, end_point, verts[i], verts[(i+1)%3]);
    //console.log(i,si);
    if (si != undefined && si[0] > 1e-7 && 0 <= si[1] && si[1] <= 1 ) {
      return [i, si[1]];
    }
  }
  console.log("I don't think I should be here");
  return -1;
}


function R2_triangle_contains(verts, p) {
  var perp0 = verts[1].sub(verts[0]).perp();
  if ( p.sub(verts[0]).dot(perp0) * verts[2].sub(verts[0]).dot(perp0) < 0 ) {
    return false;
  }
  var perp1 = verts[2].sub(verts[1]).perp();
  if ( p.sub(verts[1]).dot(perp1) * verts[0].sub(verts[1]).dot(perp1) < 0 ) {
    return false;
  }
  var perp2 = verts[0].sub(verts[2]).perp();
  if ( p.sub(verts[2]).dot(perp2) * verts[1].sub(verts[2]).dot(perp2) < 0 ) {
    return false;
  }
  //console.log(p, 'is in triangle', verts);
  return true;
}


function R2_orientation(a, b, c) {
	//return 1 if a,b,c faces up and -1 if it faces down
	var cross_prod_z = (b.x-a.x)*(c.y-b.y) - (b.y-a.y)*(c.x-b.x);
  	return (cross_prod_z > 0 ? 1 : -1);
}



function R2_triangle_distance_along_and_from(dt, da, a, b) {
	//return the point that is distance da along the segment from a to b
	//and distance da from the segment on the left looking forward
	var diff = b.sub(a);
	var abd = diff.norm();
	var t = da / abd;
	var along_p = R2_interpolate_segment(t, a, b);
	var perp_vector = new R2Point( -diff.y, diff.x );
	var pl = perp_vector.norm()
	perp_vector = perp_vector.scalar_mul( dt/pl );
	var ans = new R2Point(along_p.x + perp_vector.x, along_p.y + perp_vector.y);
	return ans;
}


function R2_triangle_make_scalar_along_and_distance_from(df, t, a, b) {
	//return the point that is scalar multiple t of b-a from a
	//and distance df from the segment on the left when looking forward
	var diff = b.sub(a);
	var abd = diff.norm();
	var along_p = b.add(diff.scalar_mul(t));
	var perp_vector = new R2Point( -diff.y, diff.x );
	var pl = perp_vector.norm()
	perp_vector = perp_vector.scalar_mul( df/pl );
	var ans = new R2Point(along_p.x + perp_vector.x, along_p.y + perp_vector.y);
	return ans;
}


function R2Graph() {
  this.vertices = [];
  this.vertex_indices = {};
  this.edges = [];
}

R2Graph.prototype.reload = function(data) {
  this.vertices = data.vertices;
  this.vertex_indices = data.vertex_indices;
  this.edges = data.edges;
}

R2Graph.prototype.add_vertex = function(coords) {
  if (coords.as_array() in this.vertex_indices) {
    return true;
  }
  this.vertices.push( {'coords':coords, 'incident_edges':{}, 'adjacent_vertices':{}} );
  this.vertex_indices[ coords.as_array() ] = this.vertices.length-1;
  return false;
}

R2Graph.prototype.add_edge = function( v1i, v2i ) {
  var v1 = this.vertices[v1i];
  var v2 = this.vertices[v2i];
  if (v1.adjacent_vertices.hasOwnProperty(v2i)) {
    console.log("Vertices already connected");
    return false;
  }
  v1.adjacent_vertices[v2i] = true;
  v2.adjacent_vertices[v1i] = true;
  var angle1 = v2.coords.sub( v1.coords ).angle();
  var angle2 = v1.coords.sub( v2.coords ).angle();
  this.edges.push( [v1i,v2i,angle1,angle2] );
  v1.incident_edges[angle1] = [this.edges.length-1, 0];
  v2.incident_edges[angle2] = [this.edges.length-1, 1];
}








