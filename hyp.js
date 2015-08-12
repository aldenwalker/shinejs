"use strict";


/*****************************************************************************
 * Extend an array by pushing N copies of X
 *****************************************************************************/
function extend_array(A, N, X) {
  Array.prototype.push.apply(A, 
      Array.apply(null, Array(N)).map( function() { return X; } ) );
}

/*****************************************************************************
 * Create the range 0, ..., N-1
 *****************************************************************************/
function range_array(N) {
  return Array.apply(null, Array(N)).map( function (_,i) { return i; });
}

/*****************************************************************************
 * Round a decimal to a number of places
 *****************************************************************************/
function round(x, n) {
  var y = x*Number('1e'+n);
  y = Math.round(y);
  y *= Number('1e-'+n);
  return y;
}

/*****************************************************************************
 * These functions provide extra Decimal.js functionality
 *****************************************************************************/
/*
function decimal_cosh(x) {
  return x.exp().plus(x.neg().exp()).div('2');
}
function decimal_sinh(x) {
  return x.exp().minus(x.neg().exp()).div('2');
}
function decimal_reciprocal(x) {
  return Decimal.ONE.div(x);
}
Decimal.PI = new Decimal('3.1415926535897932384626433832795028841971693993751');
Decimal.PI2 = new Decimal('1.5707963267948966192313216916397514420985846996876');
Decimal.ZERO = new Decimal('0');
Decimal.TWO = new Decimal('2');
Decimal.TWOPI = new Decimal('6.2831853071795864769252867665590057683943387987502');
Decimal.oneOverPhi = new Decimal('0.61803398874989484820458683436563811772030917980576');
Decimal.oneMinusOneOverPhi = new Decimal('0.38196601125010515179541316563436188227969082019424');
function decimal_acos(x) {
  var sum = new Decimal(x);
  var summand = new Decimal(x);
  var current_x_power = new Decimal(x);
  var xs = x.times(x);
  var i = 1;
  while (true) {
    //the form of each summand is (1.3.5.7...2n-1)/(2.4.6.8...2n)x^(2n+1)/(2n+1)
    //to get from the current x power, we multiply by x^2
    //x^(2n+1)*x^2 = x^(2n+3) = x^(2(n+1)+1)
    var multiplier = (new Decimal(2*i-1)).div(new Decimal(2*i*(2*i+1)));

    //correct the multiplier by multiplying by 2*(i-1)+1 = 2*i-1
    multiplier = multiplier.times(new Decimal(2*i-1));

    //get the new x power
    multiplier = multiplier.times(xs);

    //get the new summand
    summand = summand.times(multiplier);
    if (summand.lte('1e-'+(Decimal.precision-1)) ) break;

    sum = sum.plus(summand);
    i++;
  }
  return Decimal.PI2.minus( sum );
}
*/

/*****************************************************************************
 * Hyperbolic space is represented in the hyperboloid model
 * points are triples x,y,z such that x^2+y^2-z^1 = -1 (and z>0).  
 *****************************************************************************/
function HyperbolicPoint(v) {
  this.v = v.slice(0);
}

/*****************************************************************************
 * Return a point which has angle a and distance d from the origin
 *****************************************************************************/
HyperbolicPoint.angle_dist = function(a, d) {
  return new HyperbolicPoint( [Math.cos(a)*Math.sinh(d), 
                               Math.sin(a)*Math.sinh(d), 
                                    Math.cosh(d)         ] );
}

/*****************************************************************************
 * Hash a hyperbolic point to a string
 *****************************************************************************/
HyperbolicPoint.prototype.hash = function() {
  return [round(this.v[0],2).toFixed(2), round(this.v[1],2).toFixed(2)].toString();
}

/*****************************************************************************
 * Return the angle from the positive x-axis.  i.e. rotation by the 
 * negative of the result will cause the y coordinate to be 0
 *****************************************************************************/
HyperbolicPoint.prototype.angle = function() {
  return Math.atan2(this.v[1], this.v[0]);
}

/*****************************************************************************
 * Get the distance between two hyperbolic points
 *****************************************************************************/
HyperbolicPoint.prototype.dist = function(other) {
  var p = this.v[0]*other.v[0] + this.v[1]*other.v[1] - this.v[2]*other.v[2];
  return Math.acosh(-p);
}

/*****************************************************************************
 * Get the euclidean norm of a hyperbolic point
 *****************************************************************************/
HyperbolicPoint.prototype.euclidean_norm = function() {
  return Math.sqrt(this.v[0]*this.v[0] + this.v[1]*this.v[1] + this.v[2]*this.v[2]);
}

/*****************************************************************************
 * The benfit of the hyperboloid model is that hyperbolic 
 * isometries are linear.  The matrix is represented as an array of length 9
 *****************************************************************************/
function HyperbolicIsometry(m) {
  this.M = m.slice(0);
}

/*****************************************************************************
 * The identity
 *****************************************************************************/
HyperbolicIsometry.identity = function(p1, p2) {
  return new HyperbolicIsometry([1,0,0,0,1,0,0,0,1]);
}

/*****************************************************************************
 * Rotate counterclockwise by angle theta
 *****************************************************************************/
HyperbolicIsometry.rotate = function (theta) {
  return new HyperbolicIsometry( [ Math.cos(theta), -Math.sin(theta), 0, 
                                   Math.sin(theta), Math.cos(theta),  0,
                                        0,              0,            1 ] );
}

/*****************************************************************************
 * Do a hyperbolic isometry which moves the origin (0,0,1) to a 
 * point at distance d along the positive x axis (note the result of d 
 * and -d will be inverses)
 *****************************************************************************/
HyperbolicIsometry.translate_along_x = function(d) {
  return new HyperbolicIsometry( [ Math.cosh(d), 0, Math.sinh(d),
                                       0,        1,      0,
                                   Math.sinh(d), 0, Math.cosh(d) ] );
}

/*****************************************************************************
 * Do a hyperbolic isometry which moves the point (0,0,1) to the given point
 * and has an axis between these two points
 *****************************************************************************/
HyperbolicIsometry.translate_to_point = function(p) {
  var ang = p.angle();
  var dist = p.dist(new HyperbolicPoint([0,0,1]));
  var r1 = HyperbolicIsometry.rotate(ang);
  var r2 = HyperbolicIsometry.rotate(-ang);
  var f1 = HyperbolicIsometry.translate_along_x(dist);
  return r1.compose(f1.compose(r2));
}

/*****************************************************************************
 * Do a hyperbolic isometry which moves the given point to the origin
 * and has an axis between these two points
 *****************************************************************************/
HyperbolicIsometry.translate_from_point = function(p) {
  var ang = p.angle();
  var dist = p.dist(new HyperbolicPoint([0,0,1]));
  var r1 = HyperbolicIsometry.rotate(ang);
  var r2 = HyperbolicIsometry.rotate(-ang);
  var f1 = HyperbolicIsometry.translate_along_x(-dist);
  return r1.compose(f1.compose(r2));
}

/*****************************************************************************
 * Do a hyperbolic isometry which moves p1 to p2
 * and has an axis between these two points
 *****************************************************************************/
HyperbolicIsometry.translate = function(p1, p2) {
  var f = HyperbolicIsometry.translate_from_point(p1);
  var fI = HyperbolicIsometry.translate_to_point(p1);
  var fp2 = f.apply(p2);
  var g = HyperbolicIsometry.translate_to_point(fp2);
  return fI.compose(g.compose(f));
}

/*****************************************************************************
 * Do a hyperbolic isometry which has axis between p1 and p2 and translation
 * length d
 *****************************************************************************/
