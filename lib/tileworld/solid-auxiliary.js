/**
*solid-auxiliary.js
*<p>
*collection of auxiliary functions and classes
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

function alert(msg){ $("#console").append('<div class="console header">'+ new Date().toLocaleTimeString()+ '&nbsp;&gt;</div><div class="console log"><Pre>' + msg + '</Pre></div>'); }

//-> console
//console guard
try{ console.clear() }catch(e){ var console = {} };


console.log		= alert;
console.clear	= function(){$("#console").children().remove();}
console.error	= function(msg){$("#console").append('<div class="console header">'+ new Date().toLocaleTimeString()+ '&nbsp;&gt;</div><div class="console error"><Pre>' + msg + '</Pre></div>');}
//<-

//-> improving Array class! XD
Array.prototype.clear = function() {this.length = 0;};

Array.prototype.remove = function(index) {
	for (var i= index; i < this.length; ++i)
		this[i] = this[i+1];
	this.length--;
};

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] == obj) {
            return true;
        }
    }
    return false;
}
//<-

function fullScreen(e) {
	var _requestFullScreen =e.requestFullScreen			||
							e.msRequestFullScreen		||
							e.mozRequestFullScreen		||
							e.webkitRequestFullScreen;

	if (_requestFullScreen)
		_requestFullScreen.call(e);
}

var _VALID_KEYS = [13/*enter*/,27/*esc*/, 32/*space*/, 67/*C*/, 70/*F*/, 107/*+*/, 109/*-*/];
function isValidKey(keyCode){return _VALID_KEYS.contains(keyCode);}

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
	if (b === undefined)
		return Math.random()*a|0;
	else
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
	var _items = size? new Array(size|0) : new Array();
	var _lastIndex = -1;
	var _fixedSize = size;

	this.append = function(value){
		if (!this.full())
			_items[++_lastIndex] = value;
		return value;
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

	this.remove = function(x, y) {
		for (var _length=this.getLength(), iPair, i= 0; i < _length; i++){
			iPair = this.getItemAt(i);
			if (iPair[0] == x && iPair[1] == y){
				return this.removeItemAt(i);
			}
		}
		return null;
	}

	this.contains = function(x, y) {
		if (x != 0 && !x)
			return false;

		for (var _length=this.getLength(), iPair, i= 0; i < _length; i++){
			iPair = this.getItemAt(i);
			if (iPair[0] == x && iPair[1] == y){
				return true;
			}
		}
		return false;
	}

	this.appendUnique = function(value) {
		if (!this.contains(value[0], value[1]))
			this.append(value);
	}

	this.appendAllUnique = function(aList) {
		for (var _length=aList.getLength(), i= 0; i < _length; i++)
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
				this.getItemAt(i).Id = -1; // "wasRemoved" flag
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

				if (hole.isFilled()){
					hole.Id = -1; // "wasRemoved" flag
					this.removeItemAt(i);
				}

				return hole;
			}
		}

		return null;
	}

	this.shrinkHoles = function(holeCells) {

		// O(n^2) <- could it be improved?
		for (var i= 0; i < this.getLength(); i++) 
			for (var j= 0; j < holeCells.getLength(); j++)
				this.getItemAt(i).shrinkHole(holeCells.getItemAt(j));

	}
}

//Static Class CallWithDelay (created to call function with a certain delay in seconds)
function CallWithDelay() {}
CallWithDelay.Queue = new List();
CallWithDelay.Enqueue = function(_function, args, delay /*time in seconds*/) {
		return this.Queue.append([_function, args, delay]);
	}
CallWithDelay.Tick = function() {
	for (var i= 0, func; i < this.Queue.getLength(); i++) {
		func = this.Queue.getItemAt(i);

		if (!func[0]){
			this.Queue.removeItemAt(i);
			i--;
		}

		if (--func[2]  <= 0) {
			func[0].apply(this, func[1]);
			this.Queue.removeItemAt(i);
			i--;
		}
	}
CallWithDelay.Remove = function(index){this.Queue.removeItemAt(index)}
}