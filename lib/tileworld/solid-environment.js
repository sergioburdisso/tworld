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
			var _grid				= newMatrix(rows, columns); // "Row-Major Order", rows are numbered by the first index and columns by the second index
			var _listOfHoles		= new ListOfHoles(rows*columns); // rows*columns is space-inefficient but it speed up some calculation (js engine don't use hashes)
			var _listOfObstacles	= new List(/*rows*columns*/);
			var _listOfEmptyCells	= new ListOfPairs(rows*columns);

			var _bChargerLoc		= [-1, -1]; //Battery Charger Location

			var _rob = new Array(_NUMBER_OF_ROBS);

			var _self = this;
			var _graphicTileworld;

			if (_CONTROLLED_BY_AI[0]){
				var _perceptionFunction = new Worker("./lib/tileworld/solid-perception.js");
				var _percept = {header: null, data:""};

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

				_programAgent.onmessage = _programAgentActionReceived;
			}
		//public:
			this.AbstractLevel = parent;

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

				this.getRobLocation = function(rIndex) {
					return _rob[rIndex].Location;
				}

				this.getListOfHoleCells = function() { return _listOfHoles; }

				this.getCellToFill = function(rIndex) { return _rob[rIndex].CellFilling; }

				this.getHoleBeingFilled = function(rIndex) { return _rob[rIndex].HoleBeingFilled; }

				this.getListOfTilesToSlide = function(rIndex) { return _rob[rIndex].ListOfTilesToSlide; }

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

				_Running = true;

				while ( _ACTIVE_CAMERA < _DEFAULT_CAMERA )
					_graphicTileworld.toggleCamera();

				if ( !Tileworld.Dynamic )
					_TILES_TELEPORT_DELAY= 0;

				_self.AbstractLevel.createHoles();
				_self.AbstractLevel.createObstacles();

				if ( Tileworld.Dynamic )
					_holesAndObstaclesTick();

				if ( _CONTROLLED_BY_AI[0] ){
					_perceptionFunction.onmessage = _sendToProgramAgent;

					//sending the 'start' percept message!
					_percept.header =_PERCEPT_HEADER.START;
					_programAgentPerceive();
				}
			}

			//--------------------------------------------------------------------------------------> askForNextAction
			this.askForNextAction = function() {
				if ( Tileworld.PerceiveEveryTick ){
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

				for (var pos, i = _rob.length-1; i >= 0; --i){
					if (!_ROB_RANDOM_START){
						this.initializeRobAt(0, _ROB_START_POSITION[i].ROW, _ROB_START_POSITION[i].COLUMN);
						_listOfEmptyCells.remove(_ROB_START_POSITION[i].ROW, _ROB_START_POSITION[i].COLUMN);
					}else{
						pos = _listOfEmptyCells.removeItemAt( random(_listOfEmptyCells.getLength()) );
						this.initializeRobAt(i, pos[0], pos[1]);
					}
				}

				if (Tileworld.Battery){
					if (_BATTERY_RANDOM_START)
						_bChargerLoc = _listOfEmptyCells.removeItemAt( random(_listOfEmptyCells.getLength()) );
					else{
						_bChargerLoc = [_BATTERY_START_POSITION.ROW, _BATTERY_START_POSITION.COLUMN];
						_listOfEmptyCells.remove( _bChargerLoc[0], _bChargerLoc[1] );
					}

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

					if (Tileworld.PerceiveEveryTick)
						_programAgentPerceive();

					_graphicTileworld.updateTime(++this.Time);
					if (this.Time >= _TIME_LIMIT)
						_Running = false;
				}
			}

			//--------------------------------------------------------------------------------------> updateBattery
			this.updateBattery = function(rIndex, value) {
				_rob[rIndex].Battery += value;

				_graphicTileworld.updateBattery(rIndex, _rob[rIndex].Battery);
			}

			this.isBatteryChargeSufficient = function(rIndex){return _rob[rIndex].Battery > 0;}

			//--------------------------------------------------------------------------------------> isThereAHoleToFill
			this.isThereAHoleToFill = function(rIndex) {
				if (_rob[rIndex].HoleToFill) {
					_rob[rIndex].HoleToFill = false;
					return true;
				} else
					return false;
			}

			this.isThereAHoleFilling = function(row /*or rIndex when column is null*/, column) {
				if (column == null)
					return _rob[row/*rIndex*/].CellFilling[0] != -1;
				else{
					for (var r= _rob.length-1; r >= 0; --r)
						if (_rob[r].CellFilling[0] == row && _rob[r].CellFilling[1] == column)
							return true;

					return false;
				}
			}

			//--------------------------------------------------------------------------------------> isAnEmptyCell
			this.isASlidingTile = function(rIndex, row, column) {
				for (var rt = _rob.length-1; rt >= 0; --rt)
					if (rt != rIndex && _rob[rt].ListOfTilesToSlide.contains(row, column))
						return true;
				return false;
			}

			//--------------------------------------------------------------------------------------> isAnEmptyCell
			this.isAValidMovement = function(rIndex, row, column) {
				return	validCoordinates(row,column) &&
						(_grid[row][column] == _GRID_CELL.EMPTY || _grid[row][column] == _GRID_CELL.BATTERY_CHARGER) &&
						!this.isThereAHoleFilling(row, column) && 
						!this.isASlidingTile(rIndex, row, column);
			}

			//--------------------------------------------------------------------------------------> isAnEmptyCell
			this.isAnEmptyCell= function(row, column) {
				return validCoordinates(row,column)&&(_grid[row][column] == _GRID_CELL.EMPTY);
			}

			//--------------------------------------------------------------------------------------> isAHole
			this.isAHole= function(row, column) {
				// is a valid coordinate and _grid[row][column] is a number
				return validCoordinates(row,column)&&(_grid[row][column] === (_grid[row][column]|0));
			}

			//--------------------------------------------------------------------------------------> isATile
			this.isATile= function(row, column) {
				return validCoordinates(row,column)&&(_grid[row][column] == _GRID_CELL.TILE);
			}

			//--------------------------------------------------------------------------------------> isAObstacle
			this.isAObstacle= function(row, column) {
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
				var newHole = new Hole(this, holeCells, holeLifetime, actualVariabilityOfUtility);

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

			this.holeFilled = function(rIndex) {
				_rob[rIndex].CellFilling[0] = _rob[rIndex].CellFilling[1] = -1;
			}

			//--------------------------------------------------------------------------------------> initializeRobAt
			this.initializeRobAt = function(robIndex, rowIndex, columnIndex) {

				_grid[rowIndex][columnIndex] = _GRID_CELL.AGENT;

				_rob[robIndex].Location.Row = rowIndex;
				_rob[robIndex].Location.Column = columnIndex;

				_graphicTileworld.setRobLocation(robIndex, rowIndex, columnIndex);
			}

			//--------------------------------------------------------------------------------------> robWalkingToSouth
			this.robWalkingToSouth = function(rIndex) {
				robWalking(rIndex, _rob[rIndex].Location.Row + 1, _rob[rIndex].Location.Column);
			}

			//--------------------------------------------------------------------------------------> robWalkingToNorth
			this.robWalkingToNorth = function(rIndex) {
				robWalking(rIndex, _rob[rIndex].Location.Row - 1, _rob[rIndex].Location.Column);
			}

			//--------------------------------------------------------------------------------------> robWalkingNorth
			this.robWalkingToEast = function(rIndex) {
				robWalking(rIndex, _rob[rIndex].Location.Row, _rob[rIndex].Location.Column + 1);
			}

			//--------------------------------------------------------------------------------------> robWalkingSouth
			this.robWalkingToWest = function(rIndex) {
				robWalking(rIndex, _rob[rIndex].Location.Row, _rob[rIndex].Location.Column - 1);
			}

			//--------------------------------------------------------------------------------------> robGetLocation
			this.robGetLocation = function(rIndex) {

				if (Tileworld.Battery)
					if (_rob[rIndex].Location.Row == _bChargerLoc[0] && _rob[rIndex].Location.Column == _bChargerLoc[1]){
						_self.updateBattery(rIndex, 1000-_rob[rIndex].Battery);
						_graphicTileworld.batteryChargeAnimation(rIndex, false);
					}
			}


			//--------------------------------------------------------------------------------------> slideTiles
			this.slideTiles = function(rIndex, theCase) {
				var farthestTile, closestTile;
				var xSlide = theCase==_ACTION.SOUTH? 1 : (theCase==_ACTION.NORTH? -1 : 0);
				var ySlide = theCase==_ACTION.EAST? 1 : (theCase==_ACTION.WEST? -1 : 0);

				_rob[rIndex].ListOfTilesToSlide.removeAll(); // al terminar de moverse

				switch(theCase){
					case _ACTION.NORTH: //slide to the North
					case _ACTION.SOUTH: //slide to the South
						for(var iRow = _rob[rIndex].Location.Row + xSlide;
							this.isATile(iRow, _rob[rIndex].Location.Column) && !this.isASlidingTile(rIndex, iRow, _rob[rIndex].Location.Column);
							iRow+=xSlide
							)
								_rob[rIndex].ListOfTilesToSlide.appendUnique([iRow, _rob[rIndex].Location.Column]);
						break;
					case _ACTION.EAST: //slide to the East
					case _ACTION.WEST: //slide to the West
						for(var iColumn = _rob[rIndex].Location.Column + ySlide;
							this.isATile(_rob[rIndex].Location.Row, iColumn) && !this.isASlidingTile(rIndex, _rob[rIndex].Location.Row, iColumn);
							iColumn+=ySlide
							)
								_rob[rIndex].ListOfTilesToSlide.appendUnique([_rob[rIndex].Location.Row, iColumn]);
				}

				if (_rob[rIndex].ListOfTilesToSlide.empty())
					return false;

				farthestTile= _rob[rIndex].ListOfTilesToSlide.getItemAt(_rob[rIndex].ListOfTilesToSlide.getLength()-1);

				if (!this.isAValidMovement(rIndex, farthestTile[0]+xSlide, farthestTile[1]+ySlide) && !this.isAHole(farthestTile[0]+xSlide, farthestTile[1]+ySlide)){
					_rob[rIndex].ListOfTilesToSlide.removeAll();
					return false;
				}

				farthestTile = [farthestTile[0]+xSlide, farthestTile[1]+ySlide];
				_rob[rIndex].ListOfTilesToSlide.appendUnique(farthestTile);

				if (this.isAHole(farthestTile[0], farthestTile[1])){

					_grid[farthestTile[0]][farthestTile[1]] = _GRID_CELL.EMPTY;

					_listOfEmptyCells.appendUnique([farthestTile[0], farthestTile[1]]);

					_rob[rIndex].HoleBeingFilled = _listOfHoles.removeHoleCell([farthestTile[0], farthestTile[1]]);

					if (_rob[rIndex].HoleBeingFilled.isFilled()){

						_updateScore(rIndex, _rob[rIndex].HoleBeingFilled.Value, _rob[rIndex].HoleBeingFilled.OriginalCells, true);
						removeHoleHelpers(_rob[rIndex].HoleBeingFilled);

					}else
						_updateScore(rIndex, Tileworld.valueOfCellHoleFilled(_rob[rIndex].HoleBeingFilled.getNumberOfCellsFilled()), _rob[rIndex].HoleBeingFilled.getCellsFilled(), false);

					_rob[rIndex].CellFilling[0]= farthestTile[0];
					_rob[rIndex].CellFilling[1]= farthestTile[1];
					_rob[rIndex].HoleToFill = true;

				}else{

					_grid[farthestTile[0]][farthestTile[1]] = _GRID_CELL.TILE;
					_listOfEmptyCells.remove(farthestTile[0], farthestTile[1]);

					_rob[rIndex].HoleToFill = false;
				}

				closestTile = _rob[rIndex].ListOfTilesToSlide.getItemAt(0);

				if (Tileworld.Battery && (closestTile[0] == _bChargerLoc[0] && closestTile[1] == _bChargerLoc[1]) )
					_grid[closestTile[0]][closestTile[1]] = _GRID_CELL.BATTERY_CHARGER;
				else{
					_grid[closestTile[0]][closestTile[1]] = _GRID_CELL.EMPTY;
					_listOfEmptyCells.appendUnique([closestTile[0], closestTile[1]]);
				}
				_rob[rIndex].ListOfTilesToSlide.removeItemAt(0);

				_self.updateBattery(rIndex, -_BATTERY_SLIDE_COST);
				return true;
			}

			//returns the list of empty cells adjacent to <cell>
			this.successorsEmptyCells = function(cell){
				successors = new Array();

				if (cell[0]+1 < this.getGridDimension().Rows && this.isAnEmptyCell(cell[0]+1, cell[1]))
					successors.push([cell[0]+1, cell[1]]);

				if (cell[1]-1 >= 0 && this.isAnEmptyCell(cell[0], cell[1]-1))
					successors.push([cell[0], cell[1]-1]);

				if (cell[0]-1 >= 0 && this.isAnEmptyCell(cell[0]-1, cell[1]))
					successors.push([cell[0]-1, cell[1]]);

				if (cell[1]+1 < this.getGridDimension().Columns && this.isAnEmptyCell(cell[0], cell[1]+1))
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

				if (Tileworld.Percept || _percept.header == _PERCEPT_HEADER.START){
					_percept.header = null;

					//1) creating the environment...
					if (!this.environment){
						this.environment = {
							Grid : _grid,
							/*Time : _self.Time,
							Score : _self.Score,
							Battery : _battery,*/
							BatterCharger : _bChargerLoc,
							RobLocation : _rob[0].Location,
							ListOfHoles : [],
							ListOfObstacles :[],
							Costs : _self.Costs
						}
					}

					//2) preparing the environment object before sending it to the perception function
					this.environment.Time = _self.Time;
					this.environment.Score = _rob[0].Score;
					this.environment.Battery = _rob[0].Battery;

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

						//this.environment.ListOfObstacles[i].id = iObs.Id; //<-- esto deberia ser opcional, segun quiera el usuario implementar un mecanismo para "reconocer" un objeto en el ambiente o no
						this.environment.ListOfObstacles[i].row = iObs.Cell[0];
						this.environment.ListOfObstacles[i].column = iObs.Cell[1];

						if (Tileworld.Dynamic){
							this.environment.ListOfObstacles[i].time_elapsed = iObs.getTimeElapsed();

							if (Tileworld.ShowTimeLeft)
								this.environment.ListOfObstacles[i].lifetime_left = iObs.getTimeRemaindingToTimeout();
						}
					}

					//3) start running the thread whose job is to create the perception -e.i. perceptionFunction(environment)
					_perceptionFunction.postMessage( this.environment );
				}
			}

			//used to receive the Rob's Program Agent action
			//-----------------------------------------------------------------------------------------> _programAgentActionReceived
			function _programAgentActionReceived(action) {
				var matchs, noMoves = false;

				action = action.data;

				if (_Running){
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
					//case _ACTION.NONE
					if ( _ACTION_REGEX.NONE.test(action) )
						_programAgentPerceive();
					else
						noMoves = true;
				}
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
				//case INVALID ACTION
				else{
					_percept.header = _PERCEPT_HEADER.ERROR;
					if (noMoves){
						_percept.data = "'invalid action " + JSON.stringify(action) + " was received'";
						_sendToProgramAgent( _percept );
					}else
						if (!_Running){
							_percept.data = "'Tileworld haven't started, this action is not allowed yet. (allowed actions: <MESSAGE>,<ERROR> and <CLEAR>)'";
							_sendToProgramAgent( _percept );
						}
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
			function _updateScore(rIndex, utility, cells, filled) {
				_rob[rIndex].Score+= utility;

				_graphicTileworld.updateScore(rIndex, _rob[rIndex].Score, cells, filled, utility);
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
					//if Tile were on top of the battery charger
					if (_bChargerLoc[0] == tileCell[0] && _bChargerLoc[1] == tileCell[1])
						_grid[tileCell[0]][tileCell[1]] = _GRID_CELL.BATTERY_CHARGER;
					else{
						_grid[tileCell[0]][tileCell[1]] = _GRID_CELL.EMPTY;
						_listOfEmptyCells.appendUnique(tileCell);
					}

					for (var t= _rob.length-1; t >= 0; --t)
						if (_rob[t].ListOfTilesToSlide.remove(tileCell[0], tileCell[1]))
							break;

					_graphicTileworld.removeTile(tileCell, true);
				}
			}

			//--------------------------------------------------------------------------------------> getRandomTile
			function getRandomTile() {
				var listOfTiles = new ListOfPairs((_grid.length*_grid[0].length)/2);

				for (var irow= 0; irow < _grid.length; irow++)
					for (var icolumn= 0; icolumn < _grid[0].length; icolumn++){
						if (_grid[irow][icolumn] == _GRID_CELL.TILE && !_self.isThereAHoleFilling(irow, icolumn))
							listOfTiles.appendUnique([irow, icolumn]);
				}

				if (listOfTiles.empty())
					return null;
				else
					return listOfTiles.getItemAt(parseInt(random(0, listOfTiles.getLength())));
			}

			//--------------------------------------------------------------------------------------> robWalking
			function robWalking(rIndex, row, column) {

				if (Tileworld.Battery && (_rob[rIndex].Location.Row == _bChargerLoc[0] && _rob[rIndex].Location.Column == _bChargerLoc[1]) ){
					_grid[_rob[rIndex].Location.Row][_rob[rIndex].Location.Column] = _GRID_CELL.BATTERY_CHARGER;
					_graphicTileworld.batteryChargeAnimation(rIndex, true);
				}else{
					_grid[_rob[rIndex].Location.Row][_rob[rIndex].Location.Column] = _GRID_CELL.EMPTY;
					_listOfEmptyCells.appendUnique([_rob[rIndex].Location.Row, _rob[rIndex].Location.Column]);
				}

				_rob[rIndex].Location.Row = row;
				_rob[rIndex].Location.Column = column;

				_grid[_rob[rIndex].Location.Row ][_rob[rIndex].Location.Column] = _GRID_CELL.AGENT;
				_listOfEmptyCells.remove(_rob[rIndex].Location.Row, _rob[rIndex].Location.Column);

				_self.updateBattery(rIndex, -_BATTERY_WALK_COST);
			}

			//--------------------------------------------------------------------------------------> validCoordinates
			function validCoordinates(rowIndex,columnIndex) {
				return (0 <= rowIndex && rowIndex < _grid.length)&&(0 <= columnIndex && columnIndex < _grid[0].length);
			}
		//end region Private
	//end region Methods
	//
	//region Class Constructor Logic

		for (var irob= 0; irob < _NUMBER_OF_ROBS; ++irob){
			_rob[irob] = {};
			_rob[irob].Location = {Row: -1, Column: -1};
			_rob[irob].ListOfTilesToSlide = new ListOfPairs(Math.max(rows,columns));
			_rob[irob].CellFilling = [-1,-1];
			_rob[irob].HoleBeingFilled = null;
			_rob[irob].HoleToFill= false;
			_rob[irob].Score = 0;
			_rob[irob].Battery = _BATTERY_TOTAL_CHARGE;
		}

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
function Hole(environment, holeCells, holeLifetime, actualVariabilityOfUtility) {
	Hole.Counter = (Hole.Counter)? Hole.Counter+1 : 1;
	var _currentLifeTime = 0;
	var _lifeTime = holeLifetime; // time remaining to timeout (seconds)
	var _variabilityOfUtility = actualVariabilityOfUtility;

	this.Id = Hole.Counter;
	this.OriginalCells = new Array(holeCells.getLength()); //array
	this.CurrentCells = holeCells; // (ListOfPairs) cells that aren't filled yet
	this.Size = holeCells.getLength();
	this.Environment = environment;
	this.Value = Tileworld.valueOfHoleFilledCompletely(this.Size)*_variabilityOfUtility | 0;

	for(var i=0; i < holeCells.getLength(); i++) {
		this.OriginalCells[i] = holeCells.getInternalArray()[i];
	}

	//hey hole! a second has passed
	this.tickAndTest = function(){
		var i = this.CurrentCells.getLength();
		var cell;
		while (i--){
			cell = this.CurrentCells.getItemAt(i);
			if (this.Environment.isThereAHoleFilling(cell[0], cell[1]))
				return false;
		}

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
			if (!cCells.contains(oCells[i][0], oCells[i][1]))
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