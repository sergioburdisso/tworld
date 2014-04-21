/**
*solid-agent.js
*<p>
*(description here)
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/
importScripts('solid-global.js'); 


function ProgramAgent(percept)/*returns accion*/{
	percept = percept.data;

	printGrid(percept.grid);

	this.memory = null; //the agent’s memory of the world
	//this.memory = UPDATE_MEMORY(memory,percept)

	var action = chooseBestAction(percept.data/*memory*/);
	/*memory = UPDATE_MEMORY(memory,action)*/

	//creating some overhead in order to put the thread into the test
	//for (var i=0; i < 1000000000; i++);

	// Pass our message back to the creator's thread 
	// i.e. return action (to Rob's body XD)
	postMessage(action);
}
onmessage = ProgramAgent; 

function chooseBestAction(percept /*n,s,w,e*/){
	var actions = new Array();

	//if (percept[0] == GRID_CELL.None)
		actions.push(_ACTION.NORTH);

	//if (percept[1] == GRID_CELL.None)
		actions.push(_ACTION.SOUTH);

	//if (percept[2] == GRID_CELL.None)
		actions.push(_ACTION.EAST);

	//if (percept[3] == GRID_CELL.None)
	//	actions.push(_ACTION.WEST);

	return (actions.length == 0)? _ACTION.NONE : actions[parseInt(Math.random()*actions.length)];
}