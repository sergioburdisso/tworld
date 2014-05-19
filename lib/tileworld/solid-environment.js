/**
*solid-environment.js
*<p>
* here for ProgramAgent and interaction cycle with the environment? see 
* (1) _programAgentPerceive [prepared the environment and calls]
* (2) _perceptionFunction (percept.js) [which runs the perception function]
* [once percept is created it's returned in] (3) _sendToProgramAgent [it calls the Program Agent (agent.js), runs its logic and] 
* [returns the action calling] (4) _programAgentActionReceived [then the returned action is executed]
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

//Class  Environment
function Environment(rows, columns, graphicEngine, parent) {
	//region Attributes
		//private:
			var _grid = newMatrix(rows, columns); // "Row-Major Order", rows are numbered by the first index and columns by the second index
			var _listOfHoles = new ListOfHoles(rows*columns); // rows*columns is space-inefficient but it speed up some calculation (js engine don't use hashes)
			var _listOfEmptyCells = new ListOfPairs(rows*columns);
			var _listOfTilesToSlide = new ListOfPairs(rows*columns);
			var _listOfObstacles = new List(/*rows*columns*/);

			var _battery = 1000;
			var _bChargerLoc = [-1, -1]; //Battery Charger Location

			var _robLocation = {Row: -1, Column: -1};
			var _robTargetLocation = {Row: -1, Column: -1};

			var _cellFilling = [-1,-1];
			var _holeToFill= false;
			var _holeBeingFilled;

			var _graphicTileworld;
			var _self = this;

			if (_CONTROLLED_BY_AI){
				var _perceptionFunction = new Worker("./lib/tileworld/solid-perception.js");
				var _percept = {header:"", data:""};

				var _ACTION_REGEX = {
					WEST:			/^\s*(action\s*\()?\s*(west|0)\s*\)?\s*$/i,
					EAST:			/^\s*(action\s*\()?\s*(east|1)\s*\)?\s*$/i,
					NORTH:			/^\s*(action\s*\()?\s*(north|2)\s*\)?\s*$/i,
					SOUTH:			/^\s*(action\s*\()?\s*(south|3)\s*\)?\s*$/i,
					NONE:			/^\s*(action\s*\()?\s*(none|null|4)\s*\)?\s*$/i,
					CONSOLE_CLEAR:	/^\s*(action\s*\()?\s*(clear|console_clear|console.clear|5)\s*\)?\s*$/i,
					ERROR:			/^\s*(message_error|error|console_error|console.error)\s*(\(\s*'([^]*)'\s*\)|:([^]*))\s*$/i,
					MESSAGE:		/^\s*(message|log|console_log|console.log)\s*(\(\s*'([^]*)'\s*\)|:([^]*))\s*$/i
				};

				if (_SOCKET_PROGRAM_AGENT){
					var _programAgent = new WebSocket("ws://"+_SOCKET_ADDR+":"+_SOCKET_PORT);
					
					if (_SOCKET_OUTPUT_FORMAT == _PERCEPT_FORMAT.XML)
					var _X2JS = new X2JS();

					_programAgent.onopen = function(){
						//console.log("Socket has been opened!");
					}

					_programAgent.onerror = function(event){
						console.error("An error occurred while trying to connect to the remote Program Agent");
					}

					_programAgent.onclose = function(event) {
						console.error("connection was closed with code: " + event.code + "\n(can't connect to the tileworld proxy)");
					}

				}else{
					var _programAgent = new Worker("./lib/tileworld/solid-agent.js");
				}
			}
		//public:
			this.AbstractLevel = parent;

			this.Score = 0;
			this.Time = 0;
			this.ListOfHoles = _listOfHoles;
			this.ListOfObstacles = _listOfObstacles;

			this.Costs = {};
			this.Costs.move = 0; // time it takes the agent to move (in "ticks") 
			this.Costs.invalid_action = 1; // wasted time by the agent when it chooses and invalid action (100 = 1 "tick"--aprox. 1 second)
			this.Costs.hole_filling = 1; // time the animation takes to fill a cell hole (100 = 1 "tick"--aprox. 1 second)

	//end region Attributes
	//
	//region Methods
		//region Public
			//region Getters And Setters
				this.getGridDimension = function() {
					var rowsColumnsPair = new Object();

					rowsColumnsPair.Rows = _grid.length;
					rowsColumnsPair.Columns = _grid[0].length;

					return rowsColumnsPair;
				}

				this.getRobLocation = function() {
					return _robLocation;
				}

				this.getListOfHoleCells = function() { return _listOfHoles; }

				this.getCellToFill = function() { return _cellFilling; }

				this.getHoleBeingFilled = function() { return _holeBeingFilled; }

				this.getListOfTilesToSlide = function() { return _listOfTilesToSlide; }

				//--------------------------------------------------------------------------------------> initializeEmptyCellsRandomSearch
				this.initializeEmptyCellsRandomSearch = function() {
					if (!this.getARandomEmptyCell.emptyCellsNotSelectedYet)
						this.getARandomEmptyCell.emptyCellsNotSelectedYet = new ListOfPairs(_grid.length*_grid[0].length);

					this.getARandomEmptyCell.emptyCellsNotSelectedYet.removeAll();

					this.getARandomEmptyCell.emptyCellsNotSelectedYet.appendAllUnique(_listOfEmptyCells);
				}

				// (whenever you want to generate a sequence of unique empty cells using this function,
				//  make sure before call it, call initializeEmptyCellsRandomSearch)
				this.getARandomEmptyCell = function() {
					var emptyCellsNotSelectedYet = this.getARandomEmptyCell.emptyCellsNotSelectedYet;
					var emptyCell;

					if (!emptyCellsNotSelectedYet.empty()){
						//Javascript Engine, pick a random empty cell, please
						emptyCell = emptyCellsNotSelectedYet.removeItemAt(parseInt(random(0, emptyCellsNotSelectedYet.getLength())));
						//if what you just picked is the hole being filled, select another one
						if (this.isThereAHoleFilling(emptyCell[0], emptyCell[1]))
							return emptyCellsNotSelectedYet.removeItemAt(parseInt(random(0, emptyCellsNotSelectedYet.getLength())));
						else
							return emptyCell;
					}

					return null;
				}
			//end region Getters And Setters

			//--------------------------------------------------------------------------------------> startRunning
			this.startRunning = function(){
				_self.AbstractLevel.createHoles();
				_self.AbstractLevel.createObstacles();

				if ( Tileworld.Dynamic )
					_holesAndObstaclesTick();

				if ( _CONTROLLED_BY_AI ){
					_perceptionFunction.onmessage = _sendToProgramAgent;
					_programAgent.onmessage = _programAgentActionReceived; // action received callback is "_programAgentActionReceived(action)" 

					_percept.header = _PERCEPT_HEADER.START;
					_percept.data = "null";
					_sendToProgramAgent( _percept );
				}
			}

			//--------------------------------------------------------------------------------------> askForNextAction
			this.askForNextAction = function() {
				if ( Tileworld.perceiveEveryTick ){
					_percept.header = _PERCEPT_HEADER.READY_FOR_NEXT_ACTION;
					_percept.data = "null";
					_sendToProgramAgent( _percept );
				}else
					_programAgentPerceive();
			}

			//--------------------------------------------------------------------------------------> onLoadingCompleteCallback
			//(this function handles the event fired when the whole 3D scene is loaded, this event fires from the GraphicTileworld Class)
			this.onLoadingCompleteCallback = function() {
				var emptyCell;

				if (!_ROB_RANDOM_START_POSITION)
					this.initializeRobAt(_ROB_START_POSITION.ROW, _ROB_START_POSITION.COLUMN);
				else
					this.initializeRobAt(random(rows), random(columns));

				if (Tileworld.Battery){
					_bChargerLoc = _listOfEmptyCells.removeItemAt( random(_listOfEmptyCells.getLength()) );
					_grid[ _bChargerLoc[0] ][ _bChargerLoc[1] ] = _GRID_CELL.BATTERY_CHARGER;
					_graphicTileworld.setBatteryChargerLocation(_bChargerLoc[0], _bChargerLoc[1]);
				}
			}

			//--------------------------------------------------------------------------------------> tick
			//(this functions is called each second (i.e every <gTileworld.currentFPS> frames) from the GraphicTileworld)
			this.tick = function() {
				if (Tileworld.Dynamic && _Running){
					//if "it's the first time this function's called", then create the persistent variables
					if (!this.holesSeconds){
						this.holesSeconds = uncertaintyMaker(Tileworld.Dynamism, Tileworld.Dynamism_UncertaintyThreshold) + _TILES_TELEPORT_DELAY;
						this.obstaclesSecons = uncertaintyMaker(Tileworld.Hostility, Tileworld.Hostility_UncertaintyThreshold);
					}

					if ((--this.holesSeconds) == 0){
						this.AbstractLevel.createHoles();
						this.holesSeconds = uncertaintyMaker(Tileworld.Dynamism, Tileworld.Dynamism_UncertaintyThreshold) + _TILES_TELEPORT_DELAY;
					}

					if ((--this.obstaclesSecons) == 0){
						this.AbstractLevel.createObstacles();
						this.obstaclesSecons = uncertaintyMaker(Tileworld.Hostility, Tileworld.Hostility_UncertaintyThreshold);
					}

					CallWithDelay.Tick();

					_holesAndObstaclesTick();

					if (Tileworld.perceiveEveryTick)
						_programAgentPerceive();

					this.Time++;
				}
			}

			//--------------------------------------------------------------------------------------> updateBattery
			this.updateBattery = function(value) {
				_battery += value;

				if (_battery <= 0) {
					_battery = 0;
					$("#battery-charge-frame").css("box-shadow", "0 0 10px red");
				}else
				if (_battery > 1000) _battery = 1000;

				$("#battery-percent").html((_battery/10).toFixed(1) + "%");
				$("#battery-charge").css("background-color", "rgb("+(75+(180*(1-_battery/1000)|0))+", 218, 100)");
				if (value <= 0)
					$("#battery-charge").width(_battery/10 + "%");
				else
					$("#battery-charge").animate({width:_battery/10 + "%"},300);
			}

			this.isBatteryChargeSufficient = function(){return _battery > 0;}

			//--------------------------------------------------------------------------------------> isThereAHoleToFill
			this.isThereAHoleToFill = function() {
				if (_holeToFill) {
					_holeToFill = false;
					return true;
				} else
					return false;
			}

			this.isThereAHoleFilling = function(row, column) {
				if (row == null)
					return _cellFilling[0] != -1;
				else
					return _cellFilling[0] == row && _cellFilling[1] == column;
			}

			//--------------------------------------------------------------------------------------> isItAnEmptyCell
			this.isItAValidMovement= function(row, column) {
				return validCoordinates(row,column) && (_grid[row][column] == _GRID_CELL.EMPTY || _grid[row][column] == _GRID_CELL.BATTERY_CHARGER);
			}

			//--------------------------------------------------------------------------------------> isItAnEmptyCell
			this.isItAnEmptyCell= function(row, column) {
				return validCoordinates(row,column)&&(_grid[row][column] == _GRID_CELL.EMPTY);
			}

			//--------------------------------------------------------------------------------------> isItAHole
			this.isItAHole= function(row, column) {
				// is a valid coordinate and _grid[row][column] is a number
				return validCoordinates(row,column)&&(_grid[row][column] === (_grid[row][column]|0));
			}

			//--------------------------------------------------------------------------------------> isItATile
			this.isItATile= function(row, column) {
				return validCoordinates(row,column)&&(_grid[row][column] == _GRID_CELL.TILE);
			}

			//--------------------------------------------------------------------------------------> isItAObstacle
			this.isItAObstacle= function(row, column) {
				return validCoordinates(row,column)&&(_grid[row][column] == _GRID_CELL.OBSTACLE);
			}

			//--------------------------------------------------------------------------------------> newTile
			this.newTile = function(tileCell) {
				if (tileCell){
					_grid[tileCell[0]][tileCell[1]] = _GRID_CELL.TILE;

					_listOfEmptyCells.remove(tileCell[0], tileCell[1]);

					_graphicTileworld.newTile(tileCell);
				}
			}

			//--------------------------------------------------------------------------------------> newHole
			this.newHole = function(holeCells, holeLifetime, actualVariabilityOfUtility) {
				var newHole = new Hole(holeCells, holeLifetime, _cellFilling, actualVariabilityOfUtility);

				_listOfHoles.shrinkHoles(holeCells);
				_listOfHoles.append(newHole);

				for(var length= holeCells.getLength(),iCell, i= 0; i < length; i++){
					iCell = holeCells.getItemAt(i);
					_grid[iCell[0]][iCell[1]] = newHole.Id;
					_listOfEmptyCells.remove(iCell[0], iCell[1]);
				}

				_graphicTileworld.newHole(holeCells);
			}

			//--------------------------------------------------------------------------------------> newObstacle
			this.newObstacle = function(obstacleCell, lifeTime) {
				if (obstacleCell){
					_grid[obstacleCell[0]][obstacleCell[1]] = _GRID_CELL.OBSTACLE;
					_listOfEmptyCells.remove(obstacleCell[0], obstacleCell[1]);

					_listOfObstacles.append(new Obstacle(obstacleCell, lifeTime));

					_graphicTileworld.newObstacle(obstacleCell);
				}
			}

			this.holeFilled = function() {
				_cellFilling[0] = _cellFilling[1] = -1;
			}

			//--------------------------------------------------------------------------------------> initializeRobAt
			this.initializeRobAt = function(rowIndex, columnIndex) {

				_grid[rowIndex][columnIndex] = _GRID_CELL.AGENT;
				_listOfEmptyCells.remove(rowIndex, columnIndex);

				_robLocation.Row = _robTargetLocation.Row = rowIndex;
				_robLocation.Column = _robTargetLocation.Column = columnIndex;

				_graphicTileworld.setRobLocation(rowIndex, columnIndex);
			}

			//--------------------------------------------------------------------------------------> robWalkingToSouth
			this.robWalkingToSouth = function(listOfTilesToSlide) {
				_robTargetLocation.Row++;
				robWalking();
			}

			//--------------------------------------------------------------------------------------> robWalkingToNorth
			this.robWalkingToNorth = function(listOfTilesToSlide) {
				_robTargetLocation.Row--;
				robWalking();
			}

			//--------------------------------------------------------------------------------------> robWalkingNorth
			this.robWalkingToEast = function(listOfTilesToSlide) {
				_robTargetLocation.Column++;
				robWalking();
			}

			//--------------------------------------------------------------------------------------> robWalkingSouth
			this.robWalkingToWest = function(listOfTilesToSlide) {
				_robTargetLocation.Column--;
				robWalking();
			}

			//--------------------------------------------------------------------------------------> robGetLocation
			this.robGetLocation = function() {

				if (Tileworld.Battery && (_robLocation.Row == _bChargerLoc[0] && _robLocation.Column == _bChargerLoc[1]) ){
					$("#battery-charge-frame").css("box-shadow", "0 0 10px rgba(87, 255, 168, 0.57)");
					_grid[_robLocation.Row][_robLocation.Column] = _GRID_CELL.BATTERY_CHARGER;
					_graphicTileworld.batteryChargeAnimation(true);
				}else{
					_grid[_robLocation.Row][_robLocation.Column] = _GRID_CELL.EMPTY;
					_listOfEmptyCells.appendUnique([_robLocation.Row, _robLocation.Column]);
				}

				_robLocation.Row = _robTargetLocation.Row;
				_robLocation.Column = _robTargetLocation.Column;

				if (Tileworld.Battery)
					if (_robLocation.Row == _bChargerLoc[0] && _robLocation.Column == _bChargerLoc[1]){
						_self.updateBattery(1000-_battery);
						$("#battery-charge-frame").css("box-shadow", "0 0 40px rgba(87, 255, 168, 1)");
						_graphicTileworld.batteryChargeAnimation(false);
					}
			}


			//--------------------------------------------------------------------------------------> slideTiles
			this.slideTiles = function(theCase) {
				var xSlide = 0, ySlide = 0;
				var farthestTile, closestTile;

				_listOfTilesToSlide.removeAll();

				switch(theCase){
					case _ACTION.SOUTH: //slide to the South
						xSlide = 1;

						for(var iRow = _robLocation.Row+1; this.isItATile(iRow, _robLocation.Column); iRow++)
							_listOfTilesToSlide.appendUnique([iRow, _robLocation.Column]);

						if (_listOfTilesToSlide.empty())
							return false;

						farthestTile= _listOfTilesToSlide.getItemAt(_listOfTilesToSlide.getLength()-1);

						if (farthestTile[0]+1 >= this.getGridDimension().Rows  || this.isItAObstacle(farthestTile[0]+1, farthestTile[1]))
							return false;

						break;
					case _ACTION.NORTH: //slide to the North
						xSlide = -1;

						for(var iRow = _robLocation.Row-1; this.isItATile(iRow, _robLocation.Column); iRow--)
							_listOfTilesToSlide.appendUnique([iRow, _robLocation.Column]);

						if (_listOfTilesToSlide.empty())
							return false;

						farthestTile= _listOfTilesToSlide.getItemAt(_listOfTilesToSlide.getLength()-1);

						if (farthestTile[0]-1 < 0 || this.isItAObstacle(farthestTile[0]-1, farthestTile[1]))
							return false;

						break;
					case _ACTION.EAST: //slide to the East
						ySlide = 1;

						for(var iColumn = _robLocation.Column+1; this.isItATile(_robLocation.Row, iColumn); iColumn++)
							_listOfTilesToSlide.appendUnique([_robLocation.Row, iColumn]);

						if (_listOfTilesToSlide.empty())
							return false;

						farthestTile= _listOfTilesToSlide.getItemAt(_listOfTilesToSlide.getLength()-1);

						if (farthestTile[1]+1 >= this.getGridDimension().Columns || this.isItAObstacle(farthestTile[0], farthestTile[1]+1))
							return false;

						break;
					case _ACTION.WEST: //slide to the West
						ySlide = -1;

						for(var iColumn = _robLocation.Column-1; this.isItATile(_robLocation.Row, iColumn); iColumn--)
							_listOfTilesToSlide.appendUnique([_robLocation.Row, iColumn]);

						if (_listOfTilesToSlide.empty())
							return false;

						farthestTile= _listOfTilesToSlide.getItemAt(_listOfTilesToSlide.getLength()-1);

						if (farthestTile[1]-1 < 0 || this.isItAObstacle(farthestTile[0], farthestTile[1]-1))
							return false;
				}

				farthestTile = [farthestTile[0]+xSlide, farthestTile[1]+ySlide];
				_listOfTilesToSlide.appendUnique(farthestTile);

				if (this.isItAHole(farthestTile[0], farthestTile[1])){

					_grid[farthestTile[0]][farthestTile[1]] = _GRID_CELL.EMPTY;

					_listOfEmptyCells.appendUnique([farthestTile[0], farthestTile[1]]);

					_holeBeingFilled = _listOfHoles.removeHoleCell([farthestTile[0], farthestTile[1]]);

					if (_holeBeingFilled.isFilled()){

						_updateScore(_holeBeingFilled.Value, _holeBeingFilled.OriginalCells, true);
						removeHoleHelpers(_holeBeingFilled);

					}else
						_updateScore(Tileworld.valueOfCellHoleFilled(_holeBeingFilled.getNumberOfCellsFilled()), _holeBeingFilled.getCellsFilled(), false);

					_cellFilling[0]= farthestTile[0]; _cellFilling[1]= farthestTile[1];
					_holeToFill = true;

				}else{

					_grid[farthestTile[0]][farthestTile[1]] = _GRID_CELL.TILE;
					_listOfEmptyCells.remove(farthestTile[0], farthestTile[1]);

					_holeToFill = false;
				}

				closestTile = _listOfTilesToSlide.getItemAt(0);

				if (Tileworld.Battery && (closestTile[0] == _bChargerLoc[0] && closestTile[1] == _bChargerLoc[1]) )
					_grid[closestTile[0]][closestTile[1]] = _GRID_CELL.BATTERY_CHARGER;
				else{
					_grid[closestTile[0]][closestTile[1]] = _GRID_CELL.EMPTY;
					_listOfEmptyCells.appendUnique([closestTile[0], closestTile[1]]);
				}
				_listOfTilesToSlide.removeItemAt(0);

				_self.updateBattery(-_BATTERY_SLIDE_COST);
				return true;
			}

			//returns the list of empty cells adjacent to <cell>
			this.successorsEmptyCells = function(cell){
				successors = new Array();

				if (cell[0]+1 < this.getGridDimension().Rows && this.isItAnEmptyCell(cell[0]+1, cell[1]))
					successors.push([cell[0]+1, cell[1]]);

				if (cell[1]-1 >= 0 && this.isItAnEmptyCell(cell[0], cell[1]-1))
					successors.push([cell[0], cell[1]-1]);

				if (cell[0]-1 >= 0 && this.isItAnEmptyCell(cell[0]-1, cell[1]))
					successors.push([cell[0]-1, cell[1]]);

				if (cell[1]+1 < this.getGridDimension().Columns && this.isItAnEmptyCell(cell[0], cell[1]+1))
					successors.push([cell[0], cell[1]+1]);

				//shuffling the result
				for (var tmp, i = 0; i < successors.length; i++){
					rnd = Math.floor(random(0, successors.length));
					tmp = successors[0];
					successors[0] = successors[rnd];
					successors[rnd] = tmp;
				}

				return (successors.length==0)? null : successors;
			}

			//returns the list of cells adjacent to <cell>
			this.successors = function(cell){
				successors = new Array();

				if (cell[0]+1 < this.getGridDimension().Rows)
					successors.push([cell[0]+1, cell[1]]);

				if (cell[1]-1 >= 0)
					successors.push([cell[0], cell[1]-1]);

				if (cell[0]-1 >= 0)
					successors.push([cell[0]-1, cell[1]]);

				if (cell[1]+1 < this.getGridDimension().Columns)
					successors.push([cell[0], cell[1]+1]);

				//shuffling the result
				for (var tmp, i = 0; i < successors.length; i++){
					rnd = Math.floor(random(0, successors.length));
					tmp = successors[0];
					successors[0] = successors[rnd];
					successors[rnd] = tmp;
				}

				return (successors.length==0)? null : successors;
			}
		//end region Public
		//
		//region Private
			//--------------------------------------------------------------------------------------> _sendToProgramAgent
			function _sendToProgramAgent ( percept ) {
				//if percept come from the perception function/thread (in which case percept is ready to be sent)
				if (!percept.header)
					percept = percept.data;

				// once the percept was created by the perception function (thread that runs the solid-percept.js)
				// send the percept to the Rob's mind (i.e the Program Agent)
				if (!_SOCKET_PROGRAM_AGENT)
					_programAgent.postMessage( percept );
				else{

					if (percept.header)
					switch(_SOCKET_OUTPUT_FORMAT){
						case _PERCEPT_FORMAT.JSON:
							percept = JSON.stringify(percept);
							break;
						case _PERCEPT_FORMAT.XML:
							percept = sprintf( _PERCEPT_FORMAT.XML, _X2JS.json2xml_str({header:percept.header, desc:percept.data}) );
							break;
						case _PERCEPT_FORMAT.PROLOG:
							percept = sprintf( _PERCEPT_FORMAT.PROLOG, percept.header, percept.data );
							break;
					}

					_programAgent.send( percept );
				}
			}

			//Used to call Rob's Program Agent in order to get the next action to do
			//-----------------------------------------------------------------------------------------> _programAgentPerceive
			function _programAgentPerceive(){
				//1) creating the environment...
				if (!this.environment){
					this.environment = {
						Grid : _grid,
						/*Time : _self.Time,
						Score : _self.Score,
						Battery : _battery,*/
						BatterCharger : _bChargerLoc,
						RobLocation : _robLocation,
						ListOfHoles : [],
						ListOfObstacles :[],
						Costs : _self.Costs
					}
				}

				//2) preparing the environment object before sending it to the perception function
				this.environment.Time = _self.Time;
				this.environment.Score = _self.Score;
				this.environment.Battery = _battery;

				//-> List Of Holes
				var _totalHoles = _self.ListOfHoles.getLength();
				this.environment.ListOfHoles.length = _totalHoles;
				for (var iHole, iHCells, i= 0;  i < _totalHoles; ++i){
					iHole = _self.ListOfHoles.getItemAt(i);

					if (!this.environment.ListOfHoles[i])
						this.environment.ListOfHoles[i] = {};

					this.environment.ListOfHoles[i].id = iHole.Id;
					this.environment.ListOfHoles[i].cells = iHole.CurrentCells.getInternalArray();
					this.environment.ListOfHoles[i].size = iHole.Size;
					this.environment.ListOfHoles[i].value = iHole.Value;

					if (Tileworld.Dynamic){
						this.environment.ListOfHoles[i].time_elapsed = iHole.getTimeElapsed();

						if (Tileworld.ShowTimeLeft)
							this.environment.ListOfHoles[i].lifetime_left = iHole.getTimeRemaindingToTimeout();
					}
				}

				//-> List Of Obstacles
				var _totalObs = _self.ListOfObstacles.getLength();
				this.environment.ListOfObstacles.length = _totalObs;
				for (var iObs, i= 0;  i < _totalObs; ++i){
					iObs = _self.ListOfObstacles.getItemAt(i);

					if (!this.environment.ListOfObstacles[i])
						this.environment.ListOfObstacles[i] = {};

					//this.environment.ListOfObstacles[i].id = iObs.Id; //esto deberia ser opcional, segun quiera el usuario implementar un mecanismo para "reconocer" un objeto en el ambiente o no
					this.environment.ListOfObstacles[i].cell = iObs.Cell;

					if (Tileworld.Dynamic){
						this.environment.ListOfObstacles[i].time_elapsed = iObs.getTimeElapsed();

						if (Tileworld.ShowTimeLeft)
							this.environment.ListOfObstacles[i].lifetime_left = iObs.getTimeRemaindingToTimeout();
					}
				}

				//3) start running the thread whose job is to create the perception -e.i. perceptionFunction(environment)
				_perceptionFunction.postMessage( this.environment );
			}

			//used to receive the Rob's Program Agent action
			//-----------------------------------------------------------------------------------------> _programAgentActionReceived
			function _programAgentActionReceived(action) {
				var matchs;

				action = action.data;

				//case _ACTION.SOUTH
				if ( _ACTION_REGEX.SOUTH.test(action) )
					_graphicTileworld.RobWalkSouth();
				else
				//case _ACTION.NORTH
				if ( _ACTION_REGEX.NORTH.test(action) )
					_graphicTileworld.RobWalkNorth();
				else
				//case _ACTION.EAST
				if ( _ACTION_REGEX.EAST.test(action) )
					_graphicTileworld.RobWalkEast();
				else
				//case _ACTION.WEST
				if ( _ACTION_REGEX.WEST.test(action) )
					_graphicTileworld.RobWalkWest();
				else
				//case _ACTION.CONSOLE_CLEAR
				if ( _ACTION_REGEX.CONSOLE_CLEAR.test(action) )
					console.clear();
				else
				//case _ACTION.ERROR
				if ( _ACTION_REGEX.ERROR.test(action) )
					{matchs = action.match(_ACTION_REGEX.ERROR);
					console.error( matchs[3] || matchs[4] );}
				else
				//case _ACTION.MESSAGE
				if ( _ACTION_REGEX.MESSAGE.test(action) )
					{matchs = action.match(_ACTION_REGEX.MESSAGE);
					console.log( matchs[3] || matchs[4] );}
				else
				//case _ACTION.NONE
				if ( _ACTION_REGEX.NONE.test(action) )
					_programAgentPerceive();
				//case INVALID ACTION
				else{
					_percept.header = _PERCEPT_HEADER.ERROR;
					_percept.data = "'invalid action " + JSON.stringify(action) + " was received'";

					_sendToProgramAgent( _percept );
				}
			}
			//--------------------------------------------------------------------------------------> _holesAndObstaclesTick
			function _holesAndObstaclesTick() {
				var cellRemoved;
				for (var hole, i= _listOfHoles.getLength()-1; i >= 0; i--){
					hole = _listOfHoles.getItemAt(i);

					if (hole.tickAndTest()){
						if (Tileworld.HardBounds)
							_removeHole(i);
						else{
							cellRemoved = hole.CurrentCells.getItemAt(Math.floor(random(0,hole.CurrentCells.getLength())));

							removeHoleCell(cellRemoved, true);
							removeHoleHelper(cellRemoved);

							if (hole) {
								hole.shrinkHole(cellRemoved);
								hole.LifeTime = uncertaintyMaker(
									Tileworld.Dynamism,
									Tileworld.Dynamism_UncertaintyThreshold
								);
							}
						}
					}
				}

				for (var obstacle, i= _listOfObstacles.getLength()-1; i >= 0; i--){
					obstacle = _listOfObstacles.getItemAt(i);

					if (obstacle.tickAndTest())
						_removeObstacle(i);
				}
			}

			//--------------------------------------------------------------------------------------> _updateScore
			function _updateScore(utility, cells, filled) {
				_self.Score+= utility;

				_graphicTileworld.updateScore(_self.Score, cells, filled, utility);
			}

			//--------------------------------------------------------------------------------------> _removeHole
			function _removeHole(listOfHoleCellsIndex) {
				var hole = _listOfHoles.getItemAt(listOfHoleCellsIndex);
				var currentHoleCells = hole.CurrentCells;
				var holeCells = hole.OriginalCells;

				for(var i= 0, holeCell; i < currentHoleCells.getLength(); i++){
					holeCell = currentHoleCells.getItemAt(i);
					if (_grid[holeCell[0]][holeCell[1]] != _GRID_CELL.EMPTY){
						removeHoleCell(holeCell, true);
						i--;
					}
				}
			}

			//--------------------------------------------------------------------------------------> _removeObstacle
			function _removeObstacle(obstacleIndex) {
				var obstacle = _listOfObstacles.getItemAt(obstacleIndex);

				_grid[obstacle.Cell[0]][obstacle.Cell[1]] = _GRID_CELL.EMPTY;

				_listOfEmptyCells.appendUnique(obstacle.Cell);
				_listOfObstacles.removeItemAt(obstacleIndex);

				_graphicTileworld.removeObstacle(obstacle.Cell);
			}

			//--------------------------------------------------------------------------------------> removeHoleCell
			function removeHoleCell(holeCell, isTeleported) {
				var hole;

				_grid[holeCell[0]][holeCell[1]] = _GRID_CELL.EMPTY;

				_listOfEmptyCells.appendUnique(holeCell);
				hole = _listOfHoles.removeHoleCell(holeCell);

				if (hole.isFilled()){
					removeHoleHelpers(hole);
				}

				_graphicTileworld.removeHoleCell(holeCell, isTeleported);

				//TODO: o asi removeATile(); pero con animacion de teletransp las tiles a los huecos (RESPETA MEJOR LOS TIEMPOS DEL PAPER) PROBAR CON SACAR SOLO LOS RAYOS DEL ALIEN A VER COMO QUEDA
				CallWithDelay.Enqueue(removeATile, null, 1 /*time in seconds*/);
			}

			function removeHoleHelper(holeCell) {
				_graphicTileworld.removeHoleHelper(holeCell);
			}

			function removeHoleHelpers(hole) {
				for(var i= 0; i < hole.OriginalCells.length; i++)
					removeHoleHelper(hole.OriginalCells[i]);
			}

			//--------------------------------------------------------------------------------------> removeATile
			function removeATile(){
				var tileCell = getRandomTile();

				if (tileCell){
					_grid[tileCell[0]][tileCell[1]] = _GRID_CELL.EMPTY;

					_listOfEmptyCells.appendUnique(tileCell);
					_listOfTilesToSlide.remove(tileCell[0], tileCell[1]);

					_graphicTileworld.removeTile(tileCell, true);
				}
			}

			//--------------------------------------------------------------------------------------> getRandomTile
			function getRandomTile() {
				var listOfTiles = new ListOfPairs((_grid.length*_grid[0].length)/2);

				for (var irow= 0; irow < _grid.length; irow++)
					for (var icolumn= 0; icolumn < _grid[0].length; icolumn++){
						if (_grid[irow][icolumn] == _GRID_CELL.TILE && !(_cellFilling[0] == irow && _cellFilling[1] == icolumn))
							listOfTiles.appendUnique([irow, icolumn]);
				}

				if (listOfTiles.empty())
					return null;
				else
					return listOfTiles.getItemAt(parseInt(random(0, listOfTiles.getLength())));
			}

			//--------------------------------------------------------------------------------------> robWalking
			function robWalking() {
				_grid[_robTargetLocation.Row ][_robTargetLocation.Column] = _GRID_CELL.AGENT;
				_listOfEmptyCells.remove(_robTargetLocation.Row, _robTargetLocation.Column);

				_self.updateBattery(-_BATTERY_WALK_COST);
			}

			//--------------------------------------------------------------------------------------> validCoordinates
			function validCoordinates(rowIndex,columnIndex) {
				return (0 <= rowIndex && rowIndex < _grid.length)&&(0 <= columnIndex && columnIndex < _grid[0].length);
			}
		//end region Private
	//end region Methods
	//
	//region Class Constructor Logic
		_graphicTileworld = new GraphicTileworld(graphicEngine, this);

		//-> Grid Initialization
		for (var irow= 0; irow < _grid.length; irow++)
			for (var icolumn= 0; icolumn < _grid[0].length; icolumn++){
				_grid[irow][icolumn] = _GRID_CELL.EMPTY;
				_listOfEmptyCells.appendUnique([irow, icolumn]);
			}
	//end region Class Constructor Logic
}