HyperbolicIsometry.translate_along_geodesic = function(p1, p2, d) {
  //move p1 to the origin
  var f = HyperbolicIsometry.translate_from_point(p1);
  var fp2 = f.apply(p2);
  var p2_ang = fp2.angle();
  var r = HyperbolicIsometry.rotate(-p2_ang);
  var fI = HyperbolicIsometry.translate_to_point(p1);
  var rI = HyperbolicIsometry.rotate(p2_ang);
  var t = HyperbolicIsometry.translate_along_x(d);
  return fI.compose(rI.compose(t.compose(r.compose(f))));
}

/*****************************************************************************
 * Do a hyperbolic isometry which takes p1 to the origin and takes 
 * p2 along the x axis
 *****************************************************************************/
HyperbolicIsometry.pair_to_x_axis = function(p1, p2) {
  var f = HyperbolicIsometry.translate_from_point(p1);
  var fp2 = f.apply(p2);
  var g = HyperbolicIsometry.rotate(-fpr.angle());
  return g.compose(f);
}
  
/*****************************************************************************
 * Do a hyperbolic isometry which takes a pair of points to another pair
 *****************************************************************************/
HyperbolicIsometry.edge_to_edge = function(e1, e2) {
  var p11 = e1[0];
  var p12 = e1[1];
  var p21 = e2[0];
  var p22 = e2[1];
  var f = HyperbolicIsometry.translate_from_point(p11);
  var fp12 = f.apply(p12);
  var afp12 = fp12.angle();
  var g = HyperbolicIsometry.translate_from_point(p21);
  var gI = HyperbolicIsometry.translate_to_point(p21);
  var gp22 = g.apply(p22);
  var agp22 = gp22.angle();
  var r = HyperbolicIsometry.rotate(agp22 - afp12);
  return gI.compose(r.compose(f));
}

/*****************************************************************************
 * Print an isometry
 *****************************************************************************/
HyperbolicIsometry.prototype.toString = function() {
  return 'HyperbolicIsometry(' + JSON.stringify(this.m) + ')';
}

/*****************************************************************************
 * Compose two isometries; return x |-> this(other(x)) 
 *****************************************************************************/
HyperbolicIsometry.prototype.compose = function(other) {
  //multiply the matrices
  var t = this.M;
  var o = other.M;
  var ans = [];
  for (var i=0; i<3; i++) {
    for (var j=0; j<3; j++) {
      ans[3*i+j] = t[3*i]*o[j] + t[3*i+1]*o[3+j] + t[3*i+2]*o[6+j];
    }
  }
  return new HyperbolicIsometry( ans );
}

/*****************************************************************************
 * Apply a hyperbolic isometry to a point
 *****************************************************************************/
HyperbolicIsometry.prototype.apply = function(p) {
  var ans = [];
  for (var i=0; i<3; i++) {
    ans[i] = this.M[3*i]*p.v[0] + this.M[3*i+1]*p.v[1] + this.M[3*i+2]*p.v[2];
  }
  return new HyperbolicPoint(ans);
}

/*****************************************************************************
 * Get the hyperbolic isometry which is the transpose
 *****************************************************************************/
HyperbolicIsometry.prototype.transpose = function() {
  return new HyperbolicIsometry([this.M[0], this.M[3], this.M[6],
                                 this.M[1], this.M[4], this.M[7],
                                 this.M[2], this.M[5], this.M[8]]);
}

/*****************************************************************************
 * Return a list of vertices equally spaced along the geodesic between 
 * p1 and p2.  Optionally discard the first and last points.  
 * breaks the interval into n intervals, so there are n-1, n, or n+1 points returned
 *****************************************************************************/
function hyperbolic_subdivide_geodesic(p1, p2, n, include_first, include_last) {
  //Get the natural isometry
  var d = p1.dist(p2);
  var f = HyperbolicIsometry.translate_along_geodesic(p1, p2, d/n);
  var ans = (include_first ? [p1] : []);
  var pi = p1;
  for (var i=1; i<n; i++) {
    pi = f.apply(pi);
    ans.push(pi);
  }
  if (include_last) ans.push(p2);
  return ans;
}



/*****************************************************************************
 * Return a point which is in the middle of a hyperbolic triangle
 * (probably not the actual centroid?)
 *****************************************************************************/
function hyperbolic_triangle_centroid(vertices) {
  var x = vertices[0].v[0] + vertices[1].v[0] + vertices[2].v[0];
  var y = vertices[0].v[1] + vertices[1].v[1] + vertices[2].v[1];
  var z = vertices[0].v[2] + vertices[1].v[2] + vertices[2].v[2];
  var p = x*x + y*y - z*z;
  var scale = Math.sqrt(-1/p);
  return new HyperbolicPoint([scale*x, scale*y, scale*z]);
}


/*****************************************************************************
 * Return an angle from a hyperbolic triangle
 *****************************************************************************/
function hyperbolic_triangle_angle(lengths, which) {
  var a = lengths[which];
  var b = lengths[(which+2)%3];
  var c = lengths[(which+1)%3];
  var cosC = - (Math.cosh(c)-Math.cosh(a)*Math.cosh(b)) / (Math.sinh(a)*Math.sinh(b));
  return Math.acos(cosC);
}

/*****************************************************************************
 * Return a list of angles from the list of triangle edge lengths
 *****************************************************************************/
function hyperbolic_triangle_angles(lengths) {
  //return [hyperbolic_triangle_angle(lengths, 0),
  //        hyperbolic_triangle_angle(lengths, 1),
  //        hyperbolic_triangle_angle(lengths, 2)];
  var cosh = lengths.map( Math.cosh );
  var sinh = lengths.map( Math.sinh );
  var ans = [0,0,0];
  for (var i=0; i<3; i++) {
    var cos_ang = (cosh[i]*cosh[(i+2)%3] - cosh[(i+1)%3]) / (sinh[i]*sinh[(i+2)%3]);
    ans[i] = Math.acos( cos_ang );
  }
  return ans;
}

/*****************************************************************************
 * Return a list of angles from the list of triangle edge lengths
 *****************************************************************************/
function hyperbolic_triangle_angles_decimal(lengths) {
  var cosh = lengths.map( decimal_cosh );
  var sinh = lengths.map( decimal_sinh );
  var ans = [];
  for (var i=0; i<3; i++) {
    var num = cosh[i].times(cosh[(i+2)%3]).minus(cosh[(i+1)%3]);
    var den = sinh[i].times(sinh[(i+2)%3]);
    ans[i] = decimal_acos( num.div(den) );
  }
  return ans;
}

/*****************************************************************************
 * Return a list of all the angle derivatives in the triangle
 * entry [i][j] is the derivative of angle i with respect to side j
 *****************************************************************************/
function hyperbolic_triangle_angle_derivs(lengths) {
  var a = lengths[0];
  var b = lengths[1];
  var c = lengths[2];
  var cosh = [Math.cosh(a), Math.cosh(b), Math.cosh(c)];
  var sinh = [Math.sinh(a), Math.sinh(b), Math.sinh(c)];
  var csch = [1.0/sinh[0], 1.0/sinh[1], 1.0/sinh[2]];
  var coth = [cosh[0]/sinh[0], cosh[1]/sinh[1], cosh[2]/sinh[2]];

  var ans = [[0,0,0],[0,0,0],[0,0,0]];
  
  //console.log('Getting angle derivs for ' + JSON.stringify(lengths));

  for (var i=0; i<3; i++) {
    var cosAng = coth[i]*coth[(i+2)%3] - cosh[(i+1)%3]*csch[i]*csch[(i+2)%3];
    var den = Math.sqrt(1.0 - cosAng*cosAng);
    for (var j=0; j<3; j++) {
      if (j==(i+1)%3) {
        ans[i][j] = csch[i]*csch[(i+2)%3]*sinh[(i+1)%3] / den;
      } else {
        var other_side = (j==i ? (j+2)%3 : (j+1)%3);
        ans[i][j] = csch[j]*(coth[other_side]*csch[j] - cosh[(i+1)%3]*coth[j]*csch[other_side]) / den;
      }
    }
  }

  //console.log('Returning ' + JSON.stringify(ans));
 
  return ans;  
}

