/**
*solid-general-settings.js
*<p>
*(description here)
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

// AI
var _CONTROLLED_BY_AI = false;
var 	_SOCKET_PROGRAM_AGENT = true;
var 		_SOCKET_ADDR = "localhost";//"192.168.1.7";//
var 		_SOCKET_PORT = 80;
var 		_SOCKET_OUTPUT_FORMAT = _PERCEPT_FORMAT.PROLOG;//XML;//JSON;//

// hide/show things
var _SHOW_HOLES_HELPERS = true;
var _SHOW_FPS = true;

//Tileworld dimension
var _ROWS = 20;//5;//
var _COLUMNS = 20;//5;//

// render resolution
var _RENDER_AUTO_SIZE = true;
var 	_RENDER_HEIGHT = 100;
var 	_RENDER_WIDTH = 100;

// camera
var _CAMERA_TYPE = {FREE_ROB: 0, PERCEPT: 1, ALIEN: 2, FREE_GRID: 3};
var _DEFAULT_CAMERA = _CAMERA_TYPE.FREE_ROB;
var _CAMERA_SMOOTH = true;

// animation
var _AUTO_MINIMAL_UPDATE_DELAY = false;
var 	_MINIMAL_UPDATE_DELAY = 0; //the less, the smoother animations are

// Audio
var _AUDIO_ENABLE = true;
var 	_VOLUME_LEVEL = 100;
