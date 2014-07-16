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

importScripts('solid-auxiliary.js', 'solid-global.js', 'solid-general-settings.js', 'solid-core.js'); 

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

var alert = function(msg){ returnAction(_ACTION.CONSOLE_LOG + msg); }
var console = {};
console.error = function(msg){ returnAction(_ACTION.CONSOLE_ERROR + msg); }
console.clear = function(msg){ returnAction(_ACTION.CONSOLE_CLEAR); }
console.log = alert;

var _ACTION_SENT;
var _READY_FOR_NEXT_ACTION = false;
var _PERCEPT = null;
var _GRID;
var _AGENT;

function AgentProgram(percept)/*returns accion*/{
	percept = percept.data;

	try{
	switch(percept.header){
		case _PERCEPT_HEADER.INTERNAL:
			//inicializar el codigo de los eval()s que se vana  usar para el cuerpo y para los mensajes en equipo
			//percept.data.ai_src
			//percept.data.tm_msg_src (opcional, usualmente viene undefined)
			break;

		case _PERCEPT_HEADER.START:
			//resetEverything();
			if (TWorld.PerceiveAsync)
				_READY_FOR_NEXT_ACTION = true;
			else
				returnAction(_ACTION.NONE);
			break;

		case _PERCEPT_HEADER.END:
			self.close();
			break;

		case _PERCEPT_HEADER.MESSAGE:
			this.goal = JSON.parse(percept.data);
			perceive();
			break;

		case _PERCEPT_HEADER.READY_FOR_NEXT_ACTION:
			_READY_FOR_NEXT_ACTION = true;
			break;

		default:
			if (!TWorld.PerceiveAsync || _READY_FOR_NEXT_ACTION){
				//HIDDEN
				_READY_FOR_NEXT_ACTION = !TWorld.PerceiveAsync;
				percept = percept.data;
				_PERCEPT = percept;
				_GRID = percept.environment.grid;
				_GRID.ROWS = _GRID.length;
				_GRID.COLUMNS = _GRID[0].length;
				_AGENT = percept.agent;
				_ACTION_SENT = false;
/*
				//CODE EXCECUTE ONLY ONCE WHEN PROGRAM AGENT IS CREATED
				if (!this.FirstTimeFlag){
					this.FirstTimeFlag = true;

					var my_team;
					for (var teams = percept.builtin_knowledge.teams, i= 0; i < teams.length; ++i)
						if (teams[i].id == percept.agent.team_id)
							my_team = teams[i];

					//if I am the leader of my team
					if (percept.agent.id == my_team.leader){
						this.goal = {row:random(_GRID.ROWS - 2), column:random(_GRID.COLUMNS)};
						//sendTeamMessage(this.goal);
						for (var r=0, m= 0; m < my_team.members.length; ++m)
							if (my_team.members[m] != percept.agent.id){
								r+=2;
								sendMessage(my_team.members[m], {row: this.goal.row + r, column: this.goal.column});
							}
					}
				}

				//CODE EXCECUTE EACH TIME ROB PERCEIVES
				if (this.goal){
					if (this.goal.row < percept.agent.location.row){
						if (isValidMove(_ACTION.NORTH))
							returnAction(_ACTION.NORTH);
					}
					else
					if (this.goal.row > percept.agent.location.row){
						if (isValidMove(_ACTION.SOUTH))
							returnAction(_ACTION.SOUTH);
					}
					if (this.goal.column < percept.agent.location.column){
						if (isValidMove(_ACTION.WEST))
							returnAction(_ACTION.WEST);
					}
					else
					if (this.goal.column > percept.agent.location.column){
						if (isValidMove(_ACTION.EAST))
							returnAction(_ACTION.EAST);
					}
				}
*/
				//printGrid();
				var action = chooseBestAction(/*memory*/);
				returnAction(action);

				if (_AGENT.battery !== undefined && _AGENT.battery == 0)
					returnAction(_ACTION.RESTORE);

				//ACTIONS GUARD
				if (!_ACTION_SENT)
					perceive();
			}
	}
	}catch(e){console.error(e.stack);};
}onmessage = AgentProgram; 

function chooseBestAction(percept /*n,s,w,e*/){
	var actions = new Array();

	if (isValidMove(_ACTION.NORTH))
		actions.push(_ACTION.NORTH);

	if (isValidMove(_ACTION.SOUTH))
		actions.push(_ACTION.SOUTH);

	if (isValidMove(_ACTION.EAST))
		actions.push(_ACTION.EAST);

	if (isValidMove(_ACTION.WEST))
		actions.push(_ACTION.WEST);

	return (actions.length == 0)? _ACTION.NONE : actions[parseInt(Math.random()*actions.length)];
}

function returnAction(action){
	switch(action){
		case _ACTION.NORTH:
		case _ACTION.SOUTH:
		case _ACTION.WEST:
		case _ACTION.EAST:
		case _ACTION.NONE:
			_ACTION_SENT = true;
	}
	postMessage(action);
}

function sendTeamMessage(msg){
	returnAction(_ACTION.TEAM_MESSAGE + JSON.stringify(msg));
}

function sendMessage(robId, msg){
	returnAction(_ACTION.PEER_MESSAGE + robId + ":" + JSON.stringify(msg));
}

function perceive(){
	postMessage(_ACTION.NONE);
	//return from execution
}

function isValidMove(move){
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

function printGrid(){
	var strgLine = "   ";
	var strgGrid = "";

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
	console.log(strgLine + strgGrid + strgLine);
}