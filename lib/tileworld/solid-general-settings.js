/*
* solid-general-settings.js - 
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

var _LANGUAGE = _LANGUAGES.SPANISH;

//Tileworld dimension
var _ROWS = 9;//
var _COLUMNS = 9;//

var _INITIAL_STATE = {/*null;*/
	grid: [
			[" "," "," "," "," ","#"],
			["#","C"," ","2"," ","#"],
			[" ","#"," ","T"," ","A"],
			["1","T"," "," "," ","#"],
			["#"," "," "," ","T","#"],
			[" ","#"," ","#","3"," "]
		],
	holes: {},
	tiles: [],
	obstacles: []
}

// Battery
var _BATTERY_RANDOM_START	= true;
var	_BATTERY_START_POSITION	= [/*{ROW : 0, COLUMN: 0}, {ROW : 1, COLUMN: 1} /*,...*/];

// Players
//var _ROBS_RANDOM_START	= true;
var _NUMBER_OF_ROBS	= 1;
var _ROBS = new Array(_NUMBER_OF_ROBS); for (var k=0; k < _NUMBER_OF_ROBS; ++k) _ROBS[k]={};

var _TEAMS = [
	{NAME:"", COLOR: _COLORS.BLUE, MEMBERS:[0]}
	];

// Graphics
var _LOW_QUALITY_GRID	= true;
var _LOW_QUALITY_WORLD	= true;
var _FULL_WINDOW_RENDER	= false;
var _RENDER_AUTO_SIZE	= false;
var 	_RENDER_WIDTH	= 712;
var 	_RENDER_HEIGHT	= 400;

// Hide/show things
var _SHOW_HOLES_HELPERS = true;
var _SHOW_FPS = true;

// Camera
var _CAMERA_TYPE = {FREE_ROB: 0, PERCEPT: 1, ALIEN: 2, FREE_GRID: 3};
var _DEFAULT_CAMERA = _CAMERA_TYPE.FREE_GRID;
var _CAMERA_SMOOTH = true;

// Animation
var _AUTO_MINIMAL_UPDATE_DELAY = false;
var 	_MINIMAL_UPDATE_DELAY = 0; //the less, the smoother animations are

// Audio
var _AUDIO_ENABLE = true;
var 	_VOLUME_LEVEL = 100;

// Global flags
var _AI_NECESSARY = false;
var _XML_NECESSARY = false;
var _JSON_NECESSARY = false;

// Game over conditions
var _GAME = {NEUTRAL:0, WON:1, LOST: 2}
var _GAMEOVER = {
	TIME: {
		VALUE: 1*60/*seconds (0 means no time limits)*/,
		ACHIEVED: false,
		OUTCOME: _GAME.LOST,
		$ID:"go-time",
		$TEXT:{
			PLURAL: "llegar a los %s de juego",
			SINGULAR: "llegar a %s de juego"
		},
		MESSAGE:"TIME'S UP!"
	},
	ROBS_LOCATION: {
		VALUE: null,//[0/*robs id*/],//
		ACHIEVED: false,
		OUTCOME: _GAME.WON,
		$ID:"go-robs-location",
		$TEXT:{
			PLURAL: "ubicar los robots: %s",
			SINGULAR: "ubicar al robot en %s"
		},
		MESSAGE:""
	},
	HOLES: {
		VALUE: 0,
		ACHIEVED: false,
		OUTCOME: _GAME.WON,
		$ID:"go-holes",
		$TEXT:{
			PLURAL: "tapar %s huecos",
			SINGULAR: "tapar %s hueco"
		},
		MESSAGE:""
	},
	CELLS: {
		VALUE: 0,
		ACHIEVED: false,
		OUTCOME: _GAME.WON,
		$ID:"go-cells",
		$TEXT:{
			PLURAL:"tapar %s celdas",
			SINGULAR:"tapar %s celda"
		},
		MESSAGE:""
	},
	SCORE: {
		VALUE: 100,
		ACHIEVED: false,
		OUTCOME: _GAME.WON,
		$ID:"go-score",
		$TEXT:{
			PLURAL:"llegar a una puntuaci&oacute;n de %s",
			SINGULAR:"llegar a una puntuaci&oacute;n de %s"
		},
		MESSAGE:""
	},
	MOVESOK: {
		VALUE: 0,
		ACHIEVED: false,
		OUTCOME: _GAME.NEUTRAL,
		$ID:"go-movesok",
		$TEXT:{
			PLURAL: "realizar %s movimientos correctos",
			SINGULAR: "realizar %s movimiento correcto"
		},
		MESSAGE:""
	},
	MOVESNOTOK: {
		VALUE: 3,
		ACHIEVED: false,
		OUTCOME: _GAME.LOST,
		$ID:"go-movesnotok",
		$TEXT:{
			PLURAL: "realizar %s movimientos incorrectos",
			SINGULAR: "realizar %s movimiento incorrecto"
		},
		MESSAGE:"too many bad moves!"
	},
	BATTERY_USE: {
		VALUE: 0,
		ACHIEVED: false,
		OUTCOME: _GAME.LOST,
		$ID:"go-battery-use",
		$TEXT:{
			PLURAL: "gastar %s de bater&iacute;a",
			SINGULAR: "gastar %s de bater&iacute;a"
		},
		MESSAGE:""
	},
	BATTERY_RECHARGE: {
		VALUE: 0,
		ACHIEVED: false,
		OUTCOME: _GAME.LOST,
		$ID:"go-battery-recharge",
		$TEXT:{
			PLURAL: "regargar %s veces la bater&iacute;a",
			SINGULAR: "regargar %s vez la bater&iacute;a"
		},
		MESSAGE:""
	},
	BATTERY_RESTORE: {
		VALUE: 0,
		ACHIEVED: false,
		OUTCOME: _GAME.LOST,
		$ID:"go-battery-restore",
		$TEXT:{
			PLURAL: "restaurar el robot %s veces",
			SINGULAR: "restaurar el robot %s vez"
		},
		MESSAGE:""
	},
	MESSAGES: {
		NEUTRAL: {TEXT: "THE GAME<br>HAS ENDED", SUBTEXTS: ["GREAT!", "AMAZING!", "AWESOME!", "COOL!"]},
		WON: {TEXT: "GOALS<br>ACHIEVED", SUBTEXTS: ["YOU WIN!", "CONGRATULATIONS!", "GREAT JOB!", "SOLVED!"]},
		LOST: {TEXT: "GAME OVER", SUBTEXTS: ["YOU LOSE!", "YOU JUST LOST<br>THE GAME!", "UPS!", "SORRY"]}
	}
}

