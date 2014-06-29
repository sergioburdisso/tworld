/*
* solid-core.js - 
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

//Class  Tileworld
function Tileworld(){}

//region "Knobs" (The knob settings control the evolution of a Tileworld simulation)
	//-> to control the number and average size of each object type
	Tileworld.HoleSize = 3;//3;
	Tileworld.HolesSize_UncertaintyThreshold = 1;
	Tileworld.NumberOfHoles = 3; // how many holes are going to appear each time?
	Tileworld.NumberOfHoles_UncertaintyThreshold = 0;

	Tileworld.NumberOfObstacles = 2; // how many obstacles are going to appear each time?
	Tileworld.NumberOfObstacles_UncertaintyThreshold = 0.5; 

	//-> difficulty
	Tileworld.TileDistanceFromHole = 0; //when a hole is created, the number of cells between the hole and the tile to fill this hole

	//-> to control the frequency of appearance and disappearance of each object type
	Tileworld.Dynamism = 13; // time in seconds (the rate at which new holes appear and disappear)
	Tileworld.Dynamism_UncertaintyThreshold = 0.5; //P(HoleTimeout= Dynamism) = 1/(Floor((Dynamism-1)*p) + 1)

	Tileworld.Hostility = 13; // time in seconds (the rate at which obstacles appear)
	Tileworld.Hostility_UncertaintyThreshold = 1; //P(ObstTimeout= Hostility) = 1/(Floor((Hostility-1)*p) + 1)

	//-> to control factors such as the shape of the distribution of scores associated with holes
	Tileworld.VariabilityOfUtility = 0; //[0, 1] (differences in hole scores)

	//-> the choice between the instantaneous disappearance of a hole and a slow decrease in value
	Tileworld.HardBounds = true; //(holes having either hard timeouts or gradually decaying in value)

	//-> Dynamic or Static environment
	Tileworld.Dynamic = true;

	//-> Battery ON/OFF (This enabled the study of maintenance)
	Tileworld.Battery = true;

	//-> Deterministic Actions
	Tileworld.DeterministicActions = 1; // [0,1] unreliable(stochastic) or deterministic actions? 
	Tileworld.ModelOfStochasticMotion = _STOCHASTIC_ACTIONS_MODEL.NO_ACTION;

	//-> Perception
		Tileworld.Percept = true;
		Tileworld.PerceiveEveryTick = false; // perceive every tick or after each action

		// Noise
		Tileworld.ObstaclesNoisyPerception = 0;
		Tileworld.TilesNoisyPerception = 0;
		Tileworld.HolesNoisyPerception = 0;

		Tileworld.FullyObservableGrid = true; // fully observable grid or partially observable grid? 
		Tileworld.VisibilityRadius = 1; // in case the grid is partially observable, it specifies the maximum distance at which any object can be seen (in cells)

		Tileworld.ShowTimeLeft = false; // show holes and obstacles time remaining to timeout

	//--------------------------------------------------------------------------------------> utilityFillCell
	Tileworld.valueOfCellHoleFilled = function(sizeSoFar) {return sizeSoFar*2;}// it shoud be less than valueOfHoleFilledCompletely(1)

	/*
	[..]Each hole varies in size and point value, so a hole may consist of three cells on
	the grid and have a total point value of five. Once the hole is filled completely the
	agent gains the points. The agent knows how valuable each hole is in advance;
	*/
	//--------------------------------------------------------------------------------------> utilityFillHole
	Tileworld.valueOfHoleFilledCompletely = function(size) {return /*size**/size*10;}

//end region "Knobs"

