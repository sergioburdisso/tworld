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
	var _robPos = environment.RobLocation;

	//-> creating the Percept object for the very first time (this chunk of code below runs only once)
	if (!this.Percept){
		//NOTE: any changes you make to this object must be reflected in the <tw_msg.xsd> file too
		this.Percept = {
			header : _PERCEPT_HEADER.START,
			data:{
				grid: {total_rows: 0, total_columns: 0, rows: null/*[{columns:[...]},...]*/},
				time: 0,
				score: -1,
				rob: {row: -1, column: -1},
				battery: null,
				battery_charger: {row: -1, column: -1}, // if battery charger is not visible then it's value is [-1, -1]				
				holes: [],
				tiles: [],
				obstacles: [],
				builtin_knowledge:{
					costs: environment.Costs,
					//estado objetivo
					probability: {/*holes, movement, etc.*/}
				}
			}
		}

		//-> creating grid
		_grid = this.Percept.data.grid;

		if (!Tileworld.FullyObservableGrid){
			_grid.total_columns = _grid.total_rows = Tileworld.VisibilityRadius*2 + 1;
			this.Percept.data.rob.row = this.Percept.data.rob.column = Tileworld.VisibilityRadius;
		}else{
			_grid.total_rows = environment.Grid.length+2;
			_grid.total_columns = environment.Grid[0].length+2;
		}

		_grid.rows = new Array(_grid.total_rows);

		for (var _rows=_grid.total_rows, _columns= _grid.total_columns, r= 0; r < _rows; ++r){
			_grid.rows[r] = { columns: new Array(_columns) };
			_grid.rows[r].columns[0] = _grid.rows[r].columns[_columns-1] = _GRID_CELL.OBSTACLE;

			for (var c= _grid.total_columns-1; c >= 0; --c)
				if (r == 0 || r == _rows-1)
					_grid.rows[r].columns[c] = _GRID_CELL.OBSTACLE;
		}
		//<-

		//-> battery
		if (!Tileworld.Battery){
			delete this.Percept.data.battery;
			delete this.Percept.data.battery_charger;
		}else{
			this.Percept.data.builtin_knowledge.costs.battery = {}
			this.Percept.data.builtin_knowledge.costs.battery.walk = _BATTERY_WALK_COST;
			this.Percept.data.builtin_knowledge.costs.battery.slide_tiles = _BATTERY_SLIDE_COST;
			this.Percept.data.builtin_knowledge.costs.battery.invalid_move = _BATTERY_INVALID_MOVE_COST;
		}

		//time
		if (!Tileworld.Dynamic)
			delete this.Percept.data.time;
	}else{
		_grid = this.Percept.data.grid;
		this.Percept.header = _PERCEPT_HEADER.PERCEPT;
	}
	//<-

	//-> Grid
	// if grid is fully observable
	if (Tileworld.FullyObservableGrid){
		for (var r= _grid.total_rows-2; r >= 1; --r)
			for (var c= _grid.total_columns-2; c >= 1; --c)
				_grid.rows[r].columns[c] = environment.Grid[r-1][c-1];
	}else{
	// if grid is partially observable
		//-> calculate visible grid (according to the 'VisibilityRadius')
		for (var totalRows= _grid.total_rows, r= 0; r < totalRows; ++r)
			for (var totalColumns= _grid.total_columns, c= 0; c < totalColumns; ++c){
				rVOEnvGrid = _robPos.Row - Tileworld.VisibilityRadius; //VO stands for "Virtual Origin"
				cVOEnvGrid = _robPos.Column - Tileworld.VisibilityRadius; //VO stands for "Virtual Origin"

				if ( (rVOEnvGrid + r >= 0 && rVOEnvGrid + r < environment.Grid.length) &&
					 (cVOEnvGrid + c >= 0 && cVOEnvGrid + c < environment.Grid[0].length) )
					_grid.rows[r].columns[c] = environment.Grid[rVOEnvGrid + r][cVOEnvGrid + c];
				else
					_grid.rows[r].columns[c] = _GRID_CELL.OBSTACLE;
			}
	}

	//-> time
	if (Tileworld.Dynamic)
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
			if ( (_robPos.Row - Tileworld.VisibilityRadius <= environment.BatterCharger[0] && environment.BatterCharger[0] <= _robPos.Row + Tileworld.VisibilityRadius) &&
				 (_robPos.Column - Tileworld.VisibilityRadius <= environment.BatterCharger[1] && environment.BatterCharger[1] <= _robPos.Column + Tileworld.VisibilityRadius)){
				this.Percept.data.battery_charger.row -= (_robPos.Row - Tileworld.VisibilityRadius);
				this.Percept.data.battery_charger.column -= (_robPos.Column - Tileworld.VisibilityRadius);
			}else{
				this.Percept.data.battery_charger.row = -1;
				this.Percept.data.battery_charger.column = -1;
			}
	}

	//->Agent's current location
	if (Tileworld.FullyObservableGrid){
		this.Percept.data.rob.row = _robPos.Row;
		this.Percept.data.rob.column = _robPos.Column;
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
				if ( (_robPos.Row - Tileworld.VisibilityRadius <= iHCells[k][0] && iHCells[k][0] <= _robPos.Row + Tileworld.VisibilityRadius) &&
					 (_robPos.Column - Tileworld.VisibilityRadius <= iHCells[k][1] && iHCells[k][1] <= _robPos.Column + Tileworld.VisibilityRadius)){
					rVOEnvGrid = _robPos.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
					cVOEnvGrid = _robPos.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
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
			if ( (_robPos.Row - Tileworld.VisibilityRadius <= _listOfObs[i].row && _listOfObs[i].row <= _robPos.Row + Tileworld.VisibilityRadius) &&
				 (_robPos.Column - Tileworld.VisibilityRadius <= _listOfObs[i].column && _listOfObs[i].column <= _robPos.Column + Tileworld.VisibilityRadius)){
				rVOEnvGrid = _robPos.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
				cVOEnvGrid = _robPos.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
				_listOfObs[i].row -= rVOEnvGrid;
				_listOfObs[i].column -= cVOEnvGrid;
			}else
				_listOfObs.remove(i--);
		}
	}

	this.Percept.data.obstacles = _listOfObs;

	//-> List Of Tiles
	for (var tileCounter= 0, r= 0; r < _grid.total_rows; ++r)
		for (var c= 0; c < _grid.total_columns; ++c)
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
				if (Math.random() < Tileworld.HolesNoisyPerception){
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
			if (Math.random() < Tileworld.ObstaclesNoisyPerception){//Monte Carlos technique
				obst = this.Percept.data.obstacles[i];

				_grid.rows[ obst.row ].columns[ obst.column ] = _GRID_CELL.EMPTY;

				this.Percept.data.obstacles.remove(i--);

				delete obst;
			}

		//-> List of Tiles
		for (var tile, i= 0; i < this.Percept.data.tiles.length; ++i)
			if (Math.random() < Tileworld.TilesNoisyPerception){//Monte Carlos technique
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
					["id", "size", "value", "time_elapsed", "lifetime_left", "row", "column", "total_rows", "total_columns"],
					["header"],
					[["rows","row"], ["columns","column"], ["cells","cell"], ["total_rows","rows"], ["total_columns","columns"]]
				);

				//adding index attributes to the grid
				/*for (var r = this.PerceptXML.data.grid.row.length; r--;){
					this.PerceptXML.data.grid.row[r]._attr_index = r;
					for (var c = this.PerceptXML.data.grid.row[r].column.length; c--;)
						this.PerceptXML.data.grid.row[r].column[c]._attr_index = c
				}*/

				//this.PerceptXML.data.holes.hole[*]
				this.PerceptXML.data.holes = {hole: this.PerceptXML.data.holes};

				//this.PerceptXML.data.tiles.tile[*]
				this.PerceptXML.data.tiles = {tile: this.PerceptXML.data.tiles};

				//this.PerceptXML.data.obstacles.obstacle[*]
				this.PerceptXML.data.obstacles = {obstacle: this.PerceptXML.data.obstacles};

				_percept = sprintf( _PERCEPT_FORMAT.XML, _X2JS.json2xml_str( this.PerceptXML ) );
				break;

			// PROLOG
			case _PERCEPT_FORMAT.PROLOG:
				_percept = sprintf(
								_PERCEPT_FORMAT.PROLOG,
								_percept.header,
								json2prolog_facts(
									_percept.data,
									["row", "column"],
									[["holes","hole"], ["tiles","tile"], ["obstacles", "obstacle"], ["cells","cell"]]
								)
				);
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
			while (i--) if (replace[i][0] == prop)
				{rProp = replace[i][1]; i=0}

			if (json[prop] instanceof Object)
				_attr_json[ rProp ] = json2attr_json(json[ prop ], attrs, notAttrs, replace);
			else{

				if (attrs.contains(prop))
					_attr_json[ attrPrefix + rProp ] = json[ prop ];
				else
					if (!notAttrs.contains(prop)){

						_attr_json[ rProp ] = null || {};

						_attr_json[ rProp ][ attrPrefix + "value" ] = json[ prop ];
					}
					else
						_attr_json[ rProp ] = json[ prop ];
			}

		}
	return _attr_json;
}