/*****************************************************************************
 * Return a list of all the angle derivatives in the triangle
 * entry [i][j] is the derivative of angle i with respect to side j
 *****************************************************************************/
/*
function hyperbolic_triangle_angle_derivs_decimal(lengths) {
  var cosh = lengths.map( decimal_cosh );
  var sinh = lengths.map( decimal_sinh );
  var csch = sinh.map( decimal_reciprocal );
  var coth = [cosh[0].div(sinh[0]), cosh[1].div(sinh[1]), cosh[2].div(sinh[2])];

  var ans = [[],[],[]];
  
  for (var i=0; i<3; i++) {
    var cosAng = coth[i].times(coth[(i+2)%3]).minus( cosh[(i+1)%3].times(csch[i]).times(csch[(i+2)%3]) );
    var den = Decimal.ONE.minus(cosAng.times(cosAng)).sqrt();
    for (var j=0; j<3; j++) {
      if (j==(i+1)%3) {
        ans[i][j] = csch[i].times(csch[(i+2)%3]).times(sinh[(i+1)%3]).div( den );
      } else {
        var other_side = (j==i ? (j+2)%3 : (j+1)%3);
        ans[i][j] = csch[j].times( 
                      coth[other_side].times(csch[j]).minus( 
                                 cosh[(i+1)%3].times(coth[j]).times(csch[other_side])) ).div( den );
      }
    }
  }
  
  return ans;  
}
*/

/*****************************************************************************
 * Return the point p3 such that the line p1 -> p3 makes the angle a 
 * with the line p1->p2, and p3 is distance d from p1
 *****************************************************************************/
function hyperbolic_point_at_angle(p1, p2, a, d) {
  //translate p1 to the origin
  var f = HyperbolicIsometry.translate_from_point(p1);
  var fp2 = f.apply(p2);
  //get the angle of fp2
  var p2ang = fp2.angle();
  //get the new point which has angle a+p2ang
  var fp3 = HyperbolicPoint.angle_dist(a+p2ang, d);
  //act by f inverse
  var fI = HyperbolicIsometry.translate_to_point(p1);
  var p3 = fI.apply(fp3);
  return p3;
}

/*****************************************************************************
 * Return a list of vertices of the hyperbolic triangle with lengths 
 * and angles given such that side j goes along the edge given
 *****************************************************************************/
function hyperbolic_triangle_place_along_edge(edge, lengths, angles, j) {
  var v1 = edge[0];
  var v2 = edge[1];
  var L = lengths[(j+2)%3];
  var a = angles[j];
  var v3 = hyperbolic_point_at_angle(v1, v2, a, L);
  var ans = [];
  ans[j] = v1;
  ans[(j+1)%3] = v2;
  ans[(j+2)%3] = v3;
  return ans;
}

/*****************************************************************************
 * Return a list of three points such that the triangle has vertex 0 at 
 * the origin and side 0 runs along the x axis
 *****************************************************************************/
function hyperbolic_triangle_place_at_origin(lengths, angles) {
  var p1 = new HyperbolicPoint([0,0,1]);
  var p2 = HyperbolicPoint.angle_dist(0, lengths[0]);
  var p3 = HyperbolicPoint.angle_dist(angles[0], lengths[2]);
  return [p1,p2,p3];
}

/*****************************************************************************
 *
 * A hyperbolic triangulation
 * For each triangle in the triangulation, it provides lists [l0,l1,l2] and 
 * [a0, a1, a2] of lengths and angles (the lengths are thus recorded twice, unfortunately)
 *
 *****************************************************************************/
function HyperbolicTriangulation(T, lengths) {
  this.T = T;
  this.triangle_lengths = lengths;
  this.triangle_angles = lengths.map(hyperbolic_triangle_angles);
}

/*****************************************************************************
 * print a hyperbolic triangulation
 *****************************************************************************/
HyperbolicTriangulation.prototype.toString = function() {
  return 'Hyperbolic triangulation:\n' + this.T +
         '\nLengths: ' + JSON.stringify(this.triangle_lengths) + 
         '\nAngles: ' + JSON.stringify(this.triangle_angles);
}


/*****************************************************************************
 * Minimize the function f in the direction given by the vector v.
 * The step size is the approximate scale; it'll use it to bracket a 
 * min and do golden section search.  The reason is that the steepest descent 
 * step seems to be quite slow to converge directly, and we don't want to 
 * use the second derivative.  Here we evaluate f(x, false) at each step, 
 * in case f wants an argument telling it not to return the gradient.
 * This function returns the new minimum point
 *****************************************************************************/
function golden_section_search(f, X, v, step, tol) {
  var max_iters = 100;
  var iters = 0;
  var x1 = 0;
  var fx1 = f(X, false);
  var x2 = 0;
  var fx2 = 0;
  var x3 = 0;
  var fx3 = 0;
  var x4 = 0;
  var fx4 = 0;
  var temp_pt = Array.apply(null, Array(X.length)).map(function () { return 0; });

  function evalf(t) {
    for (var i=0; i<X.length; i++) {
      temp_pt[i] = X[i] + v[i]*t;
    }
    return f(temp_pt, false);
  }

  //initial bracket
  iters = 0;
  while (iters < max_iters) {
    x3 = step*Math.pow(2,iters);
    fx3 = evalf(x3);
    x2 = 0.6180339887498948*x1 + 0.3819660112501052*x3;
    fx2 = evalf(x2);
    if (fx1 > fx2 && fx2 < fx3) break;
    iters++;
  }
  
  if (iters == max_iters) {
    console.log('Failed to bracket interval');
    return temp_pt;
  }
  //console.log('Golden search bracket (' + iters + ': ' + JSON.stringify([x1,x2,x3]) + ' ' + JSON.stringify([fx1,fx2,fx3]));

  //run the search
  iters = 0;
  while ( Math.max(fx1,fx2,fx3) - Math.min(fx1,fx2,fx3) > tol && iters < max_iters) {
    if (x2-x1 < x3-x2) {  //right gap is wider
      x4 = 0.6180339887498948*x2 + 0.3819660112501052*x3;
      fx4 = evalf(x4);
      if (fx4 > fx2) {
        x3 = x4;
        fx3 = fx4;
      } else {
        x1 = x2;
        fx1 = fx2;
        x2 = x4;
        fx2 = fx4;
      }
    } else { //left gap is wider
      x4 = 0.6180339887498948*x2 + 0.3819660112501052*x1;
      fx4 = evalf(x4);
      if (fx4 > fx2) {
        x1 = x4;
        fx1 = fx4;
      } else {
        x3 = x2;
        fx3 = fx2;
        x2 = x4;
        fx2 = fx4;
      }
    }
    iters++;
  }
  for (var i=0; i<X.length; i++) {
    temp_pt[i] = X[i] + v[i]*x2;
  }
  return temp_pt;
}

/*****************************************************************************
 * Same but with Decimal.js
 *****************************************************************************/  
