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

importScripts('solid-auxiliary.js', 'solid-global.js', '../util/sprintf.min.js'); 

/*API
-coordenate_relativesToAgent(){ - porque como lo voy a hacer multi agente no puedo hacer que las cosas sean relativas al agente, para eso uso esta funcion
	object[0] = _agentPos.Row - object[0];
	object[1] = object[1] - _agentPos.Column;
*/

var alert = function(msg){
	if (msg instanceof Object)
		msg = JSON.stringify(msg);

	$return(_ACTION.CONSOLE_LOG + msg);
}

//console guard
try{
	console.clear();
	var _console = console;
	console = {};
 }catch(e){ var console = {} };
console.error = function(msg){ $return(_ACTION.CONSOLE_ERROR + msg)}
console.clear = function(msg){ $return(_ACTION.CONSOLE_CLEAR)}
console.log = alert;

function printf(){console.log(sprintf.apply(this, arguments))};
var perror = console.error;
var writeln = alert;

var _ACTION_SENT;
var _LAST_ERROR_SENT = "";
var _PERCEPT = null;
var _GRID;
var _AGENT;

var _WEST= _ACTION.WEST;
var _EAST= _ACTION.EAST;
var _NORTH= _ACTION.NORTH;
var _SOUTH= _ACTION.SOUTH;
var _NONE= _ACTION.NONE;
var _RESTORE= _ACTION.RESTORE;

var __AgentProgram__;
var __onMessageReceived__;
var __onStart__;
var __error__;

var $m;
var $memory;
var $persistent;

function __AgentProgram__Wrapper__(percept)/*returns action*/{
	percept = percept.data;

	switch(percept.header){
		case _PERCEPT_HEADER.INTERNAL:
			__error__ = false;
			$memory= $persistent= $m= percept.data.memory || {};

			// searching for errors

			try{ eval(percept.data.global_src); }
			catch(e){
				var matchs = e.stack.match(/(anonymous|eval)[^0-9 ]*(\d+)[^0-9]*(\d+)/i);
				if (!matchs)	console.error(e.stack);
				else			console.error(e.name + ": " + e.message + " at 'Global Scope' section (Line:"+matchs[2]+", Column:"+matchs[3]+")");
				__error__ = true;
			}
			if (__error__) return;
			try{ eval(percept.data.ai_src); }
			catch(e){
				var matchs = e.stack.match(/(anonymous|eval)[^0-9 ]*(\d+)[^0-9]*(\d+)/i);
				if (!matchs)	console.error(e.stack);
				else			console.error(e.name + ": " + e.message + " at 'Agent Program' section (Line:"+matchs[2]+", Column:"+matchs[3]+")");
				__error__ = true;
			}
			if (__error__) return;
			try{ eval(percept.data.start_src); }
			catch(e){
				var matchs = e.stack.match(/(anonymous|eval)[^0-9 ]*(\d+)[^0-9]*(\d+)/i);
				if (!matchs)	console.error(e.stack);
				else			console.error(e.name + ": " + e.message + " at 'Start Event' section (Line:"+matchs[2]+", Column:"+matchs[3]+")");
				__error__ = true;
			}
			if (__error__) return;
			try{ eval(percept.data.msg_src); }
			catch(e){
				var matchs = e.stack.match(/(anonymous|eval)[^0-9 ]*(\d+)[^0-9]*(\d+)/i);
				if (!matchs)	console.error(e.stack);
				else			console.error(e.name + ": " + e.message + " at 'Message Received Event' section (Line:"+matchs[2]+", Column:"+matchs[3]+")");
				__error__ = true;
			}
			if (__error__) return;

			eval(
				"(function(){"+
					percept.data.global_src+

					"(function(){"+
						percept.data.ai_src
							.replace(/(\$(return|perceive)\s*\([^;}]*?\)[^}]?)/g, "{$1;return}")
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
					var matchs = false;//e.stack.match(/(anonymous|eval)[^0-9 ]*(\d+)[^0-9]*(\d+)/i);
					if (!matchs)	console.error(e.stack);
					else			console.error(e.name + ": " + e.message + " at 'onStart' (Line:"+matchs[2]+", Column:"+matchs[3]+")");
				};
				$return(_ACTION.NONE);
			break;

		case _PERCEPT_HEADER.ERROR:
			if (_LAST_ERROR_SENT != percept.data){
				_LAST_ERROR_SENT = percept.data;
				console.error(percept.data.match(/^'([^]*)'$/)[1]);
			}
			break;

		case _PERCEPT_HEADER.END:
			$return(_ACTION._SAVE_MEMORY_ + JSON.stringify($memory))
			self.close();
			break;

		case _PERCEPT_HEADER.MESSAGE:
			var msg;

			try{msg = JSON.parse(percept.data)}
			catch(e){msg = percept.data}//if not a JSON then pass a sting to "__onMessageReceived__"

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

		default: if (!__error__){
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
	}
}onmessage = __AgentProgram__Wrapper__; 

