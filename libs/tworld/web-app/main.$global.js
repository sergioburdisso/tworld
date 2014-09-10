/*
* main.$global.js - 
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
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>
*/

if (localStorage.version != "0.9"){
	localStorage.clear();
	localStorage.version = "0.9";
}

var _tworldWindow;
var _KEYBOAR_MAP = ["","","","CANCEL","","","HELP","","BACK_SPACE","TAB","","","CLEAR","ENTER","RETURN","","SHIFT","CONTROL","ALT","PAUSE","CAPS_LOCK","KANA","EISU","JUNJA","FINAL","HANJA","","ESCAPE","CONVERT","NONCONVERT","ACCEPT","MODECHANGE","SPACE","PAGE_UP","PAGE_DOWN","END","HOME","LEFT","UP","RIGHT","DOWN","SELECT","PRINT","EXECUTE","PRINTSCREEN","INSERT","DELETE","","0","1","2","3","4","5","6","7","8","9","COLON","SEMICOLON","LESS_THAN","EQUALS","GREATER_THAN","QUESTION_MARK","AT","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","WIN","","CONTEXT_MENU","","SLEEP","NUMPAD0","NUMPAD1","NUMPAD2","NUMPAD3","NUMPAD4","NUMPAD5","NUMPAD6","NUMPAD7","NUMPAD8","NUMPAD9","MULTIPLY","ADD","SEPARATOR","SUBTRACT","DECIMAL","DIVIDE","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18","F19","F20","F21","F22","F23","F24","","","","","","","","","NUM_LOCK","SCROLL_LOCK","WIN_OEM_FJ_JISHO","WIN_OEM_FJ_MASSHOU","WIN_OEM_FJ_TOUROKU","WIN_OEM_FJ_LOYA","WIN_OEM_FJ_ROYA","","","","","","","","","","CIRCUMFLEX","EXCLAMATION","DOUBLE_QUOTE","HASH","DOLLAR","PERCENT","AMPERSAND","UNDERSCORE","OPEN_PAREN","CLOSE_PAREN","ASTERISK","PLUS","PIPE","HYPHEN_MINUS","OPEN_CURLY_BRACKET","CLOSE_CURLY_BRACKET","TILDE","","","","","VOLUME_MUTE","VOLUME_DOWN","VOLUME_UP","","","","","COMMA","","PERIOD","SLASH","BACK_QUOTE","","","","","","","","","","","","","","","","","","","","","","","","","","","OPEN_BRACKET","BACK_SLASH","CLOSE_BRACKET","QUOTE","","META","ALTGR","","WIN_ICO_HELP","WIN_ICO_00","","WIN_ICO_CLEAR","","","WIN_OEM_RESET","WIN_OEM_JUMP","WIN_OEM_PA1","WIN_OEM_PA2","WIN_OEM_PA3","WIN_OEM_WSCTRL","WIN_OEM_CUSEL","WIN_OEM_ATTN","WIN_OEM_FINISH","WIN_OEM_COPY","WIN_OEM_AUTO","WIN_OEM_ENLW","WIN_OEM_BACKTAB","ATTN","CRSEL","EXSEL","EREOF","PLAY","ZOOM","","PA1","WIN_OEM_CLEAR",""];
var _LOGIN_STATE = {HIDDEN : 0, SHOWN: 1, LOADING:2, LOGGED: 3, LOGOUT: 4}

function getVersion(){ return localStorage.version }

function startTWorld(){
	if (!_tworldWindow || !_tworldWindow.location.reload)
		_tworldWindow = window.open('tworld.html');//,'T-World','width=712, height=450');//height=400
	else{
		_tworldWindow.location.reload();
		_tworldWindow.focus();
	}
}

function gotoTop(time, top){
	if (top && Number.isNaN(Number(top)) && top.constructor == String)
		top = $('#title').offset().top;

	if (time === undefined)
		time = 1000;

	$('html, body').animate({
		scrollTop: top===undefined? $("#top").offset().top : top
	}, time, "easeOutExpo")
}

Array.prototype.remove = function(index) {
	var output=this[index];

	for (var i= index; i < this.length; ++i)
		this[i] = this[i+1];
	this.length--;

	return output;
}

Array.prototype.setTo = function(arr) {
	if (arr.length != this.length)
		this.length = arr.length;

	var i= this.length;
	while(i--)
		this[i] = arr[i];
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

Array.prototype.flattening = function(pos) {
	var flatten = [];
	var subFlatten;

	for (var len= this.length, i=0; i < len; ++i){
		if (this[i] instanceof Array){
			subFlatten = this[i].flattening(!pos && (this.length > 1 || (this.length == 1 && !(this[0] instanceof Array)))? i+1 : pos);
			for (var slen= subFlatten.length, j=0; j < slen; ++j)
				flatten.push(subFlatten[j]);
		}else{
			this[i].pos = pos || i + 1;
			flatten.push(this[i]);
		}
	}

	return flatten;
}

function Validate(){
	var errors = $('.has-error').not($('.ng-hide .has-error'));
	if (errors.length){
		errors.addClass("ng-dirty").focus();
		return false;
	}
	return true;
}

//-> custom events
function triggerClickOutside(){
	setTimeout(function() { $('button').trigger('clickOutsideEvent'); }, 0);
}

function triggerError(){
	setTimeout(function() { $('form').trigger('errorEvent'); }, 0);
}

function triggerDismissError(){
	setTimeout(function() { $('form').trigger('dismissError'); }, 0);
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

function clone(obj){return JSON.parse(JSON.stringify(obj))}

//<-

//Pseudo random generator
function pRandom(value, MAX){
	var golder_ratio = (1+Math.sqrt(5))/2;
	var q = 1/golder_ratio;

	return MAX*(value*q-((value*q)|0))|0;
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

function antiNoobsCoder(str){
	var output = "";
	for (var l= str.length, c=0; c < l;++c)
		output+= String.fromCharCode(str.charCodeAt(c) ^ 0x17);
	return output;
}

function antiNoobsHash(str){
	var output = 0;
	var _p = Math.PI-3;

	for (var l= str.length, c=0; c < l;++c)
		output+= str.charCodeAt(c) ^ 0xA4;

	return ((_p*output - ((_p*output)|0))*4294967295)|0;
}