_ROBS[0].NAME = "";
_ROBS[0].FINAL_POSITION = {ROW : 0, COLUMN: 0};// used if _GAMEOVER.WIN.ROBS_LOCATION contains this rob id (0)
_ROBS[0].CONTROLS = {Up:38, Down:40, Left:37, Right:39, Restore:16/*17 35*/};/*Arrow keys + shift/Ctrl/[<end>]*/
_ROBS[0].CONTROLLED_BY_AI = true;
//_ROBS[0].AI_SOURCE_CODE = "returnAction(Math.random()*4|0);"
//_ROBS[0].TEAM_MSG_SOURCE_CODE = "";
_ROBS[0].SOCKET_PROGRAM_AGENT =	{
									ADDR: "localhost",//"192.168.1.7",//
									PORT: 3313,//80,//
									OUTPUT_FORMAT: _PERCEPT_FORMAT.JSON//XML//PROLOG//
								}
if (_ROBS[_NUMBER_OF_ROBS]){
_ROBS[1].NAME = "";
_ROBS[1].FINAL_POSITION = {ROW : 1, COLUMN: 1};
_ROBS[1].CONTROLS = {Up:87, Down:83, Left:65, Right:68, Restore:69};/*WSADE*/
_ROBS[1].CONTROLLED_BY_AI = true;
/*_ROBS[1].SOCKET_PROGRAM_AGENT =	{
									ADDR: "localhost",//"192.168.1.7",//
									PORT: 3313,//80,
									OUTPUT_FORMAT: _PERCEPT_FORMAT.JSON//XML//PROLOG//
								}*/

_ROBS[2].NAME = "Sergio";
_ROBS[2].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Restore:186};/*PÑL[+*/
//_ROBS[2].CONTROLLED_BY_AI = true;
/*_ROBS[2].SOCKET_PROGRAM_AGENT =	{
									ADDR: "localhost",//"192.168.1.7",//
									PORT: 3313,//80,
									OUTPUT_FORMAT: _PERCEPT_FORMAT.JSON//PROLOG//XML//
								}*/


_ROBS[3].NAME = "Caro";
_ROBS[3].CONTROLS = {Up:72, Down:78, Left:66, Right:77, Restore:74};/*HNBMJ*/
//_ROBS[3].CONTROLLED_BY_AI = true;
/*_ROBS[3].SOCKET_PROGRAM_AGENT =	{
									ADDR: "localhost",//"192.168.1.7",//
									PORT: 3313,//80,
									OUTPUT_FORMAT: _PERCEPT_FORMAT.JSON//PROLOG//XML//
								}
*/

_ROBS[4].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Restore:187};/*PÑL[+*/
_ROBS[4].CONTROLLED_BY_AI = true;