/*
function golden_section_search_decimal(f, X, v, step, tol) {
  var max_iters = 100;
  var iters = 0;
  var x1 = Decimal.ZERO;
  var fx1 = f(X, false);
  var x2 = Decimal.ZERO;
  var fx2 = Decimal.ZERO;
  var x3 = Decimal.ZERO;
  var fx3 = Decimal.ZERO;
  var x4 = Decimal.ZERO;
  var fx4 = Decimal.ZERO;
  var temp_pt = Array.apply(null, Array(X.length)).map(function () { return Decimal.ZERO; });

  function evalf(t) {
    for (var i=0; i<X.length; i++) {
      temp_pt[i] = X[i].plus(v[i].times(t));
    }
    return f(temp_pt, false);
  }

  //initial bracket
  iters = 0;
  while (iters < max_iters) {
    x3 = step.times( new Decimal(2<<iters) );
    fx3 = evalf(x3);
    x2 = Decimal.oneOverPhi.times(x1).plus( Decimal.oneMinusOneOverPhi.times(x3) );
    fx2 = evalf(x2);
    if (fx1.gt(fx2) && fx2.lt(fx3)) break;
    iters++;
  }
  
  if (iters == max_iters) {
    console.log('Failed to bracket interval');
    return temp_pt;
  }
  //console.log('Golden search bracket (' + iters + ': ' + JSON.stringify([x1,x2,x3]) + ' ' + JSON.stringify([fx1,fx2,fx3]));

  //run the search
  iters = 0;
  while ( Decimal.max(fx1,fx2,fx3).minus(Decimal.min(fx1,fx2,fx3)).gt(tol) && iters < max_iters) {
    if (x2.minus(x1).lt(x3.minus(x2)) ) {  //right gap is wider
      x4 = Decimal.oneOverPhi.times(x2).plus( Decimal.oneMinusOneOverPhi.times(x3) );
      fx4 = evalf(x4);
      if (fx4.gt(fx2)) {
        x3 = x4;
        fx3 = fx4;
      } else {
        x1 = x2;
        fx1 = fx2;
        x2 = x4;
        fx2 = fx4;
      }
    } else { //left gap is wider
      x4 = Decimal.oneOverPhi.times(x2).plus( Decimal.oneMinusOneOverPhi.times(x1) );
      fx4 = evalf(x4);
      if (fx4.gt(fx2)) {
        x1 = x4;
        fx1 = fx4;
      } else {
        x3 = x2;
        fx3 = fx2;
        x2 = x4;
        fx2 = fx4;
      }
    }
    iters++;
  }
  for (var i=0; i<X.length; i++) {
    temp_pt[i] = X[i].plus(v[i].times(x2));
  }
  return temp_pt;
}
*/

/*****************************************************************************
 * Use steepest descent to globally minimize the function f, subject
 * to the restriction that all the variables are nonnegative.  Starting
 * at the point X.  Returns {'status': , 'x': , 'value': } which have the status 
 * ('success' or 'failure') and the optimal point and value.
 * For speed, if the function f takes a second argument which, when false, 
 * causes it just to return the value, not the gradient, it'll be faster.
 * This function takes maximum steps of 0.1 on every variable at every iteration
 *****************************************************************************/
function minimize(f, X) {
  var iter_limit = 1000;
  var tol = 1e-13;
  var max_move = 0.1;

  var op = {'status':'failure'};
  op.x = X.slice(0);
  var evalf = f(op.x);
  op.value = evalf[0];
  var gradfx = evalf[1];
  var iters = 0;
  while (iters < iter_limit) {

    //console.log('Optimization step ' + iters);
    //console.log('Value: ' + op.value);
    //console.log('x: ' + JSON.stringify(op.x));
    //console.log('Gradient: ' + JSON.stringify(gradfx));

    //check if the value is close enough to 0
    if (Math.abs(op.value) < tol) {
      op.status = 'success';
      break;
    }
    //check how far we can move in the direction of -gradient 
    //before we make one of the coordinates 0
    var move_limit = 'inf';
    for (var i=0; i<X.length; i++) {
      var this_move_limit = (Math.abs(gradfx[i]) < tol
                             ? 'inf' 
                             : Math.min( Math.abs(0.1/gradfx[i]), 
                                         Math.abs(op.x[i]/gradfx[i]) ) );
      //if we can't move at all, then we're on teh boundary
      if (this_move_limit != 'inf' && Math.abs(this_move_limit) < tol ) {
        alert('Hyperbolic structure has degenerate triangles?');
        return op;
      }
      if (move_limit == 'inf' || this_move_limit < move_limit) {
        move_limit = this_move_limit;
      }
    }

    //console.log('Move limit: ' + move_limit);

    //compute the directional derivative of f in the 
    //projected direction
    var dir_deriv = 0;
    var projected_norm = 0;
    for (var i=0; i<X.length; i++) {
      dir_deriv = dir_deriv + gradfx[i]*gradfx[i]
    }
    dir_deriv = Math.sqrt(dir_deriv);
    
    //get the distance we want to go;
    var desired_move = op.value/dir_deriv;

    //maybe we can't go that far
    var movement = (move_limit == 'inf' || desired_move < move_limit ? desired_move : move_limit);

    //console.log('Directional deriv: ' + dir_deriv);
    //console.log('Movement: ' + movement);
  
    //make the step by minimizing along the line
    for (var i=0; i<gradfx.length; i++) {
      gradfx[i] = -gradfx[i];
    }
    op.x = golden_section_search(f, op.x, gradfx, 0.5*movement, tol);

    //get the new function value
    evalf = f(op.x);
    op.value = evalf[0];
    gradfx = evalf[1];
    iters++;
  }
  return op;
}

/*****************************************************************************
 * Use steepest descent to globally minimize the function f, subject
 * to the restriction that all the variables are nonnegative.  Starting
 * at the point X.  Returns {'status': , 'x': , 'value': } which have the status 
 * ('success' or 'failure') and the optimal point and value.
 * For speed, if the function f takes a second argument which, when false, 
 * causes it just to return the value, not the gradient, it'll be faster.
 * This function takes maximum steps of 0.1 on every variable at every iteration
 * This function uses the Decimal.js library
 *****************************************************************************/
/*
function minimize_decimal(f, X) {
  var iter_limit = 1000;
  var tol = new Decimal('1e-8');
  var max_move = new Decimal('0.1');
  var tenth = new Decimal('0.1');

  var op = {'status':'failure'};
  op.x = X.map(function (p) { return new Decimal(p); });
  var evalf = f(op.x);
  op.value = evalf[0];
  var gradfx = evalf[1];
  var projected_gradfx = gradfx.slice(0);
  var iters = 0;
  while (iters < iter_limit) {

    console.log('Optimization step ' + iters);
    console.log('Value: ' + op.value);
    console.log('x: ' + JSON.stringify(op.x));
    console.log('Gradient: ' + JSON.stringify(gradfx));

    //check if the value is close enough to 0
    if (op.value.abs().lt(tol)) {
      op.status = 'success';
      break;
    }
    //check how far we can move in the direction of -gradient 
    //before we make one of the coordinates 0
    var move_limit = 'inf';
    for (var i=0; i<X.length; i++) {
      var this_move_limit = (gradfx[i].abs().lt(tol)
                             ? 'inf' 
                             : Decimal.min( tenth.div(gradfx[i]).abs(), 
                                            op.x[i].div(gradfx[i]).abs() ) );
      //if we can't move at all, then actually, we just 
      //ignore this variable (project to the subspace where we don't move it)
      if (this_move_limit != 'inf' && this_move_limit.abs().lt(tol) ) {
        projected_gradfx[i] = new Decimal('0');
        continue;
      }
      projected_gradfx[i] = gradfx[i];
      if (move_limit == 'inf' || this_move_limit.lt(move_limit)) {
        move_limit = this_move_limit;
      }
    }

    console.log('Move limit: ' + move_limit);

    //compute the directional derivative of f in the 
    //projected direction
    var dir_deriv = Decimal.ZERO;
    var projected_norm = Decimal.ZERO;
    for (var i=0; i<X.length; i++) {
      dir_deriv = dir_deriv.plus( projected_gradfx[i].times(gradfx[i]) );
      projected_norm = projected_norm.plus( projected_gradfx[i].times(projected_gradfx[i]) );
    }
    projected_norm = projected_norm.sqrt();
    dir_deriv = dir_deriv.div(projected_norm);
    
    //get the distance we want to go;
    var desired_move = op.value.div(dir_deriv);

    //maybe we can't go that far
    var movement = (move_limit == 'inf' || desired_move.lt(move_limit) ? desired_move : move_limit);

    //console.log('Projected gradient: ' + JSON.stringify(projected_gradfx));
    console.log('Directional deriv: ' + dir_deriv);
    console.log('Movement: ' + movement);

    //make the step 
    //for (var i=0; i<X.length; i++) {
    //  op.x[i] = op.x[i] - movement * projected_gradfx[i];
    //}
  
    //make the step by minimizing along the line
    for (var i=0; i<projected_gradfx.length; i++) {
      projected_gradfx[i] = projected_gradfx[i].neg();
    }
    op.x = golden_section_search_decimal(f, op.x, projected_gradfx, movement.div(Decimal.TWO), tol);

    //get the new function value
    evalf = f(op.x);
    op.value = evalf[0];
    gradfx = evalf[1];
    iters++;
  }
  //convert the decimals back to floats
  op.x_float = [];
  for (var i=0; i<X.length; i++) {
    op.x_float[i] = op.x[i].toNumber();
  }
  return op;
}
*/

