/*
* solid-auxiliary.js - 
*
* Copyright (C) 2014 Burdisso Sergio (sergio.burdisso@gmail.com)
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>
*/
var _DEG_PI = Math.PI/180;

function alert(msg){
    if ($.type(msg) === "string"){
        msg = he.encode(msg, {encodeEverything: true});
        msg = msg.replace(/&#xA;/g,"<br>").replace(/&#x9;/g,"&nbsp;&nbsp;").replace(/&#x20;/g, "&nbsp;");
    }
    $("#console").append(
        '<div class="console log header">'+
            new Date().toLocaleTimeString()+
        '&nbsp;&gt;</div><div class="console log">'+
            msg +
        '</div>'
    );
}

//-> console
//console guard
try{
    console.clear();
    var _console = console;
    console = {};
 }catch(e){ var console = {} };

console.log     = alert;
console.clear   = function(){$("#console").find(".console.log").remove();}
console.error   = function(msg){
    msg = he.encode(msg, {encodeEverything: true});
    msg = msg.replace(/&#xA;/g,"<br>").replace(/&#x9;/g,"&nbsp;&nbsp;");
    $("#console").append(
        '<div class="console header">'+
            new Date().toLocaleTimeString()+
        '&nbsp;&gt;</div><div class="console error">'+
            msg+
        '</div>'
    );
}
//<-

//-> improving Array class! XD
Array.prototype.empty = function() {return this.length === 0};

Array.prototype.clear = function() {this.length = 0};

Array.prototype.remove = function(index) {
    var output=this[index];

    for (var i= index; i < this.length; ++i)
        this[i] = this[i+1];
    this.length--;

    return output;
};


Array.prototype.removeByMatch = function(pattern) {
    var i = this.length;

    while (i--)
        if (match(this[i],pattern))
            break;

    return this.remove(i);
}

Array.prototype.clone = function() {
    var newArray = new Array(this.length);
    var i = this.length;

    while (i--)
        newArray[i] = this[i];

    return newArray;
}

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] == obj) {
            return true;
        }
    }
    return false;
}

Array.prototype.containsMatch = function(obj) {
    var i = this.length;
    while (i--) {
        if (match(this[i], obj)) {
            return true;
        }
    }
    return false;
}

Array.prototype.multAll = function(value) {
    var newArray = new Array(this.length);
    for (var i = this.length; i--;)
        newArray[i] = (value*this[i]).toFixed(3);
    return newArray;
}

Array.prototype.flatteningAllButTied = function() {
    var flatten = [];
    var subFlatten;
    var subFlattenNeeded;

    for (var len= this.length, i=0; i < len; ++i)
        if (this[i] instanceof Array){
            subFlattenNeeded = true;

            if (this[i].length > 1)
                for (var slen= this[i].length, j=0; j < slen; ++j)
                    if (!(this[i][j] instanceof Array)){
                        flatten.push(this[i]);
                        subFlattenNeeded = false;
                        break;
                    }

            if (subFlattenNeeded){
                subFlatten = this[i].flatteningAllButTied();
                for (var slen= subFlatten.length, j=0; j < slen; ++j)
                    flatten.push(subFlatten[j]);
            }
        }else
            flatten.push(this[i]);

    return flatten;
}

Array.prototype.getObjectWith = function(objPattern) {
    if (objPattern instanceof Object)
        for (var len= this.length, p=0; p < len; ++p){
            for (prop in objPattern)
                if (this[p][prop] == objPattern[prop])
                    return this[p];
        }
}
//<-

//-> improving Object class! XD

//Object.nextProperty = function(prop){ <- JQuery crashes! dont know why
function NextProperty(obj, prop){
    var prevProp = null;
    for (p in obj)
        if (!(obj[p] instanceof Function))
            if (prevProp == prop)
                return p;
            else
                prevProp = p;
    return "";
}

function copy(obj){
    if (obj instanceof Object)
        return JSON.parse(JSON.stringify(obj));
    else{
        console.error("copy(obj): obj is not an object");
        return obj+"";
    }
}

//assigns obj0 the values of obj1 (structurally)
function instantiate(obj0, obj1){
    for (p in obj0)
        if (!(obj0[p] instanceof Function)){
            if (!(obj0[p] instanceof Object))
                obj0[p] = obj1[p];
            else
                instantiate(obj0[p], obj1[p])
        }
}

