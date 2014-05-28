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
var _CONTROLLED_BY_AI = [false, false, false];
var 	_SOCKET_PROGRAM_AGENT = false;
var 		_SOCKET_ADDR = "localhost";//"192.168.1.7";//
var 		_SOCKET_PORT = 80;
var 		_SOCKET_OUTPUT_FORMAT = _PERCEPT_FORMAT.PROLOG;//XML;//JSON;//

//controls
var _ROB_CONTROLS = new Array(_NUMBER_OF_ROBS);
	_ROB_CONTROLS[0] = {Up:87, Down:83, Left:65, Right:68};/*WSAD*/
	_ROB_CONTROLS[1] = {Up:38, Down:40, Left:37, Right:39};/*Arrow keys*/
	_ROB_CONTROLS[2] = {Up:72, Down:78, Left:66, Right:77};/*HNBM*/
	_ROB_CONTROLS[3] = {Up:80, Down:192, Left:76, Right:222};/*PÑL[*/
	_ROB_CONTROLS[4] = {Up:87, Down:83, Left:65, Right:68};/*WSAD*/
	_ROB_CONTROLS[5] = {Up:38, Down:40, Left:37, Right:39};/*Arrow keys*/
	_ROB_CONTROLS[6] = {Up:72, Down:78, Left:66, Right:77};/*HNBM*/
	_ROB_CONTROLS[7] = {Up:80, Down:192, Left:76, Right:222};/*PÑL[*/
	_ROB_CONTROLS[8] = {Up:87, Down:83, Left:65, Right:68};/*WSAD*/
	_ROB_CONTROLS[9] = {Up:38, Down:40, Left:37, Right:39};/*Arrow keys*/

for (var k=0; k < _NUMBER_OF_ROBS; ++k){
		_VALID_KEYS.push(_ROB_CONTROLS[k].Up);
		_VALID_KEYS.push(_ROB_CONTROLS[k].Down);
		_VALID_KEYS.push(_ROB_CONTROLS[k].Left);
		_VALID_KEYS.push(_ROB_CONTROLS[k].Right);
}

// hide/show things
var _SHOW_HOLES_HELPERS = true;
var _SHOW_FPS = true;

//Tileworld dimension
var _ROWS = 6;//5;//
var _COLUMNS = 6;//5;//

// render resolution
var _RENDER_AUTO_SIZE = true;
var 	_RENDER_HEIGHT = 360;
var 	_RENDER_WIDTH = 600;

// camera
var _CAMERA_TYPE = {FREE_ROB: 0, PERCEPT: 1, ALIEN: 2, FREE_GRID: 3};
var _DEFAULT_CAMERA = _CAMERA_TYPE.FREE_GRID;
var _CAMERA_SMOOTH = true;

// animation
var _AUTO_MINIMAL_UPDATE_DELAY = false;
var 	_MINIMAL_UPDATE_DELAY = 0; //the less, the smoother animations are

// Audio
var _AUDIO_ENABLE = true;
var 	_VOLUME_LEVEL = 100;
