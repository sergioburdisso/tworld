//perceptionFunction or perceptionFilter?
/*
Perception  also  occurs  during  the  act  cycle: 
the  agent  can  access  a  global  map  of  the  world  that  indicates  the  locations  of  all  objects,  as  well  as
the  score and  time  remaining  to  timeout  for  all  holes
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
				agent_location: [-1,-1],
				list_of_holes: [],
				list_of_tiles: [],
				durations: environment.Durations
			}
		}

		if (!Tileworld.FullyObservableGrid){
			this.Percept.grid = newMatrix(Tileworld.VisibilityRadius*2 + 1, Tileworld.VisibilityRadius*2 + 1);
			this.Percept.extra.agent_location[0] = this.Percept.extra.agent_location[1] = Tileworld.VisibilityRadius;
		}

		if (!Tileworld.Battery)
			delete this.Percept.battery;
	}
	//<-

	//-> Grid
	// if grid is fully observable
	if (Tileworld.FullyObservableGrid)
		this.Percept.grid = environment.Grid;
	else{
	// if grid is partially observable
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
	if (Tileworld.Battery)
		this.Percept.battery = environment.Battery;

	//-> extra.
	//->Agent's current location
	if (Tileworld.FullyObservableGrid){
		this.Percept.extra.agent_location[0] = _agentPos.Row;
		this.Percept.extra.agent_location[1] = _agentPos.Column;
	}

	//-> List Of Holes
	_totalHoles = environment.ListOfHoles.length;
	this.Percept.extra.list_of_holes.length = _totalHoles;
	// if grid is fully observable
	if (Tileworld.FullyObservableGrid)
		this.Percept.extra.list_of_holes = environment.ListOfHoles;
	else{
		// if grid is partially observable
		var vi= 0;
		//for each hole in the environment
		for (var iHole, iHCells, i= 0;  i < _totalHoles; ++i){
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
				if (!this.Percept.extra.list_of_holes[vi])
					this.Percept.extra.list_of_holes[vi] = new Object();

				this.Percept.extra.list_of_holes[vi].id = iHole.id;
				this.Percept.extra.list_of_holes[vi].cells = iHCells;
				this.Percept.extra.list_of_holes[vi].size = iHCells.length;
				this.Percept.extra.list_of_holes[vi].value = iHole.value;

				if (Tileworld.ShowTimeLeft)
					this.Percept.extra.list_of_holes[vi].lifetimeLeft = iHole.lifetimeLeft;
				else
					delete this.Percept.extra.list_of_holes[vi].lifetimeLeft;

				vi++;
			}
		}
		this.Percept.extra.list_of_holes.length = vi; //set the new list_of_holes length
	}

	//-> List of obstacles
	var _listOfObs = environment.ListOfObstacles;
	// if grid is partially observable
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

	this.Percept.extra.list_of_obstacles = _listOfObs;

	//-> List Of Tiles
	for (var tileCounter= 0, r= 0; r < this.Percept.grid.length; ++r)
		for (var c= 0; c < this.Percept.grid[0].length; ++c)
			if (this.Percept.grid[r][c] == GRID_CELL.Tile){
				if (tileCounter < this.Percept.extra.list_of_tiles.length){
					this.Percept.extra.list_of_tiles[tileCounter][0] = r;
					this.Percept.extra.list_of_tiles[tileCounter++][1] = c;
				}else
					this.Percept.extra.list_of_tiles[tileCounter++] = [r, c];
			}
	this.Percept.extra.list_of_tiles.length = tileCounter; //set the new list_of_tiles length

	//region Noise generator
		//-> List of Holes
		for (var iHole, iHCells, i= 0;  i < this.Percept.extra.list_of_holes.length; ++i){
			iHole =  this.Percept.extra.list_of_holes[i];
			iHCells = iHole.cells;
			//for each cell of the i-th hole...
			for (var k= 0; k < iHCells.length; ++k)
				if (Math.random() < Tileworld.holesNoisyPerception){
					this.Percept.grid[ iHCells[k][0] ][ iHCells[k][1] ] = GRID_CELL.None;
					delete iHCells[k];
					iHCells.remove(k--);
				}

			if (iHole.size != iHCells.length){
				//if the i-th hole doesn't have any cell, then...
				if(iHCells.length <= 0){
					delete iHole;
					this.Percept.extra.list_of_holes.remove(i--);
				}else{
					iHole.size = iHCells.length;
					iHole.value = Tileworld.valueOfHoleFilledCompletely(iHole.size)
				}

			}
		}

		//-> List of Obstacles
		for (var obst, i= 0; i < this.Percept.extra.list_of_obstacles.length; ++i)
			if (Math.random() < Tileworld.obstaclesNoisyPerception){//Monte Carlos technique
				obst = this.Percept.extra.list_of_obstacles[i].cell;

				this.Percept.grid[ obst[0] ][ obst[1] ] = GRID_CELL.None;

				this.Percept.extra.list_of_obstacles.remove(i--);

				delete obst;
			}

		//-> List of Tiles
		for (var tile, i= 0; i < this.Percept.extra.list_of_tiles.length; ++i)
			if (Math.random() < Tileworld.tilesNoisyPerception){//Monte Carlos technique
				tile = this.Percept.extra.list_of_tiles[i];//.cell;

				this.Percept.grid[ tile[0] ][ tile[1] ] = GRID_CELL.None;

				this.Percept.extra.list_of_tiles.remove(i--);

				delete tile;
			}
	//end region Noise generator


	postMessage(JSON.stringify(this.Percept));//this.Percept);// general case (serialized): JSON.stringify(this.Percept)
}

onmessage = perceptionFunction;