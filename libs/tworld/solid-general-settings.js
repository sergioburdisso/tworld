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

var _KNOBS= localStorage.knobs?
		JSON.parse(localStorage.knobs)
		:
		{trial:{test:true,speed:0,pause:true},name:"DEFAULT",desc:"",date:0,battery:true,prop:{fullyObservable:true,multiagent:false,multiagent_type:0,deterministic:true,dynamic:2,known:true},agents:{percept:{sync:true,interval:500,partialGrid:true,radius:3,noise:false,noise_cfg:{tile:0.3,obstacle:0.3,hole:0.3}},determinism:0.8,stochastic_model:1},environment:{rows:8,columns:11,holes_size:{range:[1,3],prob:[334,333,333]},num_holes:{range:[2,3],prob:[500,500]},num_obstacles:{range:[1,2],prob:[500,500]},difficulty:{range:[0,0],prob:[]},scores_variability:0,dynamic:{dynamism:{range:[6,13],prob:[125,125,125,125,125,125,125,125]},hostility:{range:[1,13],prob:[77,77,77,77,77,77,77,77,77,77,77,77,76]},hard_bounds:true},random_initial_state:false,initial_state:[],final_state:[{name:"Time",value:300,result:0}]},teams:[{name:"Team0",color:"red",members:1},{name:"Team1",color:"blue",members:1}],final_tweaks:{battery:{level:1000,good_move:20,bad_move:5,sliding:10},multiplier:{enabled:true,timeout:6},score:{cell:true},shapes:false}};
var _KNOBS_SETTINGS = getSettings();

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

var _EASY_MODE = _KNOBS.final_tweaks.easy;

// Battery
var	_BATTERY_START_LOCATION	= [/*{ROW : 0, COLUMN: 0}, {ROW : 1, COLUMN: 1} /*,...*/];

var _BATTERY_INITIAL_CHARGE		= _KNOBS.final_tweaks.battery.level;
var _BATTERY_WALK_COST			= _KNOBS.final_tweaks.battery.good_move;
var _BATTERY_INVALID_MOVE_COST	= _KNOBS.final_tweaks.battery.bad_move;
var _BATTERY_SLIDE_COST			= _KNOBS.final_tweaks.battery.sliding;

// Players
if (_KNOBS.trial.test){
	var _SAVE_STATS = false;
	var _PAUSE_ENABLED = true;
	var _SPEED = 1;
	var _TEAMS = [{NAME:"", COLOR: _COLORS.BLUE, MEMBERS:[0]}];
	var _NUMBER_OF_AGENTS	= 1;
	var _AGENTS = [
	{
		NAME : "Rob, the agent",
		CONTROLS : {Up:38, Down:40, Left:37, Right:39, Restore:16}/*Arrow keys + shift*/
	}
	];
}else{
	var _KNOBS_Agents = _KNOBS.trial.agents;

	var _SAVE_STATS = _KNOBS.trial.saveStats;
	var _PAUSE_ENABLED = _KNOBS.trial.pause;
	var _SPEED = _KNOBS.trial.speed < 0?
				1/(-_KNOBS.trial.speed + 1)
			:
				(_KNOBS.trial.speed == 0?
					1
				:
					_KNOBS.trial.speed + 1
				)
			;

	var _NUMBER_OF_AGENTS = _KNOBS_Agents.length;
	var _TEAMS = []
	for (var t= 0; t < _KNOBS.teams.length; ++t)
		_TEAMS.push({
			NAME: _KNOBS.teams[t].name,
			COLOR: _KNOBS.teams[t].color,
			MEMBERS: []
		});

	var _AGENTS = new Array(_NUMBER_OF_AGENTS); for (var k=0; k < _NUMBER_OF_AGENTS; ++k) _AGENTS[k]={};

	for (var len = _KNOBS_Agents.length, i=0; i < len; ++i){
		_TEAMS[_KNOBS_Agents[i].team].MEMBERS.push(i);

		_AGENTS[i].NAME = _KNOBS_Agents[i].program.name;
		_AGENTS[i].PERCEPT = {};

		if (_KNOBS_Agents[i].program.ai){
			_AGENTS[i].CONTROLLED_BY_AI = true;
			
			if (_KNOBS_Agents[i].program.javascript){
				var _source = _KNOBS_Agents[i].program.source;
				_AGENTS[i].MEMORY					= getMemoryByAgentProgramID(_KNOBS_Agents[i].program.date);
				_AGENTS[i].AI_SOURCE_CODE			= _source.agentProgram.code;
				_AGENTS[i].START_SOURCE_CODE		= _source.onStart.code;
				_AGENTS[i].GLOBAL_SOURCE_CODE		= _source.global.code;
				_AGENTS[i].TEAM_MSG_SOURCE_CODE		= _source.onMessage.code;

			}else{
				_AGENTS[i].SOCKET_PROGRAM_AGENT =	{
					ADDR: _KNOBS_Agents[i].program.socket.ip_address,
					PORT: _KNOBS_Agents[i].program.socket.port,
					MAGIC_STRING: _KNOBS_Agents[i].program.socket.magic_string,
					OUTPUT_FORMAT: _KNOBS_Agents[i].program.socket.percept_format
				}
			}
			_AGENTS[i].PERCEPT.SYNC = _KNOBS_Agents[i].program.percept.sync; // perceive every <interval> milliseconds or after each action
			_AGENTS[i].PERCEPT.INTERVAL = _KNOBS_Agents[i].program.percept.interval;
		}else
			if (_KNOBS_Agents[i].program.keyboard)
				_AGENTS[i].CONTROLS = _KNOBS_Agents[i].program.controls;
			else{
				_AGENTS[i].SOCKET_PROGRAM_AGENT =	{
					ADDR: _KNOBS_Agents[i].program.socket.ip_address,
					PORT: _KNOBS_Agents[i].program.socket.port,
					MAGIC_STRING: _KNOBS_Agents[i].program.socket.magic_string,
					OUTPUT_FORMAT: _PERCEPT_FORMAT.JSON
				}
			}
	}
}

