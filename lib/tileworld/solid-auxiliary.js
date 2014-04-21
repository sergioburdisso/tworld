/**
*solid-auxiliary.js
*<p>
*collection of auxiliary functions and classes
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

Array.prototype.clear = function() {
	this.length = 0;
};
Array.prototype.remove = function(index) {
	for (var i= index; i < this.length; ++i)
		this[i] = this[i+1];
	this.length--;
};

function isValidKey(keyCode){
	return	keyCode == 37	|| keyCode == 39 ||
			keyCode == 38	|| keyCode == 40 ||
			keyCode == 65	|| keyCode == 83 ||
			keyCode == 68	|| keyCode == 87 ||
			keyCode == 107	|| keyCode == 109 ||
			keyCode == 32	|| keyCode == 27;
}

//returns a random number between [value-_(value-1)*p, value] where _ means "floor" and p = uncertantyFactor
function uncertaintyMaker(value, uncertantyFactor){//
	return value - (random(0, value)*uncertantyFactor|0);
}

function getManhattanDistance(p1, p2) {
	if (!p1 || !p2) return -1;
	var distX = Math.abs(p1[0] - p2[0]);
	var distY = Math.abs(p1[1] - p2[1]);
	var c = distX  + distY;

	c = (c - 1>=0)? c - 1: 0;

	return c;
}

// "Row-Major Order", rows are numbered by the first index and columns by the second index
function newMatrix(_FloorRows, _FloorColumns){
	var tmp = new Array(_FloorRows);

	for (var i = 0; i < _FloorRows; i++)
		tmp[i] = new Array(_FloorColumns);

	return tmp;
}

function random(a, b){
	return ((a < b)? Math.random()*(b-a) + a : Math.random()*(a-b) + b);
}

function to360Degrees(value){return (value < 0)? value + 360: value;}
function to180Degrees(value){return (value > 180)? value - 360: value;}

function createVertex(x,y,z) {
	var vtx = new CL3D.Vertex3D(true);

	vtx.Pos.X = x;
	vtx.Pos.Y = y;
	vtx.Pos.Z = z;

	return vtx;
}

//List Class
function List(size){
	var _items = size? new Array(size) : new Array();
	var _lastIndex = -1;
	var _fixedSize = size;

	this.append = function(value){
		if (!this.full())
			_items[++_lastIndex] = value;
	}

	this.appendAll = function(aList){
		if (!aList) return;
		for (var i= 0; i < aList.getLength(); i++)
			this.append(aList.getItemAt(i));
	}

	this.appendAllArray = function(aList){
		if (!aList) return;
		for (var i= 0; i < aList.length; i++)
			this.append(aList[i]);
	}

	this.removeItemAt = function(index){
		if (0 <= index && index <= _lastIndex){
			var target = _items[index];

			for (var i= index; i < _lastIndex; i++)
				_items[i] = _items[i+1];

			_lastIndex--;

			return target;
		}
		return null;
	}

	this.remove = function(Item){
		for (var i= 0; i < this.getLength(); i++)
			if (_items[i] === Item){
				this.removeItemAt(i);
				break;
			}
		return null;
	}

	this.removeAll = function(){
		_lastIndex = -1;
	}

	this.empty = function(){
		return (_lastIndex == -1);
	}

	this.full = function(){
		return size && (_lastIndex == _items.length-1);
	}

	this.getItemAt = function(index){
		if (0 <= index && index <= _lastIndex)
			return _items[index];

		return null;
	}

	this.getLength = function(){return _lastIndex+1;}

	this.getInternalArray = function() {
		if (!this.Array)
			this.Array = [];

		this.Array.length = this.getLength();

		for (var i= 0; i < this.Array.length; ++i)
			this.Array[i] = _items[i];

		return this.Array;
	}
}

//ListOfPairs Class
function ListOfPairs(size) {
	//-> ListOfPairs extends List
		this.superClass = List;
		this.superClass(size);
		//delete superClass;
	//<- ListOfPairs extends List

	this.remove = function(pair) {
		for (var i= 0; i < this.getLength(); i++)
			if (this.getItemAt(i)[0] == pair[0] && this.getItemAt(i)[1] == pair[1]){
				return this.removeItemAt(i);
			}
		return null;
	}

	this.isIn = function(pair) {
		if (!pair)
			return false;

		for (var i= 0; i < this.getLength(); i++)
			if (this.getItemAt(i)[0] == pair[0] && this.getItemAt(i)[1] == pair[1]){
				return true;
			}
		return false;
	}

	this.appendUnique = function(value) {
		if (!this.isIn(value))
			this.append(value);
	}

	this.appendAllUnique = function(aList) {
		for (var i= 0; i < aList.getLength(); i++)
			this.appendUnique(aList.getItemAt(i));
	}
}

//ListOfHoles Class
function ListOfHoles(size) {
	//-> ListOfHoles extends List
		this.superClass = List;
		this.superClass(size);
		delete superClass;
	//<- ListOfHoles extends List

	this.remove = function(id) {
		for (var i= 0; i < this.getLength(); i++)
			if (this.getItemAt(i).Id == id){
				this.removeItemAt(i);
				break;
			}
		return null;
	}

	//if this method removed an entire hole then it returns it
	this.removeHoleCell = function(pair) {
		for (var hole, i= 0; i < this.getLength(); i++){
			hole = this.getItemAt(i);
			if (hole.removeHoleCell(pair)){

				if (hole.isFilled())
					this.removeItemAt(i);

				return hole;
			}
		}

		return null;
	}

	this.shrinkHoles = function(holeCells) {

		// O(n^2) <- ver si no se puede mejorar
		for (var i= 0; i < this.getLength(); i++) 
			for (var j= 0; j < holeCells.getLength(); j++)
				this.getItemAt(i).shrinkHole(holeCells.getItemAt(j));

	}
}

//Class CallWithDelay (created to call function with a certain delay in seconds)
function CallWithDelay() {
	var queue = new List();

	CallWithDelay.Enqueue = function(_function, args, delay /*time in seconds*/) {
		queue.append([_function, args, delay]);
	}

	CallWithDelay.Tick = function() {
		for (var i= 0, func; i < queue.getLength(); i++) {
			func = queue.getItemAt(i);
			if (--func[2]  <= 0) {
				func[0].apply(this, func[1]);
				queue.removeItemAt(i);
				i--;
			}

		}
	}
}

