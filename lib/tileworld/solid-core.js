/**
*solid-core.js
*<p>
*(description here)
*<p>
*Tab Size 4 characters
*
*@author Sergio Burdisso (sergio.burdisso@gmail.com)
**/

//Class  Tileworld
function Tileworld(){}

//region "Knobs" (The knob settings control the evolution of a Tileworld simulation)
	//-> to control the number and average size of each object type
	Tileworld.HoleSize = 4;
	Tileworld.HolesSize_UncertaintyThreshold = 1;
	Tileworld.NumberOfHoles = 2; // how many holes are going to appear each time?
	Tileworld.NumberOfHoles_UncertaintyThreshold = 0;

	Tileworld.NumberOfObstacles = 5; // how many obstacles are going to appear each time?
	Tileworld.NumberOfObstacles_UncertaintyThreshold = 0.5; 

	//-> difficulty
	Tileworld.TileDistanceFromHole = 0; //when a hole is created, the number of cells between the hole and the tile for fill this hole

	//-> to control the frequency of appearance and disappearance of each object type
	Tileworld.Dynamism = 10;  // time in seconds (the rate at which new holes appear and disappear)
	Tileworld.Dynamism_UncertaintyThreshold = 0.5; //P(HoleTimeout= Dynamism) = 1/(Floor((Dynamism-1)*p) + 1)

	Tileworld.Hostility = 10; // time in seconds (the rate at which obstacles appear)
	Tileworld.Hostility_UncertaintyThreshold = 1;//P(ObstTimeout= Hostility) = 1/(Floor((Hostility-1)*p) + 1)

	//-> to control factors such as the shape of the distribution of scores associated with holes
	Tileworld.VariabilityOfUtility = 0; //(differences in hole scores)

	//-> the choice between the instantaneous disappearance of a hole and a slow decrease in value
	Tileworld.HardBounds = true; //(holes having either hard timeouts or gradually decaying in value)

	//-> perception
	Tileworld.FullyObservable = false;// fully observable or partially observable environment? 
	Tileworld.VisibilityRadius = 2; //in case environment is partially observable, it specifies the maximum distance at which the objects can be seen (in cells)

	Tileworld.Deterministic = true; // show holes' time remaining to timeout

	Tileworld.BatteryON = false;
//end region "Knobs"
 
//Tileworld class definition
function Tileworld(args) {
	//region Arguments default value mapping
		args = $.extend({graphicEngine : null, dimension : [10, 10]},  args);
	//end region Arguments default value mapping
	//
	//region Attributes
		var _environment = new Environment(args.dimension[0], args.dimension[1], args.graphicEngine, this);
	//end region Attributes
	//
	//region Methods
		//region Public Methods
			//--------------------------------------------------------------------------------------> utilityFillCell
			/*
			When all the cells in a hole are filled in, the agent 
			gets points for filling the hole. The agent knows ahead 
			of time how valuable the hole is; its overall goal is to 
			get as many points as possible by filling in holes
			*/
			this.utilityFillCell = function(sizeSoFar) {
				if (sizeSoFar <= 0)
					return 0;

				if (sizeSoFar == 1)
					return Uc(1)/2;

				return Uc(sizeSoFar) - this.utilityFillCell(sizeSoFar-1);
			}

			//--------------------------------------------------------------------------------------> utilityFillHole
			this.utilityFillHole = function(size) {
				return Uh(size) - Uc(size-1);
			}

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
					createObstacle(uncertaintyMaker(Tileworld.Dynamism, Tileworld.Dynamism_UncertaintyThreshold)+1);
			}
		//end region Public Methods
		//
		//region Private Methods
			//--------------------------------------------------------------------------------------> Uc
			function Uc(sizeSoFar) {
				return sizeSoFar == 0? 0 : Uh(sizeSoFar) - Uh(sizeSoFar-1)/2;
			}

			//--------------------------------------------------------------------------------------> Uh
			function Uh(totalSize) {
				return totalSize*totalSize;
			}

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

				_environment.newHole(holeCells, holeLifetime + _TELEPORT_DELAY);

				//for each cell of the new hole...
				for (var i= 0; i < holeCells.getLength(); i++){
					//...there must be created a tile for Rob to fill it
					CallWithDelay.Enqueue(createTile, [Tileworld.TileDistanceFromHole, holeCells.getItemAt(i)[0], holeCells.getItemAt(i)[1]], _TELEPORT_DELAY /*time in seconds*/);
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

				while (!stack.empty()) {

					node = stack.removeItemAt(stack.getLength()-1);

					if (_environment.isItAnEmptyCell(node[0], node[1]) && !_environment.isThereAHoleFilling(node[0], node[1])){
						if (getManhattanDistance(node, rootCell) == tileDistance){

							return node;
						}else
							if (getManhattanDistance(node, rootCell) >= getManhattanDistance(altSolNode, rootCell)) {
								altSolNode = node;
						}
					}

					alreadyTested.append(node);

					successors = _environment.successors(node);

					if (successors) {
						for (var i= 0, suc; i < successors.length; i++){
							suc = successors[i];

							if (getManhattanDistance(suc, rootCell) <= tileDistance && !alreadyTested.isIn(suc))
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

							if (!solution.isIn(suc)){
								solution.append(suc);
								queue.append(suc);

								//goal test
								if (solution.getLength() == holeSize)
									return solution;
							}
						}
					}
				}while (!queue.empty());

				return null;
			}
		//end region Private Methods
	//end region Methods
	//
	//region Class Constructor Logic
		if (!Tileworld.BatteryON)
			_BATTERY_WALK_COST= _BATTERY_SLIDE_COST= _BATTERY_INVALID_MOVE_COST = 0;
	//end region Class Constructor Logic
}