/*****************************************************************************
 * Use steepest descent to guess a hyperbolic triangulation given a 
 * topological triangulation
 *****************************************************************************/
HyperbolicTriangulation.hyperbolize_triangulation = function(T, triangle_length_hints) {
  if (triangle_length_hints === undefined) {
    var triangle_lengths = Array.apply(null, Array(T.num_triangles)).map( function() { return [1,1,1]; });
  } else {
    var triangle_lengths = triangle_length_hints;
  }

  //console.log('Input triangle lengths', triangle_lengths, triangle_length_hints===undefined);

  //Make a variable vector which just has the lengths; 
  //we simultaneously make a list which records, for each triangle side, 
  //which variable is its length
  var X = [];
  var triangle_X = Array.apply(null, Array(T.num_triangles)).map(function (){ return [-1,-1,-1];});
  for (var i=0; i<T.num_triangles; i++) {
    for (var j=0; j<3; j++) {
      if (triangle_X[i][j] == -1) {
        triangle_X[i][j] = X.length;
        var nT = T.triangle_neighbors[i][j];
        if (nT[0] != -1) {
          triangle_X[nT[0]][nT[1]] = X.length;
        }
        X.push(triangle_lengths[i][j]);
      }
    }
  }
  
  //Make a function which computes the sum of squares of angle error
  //and also the gradient vector; uses Decimal.js
  var angle_error_and_gradient = function(x, do_grad) {
    //create a vector to record the vertices
    var vert_error = Array.apply(null, Array(T.num_vertices)).map(function(){return 0;});
    var vert_full = Array.apply(null, Array(T.num_vertices)).map(function(){return true;});
    //go through each triangle and record the angle contributions
    for (var i=0; i<T.num_triangles; i++) {
      var current_lengths = [x[triangle_X[i][0]], 
                             x[triangle_X[i][1]],
                             x[triangle_X[i][2]]];
      var current_angles = hyperbolic_triangle_angles(current_lengths);
      for (var j=0; j<3; j++){ 
        vert_error[ T.triangle_vertices[i][j] ] += current_angles[j];
        if (T.triangle_neighbors[i][j][0] == -1) {
          vert_full[ T.triangle_vertices[i][j] ] = false;
          vert_full[ T.triangle_vertices[i][(j+1)%3] ] = false;
        }
      }
    }

    //console.log('Vertex angle sums: ' + JSON.stringify(vert_error));
    //console.log('Vertex full: ' + JSON.stringify(vert_full));

    //add up the sum of the squares of the errors
    var err = 0;
    for (var i=0; i<T.num_vertices; i++){ 
      vert_error[i] -= (vert_full[i] ? 2*Math.PI : Math.PI);
      err += vert_error[i]*vert_error[i];
    }

    //console.log('Error summands: ' + JSON.stringify(vert_error));

    if (do_grad != undefined && !do_grad) {
      return err;
    }

    //compute the gradient
    var grad = Array.apply(null, Array(x.length)).map(function(v,i) {return 0;});
    for (var i=0; i<T.num_triangles; i++) {
      var current_lengths = [x[triangle_X[i][0]], 
                             x[triangle_X[i][1]],
                             x[triangle_X[i][2]]];
      var angle_derivs = hyperbolic_triangle_angle_derivs(current_lengths);
      for (var j=0; j<3; j++) {
        var x_coord = triangle_X[i][j];
        for (var k=0; k<3; k++) {
          var vert = T.triangle_vertices[i][k];
          grad[x_coord] += 2*vert_error[vert]*angle_derivs[k][j];
        }
      }
    }
    return [err, grad];
  }
  
  var op = minimize(angle_error_and_gradient, X);

  if (op.status != 'success') {
    console.log('Optimization error\n');
    return;
  }

  var lengths = Array.apply(null, Array(T.num_triangles)).map(function () { return [0,0,0]; });
  for (var i=0; i<T.num_triangles; i++) {
    for (var j=0; j<3; j++) {
      lengths[i][j] = op.x[triangle_X[i][j]];
    }
  }
  
  return new HyperbolicTriangulation(T, lengths);
}


/*****************************************************************************
 *
 * An embedded hyperbolic triangulation which covers a fundamental domain.
 * It contains HT, the original hyperbolic triangulation, which must have 
 * a base FDTriangulation (not just Triangulation), and it contains 
 * another FDTriangulation which gives the upstairs triangulation,
 * plus a list which records, for each upstairs triangle, which 
 * triangle it covers downstairs, and for each upstairs vertex, where it is
 *
 *****************************************************************************/
function EmbeddedHyperbolicTriangulation_old(HT, data) {
  this.HT = HT;
  this.FDT = data.FDT;
  this.vertex_locations = data.vertex_locations;
  this.vertex_coverees = data.vertex_coverees;
  this.vertex_coverers = data.vertex_coverers;
  this.triangle_coverees = data.triangle_coverees;
  this.triangle_coverers = data.triangle_coverers;

  //Find the fd boundary identifications

  //Record the vertex hashes so we know if we hit them again
  this.vertex_locations_inverse = {};
  for (var i=0; i<this.FDT.num_vertices; i++) {
    this.vertex_locations_inverse[this.vertex_locations[i].hash()] = i;
  }

  //we need to create a map which remembers what edges have already been 
  //placed so that we don't re-place the same edge.
  //this is only necessary on *exposed* (fd_boundary) edges
  this.fd_boundaries_inverse = {};
  for (var i=0; i<this.FDT.num_triangles; i++) {
    var fdb = this.FDT.triangle_fd_boundaries[i];
    if (fdb !== undefined) {
      for (var j=0; j<fdb.length; j++) {
        var vi1 = this.FDT.triangle_vertices[i][fdb[j]];
        var vi2 = this.FDT.triangle_vertices[i][(fdb[j]+1)%3];
        this.fd_boundaries_inverse[[vi1,vi2].toString()] = [i, fdb[j]];
      }
    }
  }

}

/*****************************************************************************
 * An embedded hyperbolic triangulation has a HyperbolicTriangulation 
 * (with base triangulation which must be an FDTriangulation), plus 
 * data recording the vertex locations of all the triangles; note there is more 
 * than one vertex covering each triangulation vertex
 *****************************************************************************/
function EmbeddedHyperbolicTriangulation(HT, data) {
  this.HT = HT;
  this.basepoint = data.basepoint;
  this.triangle_vertex_locations = data.triangle_vertex_locations;
  this.fd_identification_isometries = data.fd_identification_isometries;
}

/*****************************************************************************
 * Embed a hyperbolic triangulation (with base FDTriangulation)
 *****************************************************************************/
