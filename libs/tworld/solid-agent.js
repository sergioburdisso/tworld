/*
* solid-agent.js - 
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

importScripts('solid-auxiliary.js', 'solid-global.js'); 

function chooseRandomAction(){return random(4)}
/*API
-coordenate_relativesToAgent(){ - porque como lo voy a hacer multi agente no puedo hacer que las cosas sean relativas al agente, para eso uso esta funcion
	object[0] = _agentPos.Row - object[0];
	object[1] = object[1] - _agentPos.Column;

-sucesor(estado) // sucesor debe descontar los segundos de vida de los objetos (segun el tiempo que demora en caminar)

time:
-HowMuchTimeHasPassed? without  regard  to  the  amount  of  time  it  is  taking is  not  likely  to  make rational decisions

-holeValue() The  agent knows ahead 
of time how valuable the hole is; its overall goal is to 
get as many points as possible by filling in holes.

-debug:
	-print whole perception (grid + extra)
	-print grid perception
*/

var alert = function(msg){
	if (msg instanceof Object)
		msg = JSON.stringify(msg);

	$return(_ACTION.CONSOLE_LOG + msg);
}
//console guard
console = {};
console.error = function(msg){ $return(_ACTION.CONSOLE_ERROR + msg); }
console.clear = function(msg){ $return(_ACTION.CONSOLE_CLEAR); }
console.log = alert;

var _ACTION_SENT;
var _PERCEPT = null;
var _GRID;
var _AGENT;

var __AgentProgram__;
var __onMessageReceived__;
var __onStart__;

var $m = {};
var $memory = $m;
var $persistent = $m;

function _agentProgram(percept)/*returns accion*/{
	percept = percept.data;

	switch(percept.header){
		case _PERCEPT_HEADER.INTERNAL:
			eval(
				"(function(){"+
					percept.data.global_src+

					"(function(){"+
						percept.data.ai_src.replace(/(\$return\s*\(.*\))/g, "$1;return")
						+"\
						__AgentProgram__= AGENT_PROGRAM\
					})();"+

					"(function(){"+
						percept.data.start_src
						+"\
						__onStart__= onStart\
					})();"+

					"(function(){"+
						percept.data.msg_src
						+"\
						__onMessageReceived__= onMessageReceived\
					})()\
				})()"
			);
			break;

		case _PERCEPT_HEADER.START:
				try{
					__onStart__(percept.data);
				}catch(e){
					var matchs = e.stack.match(/(anonymous|eval)[^0-9 ]*(\d+)[^0-9]*(\d+)/i);
					if (!matchs)	console.error(e.stack);
					else			console.error(e.name + ": " + e.message + " at 'onStart' (Line:"+matchs[2]+", Column:"+matchs[3]+")");
				};
				$return(_ACTION.NONE);
			break;

		case _PERCEPT_HEADER.END:
			self.close();
			break;

		case _PERCEPT_HEADER.MESSAGE:
			var msg;

			try{msg = JSON.parse(percept.data)}
			catch(e){msg = percept.data}//if not a JSON then pass the sting to "__onMessageReceived__"

			try{
				__onMessageReceived__(msg);
			}catch(e){
				var matchs = e.stack.match(/(anonymous|eval)[^0-9 ]*(\d+)[^0-9]*(\d+)/i);
				if (!matchs)	console.error(e.stack);
				else			console.error(e.name + ": " + e.message + " at onMessageReceived (Line:"+matchs[2]+", Column:"+matchs[3]+")");
			};
			$perceive();
			break;

		case _PERCEPT_HEADER.PAUSE:
			if (percept.data == "off")
				$perceive();
			break;

		default:
			//HIDDEN
			percept = percept.data;

			_PERCEPT = percept;

			_GRID = percept.environment.grid;
			_GRID.ROWS = _GRID.length;
			_GRID.COLUMNS = _GRID[0].length;

			_AGENT = percept.agent;
			_ACTION_SENT = false;

			try{
				__AgentProgram__(percept);
			}catch(e){
				var matchs = e.stack.match(/(anonymous|eval)[^0-9 ]*(\d+)[^0-9]*(\d+)/i);
				if (!matchs)	console.error(e.stack);
				else			console.error(e.name + ": " + e.message + " at AGENT_PROGRAM (Line:"+matchs[2]+", Column:"+matchs[3]+")");
			};

			//ACTIONS GUARD
			if (!_ACTION_SENT)
				$perceive();
	}
}onmessage = _agentProgram; 

function $chooseRandomValidAction(percept /*n,s,w,e*/){
	var actions = new Array();

	if ($isValidMove(_ACTION.NORTH))
		actions.push(_ACTION.NORTH);

	if ($isValidMove(_ACTION.SOUTH))
		actions.push(_ACTION.SOUTH);

	if ($isValidMove(_ACTION.EAST))
		actions.push(_ACTION.EAST);

	if ($isValidMove(_ACTION.WEST))
		actions.push(_ACTION.WEST);

	return (actions.length == 0)? _ACTION.NONE : actions[parseInt(Math.random()*actions.length)];
}

function $return(action){
	switch(action){
		case _ACTION.NORTH:
		case _ACTION.SOUTH:
		case _ACTION.WEST:
		case _ACTION.EAST:
		case _ACTION.NONE:
		case _ACTION.RESTORE:
			_ACTION_SENT = true;
	}
	postMessage(action);
}

function $sendTeamMessage(msg){
	$return(_ACTION.TEAM_MESSAGE + JSON.stringify(msg));
}

function $sendMessage(robId, msg){
	$return(_ACTION.PEER_MESSAGE + robId + ":" + JSON.stringify(msg));
}

function $perceive(){
	postMessage(_ACTION.NONE);
	//return from execution
}

function $isValidMove(move){
	var arow = _AGENT.location.row;
	var acol = _AGENT.location.column;
	var r = 0, c = 0;

	switch(move){
		case _ACTION.NORTH:
			if (arow <= 0)
				return false;
			r = -1;
			break;
		case _ACTION.SOUTH:
			if (arow >= _GRID.ROWS-1)
				return false;
			r = 1;
			break;
		case _ACTION.WEST:
			if (acol <= 0)
				return false;
			c = -1;
			break;
		case _ACTION.EAST:
			if (acol >= _GRID.COLUMNS-1)
				return false;
			c = 1;
	}

	return (_GRID[arow+r][acol+c] == _GRID_CELL.EMPTY ||
			_GRID[arow+r][acol+c] == _GRID_CELL.TILE  || 
			_GRID[arow+r][acol+c] == _GRID_CELL.BATTERY_CHARGER);
}

function $printGrid(percept){
	var strgLine = "   ";
	var strgGrid = "";
	var _GRID = percept.environment.grid;
		_GRID.ROWS = _GRID.length;
		_GRID.COLUMNS = _GRID[0].length;

	for (var i=0; i < _GRID.COLUMNS; ++i)
		strgLine+="-  ";
	strgLine+= "\n";

	for (var i=0; i < _GRID.ROWS; ++i){
		strgGrid+= "|  ";

		for (var j=0; j < _GRID.COLUMNS; ++j)
		strgGrid+= (isNaN(parseInt(_GRID[i][j])) || _GRID[i][j] < 10)?
				_GRID[i][j]+"  " :
				((_GRID[i][j] < 100)?
					_GRID[i][j]+" " :
					_GRID[i][j]
				)

		strgGrid+= "|\n";
	}

	console.clear();
	console.log("\n" + strgLine + strgGrid + strgLine);
}