_ROBS[5].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Restore:187};/*PÑL[+*/
_ROBS[5].CONTROLLED_BY_AI = true;


_ROBS[6].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Restore:187};/*PÑL[+*/
_ROBS[6].CONTROLLED_BY_AI = true;

_ROBS[7].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Restore:187};/*PÑL[+*/
_ROBS[7].CONTROLLED_BY_AI = true;

_ROBS[8].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Restore:187};/*PÑL[+*/
_ROBS[8].CONTROLLED_BY_AI = true;

_ROBS[9].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Restore:187};/*PÑL[+*/
_ROBS[9].CONTROLLED_BY_AI = true;
}


var _GET_TEAM_LEADER = function(rIndex){
	var iteam = _TEAMS.length;
	while (iteam--)
		if (_TEAMS[iteam].MEMBERS.contains(rIndex))
			return _TEAMS[iteam].MEMBERS[0];
	return null;
}

var _GET_TEAM_OF = function(rIndex){
	var peers = new Array();
	var j,i = _TEAMS.length;

	while (i--)
		if (_TEAMS[i].MEMBERS.contains(rIndex))
			break;

	if (i >= 0){
		j = _TEAMS[i].MEMBERS.length;
		while (j--)
			if (_TEAMS[i].MEMBERS[j] != rIndex)
				peers.push(_TEAMS[i].MEMBERS[j]);
	}

	return peers;
}

var _GET_TEAM_INDEX_OF = function(rIndex){
	var j,i = _TEAMS.length;

	while (i--)
		if (_TEAMS[i].MEMBERS.contains(rIndex))
			break;

	return i;
}

//Initializing [default] values
if (_RENDER_AUTO_SIZE){
	_RENDER_WIDTH = $("#tw-root").parent().width();
	_RENDER_HEIGHT = $("#tw-root").parent().height();
}

updateScreenResolution(_RENDER_WIDTH, _RENDER_HEIGHT);


for (var k=0; k < _NUMBER_OF_ROBS; ++k){
	if (!_ROBS[k].NAME)
		_ROBS[k].NAME = "Player "+k;

	if (_ROBS[k].CONTROLLED_BY_AI || _ROBS[k].SOCKET_PROGRAM_AGENT){
		_AI_NECESSARY = true;
		if (_ROBS[k].SOCKET_PROGRAM_AGENT){
			switch(_ROBS[k].SOCKET_PROGRAM_AGENT.OUTPUT_FORMAT){
				case _PERCEPT_FORMAT.XML:
					_XML_NECESSARY = true;
					break;
				case _PERCEPT_FORMAT.JSON:
					_JSON_NECESSARY = true;
					break;
			}
		}
	}else{
		if (_ROBS[k].CONTROLS){
			for (prop in _ROBS[k].CONTROLS)
				if (!(_ROBS[k].CONTROLS[prop] instanceof Function))
					_VALID_KEYS.push(_ROBS[k].CONTROLS[prop]);
		}else
			_AI_NECESSARY = _ROBS[k].CONTROLLED_BY_AI = true;
	}
}

for (var t=0; t < _TEAMS.length; ++t)
	if (_TEAMS[t].MEMBERS.length == 1)
		_TEAMS[t].NAME = _ROBS[_TEAMS[t].MEMBERS[0]].NAME;
	else
	if (!_TEAMS[t].NAME)
		_TEAMS[t].NAME = "Team "+t;

if (_INITIAL_STATE){
	_ROWS = _INITIAL_STATE.grid.length;
	_COLUMNS = _INITIAL_STATE.grid[0].length;

	for (var irob = 0, r= 0; r < _ROWS; ++r)
		for (var c= 0; c < _COLUMNS; ++c)
			switch(_INITIAL_STATE.grid[r][c]){
				case _GRID_CELL.AGENT:
					_ROBS[irob++].START_POSITION = {ROW: r, COLUMN: c};
					break;

				case _GRID_CELL.OBSTACLE:
					_INITIAL_STATE.obstacles.push([r,c]);
					break;

				case _GRID_CELL.TILE:
					_INITIAL_STATE.tiles.push([r,c]);
					break;

				case _GRID_CELL.BATTERY_CHARGER:
					_BATTERY_RANDOM_START = false;
					_BATTERY_START_POSITION.push({ROW: r, COLUMN: c});
					_ROBS[0].FINAL_POSITION.ROW = r;
					_ROBS[0].FINAL_POSITION.COLUMN = c;
					break;

				default:
					var cell = _INITIAL_STATE.grid[r][c];
					if (cell == parseInt(cell)){
						if (!_INITIAL_STATE.holes[cell])
							_INITIAL_STATE.holes[cell] = new ListOfPairs();
						_INITIAL_STATE.holes[cell].append([r,c]);
					}
			}
}
