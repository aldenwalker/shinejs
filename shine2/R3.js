function pos_mod(x,n) {
  return ((x%n)+n)%n;
}


function R3Surface(graph) {
  if (graph.vertices.length == 0) {
    alert('You appear to have created an empty surface');
  }
  this.core_graph = graph;
  
  //Find the closest that a vertex ever comes to an edge not incident to it
  var closest = 1;
  for (var i in this.core_graph.vertices) {
    var v = this.core_graph.vertices[i];
    for (var j in this.core_graph.edges) {
      var e = this.core_graph.edges;
      if (e[0] == i || e[1] == i) continue;
      var d = distance_to_segment(v.coords, this.core_graph.vertices[e[0]].coords, this.core_graph.vertices[e[1]].coords);
      if (d < closest) {
        closest = d;
      }
    }
  }
  //We make the tube radius 1/3 of the closest distance
  var tube_radius = (1/3)*closest;
  
  this.base_triangulation = R3Triangulation(this.core_graph, tube_radius, true);
  
}


//We don't create an R3Point object because maybe this is faster?



function R3Triangulation(graph, radius, create_shadow) {
  
  //Create all the vertices for each core vertex -------------------------------
  this.vertex_locations = [];
  this.vertices = [];
  var core_graph_mapping = { 'vertex_mapping':{} };
  for (var i in graph.vertices) {
    //For each incident edge, we need to place a vertex whose angle is halfway between the edge and the next
    //(there is a special case for one edge)
    //The core graph mapping is redundant and remembers the vertices before and after each edge
    var v = graph.vertices[i];
    core_graph_mapping.vertex_mapping[i] = {};
    var num_e = v.incident_edges.length;
    if (num_e == 1) {
      core_graph_mapping.vertex_mapping[i].type = 'boundary';
      var a = Number(v.incident_edges.keys()[0]);
      var R2_location_1 = v.coords.angle_dist(a + Math.PI/2, radius);
      var R2_location_2 = v.coords.angle_dist(a + 3*Math.PI/2, radius);
      this.vertex_locations.push( [R2_location_1.x, R2_location_1.y, 0] );
      this.vertices.push( {'coords_ind':this.vertex_locations.length-1, 'incident_tris':[]} );
      this.vertex_locations.push( [R2_location_2.x, R2_location_2.y, 0] );
      this.vertices.push( {'coords_ind':this.vertex_locations.length-1, 'incident_tris':[]} );
      core_graph_mapping.vertex_mapping[i].edges_to_new_vertices[a] = [this.vertices.length-1, this.vertices.length-2];
    } else {
      core_graph_mapping.vertex_mapping[i].type = 'normal';
      core_graph_mapping.vertex_mapping[i].edges_to_new_vertices = {};
      var angles = Object.keys(v.incident_edges).map(Number);
      angles.sort( function(a,b) { return a - b; } );
      for (var i in angles) {
        core_graph_mapping.vertex_mapping[i].edges_to_new_vertices[angles[i]] = [];
      }
      for (var i in angles) {
        //Make all angles positive
        var a1 = pos_mod(angles[i], 2*Math.PI);
        var a2 = pos_mod(angles[pos_mod(i+1,num_e)], 2*Math.PI);
        var angle_diff = a2-a1;
        var av_angle = a1 + 0.5*angle_diff;
        //we need to go out along this angle until the radius is correct
        //law of sin: sin(angle_diff/2)/radius = sin(pi/2)/dist
        var dist = radius / Math.sin(angle_diff/2);
        var R2_location = v.coords.angle_dist(av_angle, dist);
        //Add the vertex
        this.vertex_locations.push( [R2_location.x, R2_location.y, 0] );
        this.vertices.push( {'coords_ind':this.vertex_locations.length-1, 'incident_tris':[]} );
        core_graph_mapping.vertex_mapping[i].edges_to_new_vertices[a1][1] = this.vertices.length-1;
        core_graph_mapping.vertex_mapping[i].edges_to_new_vertices[a2][0] = this.vertices.length-1;
      }
      //Add vertices on the top and bottom
      this.vertex_locations.push( [ v.coords.x, v.coords.y, radius ] );
      this.vertices.push( {'coords_ind':this.vertex_locations.length-1, 'incident_tris':[]} );
      core_graph_mapping.vertex_mapping[i].top_ind = this.vertices.length-1;
      this.vertex_locations.push( [ v.coords.x, v.coords.y, -radius ] );
      this.vertices.push( {'coords_ind':this.vertex_locations.length-1, 'incident_tris':[]} );
      core_graph_mapping.vertex_mapping[i].bottom_ind = this.vertices.length-1;
    }
  }
  
  // Create the triangle strips encircling each edge -------------------------------------
  // Facing away from the initial vertex, we start at the right and circle counterclockwise
  this.triangle_vertices = [];
  this.triangles = [];
  this.edges_to_triangles = {};  // Maps pairs of vertices to triangle edges
  
  for (var i in graph.edges) {
    var e = graph.edges[i];
    var a0 = e[2];
    var a1 = e[3];
    var v0i = e[0];
    var v1i = e[1];
    var cgmvm0 = core_graph_mapping.vertex_mapping[v0i];
    var cgmvm1 = core_graph_mapping.vertex_mapping[v1i];
    
    var new_triangle_vertices = [ [cgmvm0.edges_to_new_vertices[a0][0],
                                          cgmvm1.edges_to_new_vertices[a1][1],
                                          cgmvm0.top_ind] ]
    for (var j in new_triangle_vertices) {
      this.triangle_vertices.push( new_triangle_vertices[j] );
      this.triangles.push( {'coords_ind':this.triangle_vertices.length-1} );
      for (var k=0; k<3; k++) {
        this.vertices[new_triangle_vertices[j][k]].
      }
  }
  
  
  
}