// helper function for quickly creating a 3d vertex from 3d position and texture coodinates
function createVertex(x, y, z, s, t)
{
	var vtx = new CL3D.Vertex3D(true);

	vtx.Pos.X = x;
	vtx.Pos.Y = y;
	vtx.Pos.Z = z;
	vtx.TCoords.X = s;
	vtx.TCoords.Y = t;

	return vtx;
}

// our own scene node implementation
CL3D.HoleCellHelper = function(x, y, z, size, engine, r, g, b, a)
{
	var gl = engine.getRenderer().getWebGL();
	var hSize = size/2;
	var vertex_shader_source = "\
		#ifdef GL_ES					\n\
		precision highp float;		  \n\
		#endif						  \n\
		uniform mat4 worldviewproj;	 \
		attribute vec4 vPosition;	   \
		attribute vec4 vNormal;		 \
		attribute vec2 vTexCoord1;	  \
		attribute vec2 vTexCoord2;	  \
		varying vec2 v_texCoord1;	   \
		varying vec2 v_texCoord2;	   \
		void main()					 \
		{							   \
			gl_Position = worldviewproj * vPosition;\
			v_texCoord1 = vTexCoord1.st;   \
			v_texCoord2 = vTexCoord2.st;   \
		}";
	   
	var fragment_shader_source = "\
   		#ifdef GL_ES					\n\
		precision highp float;		  \n\
		#endif						  \n\
		uniform sampler2D texture1;	 \
								   		\
		varying vec2 v_texCoord1;	   \
								   		\
		void main()					 \
		{							   \
			vec2 texCoord = vec2(v_texCoord1.s, v_texCoord1.t);  \
			gl_FragColor = vec4("+r+","+g+","+b+","+a+");  	\
		}";

	this.init();  // init scene node specific members

	// create a 3d mesh with one mesh buffer

	this.Mesh = new CL3D.Mesh();
	var buf = new CL3D.MeshBuffer();
	this.Mesh.AddMeshBuffer(buf);

	// set indices and vertices
	buf.Vertices = new Array(4);

	buf.Vertices[0] = createVertex(x - hSize, y, z + hSize);
	buf.Vertices[1] = createVertex(x + hSize, y, z + hSize);
	buf.Vertices[2] = createVertex(x + hSize, y, z - hSize);
	buf.Vertices[3] = createVertex(x - hSize, y, z - hSize);

	buf.Indices = [0,1,2, 2,3,0];

	// set the texture of the material
	buf.Mat.Type = engine.getRenderer().createMaterialType(vertex_shader_source, fragment_shader_source, true, gl.SRC_ALPHA /*gl.ONE*/, gl.ONE_MINUS_SRC_ALPHA /*gl.ONE_MINUS_SRC_COLOR*/);
}
CL3D.HoleCellHelper.prototype = new CL3D.SceneNode(); // derive from SceneNode

