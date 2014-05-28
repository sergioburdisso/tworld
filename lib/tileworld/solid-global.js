/**
*solid-global.js
*<p>
*Computational objects globally visible
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

//common vocabulary for communication between Tileworld and the Program Agent
var _GRID_CELL	= {EMPTY:" ", TILE:"T", OBSTACLE:"#", HOLE_CELL:1, AGENT:"A", BATTERY_CHARGER:"C"};
var _ACTION		= {WEST:0, EAST:1, NORTH:2, SOUTH:3, NONE:4, CONSOLE_CLEAR:5, ERROR:"error:", MESSAGE:"message:" /*stop percept, start percept*/};

//if you change some values or add/remove new ones remember to change the tw_msg.xsd too
var _PERCEPT_HEADER	= {PERCEPT: "percept", START: "start", END : "end", READY_FOR_NEXT_ACTION: "ready_for_next_action", ERROR: "error"}

//NOTE: any changes you make to this object must be reflected in the twproxy.c file (and in case of XML, the tw_msg.xsd file too)
var _PERCEPT_FORMAT	= {
	JSON: 0,
	XML: '<?xml version="1.0" encoding="UTF-8"?>'+
		 '<tw_msg '+
		 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '+
		 'xsi:noNamespaceSchemaLocation="./resrc/tw_msg.xsd">'+
		 '%s'+
		 '</tw_msg>',
	PROLOG: "tw_msg(header(%s), data(%s)).\n"
}

var _STOCHASTIC_ACTIONS_MODEL = {NO_ACTION: 0, ANOTHER_ACTION: 1, OPPOSITE_ACTION: 2, USER_DEFINED: 3}

var _Ready		= false;
var _Running	= false;//did the user push the play button?

var _FPS		= 60; // maximum fps

var _TIME_LIMIT	= 5*60;//seconds

var _TILES_TELEPORT_DELAY	= 2; //how many seconds takes AstroMaxi to teletransport the tiles

var _NUMBER_OF_ROBS			= 3;
var _ROB_RANDOM_START		= true;
var	_ROB_START_POSITION		= [{ROW : 0, COLUMN: 1}, {ROW : 1, COLUMN: 0}/*,...*/];

var _BATTERY_RANDOM_START		= true;
var	_BATTERY_START_POSITION		= [{ROW : 0, COLUMN: 0}, {ROW : 1, COLUMN: 1} /*,...*/];
var _BATTERY_TOTAL_CHARGE		= 1000;
var _BATTERY_WALK_COST			= 10;
var _BATTERY_SLIDE_COST			= 10;
var _BATTERY_INVALID_MOVE_COST	= 5;

var _ACTIVE_CAMERA = -1;

var _TEAMS = [[0,2],[1],[3]];
var _GET_TEAM_LEADER = function(rIndex){
						var iteam = _TEAMS.length;
						while (iteam--)
							if (_TEAMS[iteam].contains(rIndex))
								return _TEAMS[iteam][0];
						return null;
					}