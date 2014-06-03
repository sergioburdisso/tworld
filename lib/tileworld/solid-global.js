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
var _ACTION		= {WEST:0, EAST:1, NORTH:2, SOUTH:3, NONE:4, RECHARGE:5, MESSAGE: "message:", CONSOLE_CLEAR:6, CONSOLE_ERROR:"error:", CONSOLE_LOG:"log:", END:"end:" 
};

var _ACTION_REGEX = {
					WEST:			/^\s*(action\s*\()?\s*(west|0)\s*\)?\s*$/i,
					EAST:			/^\s*(action\s*\()?\s*(east|1)\s*\)?\s*$/i,
					NORTH:			/^\s*(action\s*\()?\s*(north|2)\s*\)?\s*$/i,
					SOUTH:			/^\s*(action\s*\()?\s*(south|3)\s*\)?\s*$/i,
					NONE:			/^\s*(action\s*\()?\s*(none|null|4)\s*\)?\s*$/i,
					RECHARGE:		/^\s*(action\s*\()?\s*(recharge|recharge_battery|revive|5)\s*\)?\s*$/i,
					MESSAGE:		/^\s*(msg|message)\s*(\(\s*'([^]*)'\s*\)|:([^]*))\s*$/i,
					CONSOLE_CLEAR:	/^\s*(action\s*\()?\s*(clear|console_clear|console.clear|6)\s*\)?\s*$/i,
					CONSOLE_ERROR:	/^\s*(error|console_error|console.error)\s*(\(\s*'([^]*)'\s*\)|:([^]*))\s*$/i,
					CONSOLE_LOG:	/^\s*(log|console_log|console.log)\s*(\(\s*'([^]*)'\s*\)|:([^]*))\s*$/i,
					KEY_DOWN:		/(key_down|keydown|key_pressed)\s*(\(\s*([^)]*)\s*\)|:([^]*))/i,
					KEY_UP:			/(key_up|keyup|key_released)\s*(\(\s*([^)]*)\s*\)|:([^]*))/i,
					END: null //TODO!
					/*stop percept, start percept*/
				};

//if you change some values or add/remove new ones remember to change the tw_msg.xsd too
var _PERCEPT_HEADER	= {PERCEPT: "percept", START: "start", END : "end", MESSAGE: "message", READY_FOR_NEXT_ACTION: "ready_for_next_action", ERROR: "error", INTERNAL:"internal"}

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
var _Paused		= false;

var _FPS		= 60; // maximum fps

var _TILES_TELEPORT_DELAY	= 2; //how many seconds takes AstroMaxi to teletransport the tiles

var _BATTERY_RANDOM_START		= true;
var	_BATTERY_START_POSITION		= [{ROW : 0, COLUMN: 0}, {ROW : 1, COLUMN: 1} /*,...*/];
var _BATTERY_INITIAL_CHARGE		= 1000;
var _BATTERY_WALK_COST			= 10;
var _BATTERY_SLIDE_COST			= 10;
var _BATTERY_INVALID_MOVE_COST	= 5;

var _ACTIVE_CAMERA = -1;
