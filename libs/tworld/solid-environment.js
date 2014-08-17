/*
* solid-environment.js - 
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

//Class  Environment
function Environment(rows, columns, graphicEngine, parent) {
	//region Attributes
		//private:
			var _grid				= newMatrix(rows, columns); // "Row-Major Order", rows are numbered by the first index and columns by the second index
			var _listOfHoles		= new ListOfHoles(rows*columns); // rows*columns is space-inefficient but it speed up some calculation (js engine don't use hashes)
			var _listOfObstacles	= new List(/*rows*columns*/);
			var _listOfEmptyCells	= new ListOfPairs(rows*columns);

			var _bChargerLoc; // Battery Charger Locations
			var _bChargerTimers;

			var _rob = new Array(_NUMBER_OF_AGENTS);

			var _self = this;
			var _graphicTWorld;

			var _percept = {header: null, data:""};
			if (_XML_NECESSARY)
				var _X2JS = new X2JS();

			var _time = 0;
		//public:
			this.AbstractLevel = parent;

			this.ListOfHoles = _listOfHoles;
			this.ListOfObstacles = _listOfObstacles;

			this.Costs = {};
			this.Costs.good_move = _ROB_WALK_TIME; // time it takes the agent to move (in "ticks")
			this.Costs.bad_move = 1000; // wasted time by the agent when it chooses and invalid action (1 "tick"--aprox. 1 second)
			this.Costs.filled_hole = 1000; // time the animation takes to fill a cell hole (1 "tick"--aprox. 1 second)
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
						emptyCell = emptyCellsNotSelectedYet.removeItemAt(random(0, emptyCellsNotSelectedYet.getLength())|0);
						//if what you just picked is a cell being filled, select another one
						if (this.isThereAHoleFilling(emptyCell[0], emptyCell[1]))
							return _self.getARandomEmptyCell();
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
					_graphicTWorld.toggleCamera();

				if ( !TWorld.Dynamic )
					_TILES_TELEPORT_DELAY= 0;

				if (_INITIAL_STATE){
					while (_INITIAL_STATE.tiles.length)
						_self.newTile(_INITIAL_STATE.tiles.shift());

					while (_INITIAL_STATE.obstacles.length)
						_self.newObstacle(_INITIAL_STATE.obstacles.shift());

					for (id in _INITIAL_STATE.holes)
						_self.newHole(
							_INITIAL_STATE.holes[id],
							uncertaintyMaker(TWorld.Dynamism, TWorld.Dynamism_UncertaintyThreshold),
							1-Math.random()*TWorld.VariabilityOfScores
						);
				}else{
					_self.AbstractLevel.createHoles();
					_self.AbstractLevel.createObstacles();
				}

				if ( TWorld.Dynamic || TWorld.Semidynamic )
					_holesAndObstaclesTick();

				if ( _AI_NECESSARY){
					//sending the 'start' percept message!
					_percept.header =_PERCEPT_HEADER.START;
					for (var irob= _NUMBER_OF_AGENTS; irob--;)
						if (_AGENTS[irob].CONTROLLED_BY_AI)
							_self.programAgentPerceive(irob);
				}
			}

			//--------------------------------------------------------------------------------------> togglePause
			this.togglePause = function() {
				if ( _AI_NECESSARY){
					//sending the 'pause' percept message!
					_percept.header =_PERCEPT_HEADER.PAUSE;
					_percept.data = _Paused? "on":"off";
					for (var irob= _NUMBER_OF_AGENTS; irob--;)
						if (_AGENTS[irob].CONTROLLED_BY_AI)
							_rob[irob].AgentProgram.send( _percept );
				}
			}

			//--------------------------------------------------------------------------------------> askForNextAction
			this.askForNextAction = function(rIndex) {
				if ( !_AGENTS[rIndex].PERCEPT.SYNC ){
					_percept.header = _PERCEPT_HEADER.READY_FOR_NEXT_ACTION;
					_percept.data = "null";
					_rob[rIndex].AgentProgram.send( _percept );
				}else
					_self.programAgentPerceive(rIndex, _PERCEPT_HEADER.READY_FOR_NEXT_ACTION);
			}

			//--------------------------------------------------------------------------------------> onLoadingCompleteCallback
			//(this function handles the event fired when the whole 3D scene is loaded, this event fires from the GraphicTWorld Class)
			this.onLoadingCompleteCallback = function() {
				var emptyCell;

				for (var pos, i = _rob.length; i--;){
					if (_AGENTS[i].START_POSITION){
						this.initializeRobAt(i, _AGENTS[i].START_POSITION.ROW, _AGENTS[i].START_POSITION.COLUMN);
						_listOfEmptyCells.remove(_AGENTS[i].START_POSITION.ROW, _AGENTS[i].START_POSITION.COLUMN);
					}else{
						pos = _listOfEmptyCells.removeItemAt( random(_listOfEmptyCells.getLength()) );

						if (!pos) pos = [0,0];

						this.initializeRobAt(i, pos[0], pos[1]);
					}
				}

				if (TWorld.Battery){
					for (var cell, length= _bChargerLoc.length, bc=0; bc < length; ++bc){
						if (!_BATTERY_START_POSITION[bc]){
							cell = _listOfEmptyCells.removeItemAt( random(_listOfEmptyCells.getLength()) );
							_bChargerLoc[bc] = {row:cell[0], column:cell[1]};
						}else{
							_bChargerLoc[bc] = {row:_BATTERY_START_POSITION[bc].ROW, column:_BATTERY_START_POSITION[bc].COLUMN};
							_listOfEmptyCells.remove( _bChargerLoc[bc].row, _bChargerLoc[bc].column );
						}

						_grid[ _bChargerLoc[bc].row ][ _bChargerLoc[bc].column ] = _GRID_CELL.BATTERY_CHARGER;
						_graphicTWorld.setBatteryChargerLocation(_bChargerLoc[bc].row, _bChargerLoc[bc].column);
					}
				}
			}

			//--------------------------------------------------------------------------------------> tick
			//(this functions is called each second (i.e every "tick") from the GraphicTWorld)
			this.tick = function() {
				if (_Running){
					var irob = _NUMBER_OF_AGENTS;
					var timeLimit = _ENDGAME.TIME.VALUE;

					if (TWorld.Dynamic){
						//if "it's the first time this function's called", then create the 'persistent' variables
						if (!this.holesSeconds){
							this.holesSeconds = uncertaintyMaker(TWorld.Dynamism, TWorld.Dynamism_UncertaintyThreshold) + _TILES_TELEPORT_DELAY;
							this.obstaclesSecons = uncertaintyMaker(TWorld.Hostility, TWorld.Hostility_UncertaintyThreshold);
						}

						if ((--this.holesSeconds) == 0){
							this.AbstractLevel.createHoles();
							this.holesSeconds = uncertaintyMaker(TWorld.Dynamism, TWorld.Dynamism_UncertaintyThreshold) + _TILES_TELEPORT_DELAY;
						}

						if ((--this.obstaclesSecons) == 0){
							this.AbstractLevel.createObstacles();
							this.obstaclesSecons = uncertaintyMaker(TWorld.Hostility, TWorld.Hostility_UncertaintyThreshold);
						}
					}

					if ( TWorld.Dynamic || TWorld.Semidynamic )
						_holesAndObstaclesTick();

					CallWithDelay.Tick();

					while(irob--) 
						if (_rob[irob].ScoreMultiplier.Timer > 0){
							_rob[irob].ScoreMultiplier.Timer--;
							if (_rob[irob].ScoreMultiplier.Timer == 0)
								_rob[irob].ScoreMultiplier.Value = 1;
							_graphicTWorld.setMultiplier(irob, _rob[irob].ScoreMultiplier);
						}

					_time++;
					if (timeLimit){
						if (_time >= timeLimit)
							_gameIsOver(_ENDGAME.TIME);
						_graphicTWorld.updateTime(timeLimit - _time, true);
					}else
						_graphicTWorld.updateTime(_time);
				}
			}

			//--------------------------------------------------------------------------------------> updateBattery
			this.updateBattery = function(rIndex, value, restored) {if (!TWorld.Battery) return;
				if (value < 0){
					_rob[rIndex].Stats.battery_used-= value;

					if (_ENDGAME.BATTERY_USED.VALUE)
						_checkIfGameOver(_ENDGAME.BATTERY_USED, _rob[rIndex].Stats.battery_used);
				}

				rIndex = _GET_TEAM_LEADER(rIndex);

				_rob[rIndex].Battery += value;

				if (_rob[rIndex].Battery < 0)
					_rob[rIndex].Battery = 0;

				_graphicTWorld.updateBattery(rIndex, _rob[rIndex].Battery, restored);
			}

			//--------------------------------------------------------------------------------------> updateScore
			this.updateScore = function(rIndex, value, cells, filled) {
				var lIndex = _GET_TEAM_LEADER(rIndex);
				var multr = _rob[lIndex].ScoreMultiplier;
				var strPoints = ((filled && multr.Value > 1)? multr.Value+"x" : "") + value;

				value = filled? value*multr.Value : value;
				//-> Stats
				if (value > 0)
					_rob[rIndex].Stats.total_score+= value;
				//<-

				//if the rob recharged after he went off!
				if (value === undefined)
					value = -_rob[lIndex].Score/2|0;

				_rob[lIndex].Score+= value;

				if (_rob[lIndex].Score < 0)
					_rob[lIndex].Score = 0;

				if (filled && _MULTIPLIER_TIME){
					multr.Value++;
					multr.Timer = _MULTIPLIER_TIME;
					_graphicTWorld.setMultiplier(lIndex, multr, true);
				}

				if (_ENDGAME.SCORE.VALUE)
					_checkIfGameOver(_ENDGAME.SCORE, _rob[lIndex].Score);

				_graphicTWorld.updateScore(rIndex, _rob[lIndex].Score, cells, filled, value, strPoints);
			}

			//--------------------------------------------------------------------------------------> updateStats
			this.updateStats = function(rIndex, type){
				switch(type){
					case 0:
						_rob[rIndex].Stats.battery_restore++;
						if (_ENDGAME.BATTERY_RESTORE.VALUE)
							_checkIfGameOver(_ENDGAME.BATTERY_RESTORE, _rob[rIndex].Stats.battery_restore);
						break;
					case 1:
						_rob[rIndex].Stats.bad_moves++;
						if (_ENDGAME.BAD_MOVES.VALUE)
							_checkIfGameOver(_ENDGAME.BAD_MOVES, _rob[rIndex].Stats.bad_moves);
						break;
				}
			}

			//--------------------------------------------------------------------------------------> isBatteryChargeSufficient
			this.checkIfAgentProgramsReady = function(){
				var nReady = 0, nTotal = 0;
				var msg_status = "Waiting for agent programs to connect (";
				var msg_ap_list = "";

				for (var irob= _NUMBER_OF_AGENTS; irob--;)
					if (_rob[irob].AgentProgram && _AGENTS[irob].SOCKET_PROGRAM_AGENT){
						nTotal++;
						if (_rob[irob].AgentProgram.Ready){
							nReady++;
							msg_ap_list+="	Agent "+irob+": '"+_AGENTS[irob].NAME+"' is READY!\n";
						}else
							msg_ap_list+="	Agent "+irob+": '"+_AGENTS[irob].NAME+"' is disconnected!\n";
					}

				_Ready = nReady === nTotal;

				msg_status += (nReady + "/" + nTotal + ")\n");

				if (nTotal){
					console.clear();
					console.log((_Ready? "All agent programs are ready =)\n" : msg_status) + msg_ap_list);
				}

				if (_Ready)
					$("#playFrame").show();
				else
					$("#playFrame").hide();
			}

			//--------------------------------------------------------------------------------------> isBatteryChargeSufficient
			this.isBatteryChargeSufficient = function(rIndex){
				var sufficient;
				rIndex = _GET_TEAM_LEADER(rIndex);

				sufficient = _rob[rIndex].Battery > 0;

				return sufficient;
			}

			//--------------------------------------------------------------------------------------> isABatteryCharger
			this.isABatteryCharger = function(row, column){
				for (var bc = _bChargerLoc.length; bc--;)
					if (_bChargerLoc[bc].row == row && _bChargerLoc[bc].column == column)
						return bc+1;
				return 0;
			}

			//--------------------------------------------------------------------------------------> isThereAHoleToFill
			this.isThereAHoleToFill = function(rIndex) {
				if (_rob[rIndex].HoleToFill) {
					_rob[rIndex].HoleToFill = false;
					return true;
				} else
					return false;
			}

			//--------------------------------------------------------------------------------------> isThereAHoleFilling
			this.isThereAHoleFilling = function(row /*or rIndex when column is null*/, column) {
				if (column == null)
					return _rob[row/*rIndex*/].CellFilling[0] != -1;
				else{
					for (var r= _rob.length; r--;)
						if (_rob[r].CellFilling[0] == row && _rob[r].CellFilling[1] == column)
							return true;
					return false;
				}
			}

			//--------------------------------------------------------------------------------------> isAnEmptyCell
			this.isASlidingTile = function(rIndex, row, column) {
				for (var rt = _rob.length; rt--;)
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

					_graphicTWorld.newTile(tileCell);
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

				_graphicTWorld.newHole(holeCells);
			}

			//--------------------------------------------------------------------------------------> newObstacle
			this.newObstacle = function(obstacleCell, lifeTime) {
				if (obstacleCell){
					_grid[obstacleCell[0]][obstacleCell[1]] = _GRID_CELL.OBSTACLE;
					_listOfEmptyCells.remove(obstacleCell[0], obstacleCell[1]);

					_listOfObstacles.append(new Obstacle(obstacleCell, lifeTime));

					_graphicTWorld.newObstacle(obstacleCell);
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

				_graphicTWorld.setRobLocation(robIndex, rowIndex, columnIndex);
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
				var bcIndex;
				if (TWorld.Battery){
					bcIndex = _self.isABatteryCharger(_rob[rIndex].Location.Row, _rob[rIndex].Location.Column);
					if (bcIndex){
						_rob[rIndex].Stats.battery_recharge++; 

						_self.updateBattery(rIndex, 1000-_rob[_GET_TEAM_LEADER(rIndex)].Battery, 1/*recharge flag*/);
						_graphicTWorld.batteryChargeAnimation(rIndex, bcIndex-1, false);

						_updateScoreBattery(rIndex, bcIndex-1, TWorld.valueOfHoleFilledCompletely(1));

						if (_ENDGAME.BATTERY_RECHARGE.VALUE)
							_checkIfGameOver(_ENDGAME.BATTERY_RECHARGE, _rob[rIndex].Stats.battery_recharge);
					}
				}

				if (_ENDGAME.AGENTS_LOCATION.VALUE){
					var i = 0;
					for (var robsids= _ENDGAME.AGENTS_LOCATION.VALUE; i < robsids.length; ++i)
						if (_rob[robsids[i]].Location.Row != _AGENTS[robsids[i]].FINAL_LOCATION.ROW ||
							_rob[robsids[i]].Location.Column != _AGENTS[robsids[i]].FINAL_LOCATION.COLUMN)
							break;

					if (i == robsids.length)
						_checkIfGameOver(_ENDGAME.AGENTS_LOCATION);
					else
					if (_ENDGAME.AGENTS_LOCATION.ACHIEVED){
						_ENDGAME.AGENTS_LOCATION.ACHIEVED = false;
						$("#"+_ENDGAME.AGENTS_LOCATION.$ID).prop("src", "imgs/goal.png");
					}
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
						_self.updateScore(rIndex, _rob[rIndex].HoleBeingFilled.Value, _rob[rIndex].HoleBeingFilled.OriginalCells, true);
						removeHoleHelpers(_rob[rIndex].HoleBeingFilled);
						_rob[rIndex].Stats.filled_holes++;
						if (_ENDGAME.FILLED_HOLES.VALUE)
							_checkIfGameOver(_ENDGAME.FILLED_HOLES, _rob[rIndex].Stats.filled_holes);

						_rob[rIndex].Stats.filled_cells++;
						if (_ENDGAME.FILLED_CELLS.VALUE)
							_checkIfGameOver(_ENDGAME.FILLED_CELLS, _rob[rIndex].Stats.filled_cells);
					}else{
						_self.updateScore(rIndex, TWorld.valueOfCellHoleFilled(_rob[rIndex].HoleBeingFilled.getNumberOfCellsFilled()), _rob[rIndex].HoleBeingFilled.getCellsFilled(), false);
						_rob[rIndex].Stats.filled_cells++;
						if (_ENDGAME.FILLED_CELLS.VALUE)
							_checkIfGameOver(_ENDGAME.FILLED_CELLS, _rob[rIndex].Stats.filled_cells);
					}

					_rob[rIndex].CellFilling[0]= farthestTile[0];
					_rob[rIndex].CellFilling[1]= farthestTile[1];
					_rob[rIndex].HoleToFill = true;

				}else{

					_grid[farthestTile[0]][farthestTile[1]] = _GRID_CELL.TILE;
					_listOfEmptyCells.remove(farthestTile[0], farthestTile[1]);

					_rob[rIndex].HoleToFill = false;
				}

				closestTile = _rob[rIndex].ListOfTilesToSlide.getItemAt(0);

				if (TWorld.Battery && _self.isABatteryCharger(closestTile[0], closestTile[1]))
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
			//Used to call Rob's Agent Program in order to get the next action to do
			//-----------------------------------------------------------------------------------------> _self.programAgentPerceive
			this.programAgentPerceive = function(rIndex, specialHeader){
				if (_Running && (TWorld.Percept || _percept.header == _PERCEPT_HEADER.START)){
					_percept.header = null;

					//1) creating the environment...
					if (!this.environment){
						this.environment = {
							Grid : _grid,
							/*Time : _time,
							Score : _self.Score,
							Battery : _battery,*/
							BatteryChargers : _bChargerLoc,
							RobID:-1,
							RobLocation : null,
							RobStats: _rob[rIndex].Stats,
							ListOfAgents : new Array(_NUMBER_OF_AGENTS),
							ListOfHoles : [],
							ListOfObstacles :[],
							Costs : _self.Costs
						}

						//-> List Of Agents
						for (var r= 0; r < _NUMBER_OF_AGENTS; ++r)
							this.environment.ListOfAgents[r] = {
								id: _rob[r].index,
								team_id: _GET_TEAM_INDEX_OF(_rob[r].index),
								location: {row: -1, column: -1}
							};
					}

					this.environment.PerceptHeader = specialHeader;

					//2) preparing the environment object before sending it to the perception function
					this.environment.Time = _time;
					this.environment.Score = _rob[_GET_TEAM_LEADER(rIndex)].Score;
					this.environment.Battery = _rob[_GET_TEAM_LEADER(rIndex)].Battery;
					this.environment.RobID = rIndex;
					this.environment.RobLocation = _rob[rIndex].Location;

					//-> List Of Agents
					for (var r= 0; r < _NUMBER_OF_AGENTS; ++r){
						//location
						this.environment.ListOfAgents[r].location.row = _rob[r].Location.Row;
						this.environment.ListOfAgents[r].location.column = _rob[r].Location.Column;

						//score
						this.environment.ListOfAgents[r].score = _rob[r].Score;
						//battery
						this.environment.ListOfAgents[r].battery = _rob[r].Battery;
					}

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

						if (TWorld.Dynamic){
							this.environment.ListOfHoles[i].time_elapsed = iHole.getTimeElapsed();

							if (TWorld.ShowTimeLeft)
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

						if (TWorld.Dynamic){
							this.environment.ListOfObstacles[i].time_elapsed = iObs.getTimeElapsed();

							if (TWorld.ShowTimeLeft)
								this.environment.ListOfObstacles[i].lifetime_left = iObs.getTimeRemaindingToTimeout();
						}
					}

					//3) start running the thread whose job is to create the perception -e.i. perceptionFunction(environment)
					_rob[rIndex].PerceptionFunction.postMessage( this.environment );
				}
			}

			//--------------------------------------------------------------------------------------> sendTeamMessage
			this.sendTeamMessage = function(team, data){
				for (var ipeer = team.length; ipeer--;)
					_self.sendPeerMessage(team[ipeer], data);
			}

			//--------------------------------------------------------------------------------------> sendPeerMessage
			this.sendPeerMessage = function(robId, data){
				_percept.header = _PERCEPT_HEADER.MESSAGE;
				_percept.data = data;

				if (_rob[robId].AgentProgram)
					_rob[robId].AgentProgram.send( _percept );
			}

			//--------------------------------------------------------------------------------------> _saveStats
			function _saveStats(){if (_SAVE_STATS){
				var trials,
					trialsPath = _KNOBS.date+"/trials",
					trial={
						date: Date.now(),
						//task_env_id: _KNOBS.date,
						speed: _KNOBS.trial.speed,
						pause: _KNOBS.trial.pause,
						stats:{
							total_holes: Hole.Counter
						},
						agents: new Array(_NUMBER_OF_AGENTS)
					}

				for (var i=0; i < _NUMBER_OF_AGENTS; ++i)
					trial.agents[i] = {
						program_id: _KNOBS_Agents[i].program.date,
						team: _KNOBS_Agents[i].team,
						socre: _rob[i].Score,
						stats: _rob[i].Stats
					};

				trials = localStorage[trialsPath]? JSON.parse(localStorage[trialsPath]) : [];

				trials.push(trial);

				localStorage[trialsPath] = JSON.stringify(trials);
			}}

			//--------------------------------------------------------------------------------------> _checkIfGameOver
			function _checkIfGameOver(goal, value){
				if ((!goal.ACHIEVED && value >= goal.VALUE) || value == undefined){
					goal.ACHIEVED = true;
					$("#"+goal.$ID).prop("src", "imgs/goal-accomp.png");

					if (goal.RESULT == _GAME_RESULT.WON)
						for (PROP in _ENDGAME) //are all the condition satisfied?
							if (_ENDGAME[PROP].VALUE && _ENDGAME[PROP].RESULT == goal.RESULT && !_ENDGAME[PROP].ACHIEVED)
								return;

					_gameIsOver(goal);
				}else
					if (goal.ACHIEVED && value < goal.VALUE) {
						goal.ACHIEVED = false;
						$("#"+goal.$ID).prop("src", "imgs/goal.png");
					}
			}

			//--------------------------------------------------------------------------------------> _gameIsOver
			function _gameIsOver(goal) {
				var r = _NUMBER_OF_AGENTS;

				if (_Running){
					_Running = false;

					while (r--)
						if (_AGENTS[r].CONTROLLED_BY_AI){
							_percept.header = _PERCEPT_HEADER.END;
							_percept.data = goal.RESULT;
							_rob[r].AgentProgram.send( _percept );
						}

					_saveStats();
					_graphicTWorld.gameIsOver(_rob, goal, _time);
				}
			}

			//--------------------------------------------------------------------------------------> _holesAndObstaclesTick
			function _holesAndObstaclesTick() {
				var cellRemoved;
				for (var hole, i= _listOfHoles.getLength(); i--;){
					hole = _listOfHoles.getItemAt(i);

					if (hole.tickAndTest())
						if (TWorld.Dynamic){
							if (TWorld.HardBounds)
								_removeHole(i);
							else{
								cellRemoved = hole.CurrentCells.getItemAt(random(0,hole.CurrentCells.getLength())|0);

								removeHoleCell(cellRemoved, true);
								removeHoleHelper(cellRemoved);

								if (hole)
									hole.shrinkHole(cellRemoved);
							}
						}else//if semidynamic
							hole.shrinkScore();
				}

				if (TWorld.Dynamic)
					for (var obstacle, i= _listOfObstacles.getLength(); i--;){
						obstacle = _listOfObstacles.getItemAt(i);

						if (obstacle.tickAndTest())
							_removeObstacle(i);
					}
			}

			//--------------------------------------------------------------------------------------> _updateScoreBattery
			function _updateScoreBattery(rIndex, bcIndex, points, calledByTimer){
				_self.updateScore(rIndex, -points);

				if (calledByTimer)
					_graphicTWorld.batteryChargeAnimation(rIndex, bcIndex, false, true);

				_bChargerTimers[bcIndex] = CallWithDelay.Enqueue(_updateScoreBattery, [rIndex, bcIndex, points, true], 10);
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

				_graphicTWorld.removeObstacle(obstacle.Cell);
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

				_graphicTWorld.removeHoleCell(holeCell, isTeleported);

				//TODO: o asi removeATile(); pero con animacion de teletransp las tiles a los huecos (RESPETA MEJOR LOS TIEMPOS DEL PAPER) PROBAR CON SACAR SOLO LOS RAYOS DEL ALIEN A VER COMO QUEDA
				CallWithDelay.Enqueue(removeATile, null, 1 /*time in seconds*/);
			}

			function removeHoleHelper(holeCell) {
				_graphicTWorld.removeHoleHelper(holeCell);
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
					if (_self.isABatteryCharger(tileCell[0], tileCell[1]))
						_grid[tileCell[0]][tileCell[1]] = _GRID_CELL.BATTERY_CHARGER;
					else{
						_grid[tileCell[0]][tileCell[1]] = _GRID_CELL.EMPTY;
						_listOfEmptyCells.appendUnique(tileCell);
					}

					for (var t= _rob.length; t--;)
						if (_rob[t].ListOfTilesToSlide.remove(tileCell[0], tileCell[1]))
							break;

					_graphicTWorld.removeTile(tileCell, true);
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
				var bcIndex;
				if (TWorld.Battery)
					bcIndex = _self.isABatteryCharger(_rob[rIndex].Location.Row, _rob[rIndex].Location.Column);

				if (TWorld.Battery && bcIndex){
					_grid[_rob[rIndex].Location.Row][_rob[rIndex].Location.Column] = _GRID_CELL.BATTERY_CHARGER;
					_graphicTWorld.batteryChargeAnimation(rIndex, bcIndex-1, true);
					_bChargerTimers[bcIndex-1][0]= null;
				}else{
					_grid[_rob[rIndex].Location.Row][_rob[rIndex].Location.Column] = _GRID_CELL.EMPTY;
					_listOfEmptyCells.appendUnique([_rob[rIndex].Location.Row, _rob[rIndex].Location.Column]);
				}

				_rob[rIndex].Location.Row = row;
				_rob[rIndex].Location.Column = column;
				_rob[rIndex].Stats.good_moves++;

				if (_ENDGAME.GOOD_MOVES.VALUE)
					_checkIfGameOver(_ENDGAME.GOOD_MOVES, _rob[rIndex].Stats.good_moves);

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
		_graphicTWorld = new GraphicTWorld(graphicEngine, this);

		for (var irob= 0; irob < _NUMBER_OF_AGENTS; ++irob){
			_rob[irob] = {index: irob};
			_rob[irob].Location = {Row: -1, Column: -1};
			_rob[irob].ListOfTilesToSlide = new ListOfPairs(Math.max(rows,columns));
			_rob[irob].CellFilling = [-1,-1];
			_rob[irob].HoleBeingFilled = null;
			_rob[irob].HoleToFill= false;
			_rob[irob].Score = 0;
			_rob[irob].ScoreMultiplier = {Value: 1, Timer: 0};
			_rob[irob].Battery = _BATTERY_INITIAL_CHARGE;
			_rob[irob].Stats = {
								//Note: since Stats are exported as part of the perception,
								//      if you change some values or add/remove new ones
								//      remember to change the tw_msg.xsd too
								good_moves: 0,
								bad_moves: 0,
								filled_cells: 0,
								filled_holes: 0,
								battery_used: 0,
								battery_recharge: 0,
								battery_restore: 0,
								total_score: 0
							};

			if (_AGENTS[irob].CONTROLLED_BY_AI || _AGENTS[irob].SOCKET_PROGRAM_AGENT){
				_rob[irob].AgentProgram = new AgentProgram(
					irob,
					_X2JS,
					_AGENTS[irob].SOCKET_PROGRAM_AGENT,
					"./libs/tworld/solid-agent.js",
					this,
					_graphicTWorld
				);
				_rob[irob].PerceptionFunction = new Worker("./libs/tworld/solid-perception.js");
				_rob[irob].PerceptionFunction.onmessage = _rob[irob].AgentProgram.send;
				_rob[irob].PerceptionFunction.postMessage({
					CFG_CONSTANTS:{
						_ROWS						: _ROWS,
						_COLUMNS					: _COLUMNS,
						_NUMBER_OF_AGENTS			: _NUMBER_OF_AGENTS,
						_AGENTS						: _AGENTS,
						_BATTERY_INVALID_MOVE_COST	: _BATTERY_INVALID_MOVE_COST,
						_BATTERY_WALK_COST			: _BATTERY_WALK_COST,
						_BATTERY_SLIDE_COST			: _BATTERY_SLIDE_COST,
						_TEAMS						: _TEAMS,
						_ENDGAME					: _ENDGAME,
						_SCORE_HOLE_MULTIPLIER		: _SCORE_HOLE_MULTIPLIER,
						_XML_NECESSARY				: _XML_NECESSARY,
						_JSON_NECESSARY				: _JSON_NECESSARY,
						TWorld:{
							FullyObservableGrid		: TWorld.FullyObservableGrid,
							VisibilityRadius		: TWorld.VisibilityRadius,
							Battery					: TWorld.Battery,
							Dynamic					: TWorld.Dynamic,
							Semidynamic				: TWorld.Semidynamic,
							HolesNoisyPerception	: TWorld.HolesNoisyPerception,
							ObstaclesNoisyPerception: TWorld.ObstaclesNoisyPerception,
							TilesNoisyPerception	: TWorld.TilesNoisyPerception
						}
					}
				})
			}
		}// for

		this.checkIfAgentProgramsReady();

		var maxTeamPlayers = 0;
		for (var iteam=_TEAMS.length; iteam--;)
			if (_TEAMS[iteam].MEMBERS.length > maxTeamPlayers)
				maxTeamPlayers = _TEAMS[iteam].MEMBERS.length;

		_bChargerLoc = new Array(TWorld.Battery? maxTeamPlayers : 0);
		_bChargerTimers = new Array(TWorld.Battery? maxTeamPlayers : 0);

		//-> Grid Initialization
		for (var irow= 0; irow < _grid.length; irow++)
			for (var icolumn= 0; icolumn < _grid[0].length; icolumn++){
				_grid[irow][icolumn] = _GRID_CELL.EMPTY;
				_listOfEmptyCells.appendUnique([irow, icolumn]);
			}
	//end region Class Constructor Logic
}

//--> Internal Classes
//Class AgentProgram
function AgentProgram(rIndex, _X2JS, isSocket, src, _env, _gtw){
	//private atributes
	var _address;
	var _agentProgram = isSocket?
							new WebSocket("ws://"+(_address = _AGENTS[rIndex].SOCKET_PROGRAM_AGENT.ADDR+":"+_AGENTS[rIndex].SOCKET_PROGRAM_AGENT.PORT)):
							new Worker(src);
	var _index = rIndex;
	var _myTeamMembers = _GET_TEAM_OF(rIndex);
	var _percept = {header: null, data:""};
	var _self = this;

	//public Methods
	this.Ready = !isSocket;

	//send to Program Agent
	this.send = function( percept ) {
		//if percept come from the perception function/thread (in which case percept is ready to be sent)

		if (!percept.header)
			percept = percept.data;

		// once the percept was created by the perception function (thread that runs the solid-perception.js)
		// send the percept to the Rob's mind (i.e the Program Agent)
		if (!_AGENTS[_index].SOCKET_PROGRAM_AGENT)
			_agentProgram.postMessage( percept );
		else{

			if (percept.header)
			switch(_AGENTS[_index].SOCKET_PROGRAM_AGENT.OUTPUT_FORMAT){
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

			_agentProgram.send( percept );
		}
	}

	//private methods

	//is this agent program "ready" (connected)?
	function _setReady(value){
		_self.Ready = value;
		if (!_Running)
			_env.checkIfAgentProgramsReady();
	}

	//used to receive the Rob's Program Agent action
	function _agentProgramActionReceived(action) {
		var matchs, noMoves = false;

		action = action.data;

		if (_Running){
			//case _ACTION.SOUTH
			if ( _ACTION_REGEX.SOUTH.test(action) )
				_gtw.RobWalkSouth(_index);
			else
			//case _ACTION.NORTH
			if ( _ACTION_REGEX.NORTH.test(action) )
				_gtw.RobWalkNorth(_index);
			else
			//case _ACTION.EAST
			if ( _ACTION_REGEX.EAST.test(action) )
				_gtw.RobWalkEast(_index);
			else
			//case _ACTION.WEST
			if ( _ACTION_REGEX.WEST.test(action) )
				_gtw.RobWalkWest(_index);
			else
			//case _ACTION.NONE
			if ( _ACTION_REGEX.NONE.test(action) )
				_env.programAgentPerceive(_index);
			else
			//case _ACTION.RESTORE
			if ( _ACTION_REGEX.RESTORE.test(action) ){
				_gtw.restoreBattery(_index);
				_env.programAgentPerceive(_index);
			}else
				noMoves = true;
		}
		//case _ACTION.PEER_MESSAGE
		if ( _ACTION_REGEX.PEER_MESSAGE.test(action) )
			{matchs = action.match(_ACTION_REGEX.PEER_MESSAGE);
			var peerId = (matchs[3]||matchs[5]);
			if (_myTeamMembers.contains(peerId))
				_env.sendPeerMessage(peerId, (matchs[4]||matchs[6]))}
		else
		//case _ACTION.TEAM_MESSAGE
		if ( _ACTION_REGEX.TEAM_MESSAGE.test(action) )
			{matchs = action.match(_ACTION_REGEX.TEAM_MESSAGE);
			_env.sendTeamMessage(_myTeamMembers, matchs[3] || matchs[4])}
		else
		//case _ACTION.CONSOLE_CLEAR
		if ( _ACTION_REGEX.CONSOLE_CLEAR.test(action) )
			console.clear();
		else
		//case _ACTION.CONSOLE_ERROR
		if ( _ACTION_REGEX.CONSOLE_ERROR.test(action) )
			{matchs = action.match(_ACTION_REGEX.CONSOLE_ERROR);
			console.error(
				(_NUMBER_OF_AGENTS > 1? "agent "+_index : "") +
				"(" + _AGENTS[rIndex].NAME + "): " +
				(matchs[3] || matchs[4])
			)}
		else
		//case _ACTION.CONSOLE_LOG
		if ( _ACTION_REGEX.CONSOLE_LOG.test(action) )
			{matchs = action.match(_ACTION_REGEX.CONSOLE_LOG);
			console.log(
				(_NUMBER_OF_AGENTS > 1? "agent "+_index : "") +
				"("+ _AGENTS[rIndex].NAME + "): " +
				(matchs[3] || matchs[4])
			)}
		else
		//case _ACTION.KEY_UP
		if ( _ACTION_REGEX.KEY_UP.test(action) )
			{matchs = action.match(_ACTION_REGEX.KEY_UP);
			_gtw.keyUp(_index, (matchs[3]||matchs[4]).toUpperCase())}
		else
		//case _ACTION.KEY_DOWN
		if ( _ACTION_REGEX.KEY_DOWN.test(action) )
			{matchs = action.match(_ACTION_REGEX.KEY_DOWN);
			_gtw.keyDown(_index, (matchs[3]||matchs[4]).toUpperCase())}
		else
		//case _ACTION._CONNECTED_
		if ( _ACTION_REGEX._CONNECTED_.test(action) )
			_setReady(true);
		else
		//case _ACTION._DISCONNECTED_
		if ( _ACTION_REGEX._DISCONNECTED_.test(action) ){
			_setReady(false);
			if (_Running)
				console.error((_NUMBER_OF_AGENTS > 1? "agent "+_index : "") +
					"(" + _AGENTS[rIndex].NAME + "): Program Agent was closed by the other side"
				)}
		//case INVALID ACTION
		else{
			_percept.header = _PERCEPT_HEADER.ERROR;
			if (noMoves){
				_percept.data = "'invalid action " + JSON.stringify(action) + " was received'";
				_self.send( _percept );
			}else
				if (!_Running){
					_percept.data = "'TWorld have not started, this action is not allowed yet. (allowed actions: <CONSOLE_LOG>,<ERROR> and <CLEAR>)'";
					_self.send( _percept );
				}
		}
	}

	/* constructor logic */

	if (!isSocket){
		_percept.header = _PERCEPT_HEADER.INTERNAL;
		_percept.data = {
			ai_src: _AGENTS[rIndex].AI_SOURCE_CODE,
			msg_src: _AGENTS[rIndex].TEAM_MSG_SOURCE_CODE,
			start_src: _AGENTS[rIndex].START_SOURCE_CODE,
			global_src:_AGENTS[rIndex].GLOBAL_SOURCE_CODE
		}
		_agentProgram.postMessage( _percept );
	}

	_agentProgram.onmessage = _agentProgramActionReceived;

	_agentProgram.onopen = function(){_agentProgram.send("CONNECT:"+_AGENTS[rIndex].SOCKET_PROGRAM_AGENT.MAGIC_STRING)}

	_agentProgram.onerror = function(event){
		if (isSocket)
			console.error(
				(_NUMBER_OF_AGENTS > 1? "agent "+_index+": " : "")+"An error occurred while trying to connect to the T-World Proxy ("+_address+")"
			);
		_setReady(false);
	}

	_agentProgram.onclose = function(event) {
		console.error((_NUMBER_OF_AGENTS > 1? "agent "+_index+": " : "")+"connection was closed with code: " + event.code + "\n(can't connect to the T-World Proxy)");
		_setReady(false);
	}
}

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
	this.Value = TWorld.valueOfHoleFilledCompletely(this.Size)*_variabilityOfUtility | 0;

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

	this.shrinkHole = function(cell, noLifetime) {
		for (var i = 0; i < this.OriginalCells.length; i++)
			if (this.OriginalCells[i][0] == cell[0] && this.OriginalCells[i][1] == cell[1]) {
				this.Size--;
				this.OriginalCells.remove(i);

				this.Value = TWorld.valueOfHoleFilledCompletely(this.Size)*_variabilityOfUtility | 0;

				if (!noLifetime)
					_lifeTime = uncertaintyMaker(TWorld.Dynamism, TWorld.Dynamism_UncertaintyThreshold);
			}
	}

	this.shrinkScore = function(){
		this.Value = this.Value/2|0;
		_lifeTime = uncertaintyMaker(TWorld.Dynamism, TWorld.Dynamism_UncertaintyThreshold);
	}
}
//<-- Internal Classes