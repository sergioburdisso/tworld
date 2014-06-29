/*
* solid-global.js - Computational objects globally visible
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

//common vocabulary for communication between Tileworld and the Program Agent
var _GRID_CELL	= {EMPTY:" ", TILE:"T", OBSTACLE:"#", HOLE_CELL:1, AGENT:"A", BATTERY_CHARGER:"C"};
var _ACTION		= {WEST:0, EAST:1, NORTH:2, SOUTH:3, NONE:4, RESTORE:5, PEER_MESSAGE: "peer_message:", TEAM_MESSAGE: "team_message:", CONSOLE_CLEAR:6, CONSOLE_ERROR:"error:", CONSOLE_LOG:"log:", END:"end:"};

var _ACTION_REGEX = {
					WEST:			/^\s*(action\s*\()?\s*(west|0)\s*\)?\s*$/i,
					EAST:			/^\s*(action\s*\()?\s*(east|1)\s*\)?\s*$/i,
					NORTH:			/^\s*(action\s*\()?\s*(north|2)\s*\)?\s*$/i,
					SOUTH:			/^\s*(action\s*\()?\s*(south|3)\s*\)?\s*$/i,
					NONE:			/^\s*(action\s*\()?\s*(none|null|4)\s*\)?\s*$/i,
					RESTORE:		/^\s*(action\s*\()?\s*(restore|restore_battery|revive|5)\s*\)?\s*$/i,
					PEER_MESSAGE:	/^\s*(p_msg|msg|peer_message|message)\s*(\(\s*(\d*),'([^]*)'\s*\)|:(\d*):([^]*))\s*$/i,
					TEAM_MESSAGE:	/^\s*(tm_msg|team_message)\s*(\(\s*'([^]*)'\s*\)|:([^]*))\s*$/i,
					CONSOLE_CLEAR:	/^\s*(action\s*\()?\s*(clear|console_clear|console.clear|6)\s*\)?\s*$/i,
					CONSOLE_ERROR:	/^\s*(error|console_error|console.error)\s*(\(\s*'([^]*)'\s*\)|:([^]*))\s*$/i,
					CONSOLE_LOG:	/^\s*(log|console_log|console.log)\s*(\(\s*'([^]*)'\s*\)|:([^]*))\s*$/i,
					KEY_DOWN:		/(key_down|keydown|key_pressed)\s*(\(\s*([^)]*)\s*\)|:([^]*))/i,
					KEY_UP:			/(key_up|keyup|key_released)\s*(\(\s*([^)]*)\s*\)|:([^]*))/i,
					END: null //TODO!
					/*stop percept, start percept*/
				};

//if you change some values or add/remove new ones remember to change the tw_msg.xsd too
var _PERCEPT_HEADER	= {
	PERCEPT: "percept", START: "start", END : "end",
	MESSAGE: "message", READY_FOR_NEXT_ACTION: "ready_for_next_action",
	ERROR: "error", INTERNAL:"internal"
}

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
var _LANGUAGES = {ENGLISH:"english", SPANISH:"spanish"}
var _COLORS = {RED:"red", BLUE:"blue", GREEN:"green", YELLOW:"yellow", PURPLE:"purple", ORANGE:"orange", CYAN:"cyan", PINK:"pink", BLACK:"black", WHITE:"white"}
var _CAMERA_TYPE	= {FREE_ROB: 0, FIRST_PERSON: 1, PERCEPT: 2, ALIEN: 3, FREE_GRID: 4};

var _Ready		= false;
var _Running	= false;//did the user push the play button?
var _Paused		= false;

var _FPS		= 60; // maximum fps

var _TILES_TELEPORT_DELAY	= 2; //how many seconds takes AstroMaxi to teletransport the tiles

var _BATTERY_INITIAL_CHARGE		= 1000;
var _BATTERY_WALK_COST			= 20;
var _BATTERY_SLIDE_COST			= 10;
var _BATTERY_INVALID_MOVE_COST	= 5;

var _ACTIVE_CAMERA = -1;

var _MULTIPLIER_TIME = 6;

var _GUI = {
	ON_GAME_SCREEN:{$:null, LEFT:0, MARGIN_TOP:0}
}

//-> Rob
var _ROB_WALKSPEED =0.55; // how much does Rob move each frame while he's walking? Max. value = 5(_FloorCellSize/2)
var _ROB_ROTATION_FRAMES = 10; // how many frames does it take Rob to turn around?