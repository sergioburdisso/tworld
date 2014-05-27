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
var _ROWS = 6;//5;//
var _COLUMNS = 6;//5;//

// render resolution
var _RENDER_AUTO_SIZE = true;
var 	_RENDER_HEIGHT = 100;
var 	_RENDER_WIDTH = 100;

// camera
var _CAMERA_TYPE = {FREE_ROB: 0, PERCEPT: 1, ALIEN: 2, FREE_GRID: 3};
var _DEFAULT_CAMERA = _CAMERA_TYPE.FREE_ROB;
var _CAMERA_SMOOTH = true;

//controls
var _ROB_CONTROLS = new Array(_NUMBER_OF_ROBS);
	_ROB_CONTROLS[0] = {Up:87, Down:83, Left:65, Right:68};/*WSAD*/
	_ROB_CONTROLS[1] = {Up:38, Down:40, Left:37, Right:39};/*Arrow keys*/
	_ROB_CONTROLS[2] = {Up:85, Down:74, Left:72, Right:75};/*UJHK*/

for (var k=0; k < _NUMBER_OF_ROBS; ++k){
	_VALID_KEYS.push(_ROB_CONTROLS[k].Up);
	_VALID_KEYS.push(_ROB_CONTROLS[k].Down);
	_VALID_KEYS.push(_ROB_CONTROLS[k].Left);
	_VALID_KEYS.push(_ROB_CONTROLS[k].Right);
}

// animation
var _AUTO_MINIMAL_UPDATE_DELAY = false;
var 	_MINIMAL_UPDATE_DELAY = 0; //the less, the smoother animations are

// Audio
var _AUDIO_ENABLE = true;
var 	_VOLUME_LEVEL = 100;