EmbeddedHyperbolicTriangulation.embed_hyperbolic_triangulation = function(HT) {
  
  var data = {'triangle_vertex_locations':[]};

  //embed the first triangle
  data.triangle_vertex_locations[0] = hyperbolic_triangle_place_at_origin(HT.triangle_lengths[0],
                                                                          HT.triangle_angles[0]);
  
  //add its neighbors to the stack
  var stack = []
  for (var i=0; i<3; i++) {
    //if there is a boundary, we don't want to glue that triangle here
    if (HT.T.triangle_fd_boundaries[0][i]) continue;
    stack.push( [HT.T.triangle_neighbors[0][i][0], [0,i]] );
  }

  //now go
  while (stack.length > 0) {
    var s_entry = stack.pop();
    var new_ti = s_entry[0];
    if (data.triangle_vertex_locations[new_ti] !== undefined) continue;
    var old_ti = s_entry[1][0];
    var old_j = s_entry[1][1];
    var new_j = HT.T.triangle_neighbors[old_ti][old_j][1];
    var v1 = data.triangle_vertex_locations[old_ti][old_j];
    var v2 = data.triangle_vertex_locations[old_ti][(old_j+1)%3];
    data.triangle_vertex_locations[new_ti] = hyperbolic_triangle_place_along_edge(
                                               [v2, v1], 
                                               HT.triangle_lengths[new_ti],
                                               HT.triangle_angles[new_ti], 
                                               new_j);
    for (var i=0; i<3; i++) {
      if (HT.T.triangle_neighbors[new_ti][i][0] == -1 ||
          HT.T.triangle_fd_boundaries[new_ti][i]) continue;
      stack.push( [HT.T.triangle_neighbors[new_ti][i][0], [new_ti, i]] );
    }
  }

  //the triangles are embedded; we just need to find the 
  //identification isometries.  Note it may identify multiple 
  //edges theoretically; but *any* should determine the map
  data.fd_identification_isometries = [];
  for (var i=0; i<HT.T.fd_identifications.length; i++) {
    var start = HT.T.fd_identifications[i].ids[0][0];
    var end = HT.T.fd_identifications[i].ids[0][1];
    var start_verts = [ data.triangle_vertex_locations[start[0]][start[1]],
                        data.triangle_vertex_locations[start[0]][(start[1]+1)%3] ];
    var end_verts = [ data.triangle_vertex_locations[end[0]][(end[1]+1)%3],
                      data.triangle_vertex_locations[end[0]][end[1]] ];
    data.fd_identification_isometries[i] = [ HyperbolicIsometry.edge_to_edge(end_verts, start_verts),
                                             HyperbolicIsometry.edge_to_edge(start_verts, end_verts) ];
  }

  data.basepoint = data.triangle_vertex_locations[0][0];

  return new EmbeddedHyperbolicTriangulation(HT, data);

}
    

/*****************************************************************************
 * Embed a hyperbolic triangulation (with base FDTriangulation)
 *****************************************************************************/
EmbeddedHyperbolicTriangulation.prototype.display_data = function() {
  var D = {'vertex_locations':[], 
           'flat_triangle_vertices':[],
           'flat_line_vertices':[],
           'flat_thick_line_vertices':[]};
  var global_offset = 0;
  for (var i=0; i<this.HT.T.num_triangles; i++) {
    global_offset = D.vertex_locations.length;
    //each edge verts list contains the first but not last vertex
    var edge_verts = [];
    var local_offset = 0;
    for (var j=0; j<3; j++) {
      edge_verts[j] = hyperbolic_subdivide_geodesic(this.triangle_vertex_locations[i][j],
                                                    this.triangle_vertex_locations[i][(j+1)%3],
                                                    10, true, false);

      //add them to the vertex list
      Array.prototype.push.apply(D.vertex_locations, edge_verts[j]);
      //for each vertex, add in its index
      for (var k=0; k<edge_verts[j].length; k++) {
        edge_verts[j][k] = global_offset + local_offset;
        local_offset++;
      }
    }
    var midpoint_ind = edge_verts[0].length/2;
    //add the sub triangles; j is the vertex from which the strip emanates
    for (var j=0; j<3; j++) {
      var right_side = edge_verts[j];
      var left_side = edge_verts[(j+2)%3];
      var LL = left_side.length;
      //draw the first
      D.flat_triangle_vertices.push( right_side[0], right_side[1], left_side[LL-1] );
      for (var k=1; k<=left_side.length/2; k++){
        D.flat_triangle_vertices.push( left_side[LL-k], right_side[k], right_side[k+1] );
        D.flat_triangle_vertices.push( left_side[LL-k], right_side[k+1], left_side[LL-k-1] );
      }
    } 
    //add the triangle in the middle
    D.flat_triangle_vertices.push( edge_verts[0][midpoint_ind], 
                                   edge_verts[1][midpoint_ind],
                                   edge_verts[2][midpoint_ind] );
    //add in the borders, if necessary
    for (var j=0; j<3; j++){ 
      if (this.HT.T.triangle_neighbors[i][j][0] == -1) {
        for (var k=0; k<edge_verts[j].length-1; k++) {
          D.flat_thick_line_vertices.push( edge_verts[j][k], edge_verts[j][k+1] );
        }
        D.flat_thick_line_vertices.push( edge_verts[j][edge_verts[j].length-1], 
                                         edge_verts[(j+1)%3][0] );
      } else if (this.HT.T.triangle_fd_boundaries[i][j]) {
        for (var k=0; k<edge_verts[j].length-1; k++) {
          D.flat_line_vertices.push( edge_verts[j][k], edge_verts[j][k+1] );
        }
        D.flat_line_vertices.push( edge_verts[j][edge_verts[j].length-1], 
                                   edge_verts[(j+1)%3][0] );
      }
    }

  }

  //D.flat_vertex_locations = new Float32Array(3*D.vertex_locations.length);
  //for (var i=0; i<D.vertex_locations.length; i++) {
  //  D.flat_vertex_locations[3*i] = D.vertex_locations[i].v[0];
  //  D.flat_vertex_locations[3*i+1] = D.vertex_locations[i].v[1];
  //  D.flat_vertex_locations[3*i+2] = D.vertex_locations[i].v[2];
  //}
  //D.flat_triangle_vertices = new Uint16Array(D.flat_triangle_vertices);
  //D.flat_line_vertices = new Uint16Array(D.flat_line_vertices);
  //D.flat_thick_line_vertices = new Uint16Array(D.flat_thick_line_vertices);

  return D;
    
}

/*****************************************************************************
 * Print an embedded hyperbolic triangulation
 *****************************************************************************/
EmbeddedHyperbolicTriangulation.prototype.toString = function() {
  return 'Embedded hyperbolic triangulation:\n' + 
         '\nTriangulation: ' + this.HT.T.toString() +
         '\nHyperbolizations: ' + this.HT.toString() +  
         '\nTriangle vertex locations: ' + JSON.stringify(this.triangle_vertex_locations) + 
         '\nIdentification isometries: ' + JSON.stringify(this.fd_identification_isometries);
}

/*****************************************************************************
 * Generate the set of isometries which move the basepoint less than 
 * distance d
 *****************************************************************************/
