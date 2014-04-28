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
importScripts('solid-global.js', 'solid-core.js'); 

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
var _READY_FOR_NEXT_ACTION = false;

function ProgramAgent(percept)/*returns accion*/{
	percept = percept.data;

	switch(percept.toUpperCase()){
		case "START":
			//console.log("start");
			//resetEverything();

			if (Tileworld.perceiveEveryTick)
				_READY_FOR_NEXT_ACTION = true;
			else
				returnAction(_ACTION.NONE);
			break;
		case "END":
			//stop();
			break;
		case "READY_FOR_NEXT_ACTION":
			//console.log("_READY_FOR_NEXT_ACTION");
			_READY_FOR_NEXT_ACTION = true;
			break;
		default:
			//console.log("percept");
			if (!Tileworld.perceiveEveryTick || _READY_FOR_NEXT_ACTION){

				_READY_FOR_NEXT_ACTION = !Tileworld.perceiveEveryTick;
				percept = JSON.parse(percept);

				printGrid(percept.grid);
				console.log(JSON.stringify(percept));
				//console.log(JSON.stringify(percept.extra.list_of_holes));
				//console.log("*****************************************************");

				//this.memory = null; //the agent’s memory of the world
				//this.memory = UPDATE_MEMORY(memory,percept)

				var action = chooseBestAction(percept.data/*memory*/);
				/*memory = UPDATE_MEMORY(memory,action)*/

				//creating some overhead in order to put the thread into the test
				//for (var i=0; i < 1000000000; i++);

				// Pass our message back to the creator's thread 
				// i.e. return action (to Rob's body XD)
				returnAction(action);
			}
	}
}
onmessage = ProgramAgent; 

function chooseBestAction(percept /*n,s,w,e*/){
	var actions = new Array();

	//if (percept[0] == GRID_CELL.EMPTY)
		actions.push(_ACTION.NORTH);

	//if (percept[1] == GRID_CELL.EMPTY)
		actions.push(_ACTION.SOUTH);

	//if (percept[2] == GRID_CELL.EMPTY)
		actions.push(_ACTION.EAST);

	//if (percept[3] == GRID_CELL.EMPTY)
		actions.push(_ACTION.WEST);

	return (actions.length == 0)? _ACTION.NONE : actions[parseInt(Math.random()*actions.length)];
}

function returnAction(action){
	postMessage(action);
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

	console.log(strgLine + strgGrid + strgLine + "\n");
}