//Tileworld class definition
function Tileworld(args) {
	//region Arguments default value mapping
		args = $.extend({graphicEngine : null, dimension : [10, 10]}, args);
	//end region Arguments default value mapping
	//
	//region Attributes
		var _environment = new Environment(args.dimension[0], args.dimension[1], args.graphicEngine, this);
	//end region Attributes
	//
	//region Methods
		//region Public Methods
			//--------------------------------------------------------------------------------------> createHoles
			this.createHoles = function() {
				var nHoles = uncertaintyMaker(Tileworld.NumberOfHoles, Tileworld.NumberOfHoles_UncertaintyThreshold);
				for (var i = 0; i < nHoles; i++)
					createHole(
						uncertaintyMaker(Tileworld.HoleSize, Tileworld.HolesSize_UncertaintyThreshold),
						uncertaintyMaker(Tileworld.Dynamism, Tileworld.Dynamism_UncertaintyThreshold)
					);
			}

			//--------------------------------------------------------------------------------------> createObstacles
			this.createObstacles= function() {
				var nObstacles = uncertaintyMaker(Tileworld.NumberOfObstacles, Tileworld.NumberOfObstacles_UncertaintyThreshold);
				for (var i = 0; i < nObstacles; i++)
					createObstacle(uncertaintyMaker(Tileworld.Hostility, Tileworld.Hostility_UncertaintyThreshold)+1);
			}

			//--------------------------------------------------------------------------------------> start
			this.start = _environment.startRunning;
		//end region Public Methods
		//
		//region Private Methods
			//--------------------------------------------------------------------------------------> createHole
			function createHole(holeSize, holeLifetime){
				var emptyCell, holeCells;

				_environment.initializeEmptyCellsRandomSearch();

				do{
					emptyCell = _environment.getARandomEmptyCell();

					//there's no empty cells, then, nothing else to do cause there's no room for any new hole
					if (emptyCell == null)
						return null;

					holeCells = tryCreatingHole(holeSize, emptyCell);

				}while(holeCells == null);

				_environment.newHole(holeCells, holeLifetime + _TILES_TELEPORT_DELAY, 1-Math.random()*Tileworld.VariabilityOfUtility);

				//for each cell of the new hole...
				for (var i= 0; i < holeCells.getLength(); i++){
					//...there must be created a tile for Rob to fill it
					if (_TILES_TELEPORT_DELAY > 0)
						CallWithDelay.Enqueue(createTile, [Tileworld.TileDistanceFromHole, holeCells.getItemAt(i)[0], holeCells.getItemAt(i)[1]], _TILES_TELEPORT_DELAY /*time in seconds*/);
					else
						createTile(Tileworld.TileDistanceFromHole, holeCells.getItemAt(i)[0], holeCells.getItemAt(i)[1]);
				}
			}

			//--------------------------------------------------------------------------------------> createTile
			function createTile(tileDistance, holeRowIndex, holeColumnIndex){
				var tileCell;
				var _MaxDepth = _environment.getGridDimension().Rows + _environment.getGridDimension().Columns-1;

				//Iterative Depth First Search
				for (var depth= tileDistance; tileCell == null && depth <= _MaxDepth; depth++)
					tileCell = tryCreatingTile(depth, [holeRowIndex, holeColumnIndex]);

				_environment.newTile(tileCell);
			}

			//--------------------------------------------------------------------------------------> createObstacle
			function createObstacle(lifeTime){
				_environment.initializeEmptyCellsRandomSearch();
				_environment.newObstacle(_environment.getARandomEmptyCell(), lifeTime);
			}

			//--------------------------------------------------------------------------------------> tryCreatingTile
			//(Depth First Search)
			function tryCreatingTile(tileDistance, rootCell){
				var node, successors, altSolNode = null;
				var stack = new ListOfPairs(), alreadyTested = new ListOfPairs();

				stack.appendAllArray(_environment.successors(rootCell));
				alreadyTested.append(rootCell);

				while ( !stack.empty() ) {

					node = stack.removeItemAt(stack.getLength()-1);

					if (_environment.isAnEmptyCell(node[0], node[1]) && !_environment.isThereAHoleFilling(node[0], node[1])){
						if (getManhattanDistance(node, rootCell) == tileDistance){

							return node;
						}else
							if (getManhattanDistance(node, rootCell) >= getManhattanDistance(altSolNode, rootCell)) {
								altSolNode = node;
						}
					}

					alreadyTested.append(node);

					successors = _environment.successors(node);

					if ( successors ) {
						for (var i= 0, suc; i < successors.length; i++){
							suc = successors[i];

							if (getManhattanDistance(suc, rootCell) <= tileDistance && !alreadyTested.contains(suc[0], suc[1]))
								stack.appendUnique(suc);
						}
					}
				}

				return altSolNode;
			}

			//--------------------------------------------------------------------------------------> tryCreatingHole
			//(Breadth First Search)
			function tryCreatingHole(holeSize, rootCell){
				var node, successors;
				var queue = new ListOfPairs(), solution = new ListOfPairs();

				queue.append(rootCell);
				solution.append(rootCell);

				if (solution.getLength() == holeSize)
					return solution;

				do{
					node = queue.removeItemAt(0);

					successors = _environment.successorsEmptyCells(node);

					if (successors) {
						for (var i= 0, suc; i < successors.length; i++){
							suc = successors[i];

							if (!solution.contains(suc[0], suc[1])){
								solution.append(suc);
								queue.append(suc);

								//goal test
								if (solution.getLength() == holeSize)
									return solution;
							}
						}
					}
				}while ( !queue.empty() );

				return null;
			}
		//end region Private Methods
	//end region Methods
	//
	//region Class Constructor Logic
		if (!Tileworld.Battery)
			_BATTERY_WALK_COST= _BATTERY_SLIDE_COST= _BATTERY_INVALID_MOVE_COST = 0;
	//end region Class Constructor Logic
}