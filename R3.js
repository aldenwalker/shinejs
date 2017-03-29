function EmbeddedR3Triangulation(T, vert_locs) {
  self.T = T; 
  self.vertex_locations = vert_locs;
}

EmbeddedR3Triangulation.embed_triangulation = function(T) {
  return new EmbeddedR3Triangulation([],[]);
}
