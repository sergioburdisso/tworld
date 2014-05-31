/**
*solid-agent.js
*<p>
*(description here)
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/
/*
One  processor  executes  a  short  control 
cycle  (the  act  cycle),  acting  on  previously  formulated 
plans  and  monitoring  the  world  for  changes.  The  sec- 
ond  processor  executes  a  longer  cycle  (the  reasoning 
cycle)
*/
importScripts('solid-auxiliary.js', 'solid-global.js', 'solid-general-settings.js', 'solid-core.js'); 

/*API
-coordenate_relativesToAgent(){ - porque como lo voy a hacer multi agente no puedo hacer que las cosas sean relativas al agente, para eso uso esta funcion
	object[0] = _agentPos.Row - object[0];
	object[1] = object[1] - _agentPos.Column;

-sucesor(estado) // sucesor debe descontar los segundos de vida de los objetos (segun el tiempo que demora en caminar)

time:
-HowMuchTimeHasPassed? without  regard  to  the  amount  of  time  it  is  taking is  not  likely  to  make rational decisions
-time actions take

-holeValue() o lo pongo en la percepcion ya? The  agent knows ahead 
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

var _READY_FOR_NEXT_ACTION = false;

function ProgramAgent(percept)/*returns accion*/{
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
			if (Tileworld.PerceiveEveryTick)
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
			if (!Tileworld.PerceiveEveryTick || _READY_FOR_NEXT_ACTION){

				_READY_FOR_NEXT_ACTION = !Tileworld.PerceiveEveryTick;

				percept = percept.data;

				//printGrid(percept.grid);
				//console.log(JSON.stringify(percept));
				//console.log(JSON.stringify(percept.extra.list_of_holes));
				//console.log("*****************************************************");

				//this.memory = null; //the agent’s memory of the world
				//this.memory = UPDATE_MEMORY(memory,percept)

				var action = chooseBestAction(percept.data/*memory*/);
				returnAction(action);
				//MULTI AGENT, [0,1],[2,3]
				/*if (!this.goal && percept.rob_id == 0){
					this.goal = {row:0, column:0};
					teamMessage(this.goal);
				}
				else
				if (!this.goal && percept.rob_id == 2){
					this.goal = {row:percept.grid.total_rows-1, column:percept.grid.total_columns-1};
					teamMessage(this.goal);
				}

				if (this.goal){
					if (this.goal.row < percept.rob.row)
						returnAction(_ACTION.NORTH);
					else
					if (this.goal.row > percept.rob.row)
						returnAction(_ACTION.SOUTH);

					if (this.goal.column < percept.rob.column)
						returnAction(_ACTION.WEST);
					else
					if (this.goal.column > percept.rob.column)
						returnAction(_ACTION.EAST);
				}*/

				/*memory = UPDATE_MEMORY(memory,action)*/

				//creating some overhead in order to put the thread into the test
				//for (var i=0; i < 1000000000; i++);


				//d/10; //<- ERROR


				// Pass our message back to the creator's thread 
				// i.e. return action (to Rob's body XD)
				//returnAction(action);
			}
	}
	}catch(e){console.error(e.stack);};
}
onmessage = ProgramAgent; 

function chooseBestAction(percept /*n,s,w,e*/){
	var actions = new Array();

	//if (percept[0] == _GRID_CELL.EMPTY)
		actions.push(_ACTION.NORTH);

	//if (percept[1] == _GRID_CELL.EMPTY)
		actions.push(_ACTION.SOUTH);

	//if (percept[2] == _GRID_CELL.EMPTY)
		actions.push(_ACTION.EAST);

	//if (percept[3] == _GRID_CELL.EMPTY)
		actions.push(_ACTION.WEST);

	return (actions.length == 0)? _ACTION.NONE : actions[parseInt(Math.random()*actions.length)];
}

function returnAction(action){
	postMessage(action);
}

function teamMessage(msg){
	returnAction(_ACTION.MESSAGE + JSON.stringify(msg));
}

function perceive(){
	postMessage(_ACTION.NONE);
	//return from execution
}

function printGrid(grid){
	var strgLine = "\t";
	var strgGrid = "";

	for (var i=0; i < grid[0].length; ++i)
		strgLine+="_\t";
	strgLine+= "\n";

	for (var i=0; i < grid.length; ++i)
		strgGrid+= "|\t"+grid[i].join("\t")+"\t|\n";

	console.clear();
	console.log(strgLine + strgGrid + strgLine);
}