EmbeddedHyperbolicTriangulation.prototype.isometries = function(d) {
  var ans = {};
  var stack = [{'point': new HyperbolicPoint([0,0,1]),
                  'map':HyperbolicIsometry.identity(), 
                 'word':[]} ];
  var II = this.fd_identification_isometries;
  var origin = new HyperbolicPoint([0,0,1]);
  while (stack.length > 0) {
    var cur_isom = stack.pop();
    var phash = cur_isom.point.hash();
    if (phash in ans && cur_isom.word.length >= ans[phash].word.length) {
      continue;
    }
    //put the current one on the stack
    ans[phash] = cur_isom;
    //add all possible children (recall children are on the left)
    for (var i=0; i<II.length; i++) {
      if (cur_isom.word[0] != -(i+1)) {
        var new_isom = {'word':cur_isom.word.slice(0),
                         'map':II[i][0].compose(cur_isom.map),
                       'point':II[i][0].apply(cur_isom.point) };
        new_isom.word.unshift(i+1);
        if (new_isom.point.dist(origin) <= d) stack.unshift(new_isom);
      }
      if (cur_isom.word[0] != (i+1)) {
        var new_isom = {'word':cur_isom.word.slice(0),
                         'map':II[i][1].compose(cur_isom.map),
                       'point':II[i][1].apply(cur_isom.point) };
        new_isom.word.unshift(-(i+1));
        if (new_isom.point.dist(origin) <= d) stack.unshift(new_isom);
      }
    }
  }
  return ans;
}






/*****************************************************************************
 * Embed a hyperbolic triangulation (with base FDTriangulation)
 *****************************************************************************/
EmbeddedHyperbolicTriangulation.embed_hyperbolic_triangulation_old = function (HT) {

  var tri_vertices = [];
  var tri_neighbors = [];
  var tri_fd_boundaries = [];
  var tri_coverers = new Array(HT.T.num_triangles);
  var tri_coverees = [];
  
  var vert_locs = [];
  var vert_coverers = new Array(HT.T.num_vertices);
  var vert_coverees = [];

  //Place the first triangle so the first vertex lies at the origin
  //and so that the first edge goes in the positive x direction
  //(the top of the hyperboloid is the "outside"/"up" face)
  var new_tri = hyperbolic_triangle_place_at_origin(HT.triangle_lengths[0], 
                                                    HT.triangle_angles[0]);
  vert_locs = new_tri;
  for (var i=0; i<3; i++) {
    var vi = HT.T.triangle_vertices[0][i];
    if (vert_coverers[vi] === undefined) vert_coverers[vi] = [];
    vert_coverers[vi].push(i);
    vert_coverees[i] = vi;
  }
  
  tri_vertices.push( [0,1,2] );
  tri_coverees.push( 0 );
  tri_coverers[0] = [0];
  tri_fd_boundaries = [ [0,1,2] ];
  tri_neighbors = [ [[-1,-1],[-1,-1],[-1,-1]] ];
  
  var fddata = {'num_vertices':3, 
                'num_triangles':1, 
                'triangle_vertices':tri_vertices,
                'triangle_neighbors':tri_neighbors,
                'triangle_fd_boundaries':tri_fd_boundaries};
  var data = {};
  data.FDT = new FDTriangulation(fddata);
  data.vertex_locations = vert_locs;
  data.vertex_coverees = vert_coverees;
  data.vertex_coverers = vert_coverers;
  data.triangle_coverees = tri_coverees;
  data.triangle_coverers = tri_coverers;
  
  var EHT = new EmbeddedHyperbolicTriangulation(HT, data);

  console.log('Create initial EHT:\n' + EHT);

  //now fill out the rest of the triangles in this lift
  EHT.fill_from_initial(0);

  //fill to a reasonable distance bound
  //EHT.fill_to_distance(15);

  return EHT;
}

/*****************************************************************************
 * Print an embedded hyperbolic triangulation
 *****************************************************************************/
EmbeddedHyperbolicTriangulation.prototype.toString_old = function() {
  return 'Embedded hyperbolic triangulation:\n' + 
         this.FDT.toString() + 
         '\nVertex locations: ' + JSON.stringify(this.vertex_locations) + 
         '\nVertex coverers: ' + JSON.stringify(this.vertex_coverers) + 
         '\nVertex coverees: ' + JSON.stringify(this.vertex_coverees) + this.vertex_coverees +  
         '\nTriangle coverers: ' + JSON.stringify(this.triangle_coverers) + 
         '\nTriangle coverees: ' + JSON.stringify(this.triangle_coverees) + 
         '\nFD boundaries inverse: ' + JSON.stringify(this.fd_boundaries_inverse) + 
         '\nVertex locations inverse: ' + JSON.stringify(this.vertex_locations_inverse);
}


/*****************************************************************************
 * Given an embedded hyperbolic triangulation, plus the index of a triangle,
 * it glues on triangles until it's the case that every unglued edge 
 * upstairs is an fd_boundary downstairs
 *****************************************************************************/
EmbeddedHyperbolicTriangulation.prototype.fill_from_initial = function (initial_ti) {
  var stack = [initial_ti];
  while (stack.length > 0) {
    var ti = stack.pop();
    var covered_ti = this.triangle_coverees[ti];
    var fdb = this.FDT.triangle_fd_boundaries[ti];
    if (fdb === undefined) continue;
    for (var i=0; i<fdb.length; i++) {
      var j = fdb[i];
      if (this.HT.T.triangle_neighbors[covered_ti][j][0] == -1) continue;
      if (this.HT.T.triangle_fd_boundaries[covered_ti] === undefined ||
          this.HT.T.triangle_fd_boundaries[covered_ti].indexOf(j) == -1) {
        console.log('About to place a triangle on side ' + j + ' of triangle ' + ti);
        var new_ti = this.place_new_lift(ti, j);
        console.log('After: \n' + this);
        stack.push(new_ti);
      }
    }
  }
}

/*****************************************************************************
 * Given an embedded hyperbolic triangulation, it glues on triangles until it's 
 * the case that every unglued edge upstairs is an fd_boundary downstairs and 
 * is (Euclidean) distance at least distance_bound from the origin
 *****************************************************************************/
EmbeddedHyperbolicTriangulation.prototype.fill_to_distance = function (distance_bound) {
  //throw in all the triangles onto the stack!
  var stack = range_array(this.FDT.num_triangles);
  while (stack.length > 0) {
    var ti = stack.pop();
    var covered_ti = this.triangle_coverees[ti];
    var fdb = this.FDT.triangle_fd_boundaries[ti];
    if (fdb === undefined) continue;
    var dist = Math.min( this.vertex_locations[ this.FDT.triangle_vertices[ti][0] ].euclidean_norm(),
                         this.vertex_locations[ this.FDT.triangle_vertices[ti][1] ].euclidean_norm(),
                         this.vertex_locations[ this.FDT.triangle_vertices[ti][2] ].euclidean_norm() );
    for (var i=0; i<fdb.length; i++) {
      var j = fdb[i];
      if (this.HT.T.triangle_neighbors[covered_ti][j][0] == -1) continue;
      var not_edge_downstairs = this.HT.T.triangle_fd_boundaries[covered_ti] === undefined ||
                                this.HT.T.triangle_fd_boundaries[covered_ti].indexOf(j) == -1;
      //we glue if it is NOT an edge downstairs
      if (!not_edge_downstairs && dist > distance_bound) continue;
      console.log('About to place a triangle on side ' + j + ' of triangle ' + ti);
      var new_ti = this.place_new_lift(ti, j);
      console.log('After: \n' + this);
      stack.push(new_ti);
    }
  }
}

/*****************************************************************************
 * Given an embedded hyperbolic triangulation, plus the index of a triangle 
 * and the index of an edge, it glues on a copy of triangle on the other side of the edge downstairs
 * It updates all the fd_boundary and fd_boundary inverse data and uses 
 * this data to correctly attach to other adjacent edges.  It returns 
 * the index of the inserted triangle (always the end of the list)
 *****************************************************************************/
