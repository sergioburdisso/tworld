/**
*solid-general-settings.js
*<p>
*(description here)
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

var _ROBS_RANDOM_START	= true;
var _NUMBER_OF_ROBS		= 2;
var _ROBS = new Array(_NUMBER_OF_ROBS); for (var k=0; k < _NUMBER_OF_ROBS; ++k) _ROBS[k]={};

_ROBS[0].NAME = "";
_ROBS[0].START_POSITION = {ROW : 0, COLUMN: 1};// used if _ROBS_RANDOM_START is false
_ROBS[0].CONTROLS = {Up:87, Down:83, Left:65, Right:68, Recharge:69};/*WSADE*/
//_ROBS[0].CONTROLLED_BY_AI = true;
//_ROBS[0].AI_SOURCE_CODE = "returnAction(Math.random()*4|0);"
//_ROBS[0].TEAM_MSG_SOURCE_CODE = "";
/*_ROBS[0].SOCKET_PROGRAM_AGENT =	{
									ADDR: "localhost",//"192.168.1.7",//
									PORT: 3313,//80,
									OUTPUT_FORMAT: _PERCEPT_FORMAT.JSON//XML//PROLOG//
								}*/

_ROBS[1].NAME = "";
_ROBS[1].CONTROLS = {Up:38, Down:40, Left:37, Right:39, Recharge:96/*35*/};/*Arrow keys + 0 [<end>]*/
//_ROBS[1].CONTROLLED_BY_AI = true;
/*_ROBS[1].SOCKET_PROGRAM_AGENT =	{
									ADDR: "localhost",//"192.168.1.7",//
									PORT: 3313,//80,
									OUTPUT_FORMAT: _PERCEPT_FORMAT.JSON//XML//PROLOG//
								}*/

if (_ROBS[_NUMBER_OF_ROBS]){
_ROBS[2].NAME = "Sergio";
_ROBS[2].CONTROLS = {Up:72, Down:78, Left:66, Right:77, Recharge:74};/*HNBMJ*/
//_ROBS[2].CONTROLLED_BY_AI = true;
/*_ROBS[2].SOCKET_PROGRAM_AGENT =	{
									ADDR: "localhost",//"192.168.1.7",//
									PORT: 3313,//80,
									OUTPUT_FORMAT: _PERCEPT_FORMAT.PROLOG//XML//JSON//
								}
*/
_ROBS[3].NAME = "NOTE_III";
_ROBS[3].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Recharge:187};/*PÑL[+*/
//_ROBS[3].CONTROLLED_BY_AI = true;
/*_ROBS[3].SOCKET_PROGRAM_AGENT =	{
									ADDR: "localhost",//"192.168.1.7",//
									PORT: 3313,//80,
									OUTPUT_FORMAT: _PERCEPT_FORMAT.JSON//PROLOG//XML//
								}
*/

_ROBS[4].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Recharge:187};/*PÑL[+*/
_ROBS[4].CONTROLLED_BY_AI = true;

_ROBS[5].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Recharge:187};/*PÑL[+*/
_ROBS[5].CONTROLLED_BY_AI = true;

_ROBS[6].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Recharge:187};/*PÑL[+*/
_ROBS[6].CONTROLLED_BY_AI = true;

_ROBS[7].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Recharge:187};/*PÑL[+*/
_ROBS[7].CONTROLLED_BY_AI = true;

_ROBS[8].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Recharge:187};/*PÑL[+*/
_ROBS[8].CONTROLLED_BY_AI = true;

_ROBS[9].CONTROLS = {Up:80, Down:192, Left:76, Right:222, Recharge:187};/*PÑL[+*/
_ROBS[9].CONTROLLED_BY_AI = true;
}

var _TEAMS = [
	/*{NAME:"Los Solids", MEMBERS:[0,1,4]},
	{NAME:"Los Juaz", MEMBERS:[2,3,5]}*/
	{NAME:"Los Solids", MEMBERS:[0,1]},
	{NAME:"Los Solids", MEMBERS:[2]}
	];

var _TIME_LIMIT	= 5*60;//seconds

// hide/show things
var _SHOW_HOLES_HELPERS = true;
var _SHOW_FPS = true;

//Tileworld dimension
var _ROWS = 8;//5;//
var _COLUMNS = 8;//5;//

// render resolution
var _RENDER_AUTO_SIZE = true;
var 	_RENDER_HEIGHT = 400;
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

var _AI_NECESSARY = false;
var _XML_NECESSARY = false;
var _JSON_NECESSARY = false;


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

//Initialazing values

for (var k=0; k < _NUMBER_OF_ROBS; ++k){
	if (!_ROBS[k].NAME)
		_ROBS[k].NAME = "Player "+k;

	if (_ROBS[k].CONTROLLED_BY_AI || _ROBS[k].SOCKET_PROGRAM_AGENT){
		_AI_NECESSARY = true;
		if (_ROBS[k].SOCKET_PROGRAM_AGENT){
			switch(_ROBS[k].SOCKET_PROGRAM_AGENT.OUTPUT_FORMAT){
				case _PERCEPT_FORMAT.XML:
					_XML_NECESSARY = true;
					break;
				case _PERCEPT_FORMAT.JSON:
					_JSON_NECESSARY = true;
					break;
			}
		}
	}else{
		if (_ROBS[k].CONTROLS){
			for (prop in _ROBS[k].CONTROLS)
				if (!(_ROBS[k].CONTROLS[prop] instanceof Function))
					_VALID_KEYS.push(_ROBS[k].CONTROLS[prop]);
		}else
			_AI_NECESSARY = _ROBS[k].CONTROLLED_BY_AI = true;
	}
}

for (var t=0; t < _TEAMS.length; ++t)
	if (_TEAMS[t].MEMBERS.length == 1)
		_TEAMS[t].NAME = _ROBS[_TEAMS[t].MEMBERS[0]].NAME;
	else
	if (!_TEAMS[t].NAME)
		_TEAMS[t].NAME = "Team "+t;