//--> Internal Classes

//Class Obstacle
function Obstacle(cell, lifeTime) {
	var _currentLifeTime = lifeTime;
	var _initalTime = lifeTime;

	this.Cell = cell;

	//hey hole! a second has passed
	this.tickAndTest = function(){
		return (--_currentLifeTime == 0);
	}

	//self-explanatory
	this.getTimeRemaindingToTimeout = function(){return _currentLifeTime;}

	this.getTimeElapsed = function(){return _initalTime - _currentLifeTime;}
}

//Class Hole
function Hole(holeCells, holeLifetime, holeFillingPointer, actualVariabilityOfUtility) {
	Hole.Counter = (Hole.Counter)? Hole.Counter+1 : 1;
	var _currentLifeTime = 0;
	var _lifeTime = holeLifetime; // time remaining to timeout (seconds)
	var _variabilityOfUtility = actualVariabilityOfUtility;

	this.Id = Hole.Counter;
	this.OriginalCells = new Array(holeCells.getLength()); //array
	this.CurrentCells = holeCells; // (ListOfPairs) cells that aren't filled yet
	this.Size = holeCells.getLength();
	this.HoleFillingPointer = holeFillingPointer;
	this.Value = Tileworld.valueOfHoleFilledCompletely(this.Size)*_variabilityOfUtility | 0;

	for(var i=0; i < holeCells.getLength(); i++) {
		this.OriginalCells[i] = holeCells.getInternalArray()[i];
	}

	//hey hole! a second has passed
	this.tickAndTest = function(){
		if (this.CurrentCells.isIn(this.HoleFillingPointer[0], this.HoleFillingPointer[1]))
			return false;

		if (++_currentLifeTime >= _lifeTime) {
			_currentLifeTime = 0;
			return true;
		}

		return false;
	}

	//self-explanatory
	this.getTimeRemaindingToTimeout = function(){return _lifeTime - _currentLifeTime;}

	//self-explanatory
	this.getTimeElapsed = function(){return _currentLifeTime;}

	//returns true whether the cell <pair> was filled
	this.removeHoleCell = function(pair, restartLifeTime) {
		for (var i= 0; i < this.CurrentCells.getLength(); i++)
			if (this.CurrentCells.getItemAt(i)[0] == pair[0] && this.CurrentCells.getItemAt(i)[1] == pair[1]){
				this.CurrentCells.removeItemAt(i);

				if (restartLifeTime)
					_currentLifeTime = 0;

				return true;
			}

		return false;
	}

	this.getNumberOfCellsFilled = function() {
		return this.Size - this.CurrentCells.getLength();
	}

	this.getCellsFilled = function() {
		var cellsFilled = new Array(this.getNumberOfCellsFilled());
		var oCells = this.OriginalCells;
		var cCells = this.CurrentCells;

		for (var i=0, j=0; i < oCells.length; i++)
			if (!cCells.isIn(oCells[i][0], oCells[i][1]))
				cellsFilled[j++]= oCells[i];

		return cellsFilled;
	}

	this.wasRemoved = function(){return this.Id == -1;}

	this.isFilled = function() {
		return (this.CurrentCells.getLength() == 0);
	}

	this.shrinkHole = function(cell) {
		for (var i = 0; i < this.OriginalCells.length; i++)
			if (this.OriginalCells[i][0] == cell[0] && this.OriginalCells[i][1] == cell[1]) {
				this.Size--;
				this.OriginalCells.splice(i,1);

				this.Value = Tileworld.valueOfHoleFilledCompletely(this.Size)*_variabilityOfUtility | 0;
			}
	}
}
//<-- Internal Classes