CL3D.HoleCellHelper.prototype.OnRegisterSceneNode = function(scene)
{
	if (this.Visible){
		scene.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_DEFAULT);
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, scene); // call base class
	}
}

CL3D.HoleCellHelper.prototype.render = function(renderer)
{
	if (this.Visible){
		renderer.setWorld(this.getAbsoluteTransformation());
		renderer.drawMesh(this.Mesh);
	}
}

// our own scene node implementation
CL3D.LaserBeam = function(srcP, destP, engine, lifeTime)
{
	var gl = engine.getRenderer().getWebGL();
	var hSize = 5;
	var buf = new CL3D.MeshBuffer();
	var scene = engine.getScene();
	var laserHit;
	var laserSrcLight;

	this.LifeTime = lifeTime;
	this.Mesh = new CL3D.Mesh();


	this.init();  // init scene node specific members

	// create a 3d mesh with one mesh buffer
	this.Mesh.AddMeshBuffer(buf);

	// set indices and vertices
	buf.Vertices = new Array(8);

	buf.Vertices[0] = createVertex(srcP.X + hSize, srcP.Y, srcP.Z, 1, 1);
	buf.Vertices[1] = createVertex(srcP.X - hSize, srcP.Y, srcP.Z, 0, 0);
	buf.Vertices[2] = createVertex(destP.X - hSize, destP.Y, destP.Z, 0, 1);
	buf.Vertices[3] = createVertex(destP.X + hSize, destP.Y, destP.Z, 1, 0);

	buf.Vertices[4] = createVertex(srcP.X, srcP.Y, srcP.Z + hSize, 1, 1);
	buf.Vertices[5] = createVertex(srcP.X, srcP.Y, srcP.Z - hSize, 0, 0);
	buf.Vertices[6] = createVertex(destP.X, destP.Y, destP.Z - hSize, 0, 1);
	buf.Vertices[7] = createVertex(destP.X, destP.Y, destP.Z + hSize, 1, 0);

	buf.Indices = [0,1,2, 2,3,0, 4,5,6, 6,7,4];

	// set the texture of the material
	buf.Mat.Type = CL3D.Material.EMT_TRANSPARENT_ADD_COLOR;
	buf.Mat.Tex1 = engine.getTextureManager().getTexture("./copperlichtdata/laserBeam.jpg", true);

	buf.Mat.BackfaceCulling = false;

	//Laser Hits on the ground
	laserHit = scene.getSceneNodeFromName('laserbeam-hit').createClone(scene.getRootSceneNode());
	laserHit.Pos = srcP;
	laserHit.Rot.Y = to180Degrees(random(0, 360));
	laserHit.setLoopMode(true);
	laserHit.setCurrentFrame(0);
	laserHit.Visible = true;

	laserSrcLight = scene.getSceneNodeFromName('laserbeam-light');
	laserSrcLight.Pos = destP;
	laserSrcLight.Visible = true;

	scene.getRootSceneNode().addChild(this);

	this.dispose = function(){
		scene.getRootSceneNode().removeChild(laserHit, true);
		scene.getRootSceneNode().removeChild(this, true);
	}
}
CL3D.LaserBeam.prototype = new CL3D.SceneNode(); // derive from SceneNode

CL3D.LaserBeam.prototype.OnRegisterSceneNode = function(scene)
{
	if (this.Visible){
		scene.registerNodeForRendering(this, CL3D.Scene.RENDER_MODE_DEFAULT);
		CL3D.SceneNode.prototype.OnRegisterSceneNode.call(this, scene); // call base class
	}
}

CL3D.LaserBeam.prototype.render = function(renderer)
{
	if (this.Visible){
		renderer.setWorld(this.getAbsoluteTransformation());
		renderer.drawMesh(this.Mesh);
	}
}