/**
*solid-global.js
*<p>
*Computational objects globally visible
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

//common vocabulary for comunication between Tileworld and the Program Agent
var _ACTION = {WEST:0, EAST:1, NORTH:2, SOUTH:3, NONE:4, CONSOLE_CLEAR:5, ERROR:"_ERROR_:", MESSAGE:"_MESSAGE_:"};
var GRID_CELL = {EMPTY:" ", TILE:"T", OBSTACLE:"#", HOLE_CELL:1, AGENT:"A", BATTERY_CHARGER:"C"};

var _Ready = false;
var _Running = false;//did the user push the play button?

var _FPS = 60; // real fps
var _TELEPORT_DELAY = 2; //how many seconds takes for AstroMaxi to teletransport the tiles

var _ROB_RANDOM_START_POSITION = true;
var _ROB_START_POSITION = {ROW : 5, COLUMN: 5}

var _BATTERY_WALK_COST = 10;
var _BATTERY_SLIDE_COST = 10;
var _BATTERY_INVALID_MOVE_COST = 5;

var _STOCHASTIC_ACTIONS_MODEL = {NO_ACTION: 0, ANOTHER_ACTION: 1, OPPOSITE_ACTION: 2}