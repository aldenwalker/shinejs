/*****************************************************************************
 * Swap the case of a character
 *****************************************************************************/
function swap_case_char(c) {
  if (c.toLowerCase() == c) {
    return c.toUpperCase();
  } else {
    return c.toLowerCase();
  }
}

/*****************************************************************************
 * Positive modulo
 *****************************************************************************/
function pos_mod(x, n) {
  return ((x%n)+n)%n;
}

/*****************************************************************************
 *
 * A topological triangulation
 * triangle_vertices has lists of triples [v0,v1,v2], which are the vertices 
 * contained in the triangle.  triangle_neighbors has lists of triples 
 * of pairs [[t0,s0],[t1,s1],[t2,s2]], where the triangle is adjacent 
 * to side s0 of triangle t0.  If the triangle has no neighbor on 
 * one side, the neighbor pair is [-1,-1]
 *
 *****************************************************************************/
function Triangulation(data) {
  if (data == 'blank') {
    this.num_vertices = 0;
    this.num_triangles = 0;
    this.triangle_vertices = [];
    this.triangle_neighbors = [];
  } else {
    this.num_vertices = data.num_vertices;
    this.num_triangles = data.num_triangles;
    this.triangle_vertices = data.vertices;
    this.triangle_neighbors = data.neighbors;
  }
}

/*****************************************************************************
 * string version of a triangulation
 *****************************************************************************/
Triangulation.prototype.toString = function() {
  return 'Num tris: ' + this.num_triangles + 
         '\nNum verts: ' + this.num_vertices + 
         '\nTri verts: ' + JSON.stringify(this.triangle_vertices) + 
         '\nTri neighbors: ' + JSON.stringify(this.triangle_neighbors);
}

/*****************************************************************************
 * A fundamental domain triangulation; all the data about a triangulation, 
 * but we also have a list which records, for each triangle, which edges 
 * lie on the boundary of the fundamental domain.  Each such edge is labeled 
 * with the signed index of the identification which sends it to the other 
 * edge.  Each triangle_fd_boundaries entry looks like [0, 0, -1] where 0 means 
 * no identification (evaluates to false).  Each identification entry looks 
 * like {'name':<name>, 'ids':[ [[ti,side],[ti,side]], ... ]} giving all the 
 * sides identified
 *****************************************************************************/
function FDTriangulation (data) {
  if (data == 'blank') {
    this.num_vertices = 0;
    this.num_triangles = 0;
    this.triangle_vertices = [];
    this.triangle_neighbors = [];
    this.triangle_fd_boundaries = []
    this.fd_identifications = []
  } else {
    this.num_vertices = data.num_vertices;
    this.num_triangles = data.num_triangles;
    this.triangle_vertices = data.triangle_vertices;
    this.triangle_neighbors = data.triangle_neighbors;
    this.triangle_fd_boundaries = data.triangle_fd_boundaries;
    this.fd_identifications = data.fd_identifications;
  }
}

/*****************************************************************************
 * string version of a triangulation
 *****************************************************************************/
FDTriangulation.prototype.toString = function() {
  return 'Num tris: ' + this.num_triangles + 
         '\nNum verts: ' + this.num_vertices + 
         '\nTri verts: ' + JSON.stringify(this.triangle_vertices) + 
         '\nTri neighbors: ' + JSON.stringify(this.triangle_neighbors) + 
         '\nTri FD boundaries: ' + JSON.stringify(this.triangle_fd_boundaries) + 
         '\nFD Identifications: ' + JSON.stringify(this.fd_identifications);
}

/*****************************************************************************
 * Create a triangulation from a polygon gluing pattern
 * It makes one triangle for every side, with one central vertex
 *****************************************************************************/
FDTriangulation.from_polygon_word = function(w) {
  tdata = {'num_vertices':0, 'num_triangles':0, 'vertices':[], 'neighbors':[], 'fd_boundaries':[], 'fd_identifications':[]};
  for (var i=0; i<w.length; i++) {
    var n = [];
    //neighbor 0 is side 2 of triangle i-1
    n[0] = [pos_mod(i-1, w.length), 2];
    //neighbor 1 is side 1 of the triangle at the matching letter position
    n[1] = (w[i] == '_' ? [-1,-1] : [w.search(swap_case_char(w[i])), 1]);
    //neighbor 2 is side 0 of the next triangle
    n[2] = [(i+1)%w.length, 0];
    tdata.neighbors.push(n);
  }
  tdata.num_triangles = tdata.neighbors.length;
  tdata.num_vertices = 0;

  for (var i=0; i<w.length; i++) {
    if (w[i] == '_') {
      tdata.fd_boundaries[i] = [0,0,0];
      continue;
    }
    if (w[i].toLowerCase() != w[i]) continue;

    var other_ind = w.search(swap_case_char(w[i]));
    var new_id = {'name':w[i], 'ids':[ [ [i,1],[other_ind,1]] ]};
    var this_id = tdata.fd_identifications.length;
    tdata.fd_boundaries[i] = [0, this_id+1, 0];
    tdata.fd_boundaries[other_ind] = [0, -(this_id+1), 0];
    tdata.fd_identifications.push(new_id);
  }

  //console.log('made neighbors', tdata.neighbors, tdata.num_triangles);
  //fill in the vertices
  tdata.vertices = Array.apply(null, 
                         Array(tdata.num_triangles)).map(function () { return [-1,-1,-1];});
  for (var i=0; i<tdata.num_triangles; i++) {
    for (var j=0; j<3; j++) {
      if (tdata.vertices[i][j] != -1) continue;
      //we scan backwards and forwards around the vertex
      var cur_i = i;
      var cur_j = j;
      do {
        tdata.vertices[cur_i][cur_j] = tdata.num_vertices;
        var old_cur_i = cur_i;
        cur_i = tdata.neighbors[cur_i][(cur_j+2)%3][0];
        cur_j = tdata.neighbors[old_cur_i][(cur_j+2)%3][1];
      } while ((cur_i != -1) && (cur_i != i || cur_j != j));
      cur_i = tdata.neighbors[i][j][0];
      cur_j = tdata.neighbors[i][j][1];
      cur_j = (cur_j+1)%3;
      while ((cur_i != -1) && (cur_i != i || cur_j != j)) {
        tdata.vertices[cur_i][cur_j] = tdata.num_vertices;
        var old_cur_i = cur_i;
        cur_i = tdata.neighbors[cur_i][cur_j][0];
        cur_j = tdata.neighbors[old_cur_i][cur_j][1];
        cur_j = (cur_j+1)%3;
      } 
      //console.log('Added new vertex; tdata now: ' + JSON.stringify(tdata));
      tdata.num_vertices++;
    }
  }
  tdata.triangle_vertices = tdata.vertices;
  tdata.triangle_neighbors = tdata.neighbors;
  tdata.triangle_fd_boundaries = tdata.fd_boundaries;
  return new FDTriangulation(tdata);
}