// transition model
function $result(state, action, paint){if (!$isValidMove(state, action)) return state;
	var ir, ic, r, c;
	var loc = state.agent.location;
	var env = state.environment;
	var grid = env.grid;

	state.agent.stats.good_moves++;
	//TODO: update battery stats

	switch(action){
		case _NORTH:	r = -1; break;
		case _SOUTH:	r =  1; break;
		case _WEST:		c = -1; break;
		case _EAST:		c =  1; break;
		default:
			console.error('$result: invalid action');
			return state;
	}

	if (paint)
		$paintCell(loc.row+r, loc.column);

	for (ir= loc.row+r; $isTile(state, ir, loc.column); ir=ir+r);

	if (ir == loc.row+r){
		grid[loc.row][loc.column] = _GRID_CELL.EMPTY;
		grid[loc.row+r][loc.column] = _GRID_CELL.AGENT;
	}else
	if ($isHoleCell(state, ir, loc.column)) {
		grid[ir][loc.column] = _GRID_CELL.EMPTY;
		grid[loc.row][loc.column] = _GRID_CELL.EMPTY;
		grid[loc.row+r][loc.column] = _GRID_CELL.AGENT;

		for (var i=env.holes.length; i--;)
			for (var j=env.holes[i].cells.length; j--;)
				if (env.holes[i].cells[j].row == ir &&
					env.holes[i].cells[j].column == loc.column)
				{
					env.holes[i].cells.remove(j);

					state.agent.stats.filled_cells++;

					if (!env.holes[i].cells.length){ // if hole's filled
						//TODO: if multiplier
						state.agent.stats.filled_holes++;
						state.agent.score += env.holes[i].value;
						env.holes.remove(i);
						break;
					}else
						state.agent.score += (env.holes[i].size - env.holes[i].cells.length)*2;/*TODO: _SCORE_CELLS_MULTIPLIER if partial rewards 0 otherwise*/
				}
	}else
	if ($isEmptyCell(state, ir, loc.column)) {
		grid[ir][loc.column] = _GRID_CELL.TILE;
		grid[loc.row][loc.column] = _GRID_CELL.EMPTY;
		grid[loc.row+r][loc.column] = _GRID_CELL.AGENT;

		for (var i=env.tiles.length; i--;)
			if (env.tiles[i].row == loc.row+r &&
				env.tiles[i].column == loc.column)
			{
				env.tiles[i].row = ir;
				env.tiles[i].column = loc.column;
				break;
			}
	}

	loc.row = loc.row+r;

	return state;
}

function $paintCell(row, column){$return(_ACTION.PAINT_CELL+row+":"+column)}

function $clearPaintedCells(){$return(_ACTION.CLEAR_CELLS)}

function $nextAction(arrayOfActions){
	return (!arrayOfActions || arrayOfActions.length == 0)? _ACTION.NONE : arrayOfActions.shift();
}

function $randomAction(){return random(6)}

function $randomValidAction(percept /*n,s,w,e*/){
	var actions = new Array();

	if ($isValidMove(percept, _ACTION.NORTH))
		actions.push(_ACTION.NORTH);

	if ($isValidMove(percept, _ACTION.SOUTH))
		actions.push(_ACTION.SOUTH);

	if ($isValidMove(percept, _ACTION.EAST))
		actions.push(percept, _ACTION.EAST);

	if ($isValidMove(percept, _ACTION.WEST))
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

function $perceive(){postMessage(_ACTION.NONE)}





function $isValidCoordinates(percept, row, column) {var _grid= percept.environment.grid;
	return (0 <= row && row < _grid.length)&&(0 <= column && column < _grid[0].length);
}

function $isEmptyCell(percept, row, column) {var _grid= percept.environment.grid;
	return	$isValidCoordinates(percept, row,column)&&
			(_grid[row][column] == _GRID_CELL.EMPTY);
}

function $isHoleCell(percept, row, column) {var _grid= percept.environment.grid;
	return	$isValidCoordinates(percept, row,column)&&
			(_grid[row][column] === (_grid[row][column]|0));
}

function $isTile(percept, row, column) {var _grid= percept.environment.grid;
	return	$isValidCoordinates(percept, row,column)&&
			(_grid[row][column] == _GRID_CELL.TILE);
}

function $isAgent(percept, row, column) {var _grid= percept.environment.grid;
	return	$isValidCoordinates(percept, row,column)&&
			(_grid[row][column] == _GRID_CELL.AGENT);
}

function $isObstacle(percept, row, column) {var _grid= percept.environment.grid;
	return	$isValidCoordinates(percept, row,column)&&
			(_grid[row][column] == _GRID_CELL.OBSTACLE);
}

function $isValidMove(percept, move){
	var arow, acol;
	var r = 0, c = 0;
	var _GRID = percept.environment.grid;
		_GRID.ROWS = _GRID.length;
		_GRID.COLUMNS = _GRID[0].length;

	if (move === undefined){
		arow = _AGENT.location.row;
		acol = _AGENT.location.column;
		move = percept;
	}else{
		arow = percept.agent.location.row;
		acol = percept.agent.location.column;
	}

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

	if (_GRID[arow+r][acol+c] == _GRID_CELL.TILE){
		var tr = r, tc = c;
		for (; _GRID[arow+tr][acol+tc] == _GRID_CELL.TILE; tr+= r, tc+= c)
			if ( arow+tr+r < 0 || arow+tr+r > _GRID.ROWS-1 ||
				 acol+tc+c < 0 || acol+tc+c > _GRID.COLUMNS-1)
				return false;
		r = tr;
		c = tc;
		return	!$isObstacle(percept, arow+r, acol+c) &&
				!$isAgent(percept, arow+r, acol+c);
	}

	return	!$isHoleCell(percept, arow+r, acol+c) &&
			!$isObstacle(percept, arow+r, acol+c) &&
			!$isAgent(percept, arow+r, acol+c);
}




function $printGrid(percept, noClear){
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

	if (!noClear)
		console.clear();
	_console.log("\n" + strgLine + strgGrid + strgLine + " Score: " + percept.agent.score);
}