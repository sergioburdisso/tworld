//perceptionFunction or perceptionFilter?
/*
Perception  also  occurs  during  the  act  cycle: 
the  agent  can  access  a  global  map  of  the  world  that  indicates  the  locations  of  all  objects,  as  well  as
the  score and  time  remaining  to  timeout  for  all  holes
*/
importScripts('solid-global.js', 'solid-general-settings.js', 'solid-auxiliary.js', 'solid-core.js'); //'solid-core.js' is included for readability's sake (Tileworld.<aKnob>)
if (_SOCKET_PROGRAM_AGENT) switch(_SOCKET_OUTPUT_FORMAT){
case _PERCEPT_FORMAT.XML:
importScripts('../util/xml2json.min.js'); var attrPrefix = "_attr_"; var _X2JS = new X2JS({attributePrefix : attrPrefix});
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
		//NOTE: any changes you make to this object must be reflected in the <tw_msg.xsd> file too
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

		//-> battery
		if (!Tileworld.Battery){
			delete this.Percept.data.battery;
			delete this.Percept.data.battery_charger;
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

	if (!Tileworld.FullyObservableGrid){
		// if grid is partially observable
		for (var i= 0; i < _listOfObs.length; ++i){
			//if the i-th obstacle is not visible, then remove it...
			if ( (_agentPos.Row - Tileworld.VisibilityRadius <= _listOfObs[i].row && _listOfObs[i].row <= _agentPos.Row + Tileworld.VisibilityRadius) &&
				 (_agentPos.Column - Tileworld.VisibilityRadius <= _listOfObs[i].column && _listOfObs[i].column <= _agentPos.Column + Tileworld.VisibilityRadius)){
				rVOEnvGrid = _agentPos.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
				cVOEnvGrid = _agentPos.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
				_listOfObs[i].row -= rVOEnvGrid;
				_listOfObs[i].column -= cVOEnvGrid;
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
				obst = this.Percept.data.obstacles[i];

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

	//if percept has to be sent _out_ of the 3D Tileworld, first we need to prepare it
	if ( _SOCKET_PROGRAM_AGENT )
		//depending on the output format (selected by the user)
		switch ( _SOCKET_OUTPUT_FORMAT ){

			// JSON
			case _PERCEPT_FORMAT.JSON:
				_percept = JSON.stringify( _percept );
				break;

			// XML
			case _PERCEPT_FORMAT.XML:
				var temp;

				//creating the XML-percept object
				this.PerceptXML = json2attr_json(
					_percept,
					["id", "size", "value", "time_elapsed", "lifetime_left", "row", "column", "rows_length", "columns_length"],
					["header"],
					[["rows","row"], ["columns","column"], ["cells","cell"], ["rows_length","rows"], ["columns_length","columns"]]
				);

				//adding index attributes to the grid
				/*for (var r = this.PerceptXML.data.grid.row.length; r--;){
					this.PerceptXML.data.grid.row[r]._attr_index = r;
					for (var c = this.PerceptXML.data.grid.row[r].column.length; c--;)
						this.PerceptXML.data.grid.row[r].column[c]._attr_index = c
				}*/

				temp = this.PerceptXML.data.holes;
				this.PerceptXML.data.holes = {hole: temp};

				temp = this.PerceptXML.data.tiles;
				this.PerceptXML.data.tiles = {tile: temp};

				temp = this.PerceptXML.data.obstacles;
				this.PerceptXML.data.obstacles = {obstacle: temp};

				_percept = sprintf( _PERCEPT_FORMAT.XML, _X2JS.json2xml_str( this.PerceptXML ) );
				break;

			// PROLOG
			case _PERCEPT_FORMAT.PROLOG:
				//TODO: reescribir esto _percept.data en formato prolog
				_percept = sprintf( _PERCEPT_FORMAT.PROLOG, _percept.header, "'"+_percept.data+"'" );
				break;
		}

	postMessage( _percept );
}

//transform the JSON perception into a JSON object that is prepared to be exported as an XML 
//	attrs:		attributes by force
//	notAttrs:	not an attribute by force
//	replace:	array of pairs "x:y", x is replaced by y whenever it appears (after conversion)
function json2attr_json(json, attrs, notAttrs, replace){
	var i, rProp, _attr_json = new Object();
	attrs = attrs || [];
	notAttrs = notAttrs || [];

	if (json instanceof Array)
		_attr_json = new Array(json.length);

	for (prop in json)
		if (!(json[prop] instanceof Function)){
			rProp = prop;

			//do I have to replace prop?
			i= replace.length;
			while (i--)
				if (replace[i][0] == prop){
					rProp = replace[i][1];
				}

			if (json[prop] instanceof Object)
				_attr_json[rProp] = json2attr_json(json[prop], attrs, notAttrs, replace);
			else{

				if (attrs.contains(prop))
					_attr_json[ attrPrefix + rProp ] = json[ prop ];
				else
					if (!notAttrs.contains(prop)){

						_attr_json[rProp] = null || {};

						_attr_json[ rProp ][ attrPrefix + "value" ] = json[ prop ];
					}
					else
						_attr_json[ rProp ] = json[ prop ];
			}

		}
	return _attr_json;
}

onmessage = perceptionFunction;