function json2prolog_facts(json, skipFunctors, arrayFunctors, parent){
	var i, _arrFunctor, functor, facts = "";
	var rowColumnCell = (parent == "obstacles" || parent == "tiles");
	var cell = false;

	skipFunctors = skipFunctors || [];
	arrayFunctors = arrayFunctors || [];

	if (json.constructor === String && isNaN(parseInt(json)))
		return "'" + json + "'";
	else
	if (!(json instanceof Object))
		return json;
	else
		for (prop in json)
			if (!(json[prop] instanceof Function)){
				_arrFunctor = "";
				if (facts !== "") facts+=", ";

				if ( rowColumnCell && prop == "row")
					{facts+= "cell("; cell = true}
				else
					if (!(rowColumnCell && prop == "column")){
						//do I have to add a functor to each array elemnt?
						i= arrayFunctors.length;
						while (i--) if (arrayFunctors[i][0] == parent)
							{_arrFunctor = arrayFunctors[i][1]; i=0}
					}

				functor = (skipFunctors.contains(prop) || !isNaN(parseInt(prop))/*prop is an Array index*/)?
							((!_arrFunctor)? "%s" : _arrFunctor+"(%s)")
							:
							prop + "(%s)";

				if (json[prop] instanceof Array){
					facts+= sprintf(functor, "[" + json2prolog_facts(json[prop], skipFunctors, arrayFunctors, prop ) +"]");
				}else
					facts+= sprintf(
						functor,
						json2prolog_facts(
							json[prop],
							skipFunctors,
							arrayFunctors,
							rowColumnCell? parent : prop
						)
					);

				if (cell && rowColumnCell && prop == "column")
					facts+= ")";//closing the 'cell' functor
			}

	return facts? facts : "null";
}

onmessage = perceptionFunction;