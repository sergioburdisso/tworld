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
function Tileworld(args) {
	//region Arguments default value mapping
		args = $.extend({graphicEngine : null, dimension : [10, 10]},  args);
	//end region Arguments default value mapping
	//
	//region Attributes
		//-Static:

		//public:
			var _environment = new Environment(args.dimension[0], args.dimension[1], args.graphicEngine, this);

			//region "Knobs" (The knob settings control the evolution of a Tileworld simulation)
				//-> to control the number and average size of each object type
				//difficulty:
				var _holeSize = 4;
				var _holesSize_UncertaintyThreshold = 1;
				var _numberOfHoles = 2; // how many holes are going to appear each time?
				var _numberOfHoles_UncertaintyThreshold = 0;
				var _tileDistanceFromHole = 0; //when a hole is created, the number of cells between the hole and the tile for fill this hole

				var _numberOfObstacles = 5; // how many obstacles are going to appear each time?
				var _numberOfObstacles_UncertaintyThreshold = 0.5; 

				//-> to control the frequency of appearance and disappearance of each object type
				this.Dynamism = 100;  // time in seconds (the rate at which new holes appear and disappear)
				this.Dynamism_UncertaintyThreshold = 0.5; // 0 - 1  -> the closer to one, the more uncertainty (_dynamism + Math.random(-_dynamism, _dynamism)*_dynamismUncertaintyThreshold)

				this.Hostility = 100; // time in seconds (the rate at which obstacles appear)
				this.Hostility_UncertaintyThreshold = 1; // 0 - 1  -> _hostility + Math.random(-_hostility, _hostility)*_hostilityUncertaintyThreshold

				//-> to control factors such as the shape of the distribution of scores associated with holes
				var _variabilityOfUtility = 0; //(differences in hole scores)

				//-> the choice between the instantaneous disappearance of a hole and a slow decrease in value
				this.HardBounds = true; //(holes having either hard timeouts or gradually decaying in value)

				//->perseption
				var _fullyObservable = true;
				var _deterministic = false;
			//end region "Knobs"
	//end region Attributes
	//
	//region Methods
		//region Public Methods
			//--------------------------------------------------------------------------------------> utilityFillCell
			/*
			When all the cells in a hole are filled in, the a.gent 
			gets points for filling the hole. The agent knows ahead 
			of time how valuable the hole is; its overall goal is to 
			get as many points as possible by filling in holes.
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

			//--------------------------------------------------------------------------------------> perceptionFunction
			//perceptionFunction or perceptionFilter?
			/*
			Perception  also  occurs  during  the  act  cycle: 
			the  agent  can  access  a  global  map  of  the  world  that  indicates  the  locations  of  all  objects,  as  well  as
			the  ***********score and  time  remaining  to  timeout  for  all  holes***********
			*/
			this.perceptionFunction = function(environment) /*returns a JSON*/{ // VER SI NO LO METO EN UN WORKER QUE LLAME A OTRO WORKER (PROGRAMA AGENTE)
				if (!this.Perseption)
					this.Perseption = {
						grid: environment.Grid,
						agentLocation: [0,0],
						/*batery : 100,*/
						listOfHoles: [],
						listOfTiles: []
					}

				this.Perseption.agentLocation[0] = environment.RobLocation.Row;
				this.Perseption.agentLocation[1] = environment.RobLocation.Column;

				this.Perseption.listOfHoles.length = environment.ListOfHoles.getLength();

				for (var iHole, iHCells, i= 0;  i < this.Perseption.listOfHoles.length; ++i){
					iHole = environment.ListOfHoles.getItemAt(i);

					if (!this.Perseption.listOfHoles[i])
						this.Perseption.listOfHoles[i] = new Object();

					this.Perseption.listOfHoles[i].id = iHole.Id;
					this.Perseption.listOfHoles[i].cells = iHole.CurrentCells.getInternalArray();
					this.Perseption.listOfHoles[i].size = iHole.Size;

					if (_deterministic)
						this.Perseption.listOfHoles[i].lifetimeLeft = iHole.LifeTime;
					else
						delete this.Perseption.listOfHoles[i].lifetimeLeft;
				}

				for (var tileCounter= 0, r= 0; r < this.Perseption.grid.length; ++r)
					for (var c= 0; c < this.Perseption.grid[0].length; ++c)
						if (this.Perseption.grid[r][c] == GRID_CELL.Tile)
							if (tileCounter < this.Perseption.listOfTiles.length){
								this.Perseption.listOfTiles[tileCounter][0] = r;
								this.Perseption.listOfTiles[tileCounter++][1] = c;
							}else
								this.Perseption.listOfTiles[tileCounter++] = [r, c];

				this.Perseption.listOfTiles.length = tileCounter;

				return this.Perseption; // general case (serialized): JSON.stringify(this.Perseption)
			}

			//--------------------------------------------------------------------------------------> createHoles
			this.createHoles = function() {
				var nHoles = uncertaintyMaker(_numberOfHoles, _numberOfHoles_UncertaintyThreshold);
				for (var i = 0; i < nHoles; i++)
					createHole(
						uncertaintyMaker(_holeSize, _holesSize_UncertaintyThreshold),
						uncertaintyMaker(this.Dynamism, this.Dynamism_UncertaintyThreshold)
					);
			}

			//--------------------------------------------------------------------------------------> createObstacles
			this.createObstacles= function() {
				var nObstacles = uncertaintyMaker(_numberOfObstacles, _numberOfObstacles_UncertaintyThreshold);
				for (var i = 0; i < nObstacles; i++)
					createObstacle(uncertaintyMaker(this.Hostility, this.Hostility_UncertaintyThreshold)+1);
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
					CallWithDelay.Enqueue(createTile, [_tileDistanceFromHole, holeCells.getItemAt(i)[0], holeCells.getItemAt(i)[1]], _TELEPORT_DELAY /*time in seconds*/);
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
		CallWithDelay(); // just ignore this (it's here so that the CallWithDelay class "static attributes" are created... that's the way js works :( )
	//end region Class Constructor Logic
}