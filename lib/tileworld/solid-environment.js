/**
*solid-environment.js
*<p>
*(description here)
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

//Class  Environment
function Environment(rows, columns, graphicEngine, parent) {
	//region Attributes
		//private:
			var _grid = newMatrix(rows, columns);// "Row-Major Order", rows are numbered by the first index and columns by the second index
			var _listOfHoles = new ListOfHoles(rows*columns); // rows*columns is space-inefficient but it speed up some calculation (js engine don't use hashes)
			var _listOfEmptyCells = new ListOfPairs(rows*columns);
			var _listOfTilesToSlide = new ListOfPairs(rows*columns);
			var _listOfObstacles = new List(/*rows*columns*/);

			var _holeFilling = [-1,-1];
			var _holeToFill= false;

			var _robLocation = {Row: -1, Column: -1};
			var _robTargetLocation = {Row: -1, Column: -1};

			var _graphicTileworld;
			var _self = this;
		//public:
			this.RobLocation = _robLocation;

			this.AbstractLevel = parent;

			this.Grid = _grid;
			this.ListOfHoles = _listOfHoles;
			this.Score = 0;
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

				this.getHoleToFill = function() { return _holeFilling; }

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

			//--------------------------------------------------------------------------------------> onLoadingCompleteCallback
			//(this function handles the event fired when the whole 3D scene is loaded, this event fires from the GraphicTileworld Class)
			this.onLoadingCompleteCallback = function() {
				this.initializeRobAt(_ROB_START_POSITION.ROW, _ROB_START_POSITION.COLUMN);

				this.AbstractLevel.createHoles();
				this.AbstractLevel.createObstacles();

				_holesAndObstaclesTick();
			}

			//--------------------------------------------------------------------------------------> tick
			//(this functions is called each second (i.e every gTileworld.currentFPS frames) from the GraphicTileworld)
			this.tick = function() {
				//if "it's the first time this function's called", then...
				if (!this.holesSeconds){
					this.holesSeconds = uncertaintyMaker(this.AbstractLevel.Dynamism, this.AbstractLevel.Dynamism_UncertaintyThreshold) + _TELEPORT_DELAY;
					this.obstaclesSecons = uncertaintyMaker(this.AbstractLevel.Hostility, this.AbstractLevel.Hostility_UncertaintyThreshold);
				}

				if ((--this.holesSeconds) == 0){
					this.AbstractLevel.createHoles();
					this.holesSeconds = uncertaintyMaker(this.AbstractLevel.Dynamism, this.AbstractLevel.Dynamism_UncertaintyThreshold) + _TELEPORT_DELAY;
				}

				if ((--this.obstaclesSecons) == 0){
					this.AbstractLevel.createObstacles();
					this.obstaclesSecons = uncertaintyMaker(this.AbstractLevel.Hostility, this.AbstractLevel.Hostility_UncertaintyThreshold);
				}

				CallWithDelay.Tick();

				_holesAndObstaclesTick();
			}

			//--------------------------------------------------------------------------------------> isThereAHoleToFill
			this.isThereAHoleToFill = function() {
				if (_holeToFill) {
					_holeToFill = false;
					return true;
				} else
					return false;
			}

			this.isThereAHoleFilling = function(rowIndex, columnIndex) {
				if (rowIndex == null)
					return _holeFilling[0] != -1;
				else
					return _holeFilling[0] == rowIndex && _holeFilling[1] == columnIndex;
			}

			//--------------------------------------------------------------------------------------> isItAnEmptyCell
			this.isItAnEmptyCell= function(rowIndex, columnIndex) {
				return validCoordinates(rowIndex,columnIndex)&&(_grid[rowIndex][columnIndex] == GRID_CELL.None);
			}

			//--------------------------------------------------------------------------------------> isItAHole
			this.isItAHole= function(rowIndex, columnIndex) {
				// is a valid coordinate and _grid[rowIndex][columnIndex] is a number
				return validCoordinates(rowIndex,columnIndex)&&(_grid[rowIndex][columnIndex] === (_grid[rowIndex][columnIndex]|0));
			}

			//--------------------------------------------------------------------------------------> isItATile
			this.isItATile= function(rowIndex, columnIndex) {
				return validCoordinates(rowIndex,columnIndex)&&(_grid[rowIndex][columnIndex] == GRID_CELL.Tile);
			}

			//--------------------------------------------------------------------------------------> isItAObstacle
			this.isItAObstacle= function(rowIndex, columnIndex) {
				return validCoordinates(rowIndex,columnIndex)&&(_grid[rowIndex][columnIndex] == GRID_CELL.Obstacle);
			}

			//--------------------------------------------------------------------------------------> newTile
			this.newTile = function(tileCell) {
				if (tileCell){
					_grid[tileCell[0]][tileCell[1]] = GRID_CELL.Tile;

					_listOfEmptyCells.remove(tileCell);

					_graphicTileworld.newTile(tileCell);
				}
			}

			//--------------------------------------------------------------------------------------> newHole
			this.newHole = function(holeCells, holeLifetime) {
				var newHole = new Hole(holeCells, holeLifetime, _holeFilling);

				_listOfHoles.shrinkHoles(holeCells);
				_listOfHoles.append(newHole);

				for(var i= 0; i < holeCells.getLength(); i++){
					_grid[holeCells.getItemAt(i)[0]][holeCells.getItemAt(i)[1]] = newHole.Id;
					_listOfEmptyCells.remove(holeCells.getItemAt(i));
				}

				_graphicTileworld.newHole(holeCells);
			}

			//--------------------------------------------------------------------------------------> newObstacle
			this.newObstacle = function(obstacleCell, lifeTime) {
				if (obstacleCell){
					_grid[obstacleCell[0]][obstacleCell[1]] = GRID_CELL.Obstacle;
					_listOfEmptyCells.remove(obstacleCell);

					_listOfObstacles.append(new Obstacle(obstacleCell, lifeTime));

					_graphicTileworld.newObstacle(obstacleCell);
				}
			}

			this.holeFilled = function() {
				_holeFilling[0] = _holeFilling[1] = -1;
			}

			//--------------------------------------------------------------------------------------> initializeRobAt
			this.initializeRobAt = function(rowIndex, columnIndex) {

				_grid[rowIndex][columnIndex] = GRID_CELL.Rob;
				_listOfEmptyCells.remove([rowIndex, columnIndex]);

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
				_grid[_robLocation.Row][_robLocation.Column] = GRID_CELL.None;

				_listOfEmptyCells.appendUnique([_robLocation.Row, _robLocation.Column]);

				_robLocation.Row = _robTargetLocation.Row;
				_robLocation.Column = _robTargetLocation.Column;
			}

			//--------------------------------------------------------------------------------------> slideTiles
			this.slideTiles = function(theCase) {
				var xSlide = 0, ySlide = 0;
				var farthestTile, closestTile;
				var hole;

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

					_grid[farthestTile[0]][farthestTile[1]] = GRID_CELL.None;

					_listOfEmptyCells.appendUnique([farthestTile[0], farthestTile[1]]);

					hole = _listOfHoles.removeHoleCell([farthestTile[0], farthestTile[1]]);

					if (hole.isFilled()){

						_updateScore(this.AbstractLevel.utilityFillHole(hole.Size), hole.OriginalCells, true);
						removeHoleHelpers(hole);

					}else
						_updateScore(this.AbstractLevel.utilityFillCell(hole.getNumberOfCellsFilled()), hole.getCellsFilled(), false);

					_holeFilling[0]= farthestTile[0]; _holeFilling[1]= farthestTile[1];
					_holeToFill = true;

				}else{

					_grid[farthestTile[0]][farthestTile[1]] = GRID_CELL.Tile;
					_listOfEmptyCells.remove([farthestTile[0], farthestTile[1]]);

					_holeToFill = false;
				}

				closestTile = _listOfTilesToSlide.getItemAt(0);

				_grid[closestTile[0]][closestTile[1]] = GRID_CELL.None;

				_listOfEmptyCells.appendUnique([closestTile[0], closestTile[1]]);
				_listOfTilesToSlide.removeItemAt(0);

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
			//--------------------------------------------------------------------------------------> _holesAndObstaclesTick
			function _holesAndObstaclesTick() {
				var cellRemoved;
				for (var hole, i= _listOfHoles.getLength()-1; i >= 0; i--){
					hole = _listOfHoles.getItemAt(i);

					if (hole.tickAndTest()){
						if (_self.AbstractLevel.HardBounds)
							_removeHole(i);
						else{
							cellRemoved = hole.CurrentCells.getItemAt(Math.floor(random(0,hole.CurrentCells.getLength())));

							removeHoleCell(cellRemoved, true);
							removeHoleHelper(cellRemoved);

							if (hole) {
								hole.shrinkHole(cellRemoved);
								hole.LifeTime = uncertaintyMaker(
									_self.AbstractLevel.Dynamism,
									_self.AbstractLevel.Dynamism_UncertaintyThreshold
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
				_self.Score+= utility*10;

				_graphicTileworld.updateScore(_self.Score, cells, filled, utility*10);
			}

			//--------------------------------------------------------------------------------------> _removeHole
			function _removeHole(listOfHoleCellsIndex) {
				var hole = _listOfHoles.getItemAt(listOfHoleCellsIndex);
				var currentHoleCells = hole.CurrentCells;
				var holeCells = hole.OriginalCells;

				for(var i= 0, holeCell; i < currentHoleCells.getLength(); i++){
					holeCell = currentHoleCells.getItemAt(i);
					if (_grid[holeCell[0]][holeCell[1]] != GRID_CELL.None){
						removeHoleCell(holeCell, true);
						i--;
					}
				}
			}

			//--------------------------------------------------------------------------------------> _removeObstacle
			function _removeObstacle(obstacleIndex) {
				var obstacle = _listOfObstacles.getItemAt(obstacleIndex);

				_grid[obstacle.Cell[0]][obstacle.Cell[1]] = GRID_CELL.None;

				_listOfEmptyCells.appendUnique(obstacle.Cell);
				_listOfObstacles.removeItemAt(obstacleIndex);

				_graphicTileworld.removeObstacle(obstacle.Cell);
			}

			//--------------------------------------------------------------------------------------> removeHoleCell
			function removeHoleCell(holeCell, isTeleported) {
				var hole;

				_grid[holeCell[0]][holeCell[1]] = GRID_CELL.None;

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
					_grid[tileCell[0]][tileCell[1]] = GRID_CELL.None;

					_listOfEmptyCells.appendUnique(tileCell);
					_listOfTilesToSlide.remove(tileCell);

					_graphicTileworld.removeTile(tileCell, true);
				}
			}

			//--------------------------------------------------------------------------------------> getRandomTile
			function getRandomTile() {
				var listOfTiles = new ListOfPairs((_grid.length*_grid[0].length)/2);

				for (var irow= 0; irow < _grid.length; irow++)
					for (var icolumn= 0; icolumn < _grid[0].length; icolumn++){
						if (_grid[irow][icolumn] == GRID_CELL.Tile && !(_holeFilling[0] == irow && _holeFilling[1] == icolumn))
							listOfTiles.appendUnique([irow, icolumn]);
				}

				if (listOfTiles.empty())
					return null;
				else
					return listOfTiles.getItemAt(parseInt(random(0, listOfTiles.getLength())));
			}

			//--------------------------------------------------------------------------------------> robWalking
			function robWalking() {
				_grid[_robTargetLocation.Row ][_robTargetLocation.Column] = GRID_CELL.Rob;
				_listOfEmptyCells.remove([_robTargetLocation.Row, _robTargetLocation.Column]);
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
				_grid[irow][icolumn] = GRID_CELL.None;
				_listOfEmptyCells.appendUnique([irow, icolumn]);
			}
	//end region Class Constructor Logic
}

//--> Internal Classes

//Class Obstacle
function Obstacle(cell, lifeTime) {
	var _currentLifeTime = lifeTime;

	this.Cell = cell;

	this.tickAndTest = function(){
		return (--_currentLifeTime == 0);
	}
}

//Class Hole
function Hole(holeCells, holeLifetime, holeFillingPointer) {
	Hole.Counter = (Hole.Counter)? Hole.Counter+1 : 1;
	var _currentLifeTime = 0;

	this.Id = Hole.Counter;
	this.OriginalCells = new Array(holeCells.getLength()); //array
	this.CurrentCells = holeCells; // (ListOfPairs) cells that aren't filled yet
	this.LifeTime = holeLifetime; // time remaining to timeout (seconds)
	this.Size = holeCells.getLength();
	this.HoleFillingPointer = holeFillingPointer;

	for(var i=0; i < holeCells.getLength(); i++) {
		this.OriginalCells[i] = holeCells.getInternalArray()[i];
	}

	this.tickAndTest = function(){
		if (this.CurrentCells.isIn(this.HoleFillingPointer))
			return false;

		if (++_currentLifeTime >= this.LifeTime) {
			_currentLifeTime = 0;
			return true;
		}

		return false;
	}

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

		for (var i=0,j=0; i < oCells.length; i++)
			if (!cCells.isIn(oCells[i]))
				cellsFilled[j++]= oCells[i];

		return cellsFilled;
	}

	this.isFilled = function() {
		return (this.CurrentCells.getLength() == 0);
	}

	this.shrinkHole = function(cell) {
		for (var i = 0; i < this.OriginalCells.length; i++)
			if (this.OriginalCells[i][0] == cell[0] && this.OriginalCells[i][1] == cell[1]) {
				this.Size--;
				this.OriginalCells.splice(i,1);
			}
	}
}
//<-- Internal Classes