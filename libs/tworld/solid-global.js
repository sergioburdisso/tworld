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

//common vocabulary for communication between TWorld and the Program Agent
var _GRID_CELL	= {EMPTY:" ", TILE:"T", OBSTACLE:"#", HOLE_CELL:1, AGENT:"A", BATTERY_CHARGER:"C"};
var _ACTION		= {WEST:0, EAST:1, NORTH:2, SOUTH:3, NONE:4, RESTORE:5, PEER_MESSAGE: "peer_message:", TEAM_MESSAGE: "team_message:", CONSOLE_CLEAR:6, CONSOLE_ERROR:"error:", CONSOLE_LOG:"log:", _SAVE_MEMORY_:"_save_memory_:"};

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


					//internal actions (user shouldn't be aware of this action)
					_SAVE_MEMORY_:	/(_save_memory_|_memory_)\s*(\(\s*([^)]*)\s*\)|:([^]*))/i,

					// used by the t-world proxy
					_CONNECTED_:	/^_connected_$/i,
					_DISCONNECTED_:	/^_disconnected_$/i

				};

//if you change some values or add/remove new ones remember to change the tw_msg.xsd too
var _PERCEPT_HEADER	= {
	PERCEPT: "percept", START: "start", END : "end", PAUSE: "pause",
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
var _LANGUAGES = {ENGLISH:"English", SPANISH:"Spanish"}
var _COLORS = {RED:"red", BLUE:"blue", GREEN:"green", YELLOW:"yellow", PURPLE:"purple", ORANGE:"orange", CYAN:"cyan", PINK:"pink", BLACK:"black", WHITE:"white"}
var _CAMERA_TYPE	= {FREE_ROB: 0, FIRST_PERSON: 1, PERCEPT: 2, ALIEN: 3, FREE_GRID: 4};
var _GUI = {ON_GAME_SCREEN:{$:null, LEFT:0, MARGIN_TOP:0}}
var _GAME_RESULT = {NEUTRAL:0, WON:1, LOST: 2}
var _ENDGAME = {
	TIME: {
		NAME:"Time",
		$ID:"go-time",
		$TEXT:{
			PLURAL: "llegar a los %s de juego",
			SINGULAR: "llegar a %s de juego"
		},
		MESSAGE:"TIME'S UP!"
	},
	AGENTS_LOCATION: {
		NAME:"Agent(s) location",
		$ID:"go-robs-location",
		$TEXT:{
			PLURAL: "ubicar los robots: %s",
			SINGULAR: "ubicar al robot en %s"
		},
		MESSAGE:""
	},
	FILLED_HOLES: {
		NAME:"Filled holes",
		$ID:"go-holes",
		$TEXT:{
			PLURAL: "tapar %s huecos",
			SINGULAR: "tapar %s hueco"
		},
		MESSAGE:""
	},
	FILLED_CELLS: {
		NAME:"Filled cells",
		$ID:"go-cells",
		$TEXT:{
			PLURAL:"tapar %s celdas",
			SINGULAR:"tapar %s celda"
		},
		MESSAGE:""
	},
	SCORE: {
		NAME:"Score",
		$ID:"go-score",
		$TEXT:{
			PLURAL:"llegar a una puntuaci&oacute;n de %s",
			SINGULAR:"llegar a una puntuaci&oacute;n de %s"
		},
		MESSAGE:""
	},
	GOOD_MOVES: {
		NAME:"Good moves",
		$ID:"go-movesok",
		$TEXT:{
			PLURAL: "realizar %s movimientos correctos",
			SINGULAR: "realizar %s movimiento correcto"
		},
		MESSAGE:""
	},
	BAD_MOVES: {
		NAME:"Bad moves",
		$ID:"go-movesnotok",
		$TEXT:{
			PLURAL: "realizar %s movimientos incorrectos",
			SINGULAR: "realizar %s movimiento incorrecto"
		},
		MESSAGE:"too many bad moves!"
	},
	BATTERY_USED: {
		NAME:"Battery use",
		$ID:"go-battery-use",
		$TEXT:{
			PLURAL: "gastar %s de bater&iacute;a",
			SINGULAR: "gastar %s de bater&iacute;a"
		},
		MESSAGE:""
	},
	BATTERY_RECHARGE: {
		NAME:"Battery recharge",
		$ID:"go-battery-recharge",
		$TEXT:{
			PLURAL: "regargar %s veces la bater&iacute;a",
			SINGULAR: "regargar %s vez la bater&iacute;a"
		},
		MESSAGE:""
	},
	BATTERY_RESTORE: {
		NAME:"Battery restorations",
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

var _Running	= false;//did the user push the play button?
var _Paused		= false;
var _Ready		= false;//are all the agent programs ready?

var _FPS		= 60; // maximum fps

var _TILES_TELEPORT_DELAY = 2; //how many seconds takes AstroMaxi to teletransport the tiles

var _ACTIVE_CAMERA = -1;

//region 3D World Parameters
var _LaserBeamLifeTime	= 1000;//(milliseconds)
var _FloorCellSize		= 10;
var _FloorCellHeight	= 20;
var _HoleCellAlpha		= 0.4;// from 0 to 1
var _BatteryIconY		= 10;
var _MultiplierFontSize	= 30;

//-> Rob (the agent)
var _ROB_WALK_TIME = 350; // time it takes the agent to move (in milliseconds)
var _ROB_ROTATION_TIME = 170; // time it takes the agent to to turn around (in milliseconds)
//end region World Parameters