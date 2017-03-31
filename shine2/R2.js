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

R2Point.prototype.angle = function() {
  return Math.atan2(this.y, this.x);
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


R2Point.prototype.copy = function() {
  return new R2Point(this.x, this.y);
}

R2Point.prototype.as_array = function() {
  return [this.x, this.y];
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
  if (v2i in v1.adjacent_vertices) {
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