//structural equivalence
function match(obj0, obj1){
    if (!(obj0 instanceof Object)) return obj0 == obj1;
    if (!(obj1 instanceof Object)) return false;

    if (obj1 instanceof Array)
        if (!(obj0 instanceof Array) || obj1.length != obj0.length)
            return false;

    for (p in obj1)
        switch(p){
            case "filled_cells":
            case "filled_holes":
            case "battery_used":
            case "battery_recharge":
            case "total_score":
            case "battery":
            case "score":
                if (obj0[p] < obj1[p])
                    return false;
                break;
            default:
                if (!["time", "agents", "battery", "good_moves", "battery_used", "time_elapsed",
                      "builtin_knowledge", "grid", "battery_chargers"].contains(p) &&
                    !(obj1[p] instanceof Function) && !match(obj0[p], obj1[p]))
                    return false;
        }
    return true;
}

//obj0 structures includes the structure of obj1?
function structMatch(obj0, obj1){
    if ( ((obj0 instanceof Object) && !(obj1 instanceof Object)) ||
         (!(obj0 instanceof Object) && (obj1 instanceof Object)))
        return false;

    if ((obj1 instanceof Array) && !(obj0 instanceof Array)) return false;

    for (p in obj1)
        if ((obj1.hasOwnProperty(p) && !obj0.hasOwnProperty(p)) || !structMatch(obj0[p], obj1[p]))
            return false;
    return true;
}

//<-

//Manhattan Distance
function manhattand(c0, c1){
    return Math.abs(c0.row - c1.row) + Math.abs(c0.column - c1.column);
}

function SortAndPartition(list, criteria){
    var tiePartitions = [];
    var oapList = [];// oap stands for "Ordered and Partitioned"

    criteria = NextProperty(list[0].stats, criteria);

    //recursion stopping condition
    if (list.length <= 1 || !criteria)
        return list;

    //sorting the list according to criteria
    if (criteria[0] == "M")
        list.sort(function(a,b){return b.stats[criteria] - a.stats[criteria]});
    else
        list.sort(function(b,a){return b.stats[criteria] - a.stats[criteria]});

    //creating partitions according to equal results (tied cases)
    for (var prevValue = null, k=-1, i=0; i < list.length; i++)
        if (list[i].stats[criteria] === prevValue)
            tiePartitions[k].push(list[i]);
        else{
            //creating a new partition of "equal values"
            tiePartitions.push([list[i]]);
            prevValue = list[i].stats[criteria];
            k++;
        }

    //for each partition
    for (var p=0; p < tiePartitions.length; ++p)
        oapList.push(
            SortAndPartition(tiePartitions[p], criteria) //recursive call
        );

    return oapList;
}

function newLineCounter(str){
    var counter = 0;
    for (var i=str.length; i--;)
        if (str[i] == "\n") counter++;
    return counter;
}

function isNumber(n){return !isNaN(parseInt(n))}

function UpdateScreenResolution(width, height){
    try{
    $("#tw-root")
        .css("top", "50%")
        .css("left", "50%")
        .css("width", width+"px")
        .css("height", height+"px")
        .css("margin-left", -(width/2|0)+"px")
        .css("margin-top", -(height/2|0)+"px");
    $("#tworld").prop("width", width).prop("height", height);
    }catch(e){}
}
var _FULL_SCREEN = false;
function ToogleFullWindowRender(e){

    if (!_FULL_SCREEN)
        $(e)
            .css("top", "0")
            .css("left", "0")
            .css("width", "100%")
            .css("height", "100%")
            .css("margin-top", "0")
            .css("margin-left", "0");
    else
        UpdateScreenResolution(_RENDER_WIDTH, _RENDER_HEIGHT);

    _FULL_SCREEN = !_FULL_SCREEN;
}
function ToggleFullScreen(e) {
    var d = document;
    var _requestFullScreen =e.requestFullScreen         || e.requestFullscreen      ||
                            e.msRequestFullScreen       || e.msRequestFullscreen    ||
                            e.mozRequestFullScreen      || e.mozRequestFullscreen   ||
                            e.webkitRequestFullScreen   || e.webkitRequestFullscreen;
    var _cancelFullScreen = d.cancelFullScreen          || d.cancelFullscreen       || d.exitFullScreen         || d.exitFullscreen         ||
                            d.msCancelFullScreen        || d.msCancelFullscreen     || d.msExitFullScreen       || d.msExitFullscreen       ||
                            d.mozCancelFullScreen       || d.mozCancelFullscreen    || d.mozExitFullScreen      || d.mozExitFullscreen      ||
                            d.webkitCancelFullScreen    || d.webkitCancelFullscreen || d.webkitExitFullScreen   || d.webkitExitFullscreen;
    ToogleFullWindowRender(e);

    if ( d.fullscreenElement    || d.webkitFullscreenElement ||
         d.mozFullScreenElement || d.msFullscreenElement) {
        if (_cancelFullScreen) _cancelFullScreen.call(d);
    }else{
        if (_requestFullScreen) _requestFullScreen.call(e);
    }
}

