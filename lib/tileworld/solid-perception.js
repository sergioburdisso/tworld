//perceptionFunction or perceptionFilter?
/*
Perception  also  occurs  during  the  act  cycle: 
the  agent  can  access  a  global  map  of  the  world  that  indicates  the  locations  of  all  objects,  as  well  as
the  score and  time  remaining  to  timeout  for  all  holes
*/
importScripts('solid-global.js', 'solid-general-settings.js', 'solid-auxiliary.js', 'solid-core.js'); //'solid-core.js' is included for readability's sake (Tileworld.<aKnob>)
if (_SOCKET_PROGRAM_AGENT) switch(_SOCKET_OUTPUT_FORMAT){
case _PERCEPT_FORMAT.XML:
importScripts('../util/xml2json.min.js'); var _X2JS = new X2JS();
break;
case _PERCEPT_FORMAT.PROLOG:
importScripts('../util/sprintf.min.js');
break;
}

this.perceptionFunction = function( environment ) /*returns a perception*/{
	environment = environment.data;

	var rVOEnvGrid, cVOEnvGrid; // VO stands for "Virtual Origin" (as if we were a compiler implementing multidimensional arrays XD)
	var _totalHoles, _percept, _grid;
	var _agentPos = environment.RobLocation;

	//-> creating the Percept object for the very first time (this chunk of code below runs only once)
	if (!this.Percept){
		this.Percept = {
			header : _PERCEPT_HEADER.PERCEPT,
			data:{
				grid: {rows_length: 0, columns_length: 0, rows: null/*[{columns:[...]},...]*/},
				time: 0,
				score: -1,
				battery: null,
				battery_charger: {row: -1, column: -1}, // if battery charger is not visible then it's value is [-1, -1]
				agent: {row: -1, column: -1},
				holes: [],
				tiles: [],
				costs: environment.Costs
			}
		}

		//-> creating grid
		_grid = this.Percept.data.grid;

		if (!Tileworld.FullyObservableGrid){
			_grid.columns_length = _grid.rows_length = Tileworld.VisibilityRadius*2 + 1;
			this.Percept.data.agent.row = this.Percept.data.agent.column = Tileworld.VisibilityRadius;
		}else{
			_grid.rows_length = environment.Grid.length;
			_grid.columns_length = environment.Grid[0].length;
		}

		_grid.rows = new Array(_grid.rows_length);

		for (var r= _grid.rows_length-1; r >= 0; --r)
			_grid.rows[r] = { columns: new Array(_grid.columns_length) };
		//<-

		if (!Tileworld.Battery){
			delete this.Percept.data.battery;
			delete this.Percept.data.battery_charger;
			delete this.Percept.data.costs.battery;
		}else{
			this.Percept.data.battery_charger.row = environment.BatterCharger[0];
			this.Percept.data.battery_charger.column = environment.BatterCharger[1];

			this.Percept.data.costs.battery = {}
			this.Percept.data.costs.battery.walk = _BATTERY_WALK_COST;
			this.Percept.data.costs.battery.slide_tiles = _BATTERY_SLIDE_COST;
			this.Percept.data.costs.battery.invalid_move = _BATTERY_INVALID_MOVE_COST;
		}
	}else
		_grid = this.Percept.data.grid;
	//<-

	//-> Grid
	// if grid is fully observable
	if (Tileworld.FullyObservableGrid){
		for (var r= _grid.rows_length-1; r >= 0; --r)
			for (var c= _grid.columns_length-1; c >= 0; --c)
				_grid.rows[r].columns[c] = environment.Grid[r][c];
	}else{
	// if grid is partially observable
		//-> calculate visible grid (according to the 'VisibilityRadius')
		for (var totalRows= _grid.rows_length, r= 0; r < totalRows; ++r)
			for (var totalColumns= _grid.columns_length, c= 0; c < totalColumns; ++c){
				rVOEnvGrid = _agentPos.Row - Tileworld.VisibilityRadius; //VO stands for "Virtual Origin"
				cVOEnvGrid = _agentPos.Column - Tileworld.VisibilityRadius; //VO stands for "Virtual Origin"

				if ( (rVOEnvGrid + r >= 0 && rVOEnvGrid + r < environment.Grid.length) &&
					 (cVOEnvGrid + c >= 0 && cVOEnvGrid + c < environment.Grid[0].length) )
					_grid.rows[r].columns[c] = environment.Grid[rVOEnvGrid + r][cVOEnvGrid + c];
				else
					_grid.rows[r].columns[c] = _GRID_CELL.OBSTACLE;
		}
	}

	//-> time
	this.Percept.data.time = environment.Time;

	//-> score
	this.Percept.data.score = environment.Score;

	//-> battery
	if (Tileworld.Battery){
		this.Percept.data.battery = environment.Battery;

		// if grid is partially observable
		if (!Tileworld.FullyObservableGrid)
			if ( (_agentPos.Row - Tileworld.VisibilityRadius <= environment.BatterCharger[0] && environment.BatterCharger[0] <= _agentPos.Row + Tileworld.VisibilityRadius) &&
				 (_agentPos.Column - Tileworld.VisibilityRadius <= environment.BatterCharger[1] && environment.BatterCharger[1] <= _agentPos.Column + Tileworld.VisibilityRadius)){
				this.Percept.data.battery_charger.row -= _agentPos.Row - Tileworld.VisibilityRadius;
				this.Percept.data.battery_charger.column -= _agentPos.Column - Tileworld.VisibilityRadius;
			}else{
				this.Percept.data.battery_charger.row = -1;
				this.Percept.data.battery_charger.column = -1;
			}
	}

	//->Agent's current location
	if (Tileworld.FullyObservableGrid){
		this.Percept.data.agent.row = _agentPos.Row;
		this.Percept.data.agent.column = _agentPos.Column;
	}

	//-> List Of Holes
	_totalHoles = environment.ListOfHoles.length;
	this.Percept.data.holes.length = _totalHoles;
	// if grid is fully observable
	if (Tileworld.FullyObservableGrid){
		this.Percept.data.holes = environment.ListOfHoles;

		for (var i= 0;  i < _totalHoles; ++i)
			for (var iHCells, j= this.Percept.data.holes[i].cells.length-1;  j >= 0; --j){
				iHCells = this.Percept.data.holes[i].cells[j];
				this.Percept.data.holes[i].cells[j] = {row: iHCells[0], column: iHCells[1]};
			}

	}else{
		// if grid is partially observable
		var vi= 0;
		//for each hole in the environment
		for (var iHole, iHCells, i= 0;  i < _totalHoles; ++i){
			iHole = environment.ListOfHoles[i];
			iHCells = iHole.cells

			//for each cell of the i-th hole...
			for (var k= 0; k < iHCells.length; ++k){
				//if the k-th cell of the i-th hole is not visible, then remove it...
				if ( (_agentPos.Row - Tileworld.VisibilityRadius <= iHCells[k].row && iHCells[k].row <= _agentPos.Row + Tileworld.VisibilityRadius) &&
					 (_agentPos.Column - Tileworld.VisibilityRadius <= iHCells[k].column && iHCells[k].column <= _agentPos.Column + Tileworld.VisibilityRadius)){
					rVOEnvGrid = _agentPos.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
					cVOEnvGrid = _agentPos.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
					iHCells[k].row -= rVOEnvGrid;
					iHCells[k].column -= cVOEnvGrid;
				}else
					iHCells.remove(k--);
			}

			//if the i-th hole has at least one visible cell, then...
			if(iHCells.length > 0){
				if (!this.Percept.data.holes[vi])
					this.Percept.data.holes[vi] = new Object();

				this.Percept.data.holes[vi].id = iHole.id;
				this.Percept.data.holes[vi].cells = iHCells;
				this.Percept.data.holes[vi].size = iHCells.length;
				this.Percept.data.holes[vi].value = iHole.value;

				if (Tileworld.ShowTimeLeft)
					this.Percept.data.holes[vi].lifetimeLeft = iHole.lifetimeLeft;
				else
					delete this.Percept.data.holes[vi].lifetimeLeft;

				vi++;
			}
		}
		this.Percept.data.holes.length = vi; //set the new holes length
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

	this.Percept.data.list_of_obstacles = _listOfObs;

	//-> List Of Tiles
	for (var tileCounter= 0, r= 0; r < _grid.rows_length; ++r)
		for (var c= 0; c < _grid.columns_length; ++c)
			if (_grid.rows[r].columns[c] == _GRID_CELL.TILE){
				if (tileCounter < this.Percept.data.tiles.length){
					this.Percept.data.tiles[tileCounter].row = r;
					this.Percept.data.tiles[tileCounter++].column = c;
				}else
					this.Percept.data.tiles[tileCounter++] = {row: r, column: c};
			}
	this.Percept.data.tiles.length = tileCounter; //set the new tiles length

	//region Noise generator
		//-> List of Holes
		for (var iHole, iHCells, i= 0;  i < this.Percept.data.holes.length; ++i){
			iHole =  this.Percept.data.holes[i];
			iHCells = iHole.cells;
			//for each cell of the i-th hole...
			for (var k= 0; k < iHCells.length; ++k)
				if (Math.random() < Tileworld.holesNoisyPerception){
					_grid.rows[ iHCells[k].row ].columns[ iHCells[k].column ] = _GRID_CELL.EMPTY;
					delete iHCells[k];
					iHCells.remove(k--);
				}

			if (iHole.size != iHCells.length){
				//if the i-th hole doesn't have any cell, then...
				if(iHCells.length <= 0){
					delete iHole;
					this.Percept.data.holes.remove(i--);
				}else{
					iHole.size = iHCells.length;
					iHole.value = Tileworld.valueOfHoleFilledCompletely(iHole.size)
				}

			}
		}

		//-> List of Obstacles
		for (var obst, i= 0; i < this.Percept.data.list_of_obstacles.length; ++i)
			if (Math.random() < Tileworld.obstaclesNoisyPerception){//Monte Carlos technique
				obst = this.Percept.data.list_of_obstacles[i].cell;

				_grid.rows[ obst.row ].columns[ obst.column ] = _GRID_CELL.EMPTY;

				this.Percept.data.list_of_obstacles.remove(i--);

				delete obst;
			}

		//-> List of Tiles
		for (var tile, i= 0; i < this.Percept.data.tiles.length; ++i)
			if (Math.random() < Tileworld.tilesNoisyPerception){//Monte Carlos technique
				tile = this.Percept.data.tiles[i];//.cell;

				_grid.rows[ tile.row ].columns[ tile.column ] = _GRID_CELL.EMPTY;

				this.Percept.data.tiles.remove(i--);

				delete tile;
			}
	//end region Noise generator

	_percept = this.Percept;

	//if percept has to be sent _out_ of the 3D Tileworld, firt we need to prepare it
	if ( _SOCKET_PROGRAM_AGENT )
		switch ( _SOCKET_OUTPUT_FORMAT ){
			case _PERCEPT_FORMAT.JSON:
				_percept = JSON.stringify( _percept );
				break;
			case _PERCEPT_FORMAT.XML:
				_percept = _X2JS.json2xml_str( _percept );
				break;
			case _PERCEPT_FORMAT.PROLOG:
				//TODO: reescribi esto _percept.data en formato prolog
				_percept = sprintf( _PERCEPT_FORMAT.PROLOG, _percept.header, "'"+_percept.data+"'" );
				break;
		}

	postMessage( _percept );
}

onmessage = perceptionFunction;