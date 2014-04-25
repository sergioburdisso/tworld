//perceptionFunction or perceptionFilter?
/*
Perception  also  occurs  during  the  act  cycle: 
the  agent  can  access  a  global  map  of  the  world  that  indicates  the  locations  of  all  objects,  as  well  as
the  ***********score and  time  remaining  to  timeout  for  all  holes***********
*/
importScripts('solid-global.js', 'solid-auxiliary.js', 'solid-core.js'); //'solid-core.js' is included for readability's sake (Tileworld.<aKnob>)

this.perceptionFunction = function(environment) /*returns a JSON*/{
	environment = environment.data;

	var _totalHoles;
	var _agentPos = environment.RobLocation;
	var rVOEnvGrid, cVOEnvGrid;//VO stands for Virtual Origin

	//-> creating the Percept object for the very first time (this chunk of code below runs only once)
	if (!this.Percept){
		this.Percept = {
			grid: null,
			time: 0,
			score: -1,
			battery : null,
			extra: {
				agentLocation: [-1,-1],
				listOfHoles: [],
				listOfTiles: []
			}
		}

		if (!Tileworld.FullyObservableGrid){
			this.Percept.grid = newMatrix(Tileworld.VisibilityRadius*2 + 1, Tileworld.VisibilityRadius*2 + 1);
			this.Percept.extra.agentLocation[0] = this.Percept.extra.agentLocation[1] = Tileworld.VisibilityRadius;
		}

		if (!Tileworld.BatteryON)
			delete this.Percept.battery;
	}
	//<-

	//-> Grid
	// if environment is fully observable
	if (Tileworld.FullyObservableGrid)
		this.Percept.grid = environment.Grid;
	else{
	// if environment is partially observable
		//-> calculate visible grid (according to the 'VisibilityRadius')
		for (var totalRows= this.Percept.grid.length, r= 0; r < totalRows; ++r)
			for (var totalColumns= this.Percept.grid[0].length, c= 0; c < totalColumns; ++c){
				rVOEnvGrid = _agentPos.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
				cVOEnvGrid = _agentPos.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin

				if ( (rVOEnvGrid + r >= 0 && rVOEnvGrid + r < environment.Grid.length) &&
					 (cVOEnvGrid + c >= 0 && cVOEnvGrid + c < environment.Grid[0].length) )
					this.Percept.grid[r][c] = environment.Grid[rVOEnvGrid + r][cVOEnvGrid + c];
				else
					this.Percept.grid[r][c] = GRID_CELL.Obstacle;
		}
	}

	//-> time
	this.Percept.time = environment.Time;

	//-> score
	this.Percept.score = environment.Score;

	//-> battery
	if (Tileworld.BatteryON)
		this.Percept.battery = environment.Battery;

	//-> extra.
		//->Agent's current location
		if (Tileworld.FullyObservableGrid){
			this.Percept.extra.agentLocation[0] = _agentPos.Row;
			this.Percept.extra.agentLocation[1] = _agentPos.Column;
		}

		//-> List Of Holes
		_totalHoles = environment.ListOfHoles.length;
		this.Percept.extra.listOfHoles.length = _totalHoles;
		// if environment is fully observable
		if (Tileworld.FullyObservableGrid)
			this.Percept.extra.listOfHoles = environment.ListOfHoles;
		else{
			// if environment is partially observable
			var vi= 0;
			//for each hole in the environment
			for (var iHole, iHCells, iHCells, i= 0;  i < _totalHoles; ++i){
				iHole = environment.ListOfHoles[i];
				iHCells = iHole.cells

				//for each cell of the i-th hole...
				for (var k= 0; k < iHCells.length; ++k){
					//if the k-th cell of the i-th hole is not visible, then remove it...
					if ( (_agentPos.Row - Tileworld.VisibilityRadius <= iHCells[k][0] && iHCells[k][0] <= _agentPos.Row + Tileworld.VisibilityRadius) &&
						 (_agentPos.Column - Tileworld.VisibilityRadius <= iHCells[k][1] && iHCells[k][1] <= _agentPos.Column + Tileworld.VisibilityRadius)){
						rVOEnvGrid = _agentPos.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
						cVOEnvGrid = _agentPos.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
						iHCells[k][0] -= rVOEnvGrid;
						iHCells[k][1] -= cVOEnvGrid;
					}else
						iHCells.remove(k--);
				}

				//if the i-th hole has at least one visible cell, then...
				if(iHCells.length > 0){
					if (!this.Percept.extra.listOfHoles[vi])
						this.Percept.extra.listOfHoles[vi] = new Object();

					this.Percept.extra.listOfHoles[vi].id = iHole.id;
					this.Percept.extra.listOfHoles[vi].cells = iHCells;
					this.Percept.extra.listOfHoles[vi].size = iHCells.length;
					this.Percept.extra.listOfHoles[vi].value = iHole.value;

					if (Tileworld.ShowTimeLeft)
						this.Percept.extra.listOfHoles[vi].lifetimeLeft = iHole.lifetimeLeft;
					else
						delete this.Percept.extra.listOfHoles[vi].lifetimeLeft;

					vi++;
				}
			}
			this.Percept.extra.listOfHoles.length = vi; //set the new listOfHoles length
		}

		//-> List of obstacles
		var _listOfObs = environment.ListOfObstacles;
		// if environment is partially observable
		if (!Tileworld.FullyObservableGrid)
			for (var i= 0; i < _listOfObs.length; ++i){
				//if the i-th obstacle is not visible, then remove it...
				if ( (_agentPos.Row - Tileworld.VisibilityRadius <= _listOfObs[i].cell[0] && _listOfObs[i].cell[0] <= _agentPos.Row + Tileworld.VisibilityRadius) &&
					 (_agentPos.Column - Tileworld.VisibilityRadius <= _listOfObs[i].cell[1] && _listOfObs[i].cell[1] <= _agentPos.Column + Tileworld.VisibilityRadius)){
					rVOEnvGrid = _agentPos.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
					cVOEnvGrid = _agentPos.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
					_listOfObs[i].cell[0] -= rVOEnvGrid;
					_listOfObs[i].cell[1] -= cVOEnvGrid;
				}else
					_listOfObs.remove(i--);
			}

		this.Percept.extra.listOfObstacles = _listOfObs;

		//-> List Of Tiles
		for (var tileCounter= 0, r= 0; r < this.Percept.grid.length; ++r)
			for (var c= 0; c < this.Percept.grid[0].length; ++c)
				if (this.Percept.grid[r][c] == GRID_CELL.Tile){
					if (tileCounter < this.Percept.extra.listOfTiles.length){
						this.Percept.extra.listOfTiles[tileCounter][0] = r;
						this.Percept.extra.listOfTiles[tileCounter++][1] = c;
					}else
						this.Percept.extra.listOfTiles[tileCounter++] = [r, c];
				}
		this.Percept.extra.listOfTiles.length = tileCounter; //set the new listOfTiles length

	postMessage(JSON.stringify(this.Percept));//this.Percept);// general case (serialized): JSON.stringify(this.Percept)
}

onmessage = perceptionFunction;