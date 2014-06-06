//perceptionFunction or perceptionFilter?
/*
Perception  also  occurs  during  the  act  cycle: 
the  agent  can  access  a  global  map  of  the  world  that  indicates  the  locations  of  all  objects,  as  well  as
the  score and  time  remaining  to  timeout  for  all  holes
*/
importScripts('solid-auxiliary.js', 'solid-global.js', 'solid-general-settings.js', 'solid-core.js'); //'solid-core.js' is included for readability's sake (Tileworld.<aKnob>)
if (_XML_NECESSARY)
{importScripts('../util/xml2json.min.js'); var attrPrefix = "_attr_"; var _X2JS = new X2JS({attributePrefix : attrPrefix});}
if (!_JSON_NECESSARY)
importScripts('../util/sprintf.min.js');


this.perceptionFunction = function( environment ) /*returns a perception*/{
	environment = environment.data;

	var rVOEnvGrid, cVOEnvGrid; // VO stands for "Virtual Origin" (as if we were a compiler implementing multidimensional arrays XD)
	var _totalHoles, _percept, _grid, _bik;
	var _robLoc = environment.RobLocation;

	//-> creating the Percept object for the very first time (this chunk of code below runs only once)
	if (!this.Percept){
		//NOTE: any changes you make to this object must be reflected in the <tw_msg.xsd> file too
		this.Percept = {
			header : _PERCEPT_HEADER.START,
			data:{
				environment:{
					grid: { rows: null/*[{columns:[...]},...]*/},
					time: 0,
					battery_chargers: [/*{row:,column:},..*/],// optional
					agents: environment.ListOfAgents,// optional
					holes: [],
					tiles: [/*{row:,column:},..*/],
					obstacles: [/*{row:,column:},..*/]
				},
				agent:{
					id: environment.RobID, // optional
					team_id: _GET_TEAM_INDEX_OF(environment.RobID), //optional
					location: {row: -1, column: -1},
					score: -1,
					battery: null // optional
				},
				builtin_knowledge:{
					grid_total_rows: 0,
					grid_total_columns: 0,
					teams: [/*{id:, leader:, members:[]}...*/], // optional
					costs: environment.Costs,
					//estado objetivo
					probability: {/*holes, movement, etc.*/}
				}
			}
		}

		//my_id, team_id, agents and teams
		if (_NUMBER_OF_ROBS <= 1){
			delete this.Percept.data.environment.agents;
			delete this.Percept.data.agent.id;
			delete this.Percept.data.agent.team_id;
			delete this.Percept.data.builtin_knowledge.teams;
		}else{
			for (var len= _TEAMS.length, i=0; i < len; ++i){
				this.Percept.data.builtin_knowledge.teams.push({
					id: i,
					leader: _TEAMS[i].MEMBERS[0],
					members: _TEAMS[i].MEMBERS
				});
			}
		}

		_bik = this.Percept.data.builtin_knowledge;
		_grid = this.Percept.data.environment.grid;

		//-> creating grid
		if (!Tileworld.FullyObservableGrid){
			_bik.grid_total_columns = _bik.grid_total_rows = Tileworld.VisibilityRadius*2 + 1;
			this.Percept.data.agent.location.row = this.Percept.data.agent.location.column = Tileworld.VisibilityRadius;
		}else{
			_bik.grid_total_rows = environment.Grid.length;
			_bik.grid_total_columns = environment.Grid[0].length;
		}

		_grid.rows = new Array(_bik.grid_total_rows);

		for (var _rows=_bik.grid_total_rows, _columns= _bik.grid_total_columns, r= 0; r < _rows; ++r)
			_grid.rows[r] = { columns: new Array(_columns) };
		//<-

		//-> battery
		if (!Tileworld.Battery){
			delete this.Percept.data.agent.battery;
			delete this.Percept.data.environment.battery_chargers;
		}else{
			this.Percept.data.builtin_knowledge.costs.battery = {}
			this.Percept.data.builtin_knowledge.costs.battery.walk = _BATTERY_WALK_COST;
			this.Percept.data.builtin_knowledge.costs.battery.slide_tiles = _BATTERY_SLIDE_COST;
			this.Percept.data.builtin_knowledge.costs.battery.invalid_move = _BATTERY_INVALID_MOVE_COST;
		}

		//time
		if (!Tileworld.Dynamic)
			delete this.Percept.data.environment.time;
	}else{
		_bik = this.Percept.data.builtin_knowledge;
		_grid = this.Percept.data.environment.grid;
		this.Percept.header = _PERCEPT_HEADER.PERCEPT;
	}
	//<-

	//-> Grid
	// if grid is fully observable
	if (Tileworld.FullyObservableGrid){
		for (var r= _bik.grid_total_rows-1; r >= 0; --r)
			for (var c= _bik.grid_total_columns-1; c >= 0; --c)
				_grid.rows[r].columns[c] = environment.Grid[r][c];
	}else{
	// if grid is partially observable
		//-> calculate visible grid (according to the 'VisibilityRadius')
		for (var totalRows= _bik.grid_total_rows, r= 0; r < totalRows; ++r)
			for (var totalColumns= _bik.grid_total_columns, c= 0; c < totalColumns; ++c){
				rVOEnvGrid = _robLoc.Row - Tileworld.VisibilityRadius; //VO stands for "Virtual Origin"
				cVOEnvGrid = _robLoc.Column - Tileworld.VisibilityRadius; //VO stands for "Virtual Origin"

				if ( (rVOEnvGrid + r >= 0 && rVOEnvGrid + r < environment.Grid.length) &&
					 (cVOEnvGrid + c >= 0 && cVOEnvGrid + c < environment.Grid[0].length) )
					_grid.rows[r].columns[c] = environment.Grid[rVOEnvGrid + r][cVOEnvGrid + c];
				else
					_grid.rows[r].columns[c] = _GRID_CELL.OBSTACLE;
			}
	}

	//-> time
	if (Tileworld.Dynamic)
		this.Percept.data.environment.time = environment.Time;

	//-> score
	this.Percept.data.agent.score = environment.Score;

	//-> battery
	if (Tileworld.Battery){
		var _listOfBC = environment.BatteryChargers;
		this.Percept.data.agent.battery = environment.Battery;

		if (!Tileworld.FullyObservableGrid){
			// if grid is partially observable
			for (var i= 0; i < _listOfBC.length; ++i){
				//if the i-th battery charger is not visible, then remove it...
				if ( (_robLoc.Row - Tileworld.VisibilityRadius <= _listOfBC[i].row && _listOfBC[i].row <= _robLoc.Row + Tileworld.VisibilityRadius) &&
					 (_robLoc.Column - Tileworld.VisibilityRadius <= _listOfBC[i].column && _listOfBC[i].column <= _robLoc.Column + Tileworld.VisibilityRadius)){
					rVOEnvGrid = _robLoc.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
					cVOEnvGrid = _robLoc.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
					_listOfBC[i].row -= rVOEnvGrid;
					_listOfBC[i].column -= cVOEnvGrid;
				}else
					_listOfBC.remove(i--);
			}
		}

		this.Percept.data.environment.battery_chargers = _listOfBC;
	}

	//Agents
	if (_NUMBER_OF_ROBS > 1)
		this.Percept.data.environment.agents = environment.ListOfAgents;


	//->Agent's current location
	if (Tileworld.FullyObservableGrid){
		this.Percept.data.agent.location.row = _robLoc.Row;
		this.Percept.data.agent.location.column = _robLoc.Column;
	}

	//-> List Of Holes
	this.Percept.data.environment.holes = environment.ListOfHoles;

	// if grid is fully observable
	if (Tileworld.FullyObservableGrid){

		for (var i= this.Percept.data.environment.holes.length-1;  i >= 0; --i)
			for (var iHCells, j= this.Percept.data.environment.holes[i].cells.length-1;  j >= 0; --j){
				iHCells = this.Percept.data.environment.holes[i].cells[j];
				this.Percept.data.environment.holes[i].cells[j] = {row: iHCells[0], column: iHCells[1]};
			}

	}else{
		// if grid is partially observable
		var vi= 0;
		//for each hole in the environment
		for (var iHole, iHCells, i= 0;  i < this.Percept.data.environment.holes.length; ++i){
			iHole = environment.ListOfHoles[i];
			iHCells = iHole.cells

			//for each cell of the i-th hole...
			for (var k= 0; k < iHCells.length; ++k){
				//if the k-th cell of the i-th hole is not visible, then remove it...
				if ( (_robLoc.Row - Tileworld.VisibilityRadius <= iHCells[k][0] && iHCells[k][0] <= _robLoc.Row + Tileworld.VisibilityRadius) &&
					 (_robLoc.Column - Tileworld.VisibilityRadius <= iHCells[k][1] && iHCells[k][1] <= _robLoc.Column + Tileworld.VisibilityRadius)){
					rVOEnvGrid = _robLoc.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
					cVOEnvGrid = _robLoc.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
					iHCells[k] = {row: iHCells[k][0], column: iHCells[k][1]};
					iHCells[k].row -= rVOEnvGrid;
					iHCells[k].column -= cVOEnvGrid;
				}else
					iHCells.remove(k--);
			}

			//if the i-th hole hasn't any visible cell, then...
			if(iHCells.length <= 0)
				this.Percept.data.environment.holes.remove(i--);// we remove it from the list of visible holes
		}
	}

	//-> List of obstacles
	var _listOfObs = environment.ListOfObstacles;

	if (!Tileworld.FullyObservableGrid){
		// if grid is partially observable
		for (var i= 0; i < _listOfObs.length; ++i){
			//if the i-th obstacle is not visible, then remove it...
			if ( (_robLoc.Row - Tileworld.VisibilityRadius <= _listOfObs[i].row && _listOfObs[i].row <= _robLoc.Row + Tileworld.VisibilityRadius) &&
				 (_robLoc.Column - Tileworld.VisibilityRadius <= _listOfObs[i].column && _listOfObs[i].column <= _robLoc.Column + Tileworld.VisibilityRadius)){
				rVOEnvGrid = _robLoc.Row - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
				cVOEnvGrid = _robLoc.Column - Tileworld.VisibilityRadius; //VO stands for Virtual Origin
				_listOfObs[i].row -= rVOEnvGrid;
				_listOfObs[i].column -= cVOEnvGrid;
			}else
				_listOfObs.remove(i--);
		}
	}

	this.Percept.data.environment.obstacles = _listOfObs;

	//-> List Of Tiles
	for (var tileCounter= 0, r= 0; r < _bik.grid_total_rows; ++r)
		for (var c= 0; c < _bik.grid_total_columns; ++c)
			if (_grid.rows[r].columns[c] == _GRID_CELL.TILE){
				if (tileCounter < this.Percept.data.environment.tiles.length){
					this.Percept.data.environment.tiles[tileCounter].row = r;
					this.Percept.data.environment.tiles[tileCounter++].column = c;
				}else
					this.Percept.data.environment.tiles[tileCounter++] = {row: r, column: c};
			}
	this.Percept.data.environment.tiles.length = tileCounter; //set the new tiles length

	//region Noise generator
		//-> List of Holes
		for (var iHole, iHCells, i= 0;  i < this.Percept.data.environment.holes.length; ++i){
			iHole =  this.Percept.data.environment.holes[i];
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
					this.Percept.data.environment.holes.remove(i--);
				}else{
					iHole.size = iHCells.length;
					iHole.value = Tileworld.valueOfHoleFilledCompletely(iHole.size)
				}
			}
		}

		//-> List of Obstacles
		for (var obst, i= 0; i < this.Percept.data.environment.obstacles.length; ++i)
			if (Math.random() < Tileworld.ObstaclesNoisyPerception){//Monte Carlos technique
				obst = this.Percept.data.environment.obstacles[i];

				_grid.rows[ obst.row ].columns[ obst.column ] = _GRID_CELL.EMPTY;

				this.Percept.data.environment.obstacles.remove(i--);

				delete obst;
			}

		//-> List of Tiles
		for (var tile, i= 0; i < this.Percept.data.environment.tiles.length; ++i)
			if (Math.random() < Tileworld.TilesNoisyPerception){//Monte Carlos technique
				tile = this.Percept.data.environment.tiles[i];//.cell;

				_grid.rows[ tile.row ].columns[ tile.column ] = _GRID_CELL.EMPTY;

				this.Percept.data.environment.tiles.remove(i--);

				delete tile;
			}
	//end region Noise generator

	_percept = this.Percept;

	//if percept has to be sent _out_ of the 3D Tileworld, first we need to prepare it
	if ( _ROBS[environment.RobID].SOCKET_PROGRAM_AGENT )
		//depending on the output format (selected by the user)
		switch ( _ROBS[environment.RobID].SOCKET_PROGRAM_AGENT.OUTPUT_FORMAT ){

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
					["id", "size", "value", "time_elapsed", "lifetime_left", "row", "column", "leader", "team_id", "score", "battery"],
					["header"],
					[["rows","row"], ["columns","column"], ["cells","cell"], ["members", "member"]]
				);

				//adding index attributes to the grid
				/*for (var r = this.PerceptXML.data.environment.grid.row.length; r--;){
					this.PerceptXML.data.environment.grid.row[r]._attr_index = r;
					for (var c = this.PerceptXML.data.environment.grid.row[r].column.length; c--;)
						this.PerceptXML.data.environment.grid.row[r].column[c]._attr_index = c
				}*/

				//this.PerceptXML.data.environment.holes.hole[*]
				this.PerceptXML.data.environment.holes = {hole: this.PerceptXML.data.environment.holes};

				//this.PerceptXML.data.environment.tiles.tile[*]
				this.PerceptXML.data.environment.tiles = {tile: this.PerceptXML.data.environment.tiles};

				//this.PerceptXML.data.environment.obstacles.obstacle[*]
				this.PerceptXML.data.environment.obstacles = {obstacle: this.PerceptXML.data.environment.obstacles};

				//this.PerceptXML.data.environment.battery_chargers.location[*]
				this.PerceptXML.data.environment.battery_chargers = {location: this.PerceptXML.data.environment.battery_chargers};

				//this.PerceptXML.data.environment.agents.agent[*]
				this.PerceptXML.data.environment.agents = {agent: this.PerceptXML.data.environment.agents};

				//this.PerceptXML.data.builtin_knowledge.teams.team[*]
				this.PerceptXML.data.builtin_knowledge.teams = {team: this.PerceptXML.data.builtin_knowledge.teams};

				//this.PerceptXML.data.builtin_knowledge.teams.team[*].member[*]
				for (var teams = this.PerceptXML.data.builtin_knowledge.teams.team, t=0; t < teams.length; ++t)
					for (var m=0; m < teams[t].member.length; ++m){
						teams[t].member[m] = {_attr_id: teams[t].member[m]._attr_value}
					}

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
									[["holes","hole"], ["tiles","tile"], ["obstacles", "obstacle"], ["cells","cell"], ["agents","agent"], ["teams","team"], ["battery_chargers","location"]]
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
					{facts+= "location("; cell = true}
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