var _MULTIPLIER_TIME = _KNOBS.final_tweaks.multiplier.enabled?
						_KNOBS.final_tweaks.multiplier.timeout
						:
						0;

var _SCORE_CELLS_MULTIPLIER = _KNOBS.final_tweaks.score.cell && (_KNOBS.prop.dynamic != 1)? 2 : 0;
var _SCORE_HOLE_MULTIPLIER = 10;

// Graphics
var _LOW_QUALITY_GRID	= _KNOBS_SETTINGS.display.lq_grid;
var _LOW_QUALITY_WORLD	= _KNOBS_SETTINGS.display.lq_env;
var _FULL_WINDOW_RENDER	= _KNOBS_SETTINGS.display.cover_window;
var _RENDER_AUTO_SIZE	= !_KNOBS_SETTINGS.display.resolution;
var 	_RENDER_WIDTH	= !_RENDER_AUTO_SIZE? _KNOBS_SETTINGS.display.resolution.match(/^(\d+)x(\d+)$/)[1] : undefined;
var 	_RENDER_HEIGHT	= !_RENDER_AUTO_SIZE? _KNOBS_SETTINGS.display.resolution.match(/^(\d+)x(\d+)$/)[2] : undefined;

// Hide/show enable/disable things
var _SHOW_HOLES_HELPERS = true;
var _SHOW_FPS = _KNOBS_SETTINGS.display.show_fps;

// Camera
var _DEFAULT_CAMERA	= _KNOBS.trial.camera;
var _CAMERA_SMOOTH	= true;

// Animation
var _MINIMAL_UPDATE_DELAY = 0; //the less, the smoother animations are

// Audio
var _AUDIO_ENABLE = _KNOBS_SETTINGS.audio.enabled;
var 	_VOLUME_LEVEL = _KNOBS_SETTINGS.audio.volume;

var _START_TIME;

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
try{UpdateScreenResolution(_RENDER_WIDTH, _RENDER_HEIGHT);}catch(e){}



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
					if (irob < _AGENTS.length)
						_AGENTS[irob++].START_LOCATION = {ROW: r, COLUMN: c};
					break;

				case _GRID_CELL.OBSTACLE:
					_INITIAL_STATE.obstacles.push([r,c]);
					break;

				case _GRID_CELL.TILE:
					_INITIAL_STATE.tiles.push([r,c]);
					break;

				case _GRID_CELL.BATTERY_CHARGER:
					_BATTERY_START_LOCATION.push({ROW: r, COLUMN: c});
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

document.title = "T-World ("+_KNOBS.name+")";
//window.opener = null;