EmbeddedHyperbolicTriangulation.prototype.place_new_lift = function(ti, side_j) {
  var down_ti = this.triangle_coverees[ti];
  var down_new_ti = this.HT.T.triangle_neighbors[down_ti][side_j][0];
  var down_new_ti_j = this.HT.T.triangle_neighbors[down_ti][side_j][1];
  var down_new_lengths = this.HT.triangle_lengths[down_new_ti];
  var down_new_angles = this.HT.triangle_angles[down_new_ti];

  var current_edge = [ this.vertex_locations[ this.FDT.triangle_vertices[ti][side_j] ],
                       this.vertex_locations[ this.FDT.triangle_vertices[ti][(side_j+1)%3] ] ];
  var new_tri = hyperbolic_triangle_place_along_edge(current_edge.reverse(), 
                                                     down_new_lengths, 
                                                     down_new_angles, 
                                                     down_new_ti_j);
  var new_vert_loc = new_tri[(down_new_ti_j+2)%3];
  var extant_vert = this.vertex_locations_inverse[new_vert_loc.hash()];
 
  //FDT triangulation
  if (extant_vert === undefined) {
    this.vertex_locations[this.FDT.num_vertices] = new_vert_loc; 
    this.vertex_locations_inverse[new_vert_loc.hash()] = this.FDT.num_vertices;
  }
  var v1 = this.FDT.triangle_vertices[ti][side_j];
  var v2 = this.FDT.triangle_vertices[ti][(side_j+1)%3];
  var v_op = (extant_vert === undefined ? this.FDT.num_vertices : extant_vert);
  var new_tri_verts = [];
  new_tri_verts[down_new_ti_j] = v2;
  new_tri_verts[(down_new_ti_j+1)%3] = v1;
  new_tri_verts[(down_new_ti_j+2)%3] = v_op;
  this.FDT.triangle_vertices.push(new_tri_verts);

  this.FDT.triangle_fd_boundaries[this.FDT.num_triangles] = [];
  this.FDT.triangle_neighbors[this.FDT.num_triangles] = [[-1,-1],[-1,-1],[-1,-1]];
  for (var i=0; i<3; i++) {
    var vv1 = new_tri_verts[i];
    var vv2 = new_tri_verts[(i+1)%3];
    var sv = [vv2,vv1].toString();
    var found_t = this.fd_boundaries_inverse[sv];
    if (found_t === undefined) {
      //no matching edge
      this.FDT.triangle_fd_boundaries[this.FDT.num_triangles].push(i);
      this.fd_boundaries_inverse[ [vv1,vv2].toString() ] = [this.FDT.num_triangles, i];
    } else {
      var found_t_ind = this.FDT.triangle_fd_boundaries[found_t[0]].indexOf(found_t[1]);
      this.FDT.triangle_fd_boundaries[found_t[0]].splice(found_t_ind, 1);
      delete this.fd_boundaries_inverse[sv];
      this.FDT.triangle_neighbors[found_t[0]][found_t[1]] = [this.FDT.num_triangles, i];
      this.FDT.triangle_neighbors[this.FDT.num_triangles][i] = [found_t[0], found_t[1]];
    }
  }
  if (this.FDT.triangle_fd_boundaries[this.FDT.num_triangles] == []) {
    delete this.FDT.triangle_fd_boundaries[this.FDT.num_triangles];
  }

  //record covers, etc
  var covered_vert_i = this.HT.T.triangle_vertices[down_new_ti][(down_new_ti_j+2)%3];
  if (extant_vert === undefined) {
    this.vertex_coverees[this.FDT.num_vertices] = covered_vert_i;
    if (this.vertex_coverers[covered_vert_i] === undefined) {
      this.vertex_coverers[covered_vert_i] = [this.FDT.num_vertices];
    } else {
      this.vertex_coverers[covered_vert_i].push(this.FDT.num_vertices);
    }
  } else {
    this.vertex_coverers[covered_vert_i].push(extant_vert);
  }

  this.triangle_coverees[this.FDT.num_triangles] = down_new_ti;
  if (this.triangle_coverers[down_new_ti] === undefined) {
    this.triangle_coverers[down_new_ti] = [this.FDT.num_triangles];
  } else {
    this.triangle_coverers[down_new_ti].push(this.FDT.num_triangles);
  }
  
  if (extant_vert === undefined) this.FDT.num_vertices++;
  this.FDT.num_triangles++; 

  return this.FDT.num_triangles-1;

}

/*****************************************************************************
 * Produce triangles suitable for display; each triangle is subdivded
 * from a center vertex into about N triangles per edge; also 
 * any edge which covers a boundary edge is subdivided 
 *****************************************************************************/
EmbeddedHyperbolicTriangulation.prototype.display_data_old = function() {
  var D = {'vertex_locations':[],
           'vertex_colors':[], 
           'flat_triangle_vertices':[],
           'flat_other_triangle_vertices':[],
           'flat_line_vertices':[],
           'flat_thick_line_vertices':[]};
  for (var i=0; i<this.FDT.num_triangles; i++) {
    var verts = [ this.vertex_locations[ this.FDT.triangle_vertices[i][0] ],
                  this.vertex_locations[ this.FDT.triangle_vertices[i][1] ],
                  this.vertex_locations[ this.FDT.triangle_vertices[i][2] ] ];
    var centroid = hyperbolic_triangle_centroid(verts);
    var edge_verts = [];
    var fd_bd = this.FDT.triangle_fd_boundaries[i];
    fd_bd = (fd_bd === undefined ? [] : fd_bd);
    //var triangle_color = (i < this.HT.T.num_triangles ? 1 : 2);
    var covered_triangle = this.triangle_coverees[i];
    for (var j=0; j<3; j++) {
      var n = (fd_bd.indexOf(j) == -1 ? 10 : 10);
      edge_verts[j] = hyperbolic_subdivide_geodesic(verts[j], verts[(j+1)%3], n, true, true);
      
      //add the triangles
      var offset = D.vertex_locations.length;
      var v_list = (i<this.HT.T.num_triangles ? D.flat_triangle_vertices : D.flat_other_triangle_vertices);
      for (var k=0; k<edge_verts[j].length-1; k++) {
        v_list.push( offset, offset+k+1, offset+k+2 );
      }
        
      D.vertex_locations.push(centroid);
      Array.prototype.push.apply(D.vertex_locations, edge_verts[j]);
      //extend_array(D.vertex_colors, edge_verts[j]+1, triangle_color);

      //if necessary, add the border
      if (this.HT.T.triangle_neighbors[covered_triangle][j][0] == -1) {
        //boundary -- thick border
        offset = D.vertex_locations.length;
        for (var k=0; k<edge_verts[j].length-1; k++) {
          D.flat_thick_line_vertices.push(offset+k, offset+k+1);
        }
        Array.prototype.push.apply(D.vertex_locations, edge_verts[j]);
        //extend_array(D.vertex_colors, edge_verts[j].length, 0);

      } else if (this.HT.T.triangle_fd_boundaries[covered_triangle].indexOf(j) != -1) {
        //fd boundary downstairs; thin line
        offset = D.vertex_locations.length;
        for (var k=0; k<edge_verts[j].length-1; k++) {
          D.flat_line_vertices.push(offset+k, offset+k+1);
        }
        Array.prototype.push.apply(D.vertex_locations, edge_verts[j]);
        //extend_array(D.vertex_colors, edge_verts[j].length, 0);
      }
    }
  }

  D.flat_vertex_locations = new Float32Array(3*D.vertex_locations.length);
  for (var i=0; i<D.vertex_locations.length; i++) {
    D.flat_vertex_locations[3*i] = D.vertex_locations[i].v[0];
    D.flat_vertex_locations[3*i+1] = D.vertex_locations[i].v[1];
    D.flat_vertex_locations[3*i+2] = D.vertex_locations[i].v[2];
  }
  //D.vertex_colors = new new Uint16Array(D.vertex_colors);
  D.flat_triangle_vertices = new Uint16Array(D.flat_triangle_vertices);
  D.flat_other_triangle_vertices = new Uint16Array(D.flat_other_triangle_vertices);
  D.flat_line_vertices = new Uint16Array(D.flat_line_vertices);
  D.flat_thick_line_vertices = new Uint16Array(D.flat_thick_line_vertices);
 
  return D;
}