function IsMobile(){
    return navigator.userAgent.match(/iPad|iPhone|Android|BlackBerry|webOS/i);
}

var _VALID_KEYS = [13/*enter*/,27/*esc*/, 32/*space*/, 16/*shift*/, 67/*C*/, 70/*F*/, 107/*+*/, 109/*-*/];
function IsValidKey(keyCode){return _VALID_KEYS.contains(keyCode);}

//returns a number between the closed interval [<a>, <a>+<prob>.length-1] according to the given probability distribution <prob>
function UncertaintyMaker(a, prob){ if (prob.length <= 1) return a;
    var rnd = Math.random()*1000|0;
    var len=prob.length-1;
    var pAccumulated = 0

    for (var p=0; p < len; ++p){
        pAccumulated += prob[p];
        if (rnd < pAccumulated)
            return a + p;
    }
    return a+len;
}

function ToMMSS(value){
    var mins = (value/60|0);
    var segs = value%60;

    mins = (mins < 10)? "0"+mins : mins;
    segs = (segs < 10)? "0"+segs : segs;

    return mins +":"+ segs;
}

function GetManhattanDistance(p1, p2) {
    if (!p1 || !p2) return -1;

    var distX = Math.abs(p1[0] - p2[0]);
    var distY = Math.abs(p1[1] - p2[1]);
    var c = distX  + distY;

    c = (c - 1>=0)? c - 1: 0;

    return c;
}

// "Row-Major Order", rows are numbered by the first index and columns by the second index
function NewMatrix(_FloorRows, _FloorColumns){
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

function AngleBetween(a, b){
    var signA = (a < 0)? -1: 1;
    var signB = (b < 0)? -1: 1;
    if (signA == signB)
        return Math.abs(a-b);
    else
        return Math.abs(a-(b+signA*360));
}

function RelativeAngleBetween(a, b){return Relative180Angle(b, -a)}

function Relative180Angle(a, angle){return to180Degrees(To360Degrees(a) + angle)}

function To360Degrees(value){return (value < 0)? value + 360: value;}
function to180Degrees(value){return (value > 180)? value - 360: value;}

function CreateVertex(x,y,z) {
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
        for (var i= this.getLength()-1; i >= 0 ; --i) 
            for (var j= holeCells.getLength()-1; j >= 0; --j)
                this.getItemAt(i).shrinkHole(holeCells.getItemAt(j), true);

    }
}

//Static Class CallWithDelay (created to call function with a certain delay in seconds)
function CallWithDelay() {}
CallWithDelay.Queue = new List();
CallWithDelay.Enqueue = function(_function, args, delay /*time in seconds*/, _this) {
        return this.Queue.append([_function, args, _this, delay]);
    }
CallWithDelay.Tick = function() {
    for (var i= 0, func; i < this.Queue.getLength(); i++) {
        func = this.Queue.getItemAt(i);

        if (!func[0]){
            this.Queue.removeItemAt(i);
            i--;
        }else
        if (--func[3] <= 0) {
            func[0].apply(func[2]? func[2] : this, func[1]);
            func[0] = null;
            this.Queue.removeItemAt(i);
            i--;
        }
    }
CallWithDelay.Remove = function(index){this.Queue.removeItemAt(index)}
}