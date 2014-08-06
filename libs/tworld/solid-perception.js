/*
* solid-perception.js - 
*
* Copyright (C) 2014 Burdisso Sergio (sergio.burdisso@gmail.com)
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>
*/
importScripts('solid-auxiliary.js', 'solid-global.js', '../util/sprintf.min.js');

var _ROWS;
var _COLUMNS;
var _NUMBER_OF_AGENTS;
var _AGENTS;
var _BATTERY_INVALID_MOVE_COST;
var _BATTERY_WALK_COST;
var _BATTERY_SLIDE_COST;
var _TEAMS;
var _ENDGAME;
var _SCORE_HOLE_MULTIPLIER
var TWorld;
var attrPrefix, _X2JS;

var _GET_TEAM_INDEX_OF = function(rIndex){
	var j,i = _TEAMS.length;

	while (i--)
		if (_TEAMS[i].MEMBERS.contains(rIndex))
			break;

	return i;
}

this.perceptionFunction = function( environment ) /*returns a percept*/{
	environment = environment.data;

	var rVOEnvGrid, cVOEnvGrid; // VO stands for "Virtual Origin" (as if we were a compiler implementing multidimensional arrays XD)
	var _totalHoles, _percept, _grid, _bik;
	var _robLoc = environment.RobLocation;

	//Constants initialization (this chunk runs only once)
	if (environment.CFG_CONSTANTS){
		var _CFG = environment.CFG_CONSTANTS;

		if (_CFG._XML_NECESSARY){
			importScripts('../util/xml2json.min.js');
			attrPrefix = "_attr_";
			_X2JS = new X2JS({attributePrefix : attrPrefix});
		}

		_ROWS						= _CFG._ROWS;
		_COLUMNS					= _CFG._COLUMNS;
		_NUMBER_OF_AGENTS			= _CFG._NUMBER_OF_AGENTS;
		_AGENTS						= _CFG._AGENTS;
		_BATTERY_INVALID_MOVE_COST	= _CFG._BATTERY_INVALID_MOVE_COST;
		_BATTERY_WALK_COST			= _CFG._BATTERY_WALK_COST;
		_BATTERY_SLIDE_COST			= _CFG._BATTERY_SLIDE_COST;
		_TEAMS						= _CFG._TEAMS;
		_ENDGAME					= _CFG._ENDGAME;
		_SCORE_HOLE_MULTIPLIER		= _CFG._SCORE_HOLE_MULTIPLIER;

		TWorld = _CFG.TWorld;
		TWorld.valueOfHoleFilledCompletely = function(size) {return size*_SCORE_HOLE_MULTIPLIER};
		return;
	}

	//-> creating the Percept object for the very first time (this chunk of code below runs only once)
	if (!this.Percept){
		//NOTE: any changes you make to this object must be reflected in the <tw_msg.xsd> file too
		this.Percept = {
			header : _PERCEPT_HEADER.START,
			data:{
				environment:{
					grid: undefined/*[]*/,
					time: 0,// optional
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
					battery: null, // optional
					stats: null
				},
				builtin_knowledge:{
					grid_total_rows: 0,
					grid_total_columns: 0,
					teams: [/*{id:, leader:, members:[]}...*/], // optional
					endgame : {/*neutral: {}, won: {}, lost: {}*/}, //end game conditions
					costs: environment.Costs,
					probability: {/*holes, movement, etc.*/}
				}
			}
		}

		//builtin_knowledge.endgame
		_bik = this.Percept.data.builtin_knowledge;
		for (cond in _ENDGAME)
			if (!(_ENDGAME[cond] instanceof Function) && _ENDGAME[cond].VALUE){
				var nCond;
				var _sockPA = _AGENTS[environment.RobID].SOCKET_PROGRAM_AGENT;
				switch(cond){
					case "AGENTS_LOCATION":
						var final_location;
						if (_NUMBER_OF_AGENTS > 1){
							final_location = new Array(_ENDGAME[cond].VALUE.length);

							if (_sockPA && _sockPA.OUTPUT_FORMAT == _PERCEPT_FORMAT.PROLOG){
								for (var r= _ENDGAME[cond].VALUE.length-1; r>=0; --r)
											final_location[r] = {
												id: _ENDGAME[cond].VALUE[r],
												location:{
													row: _AGENTS[_ENDGAME[cond].VALUE[r]].FINAL_LOCATION.ROW,
													column: _AGENTS[_ENDGAME[cond].VALUE[r]].FINAL_LOCATION.COLUMN
												}
											}
							}else{
								for (var r= _ENDGAME[cond].VALUE.length-1; r>=0; --r)
									final_location[r] = {
										id: _ENDGAME[cond].VALUE[r],
										row: _AGENTS[_ENDGAME[cond].VALUE[r]].FINAL_LOCATION.ROW,
										column: _AGENTS[_ENDGAME[cond].VALUE[r]].FINAL_LOCATION.COLUMN
									}

								if (_sockPA && _sockPA.OUTPUT_FORMAT == _PERCEPT_FORMAT.XML)
									final_location = {agent: final_location};
							}
						}else
							final_location = {
								row: _AGENTS[_ENDGAME[cond].VALUE[0]].FINAL_LOCATION.ROW,
								column: _AGENTS[_ENDGAME[cond].VALUE[0]].FINAL_LOCATION.COLUMN
							}
						_ENDGAME[cond].VALUE = final_location;
						nCond = cond.toLowerCase();
						break;
					case "SCORE":
						if (_sockPA && _sockPA.OUTPUT_FORMAT == _PERCEPT_FORMAT.XML)
							nCond = "_score_";
						else
							nCond = cond.toLowerCase();
						break;
					default:
						nCond =cond.toLowerCase();
				}

				switch(_ENDGAME[cond].RESULT){
					case _GAME_RESULT.NEUTRAL:
						if (!_bik.endgame.neutral)
							_bik.endgame.neutral = {};
						_bik.endgame.neutral[nCond] = _ENDGAME[cond].VALUE;
						break;
					case _GAME_RESULT.WON:
						if (!_bik.endgame.won)
							_bik.endgame.won = {};
						_bik.endgame.won[nCond] = _ENDGAME[cond].VALUE;
						break;
					case _GAME_RESULT.LOST:
						if (!_bik.endgame.lost)
							_bik.endgame.lost = {};
						_bik.endgame.lost[nCond] = _ENDGAME[cond].VALUE;
				}
			}

		//my_id, team_id, agents and teams
		if (_NUMBER_OF_AGENTS <= 1){
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

		//-> creating grid
		if (!TWorld.FullyObservableGrid){
			_bik.grid_total_columns = _bik.grid_total_rows = TWorld.VisibilityRadius*2 + 1;
			this.Percept.data.agent.location.row = this.Percept.data.agent.location.column = TWorld.VisibilityRadius;

			_grid = new Array(_bik.grid_total_rows);

			for (var _rows=_bik.grid_total_rows, _columns= _bik.grid_total_columns, r= 0; r < _rows; ++r)
				_grid[r] = new Array(_columns);

			this.Percept.data.environment.grid = _grid;
		}else{
			_bik.grid_total_rows = _ROWS;
			_bik.grid_total_columns = _COLUMNS;
		}
		//<-

		//-> battery
		if (!TWorld.Battery){
			delete this.Percept.data.agent.battery;
			delete this.Percept.data.environment.battery_chargers;
		}else{
			this.Percept.data.builtin_knowledge.costs.battery = {}
			this.Percept.data.builtin_knowledge.costs.battery.bad_move = _BATTERY_INVALID_MOVE_COST;
			this.Percept.data.builtin_knowledge.costs.battery.good_move = _BATTERY_WALK_COST;
			this.Percept.data.builtin_knowledge.costs.battery.slide_tile = _BATTERY_SLIDE_COST;
		}

		//time
		if (!TWorld.Dynamic && !TWorld.Semidynamic)
			delete this.Percept.data.environment.time;
	}else{
		this.Percept.header = _PERCEPT_HEADER.PERCEPT;
		_grid = this.Percept.data.environment.grid;
	}
	//<-

	_bik = this.Percept.data.builtin_knowledge;

	//-> Grid
	// if grid is fully observable
	if (TWorld.FullyObservableGrid)
		_grid = environment.Grid;
	else{
	// if grid is partially observable
		//-> calculate visible grid (according to the 'VisibilityRadius')
		for (var totalRows= _bik.grid_total_rows, r= 0; r < totalRows; ++r)
			for (var totalColumns= _bik.grid_total_columns, c= 0; c < totalColumns; ++c){
				rVOEnvGrid = _robLoc.Row - TWorld.VisibilityRadius; //VO stands for "Virtual Origin"
				cVOEnvGrid = _robLoc.Column - TWorld.VisibilityRadius; //VO stands for "Virtual Origin"

				if ( (rVOEnvGrid + r >= 0 && rVOEnvGrid + r < environment.Grid.length) &&
					 (cVOEnvGrid + c >= 0 && cVOEnvGrid + c < environment.Grid[0].length) )
					_grid[r][c] = environment.Grid[rVOEnvGrid + r][cVOEnvGrid + c];
				else
					_grid[r][c] = _GRID_CELL.OBSTACLE;
			}
	}
	this.Percept.data.environment.grid = _grid;

	//-> time
	if (TWorld.Dynamic || TWorld.Semidynamic)
		this.Percept.data.environment.time = environment.Time;

	//-> score
	this.Percept.data.agent.score = environment.Score;

	//-> battery
	if (TWorld.Battery){
		var _listOfBC = environment.BatteryChargers;
		this.Percept.data.agent.battery = environment.Battery;

		if (!TWorld.FullyObservableGrid){
			// if grid is partially observable
			for (var i= 0; i < _listOfBC.length; ++i){
				//if the i-th battery charger is not visible, then remove it...
				if ( (_robLoc.Row - TWorld.VisibilityRadius <= _listOfBC[i].row && _listOfBC[i].row <= _robLoc.Row + TWorld.VisibilityRadius) &&
					 (_robLoc.Column - TWorld.VisibilityRadius <= _listOfBC[i].column && _listOfBC[i].column <= _robLoc.Column + TWorld.VisibilityRadius)){
					rVOEnvGrid = _robLoc.Row - TWorld.VisibilityRadius; //VO stands for Virtual Origin
					cVOEnvGrid = _robLoc.Column - TWorld.VisibilityRadius; //VO stands for Virtual Origin
					_listOfBC[i].row -= rVOEnvGrid;
					_listOfBC[i].column -= cVOEnvGrid;
				}else
					_listOfBC.remove(i--);
			}
		}

		this.Percept.data.environment.battery_chargers = _listOfBC;
	}

	//Agent stats
	this.Percept.data.agent.stats = environment.RobStats;

	//Agents
	if (_NUMBER_OF_AGENTS > 1)
		this.Percept.data.environment.agents = environment.ListOfAgents;


	//->Agent's current location
	if (TWorld.FullyObservableGrid){
		this.Percept.data.agent.location.row = _robLoc.Row;
		this.Percept.data.agent.location.column = _robLoc.Column;
	}

	//-> List Of Holes
	this.Percept.data.environment.holes = environment.ListOfHoles;

	// if grid is fully observable
	if (TWorld.FullyObservableGrid){

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
				if ( (_robLoc.Row - TWorld.VisibilityRadius <= iHCells[k][0] && iHCells[k][0] <= _robLoc.Row + TWorld.VisibilityRadius) &&
					 (_robLoc.Column - TWorld.VisibilityRadius <= iHCells[k][1] && iHCells[k][1] <= _robLoc.Column + TWorld.VisibilityRadius)){
					rVOEnvGrid = _robLoc.Row - TWorld.VisibilityRadius; //VO stands for Virtual Origin
					cVOEnvGrid = _robLoc.Column - TWorld.VisibilityRadius; //VO stands for Virtual Origin
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

	if (!TWorld.FullyObservableGrid){
		// if grid is partially observable
		for (var i= 0; i < _listOfObs.length; ++i){
			//if the i-th obstacle is not visible, then remove it...
			if ( (_robLoc.Row - TWorld.VisibilityRadius <= _listOfObs[i].row && _listOfObs[i].row <= _robLoc.Row + TWorld.VisibilityRadius) &&
				 (_robLoc.Column - TWorld.VisibilityRadius <= _listOfObs[i].column && _listOfObs[i].column <= _robLoc.Column + TWorld.VisibilityRadius)){
				rVOEnvGrid = _robLoc.Row - TWorld.VisibilityRadius; //VO stands for Virtual Origin
				cVOEnvGrid = _robLoc.Column - TWorld.VisibilityRadius; //VO stands for Virtual Origin
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
			if (_grid[r][c] == _GRID_CELL.TILE){
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
				if (Math.random() < TWorld.HolesNoisyPerception){
					_grid[ iHCells[k].row ][ iHCells[k].column ] = _GRID_CELL.EMPTY;
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
					iHole.value = TWorld.valueOfHoleFilledCompletely(iHole.size)
				}
			}
		}

		//-> List of Obstacles
		for (var obst, i= 0; i < this.Percept.data.environment.obstacles.length; ++i)
			if (Math.random() < TWorld.ObstaclesNoisyPerception){//Monte Carlos technique
				obst = this.Percept.data.environment.obstacles[i];

				_grid[ obst.row ][ obst.column ] = _GRID_CELL.EMPTY;

				this.Percept.data.environment.obstacles.remove(i--);

				delete obst;
			}

		//-> List of Tiles
		for (var tile, i= 0; i < this.Percept.data.environment.tiles.length; ++i)
			if (Math.random() < TWorld.TilesNoisyPerception){//Monte Carlos technique
				tile = this.Percept.data.environment.tiles[i];//.cell;

				_grid[ tile.row ][ tile.column ] = _GRID_CELL.EMPTY;

				this.Percept.data.environment.tiles.remove(i--);

				delete tile;
			}
	//end region Noise generator

	_percept = this.Percept;

	//if percept has to be sent _out_ of the 3D TWorld, first we need to prepare it
	if ( _AGENTS[environment.RobID].SOCKET_PROGRAM_AGENT )
		//depending on the output format (selected by the user)
		switch ( _AGENTS[environment.RobID].SOCKET_PROGRAM_AGENT.OUTPUT_FORMAT ){

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
					[["rows","row"], ["columns","column"], ["cells","cell"], ["members", "member"], ["_score_", "score"]]
				);

				//this.PerceptXML.data.environment.grid
				var rows = new Array(this.PerceptXML.data.environment.grid.length);
				for (var r= rows.length-1; r >= 0; --r)
					rows[r] = {cell_data: this.PerceptXML.data.environment.grid[r]};
				this.PerceptXML.data.environment.grid = {row: rows}

				//this.PerceptXML.data.environment.holes.hole[*]
				this.PerceptXML.data.environment.holes = {hole: this.PerceptXML.data.environment.holes};

				//this.PerceptXML.data.environment.tiles.tile[*]
				this.PerceptXML.data.environment.tiles = {tile: this.PerceptXML.data.environment.tiles};

				//this.PerceptXML.data.environment.obstacles.obstacle[*]
				this.PerceptXML.data.environment.obstacles = {obstacle: this.PerceptXML.data.environment.obstacles};

				//this.PerceptXML.data.environment.battery_chargers.location[*]
				if (this.PerceptXML.data.environment.battery_chargers)
					this.PerceptXML.data.environment.battery_chargers = {location: this.PerceptXML.data.environment.battery_chargers};

				//this.PerceptXML.data.environment.agents.agent[*]
				if (this.PerceptXML.data.environment.agents)
					this.PerceptXML.data.environment.agents = {agent: this.PerceptXML.data.environment.agents};

				//this.PerceptXML.data.builtin_knowledge.teams.team[*]
				if (this.PerceptXML.data.builtin_knowledge.teams){
					this.PerceptXML.data.builtin_knowledge.teams = {team: this.PerceptXML.data.builtin_knowledge.teams};

					//this.PerceptXML.data.builtin_knowledge.teams.team[*].member[*]
					for (var teams = this.PerceptXML.data.builtin_knowledge.teams.team, t=0; t < teams.length; ++t)
						for (var m=0; m < teams[t].member.length; ++m){
							teams[t].member[m] = {_attr_id: teams[t].member[m]._attr_value}
						}
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
									[
										["holes","hole"], ["tiles","tile"], ["obstacles", "obstacle"],
										["cells","cell"], ["agents","agent"], ["teams","team"],
										["battery_chargers","location"], ((_NUMBER_OF_AGENTS > 1)? ["agents_location","agent"]: [])
									]
								)
				);
				break;
		}
	postMessage( _percept );
}

//transform the JSON perception into a JSON object that is prepared to be exported as an XML
//args:
//	attrs:		attributes by force
//	notAttrs:	not-an-attribute by force
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

//transform the JSON perception into a Prolog fact
//args:
//	skipFunctors:	array of functors to be omitted in the process of constructing the Prolog fact
//	arrayFunctors:	array of pairs [A,B], where A is the name of the array property of <json>
//					and B is the functor to be added to each element of the A array.
//						e.g. if json.A = [1,2,3] then json2prolog_facts(_,[["A","elem"]..],_) will
//						produce ...A([elem(1), elem(2), elem(3)])...
//	parent:			internal parameter, you shoundn't care about it
//					(pretend it doens't exist when calling this function)
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

				if (json[prop] instanceof Array && json[prop].length){
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