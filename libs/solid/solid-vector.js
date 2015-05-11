/*
 *Author: Burdisso Sergio
 *
 *Review: this file contains a Vector Class definition with all the operations needed to compute with vectors
 */

 //class Vector
function Vector(x, y, z) {
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;

	//For improving performance avoiding the garbage collector
	//instead of returning a new object each time a
	//method that returns a vector is called,
	//I'll use these 2 private attributes so that each vector contains
	//a reference to its own unit vector and
	//projection of the vector onto another one
	var _projectionVector;
	var _unitVector; 
	
	//static function to return the Null Vector
	Vector.NullVector = function(){
		if (!this.null)
			this.null = new Vector();
		return this.null;
	}
	
	//instead of use v0 = v1, use this function ( v0.assign(v1) )
	//it's much efficient in terms of performance (avoid the garbage collector)
	this.assign = function(vOrx, y, z) {
		if (!y && !z && z != 0 && y != 0){
			this.x = vOrx.x;
			this.y = vOrx.y;
			this.z = vOrx.z;
		}else{
			this.x = vOrx || 0;
			this.y = y || 0;
			this.z = z || 0;
		}

		return this;
	}

	//return true whether this vector is equal to the vOrx vector, or equal to the (vOrx, y, z) vector;
	//otherwise return false 
	this.isEqual = function(vOrx, y, z) {
		if (!y && !z && z != 0 && y != 0){
			return 	this.x == vOrx.x &&
					this.y == vOrx.y &&
					this.z == vOrx.z;
		}else{
			return 	this.x == vOrx 	&&
					this.y == y 	&&
					this.z == z;
		}
	}

	//compute the addition of the vector with a v vector  
	this.add = function(v) {
		this.x+=v.x;
		this.y+=v.y;
		this.z+=v.z;

		return this;
	}

	//compute the addition of the vector with a v vector  
	this.sub = function(v) {
		this.x-=v.x;
		this.y-=v.y;
		this.z-=v.z;

		return this;
	}

	//compute the multiplication of the vector by a n scalar  
	this.mult = function(n) {
		this.x*=n;
		this.y*=n;
		this.z*=n;

		return this;
	}

	//compute the division of the vector by a n scalar  
	this.div = function(n) {
		if (n != 0){
			this.x/=n;
			this.y/=n;
			this.z/=n;

			return this;
		}else
			return this.assign(0,0,0);		
	}

	//returns the cross product vector of the vector and the v vector
	this.crossProduct = function(v) {
		return new Vector(this.y*v.z - this.z*v.y, this.z*v.x - this.x*v.z, this.x*v.y - this.y*v.x)
	}

	//returns the dot product of the vector and the v vector
	this.dotProduct = function(v) {
		return (this.x*v.x)+(this.y*v.y)+(this.z*v.z);
	}

	//gets the distance from this vetor to the v vector
	this.getDistanceTo = function(v) {
		return Math.sqrt(Math.pow(this.x-v.x,2) + Math.pow(this.y - v.y,2) + Math.pow(this.z - v.z,2));
	}

	//returns the angle in degrees between the vector and the vector v
	this.getAngleBetween = function(v) {
		return this.getAngle()-v.getAngle();
	}

	//returns the angle in degrees of the vector (counterclockwise)
	this.getAngle = function(v) {
		
		var angle= Math.atan2(this.x, -this.y);
		angle*= 180/Math.PI;
		return (angle < 0)? angle + 360 : angle;
	}

	//returns the projection vector of the vector onto v
	this.getProjectionOnTo = function(v) {
		var pModule = this.dotProduct(v)/(v.getNorm()*v.getNorm());

		//if it's called for the very first time, then creates a
		//new Vector instance for the projection vector
		if (!_projectionVector)
			_projectionVector = new Vector();

		_projectionVector.assign(v);
		_projectionVector.mult(pModule);
		return _projectionVector;
	} 
	
	//return ||v|| when v is the vector instance of this class
	this.getNorm = function() {		
		return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
	}

	//returns the unit vector of the vector
	this.getUnitVector = function() {
		//if it's called for the very first time, then creates a
		//new Vector instance for the unit vector
		if (!_unitVector)
			_unitVector = new Vector();

		_unitVector.assign(this);

		if (this.getNorm() != 0)
			_unitVector.mult(1/this.getNorm());

		return _unitVector;
	}

	//returns a copy of the vector
	this.copy = function() {
		return new Vector(this.x, this.y, this.z);
	}

	//normalize the vector
	this.normalize = function(){
		this.assign(this.getUnitVector());
		return this;
	}

	//limit norm to max
	this.limitNorm = function(max) {
		if (this.getNorm() > max) {
			this.normalize();
			this.mult(max);
		}
		return this;
	}

	//inverse the vector
	this.inverse = function() {
		this.x *=-1;
		this.y *=-1;
		this.z *=-1;

		return this;
	}

	//rotates the vector theta degrees
	//rotation matrix:
	//	|cos(theta)	-sin(theta)| |x|
	//	|sin(theta)	 cos(theta)| |y|	
	this.rotate = function(theta){
		theta *= Math.PI/180; //converting from degrees to radians
		this.x = Math.cos(theta)*this.x - Math.sin(theta)*this.y;
		this.y = Math.sin(theta)*this.x + Math.cos(theta)*this.y;

		return this;
	}

	//change the vector norm (that is, magnitude or length) to value
	this.setNorm = function(value) {
		this.normalize();
		this.mult(value);

		return this;
	}

	//region Synonyms
		this.getNormalizedVector = function() {
			return this.getUnitVector();
		}
		this.getMagnitude = function() {
			return this.getNorm();
		}
		this.scalarProduct = function(v) {
			return this.dotProduct(v);
		}
		this.vectorProduct = function(v) {
			return this.crossProduct(n);
		}
		this.setMagnitude = function(value) {
			return this.setNorm(value);
		}
	//end region Synonyms
}
