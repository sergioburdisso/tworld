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
var _ACTION = {NONE:0, WEST:1, EAST:2, NORTH:3, SOUTH:4/*, RECHARGE:5*/};
var GRID_CELL = {None:" ", Tile:"T", Obstacle:"#", Hole:1, Rob:"a"};

var _Pause = false;//is the game paused?
var _Ready = false;//did the user push the play button?

var _FPS = 60; // real fps
var _TELEPORT_DELAY = 2; //how many seconds takes for AstroMaxi to teletransport the tiles

var _ROB_START_POSITION = {ROW : 5, COLUMN: 5}