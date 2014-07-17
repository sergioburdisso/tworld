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

var _KNOBS= localStorage.knobs? JSON.parse(localStorage.knobs) : null;

var _LANGUAGE = _LANGUAGES.SPANISH;

//TWorld dimension
var _ROWS = _KNOBS.environment.rows;
var _COLUMNS = _KNOBS.environment.columns;

var _INITIAL_STATE = (!(_KNOBS.prop.dynamic == 2) && !_KNOBS.environment.random_initial_state)?
					{
						grid:_KNOBS.environment.initial_state,
						obstacles:[],
						holes:{},
						tiles:[]
					}
					:
					null;

// Battery
var _BATTERY_RANDOM_START	= true;
var	_BATTERY_START_POSITION	= [/*{ROW : 0, COLUMN: 0}, {ROW : 1, COLUMN: 1} /*,...*/];

var _BATTERY_INITIAL_CHARGE		= _KNOBS.final_tweaks.battery.level;
var _BATTERY_WALK_COST			= _KNOBS.final_tweaks.battery.good_move;
var _BATTERY_INVALID_MOVE_COST	= _KNOBS.final_tweaks.battery.bad_move;
var _BATTERY_SLIDE_COST			= _KNOBS.final_tweaks.battery.sliding;

// Players
if (_KNOBS.trial.test){
	var _TEAMS = [{NAME:"", COLOR: _COLORS.ORANGE, MEMBERS:[0]}];
	var _NUMBER_OF_AGENTS	= 1;
	var _AGENTS = [{
		NAME : "Rob, the agent",
		CONTROLS : {Up:38, Down:40, Left:37, Right:39, Restore:17}/*Arrow keys + Ctrl*/
		/*CONTROLLED_BY_AI : true,
		SOCKET_PROGRAM_AGENT : {
								ADDR: "localhost",//"192.168.1.7",//
								PORT: 3313,//80,
								OUTPUT_FORMAT: _PERCEPT_FORMAT.PROLOG//JSON//XML//
							}*/
	}];
}else{
	var _NUMBER_OF_AGENTS = 0;
	var _TEAMS = []
	for (team in _KNOBS.teams){
		_TEAMS.push({
			NAME: team.name,
			COLOR: team.color,
			MEMBERS: new Array(team.members)
		});

		_NUMBER_OF_AGENTS+= team.members;
	}
	var _AGENTS = new Array(_NUMBER_OF_AGENTS); for (var k=0; k < _NUMBER_OF_AGENTS; ++k) _AGENTS[k]={};
}

var _MULTIPLIER_TIME = _KNOBS.final_tweaks.multiplier.enabled?
						_KNOBS.final_tweaks.multiplier.timeout
						:
						0;

var _SPEED = _KNOBS.final_tweaks.speed < 0?
				1/(-_KNOBS.final_tweaks.speed + 1)
			:
				(_KNOBS.final_tweaks.speed == 0?
					1
				:
					_KNOBS.final_tweaks.speed + 1
				)
			;

var _SCORE_CELLS_MULTIPLIER = _KNOBS.final_tweaks.score.cell? 2 : 0;
var _SCORE_HOLE_MULTIPLIER = 10;

// Graphics
var _LOW_QUALITY_GRID	= false;
var _LOW_QUALITY_WORLD	= false;
var _FULL_WINDOW_RENDER	= false;
var _RENDER_AUTO_SIZE	= false;
var 	_RENDER_WIDTH	= 712;
var 	_RENDER_HEIGHT	= 400;

// Hide/show enable/disable things
var _SHOW_HOLES_HELPERS = true;
var _SHOW_FPS = true;
var _PAUSE_ENABLED = _KNOBS.final_tweaks.pause;

// Camera
var _DEFAULT_CAMERA	= _CAMERA_TYPE.FREE_GRID;
var _CAMERA_SMOOTH	= true;

// Animation
var _MINIMAL_UPDATE_DELAY = 0; //the less, the smoother animations are

// Audio
var _AUDIO_ENABLE = true;
var 	_VOLUME_LEVEL = 100;

// Global flags
var _AI_NECESSARY = false;
var _XML_NECESSARY = false;
var _JSON_NECESSARY = false;

//Note: set _ENDGAME.<COND>.VALUE = 0 to disable condition <COND>
var _KNOBS_Cond;
for (COND in _ENDGAME){
	_KNOBS_Cond = _KNOBS.environment.final_state.getObjectWith({name:_ENDGAME[COND].NAME});

	if (_KNOBS_Cond){
		_ENDGAME[COND].VALUE= _KNOBS_Cond.value;
		_ENDGAME[COND].RESULT= _KNOBS_Cond.result|0;
	}else
		_ENDGAME[COND].RESULT= _ENDGAME[COND].VALUE= 0;

	_ENDGAME[COND].ACHIEVED= false;
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
	try{
		_RENDER_WIDTH = $("#tw-root").parent().width();
		_RENDER_HEIGHT = $("#tw-root").parent().height();
	}catch(e){}
}
try{updateScreenResolution(_RENDER_WIDTH, _RENDER_HEIGHT);}catch(e){}


for (var k=0; k < _NUMBER_OF_AGENTS; ++k){
	if (!_AGENTS[k].NAME)
		_AGENTS[k].NAME = "Player "+k;

	if (_AGENTS[k].CONTROLLED_BY_AI || _AGENTS[k].SOCKET_PROGRAM_AGENT){
		_AI_NECESSARY = true;
		if (_AGENTS[k].SOCKET_PROGRAM_AGENT){
			switch(_AGENTS[k].SOCKET_PROGRAM_AGENT.OUTPUT_FORMAT){
				case _PERCEPT_FORMAT.XML:
					_XML_NECESSARY = true;
					break;
				case _PERCEPT_FORMAT.JSON:
					_JSON_NECESSARY = true;
					break;
			}
		}
	}else{
		if (_AGENTS[k].CONTROLS){
			for (prop in _AGENTS[k].CONTROLS)
				if (!(_AGENTS[k].CONTROLS[prop] instanceof Function))
					_VALID_KEYS.push(_AGENTS[k].CONTROLS[prop]);
		}else
			_AI_NECESSARY = _AGENTS[k].CONTROLLED_BY_AI = true;
	}
}

for (var t=0; t < _TEAMS.length; ++t)
	if (_TEAMS[t].MEMBERS.length == 1)
		_TEAMS[t].NAME = _AGENTS[_TEAMS[t].MEMBERS[0]].NAME;
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
					_AGENTS[irob++].START_POSITION = {ROW: r, COLUMN: c};
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

document.title = "T-world ("+_KNOBS.name+")";
//window.opener = null;