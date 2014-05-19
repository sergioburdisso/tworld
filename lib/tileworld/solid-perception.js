//perceptionFunction or perceptionFilter?
/*
Perception  also  occurs  during  the  act  cycle: 
the  agent  can  access  a  global  map  of  the  world  that  indicates  the  locations  of  all  objects,  as  well  as
the  score and  time  remaining  to  timeout  for  all  holes
*/
importScripts('solid-global.js', 'solid-general-settings.js', 'solid-auxiliary.js', 'solid-core.js'); //'solid-core.js' is included for readability's sake (Tileworld.<aKnob>)
if (_SOCKET_PROGRAM_AGENT) switch(_SOCKET_OUTPUT_FORMAT){
case _PERCEPT_FORMAT.XML:
importScripts('../util/xml2json.min.js'); var _X2JS = new X2JS({attributePrefix : "_attr_"});
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
				obstacles: [],
				builtin_knowledge:{
					costs: environment.Costs,
					probability: {/*holes, movement, etc.*/}
				}
			}
		}

		//creating the XML-percept object (if necessary) 
		if (_SOCKET_PROGRAM_AGENT && _SOCKET_OUTPUT_FORMAT == _PERCEPT_FORMAT.XML){
			this.PerceptXML = {
				header: this.Percept.header,
				data: {
					grid	:{_attr_rows:null, _attr_columns:null, row: null/*[column, ...]*/},
					time	:{_attr_value : 0},
					score	:{_attr_value: 0},
					battery	:{_attr_value: 0},//optional
					battery_charger:{_attr_row: -1, _attr_column: -1},//optional
					agent	:{_attr_row: -1, _attr_column: -1},
					holes	:{hole: null/*[]*/},
					tiles	:{tile: null/*[]*/},
					obstacles:{obstacle: null/*[]*/},
					builtin_knowledge:{
						costs: {
							moves:{},
							invalid_action:{},
							hole_filling:{},
							battery : {
								walk:{},
								slide_tiles:{},
								invalid_move:{}
							}
						},
						probability: {/*holes, movement, etc.*/}
					}
				}
			};

			this.PerceptXML.data.builtin_knowledge.costs.moves._attr_value = environment.Costs.moves;
			this.PerceptXML.data.builtin_knowledge.costs.invalid_action._attr_value = environment.Costs.invalid_action;
			this.PerceptXML.data.builtin_knowledge.costs.hole_filling._attr_value = environment.Costs.hole_filling;

			this.PerceptXML.data.builtin_knowledge.costs.battery.walk._attr_value = _BATTERY_WALK_COST;
			this.PerceptXML.data.builtin_knowledge.costs.battery.slide_tiles._attr_value = _BATTERY_SLIDE_COST;
			this.PerceptXML.data.builtin_knowledge.costs.battery.invalid_move._attr_value = _BATTERY_INVALID_MOVE_COST;
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

		this.Percept.data.builtin_knowledge.costs.battery = {}
		this.Percept.data.builtin_knowledge.costs.battery.walk = _BATTERY_WALK_COST;
		this.Percept.data.builtin_knowledge.costs.battery.slide_tiles = _BATTERY_SLIDE_COST;
		this.Percept.data.builtin_knowledge.costs.battery.invalid_move = _BATTERY_INVALID_MOVE_COST;

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
		this.Percept.data.battery_charger.row = environment.BatterCharger[0];
		this.Percept.data.battery_charger.column = environment.BatterCharger[1];

		// if grid is partially observable
		if (!Tileworld.FullyObservableGrid)
			//if the charger is visible...
			if ( (_agentPos.Row - Tileworld.VisibilityRadius <= environment.BatterCharger[0] && environment.BatterCharger[0] <= _agentPos.Row + Tileworld.VisibilityRadius) &&
				 (_agentPos.Column - Tileworld.VisibilityRadius <= environment.BatterCharger[1] && environment.BatterCharger[1] <= _agentPos.Column + Tileworld.VisibilityRadius)){
				this.Percept.data.battery_charger.row -= (_agentPos.Row - Tileworld.VisibilityRadius);
				this.Percept.data.battery_charger.column -= (_agentPos.Column - Tileworld.VisibilityRadius);
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
	this.Percept.data.holes = environment.ListOfHoles;

	// if grid is fully observable
	if (Tileworld.FullyObservableGrid){

		for (var i= this.Percept.data.holes.length-1;  i >= 0; --i)
			for (var iHCells, j= this.Percept.data.holes[i].cells.length-1;  j >= 0; --j){
				iHCells = this.Percept.data.holes[i].cells[j];
				this.Percept.data.holes[i].cells[j] = {row: iHCells[0], column: iHCells[1]};
			}

	}else{
		// if grid is partially observable
		var vi= 0;
		//for each hole in the environment
		for (var iHole, iHCells, i= 0;  i < this.Percept.data.holes.length; ++i){
			iHole = environment.ListOfHoles[i];
			iHCells = iHole.cells

			//for each cell of the i-th hole...
			for (var k= 0; k < iHCells.length; ++k){
				//if the k-th cell of the i-th hole is not visible, then remove it...
				if ( (_agentPos.Row - Tileworld.VisibilityRadius <= iHCells[k][0] && iHCells[k][0] <= _agentPos.Row + Tileworld.VisibilityRadius) &&
					 (_agentPos.Column - Tileworld.VisibilityRadius <= iHCells[k][1] && iHCells[k][1] <= _agentPos.Column + Tileworld.VisibilityRadius)){
					rVOEnvGrid = _agentPos.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
					cVOEnvGrid = _agentPos.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
					iHCells[k] = {row: iHCells[k][0], column: iHCells[k][1]};
					iHCells[k].row -= rVOEnvGrid;
					iHCells[k].column -= cVOEnvGrid;
				}else
					iHCells.remove(k--);
			}

			//if the i-th hole hasn't any visible cell, then...
			if(iHCells.length <= 0)
				this.Percept.data.holes.remove(i--);// we remove it from the list of visible holes
		}
	}

	//-> List of obstacles
	var _listOfObs = environment.ListOfObstacles;

	if (Tileworld.FullyObservableGrid){
		for (var i= _listOfObs.length-1;  i >= 0; --i)
			_listOfObs[i].cell = {row: _listOfObs[i].cell[0], column: _listOfObs[i].cell[1]}
	}else{
	// if grid is partially observable
		for (var i= 0; i < _listOfObs.length; ++i){
			//if the i-th obstacle is not visible, then remove it...
			if ( (_agentPos.Row - Tileworld.VisibilityRadius <= _listOfObs[i].cell[0] && _listOfObs[i].cell[0] <= _agentPos.Row + Tileworld.VisibilityRadius) &&
				 (_agentPos.Column - Tileworld.VisibilityRadius <= _listOfObs[i].cell[1] && _listOfObs[i].cell[1] <= _agentPos.Column + Tileworld.VisibilityRadius)){
				rVOEnvGrid = _agentPos.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
				cVOEnvGrid = _agentPos.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
				_listOfObs[i].cell = {row: _listOfObs[i].cell[0], column: _listOfObs[i].cell[1]};
				_listOfObs[i].cell.row -= rVOEnvGrid;
				_listOfObs[i].cell.column -= cVOEnvGrid;
			}else
				_listOfObs.remove(i--);
		}
	}

	this.Percept.data.obstacles = _listOfObs;

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
		for (var obst, i= 0; i < this.Percept.data.obstacles.length; ++i)
			if (Math.random() < Tileworld.obstaclesNoisyPerception){//Monte Carlos technique
				obst = this.Percept.data.obstacles[i].cell;

				_grid.rows[ obst.row ].columns[ obst.column ] = _GRID_CELL.EMPTY;

				this.Percept.data.obstacles.remove(i--);

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
				var _pdata = _percept.data;
				var _pXMLdata = this.PerceptXML.data;

				//grid
				_pXMLdata.grid._attr_rows = _pdata.grid.rows_length;
				_pXMLdata.grid._attr_columns = _pdata.grid.columns_length;
				_pXMLdata.grid.row = new Array(_pdata.grid.rows_length);

				for (var r= _pdata.grid.rows_length-1; r >= 0; --r){
					_pXMLdata.grid.row[r]= {_attr_index: r, colum: new Array(_pdata.grid.columns_length)}
					for (var c= _pdata.grid.columns_length-1; c >= 0; --c)
						_pXMLdata.grid.row[r].colum[c] = {
							_attr_index:c,
							_attr_value:_pdata.grid.rows[r].columns[c]
						}
				}

				//time, score, battery and agent position
				_pXMLdata.time._attr_value = _pdata.time;
				_pXMLdata.score._attr_value = _pdata.score;
				_pXMLdata.battery._attr_value = _pdata.battery;
				_pXMLdata.battery_charger._attr_row = _pdata.battery_charger.row;
				_pXMLdata.battery_charger._attr_column = _pdata.battery_charger.column;
				_pXMLdata.agent._attr_row = _pdata.agent.row;
				_pXMLdata.agent._attr_column = _pdata.agent.column;

				//holes
				_pXMLdata.holes.hole = new Array(_pdata.holes.length);

				for (var h= _pdata.holes.length - 1; h >= 0; --h){
					_pXMLdata.holes.hole[h] = {
						_attr_id: _pdata.holes[h].id,
						_attr_size: _pdata.holes[h].size,
						_attr_value: _pdata.holes[h].value,
						cell: new Array(_pdata.holes[h].cells.length)
					}

					for (var c= _pdata.holes[h].cells.length-1; c >= 0; --c)
						_pXMLdata.holes.hole[h].cell[c] = {
							_attr_row: _pdata.holes[h].cells[c].row,
							_attr_column: _pdata.holes[h].cells[c].column
						}

					//optional fields
					if (_pdata.holes[h].lifetime_left)
						_pXMLdata.holes.hole[h]._attr_lifetime_left = _pdata.holes[h].lifetime_left;

					if (_pdata.holes[h].time_elapsed)
						_pXMLdata.holes.hole[h]._attr_time_elapsed = _pdata.holes[h].time_elapsed;
				}

				//tiles
				_pXMLdata.tiles.tile = new Array(_pdata.tiles.length);
				for (var t = _pdata.tiles.length-1; t >= 0; --t){
					_pXMLdata.tiles.tile[t] = {
						_attr_row: _pdata.tiles[t].row,
						_attr_column: _pdata.tiles[t].column
					}
					/*
					//optional fields
					if (_pdata.obstacles[h].lifetime_left)
						_pXMLdata.obstacles.obstacle[h]._attr_lifetime_left = _pdata.obstacles[h].lifetime_left;

					if (_pdata.obstacles[h].time_elapsed)
						_pXMLdata.obstacles.obstacle[h]._attr_time_elapsed = _pdata.obstacles[h].time_elapsed;
					}
					*/
				}

				//obstacles
				_pXMLdata.obstacles.obstacle = new Array(_pdata.obstacles.length);
				for (var o = _pdata.obstacles.length-1; o >= 0; --o){
					_pXMLdata.obstacles.obstacle[o] = {
						_attr_row: _pdata.obstacles[o].cell.row,
						_attr_column: _pdata.obstacles[o].cell.column
					}

					//optional fields
					if (_pdata.obstacles[o].lifetime_left)
						_pXMLdata.obstacles.obstacle[o]._attr_lifetime_left = _pdata.obstacles[o].lifetime_left;

					if (_pdata.obstacles[o].time_elapsed)
						_pXMLdata.obstacles.obstacle[o]._attr_time_elapsed = _pdata.obstacles[o].time_elapsed;
				}

				_percept = sprintf( _PERCEPT_FORMAT.XML, _X2JS.json2xml_str( this.PerceptXML ) );
				break;
			case _PERCEPT_FORMAT.PROLOG:
				//TODO: reescribi esto _percept.data en formato prolog
				_percept = sprintf( _PERCEPT_FORMAT.PROLOG, _percept.header, "'"+_percept.data+"'" );
				break;
		}

	postMessage( _percept );
}

onmessage = perceptionFunction;