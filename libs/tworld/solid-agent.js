/*
* solid-agent.js - 
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

// overwriting alert function for this scope
var alert = function(msg){
  if (msg instanceof Object)
    msg = JSON.stringify(msg);

  $return(_ACTION.CONSOLE_LOG + msg);
}

//console guard
try{
  console.clear();
  var _console = console;
  console = {};
 }catch(e){ var console = {} };
console.error = function(msg){ $return(_ACTION.CONSOLE_ERROR + msg)}
console.clear = function(msg){ $return(_ACTION.CONSOLE_CLEAR)}
console.log = alert;

function printf(){console.log(sprintf.apply(this, arguments))};
var perror = console.error;
var writeln = alert;

var _ACTION_SENT;
var _LAST_ERROR_SENT = "";
var _PERCEPT = null;
var _GRID;
var _AGENT;
var _SCORE_CELLS_MULTIPLIER;
var _EASY_MODE;

var _WEST= _ACTION.WEST;
var _EAST= _ACTION.EAST;
var _NORTH= _ACTION.NORTH;
var _SOUTH= _ACTION.SOUTH;
var _NONE= _ACTION.NONE;
var _RESTORE= _ACTION.RESTORE;

var __AgentProgram__;
var __onMessageReceived__;
var __onStart__;
var __onEnd__;
var __error__;
var __thinking__;

var __GLOBAL_LINES__;
var __AGENT_PROG_LINES__;
var __ON_START_LINES__;
var __ON_MSG_LINES__;

var $memory;
var $m;
var $persistent;

function __AgentProgram__Wrapper__(percept)/*returns action*/{
  percept = percept.data;

  switch(percept.header){
    case _PERCEPT_HEADER.INTERNAL:

      _SCORE_CELLS_MULTIPLIER = percept.data.CFG_CONSTANTS._SCORE_CELLS_MULTIPLIER;
      _EASY_MODE = percept.data.CFG_CONSTANTS._EASY_MODE;

      if (percept.data.memory)
        $memory = percept.data.memory;
      else
        $memory = {};
      $persistent = $m = $memory;

      __GLOBAL_LINES__ = newLineCounter(percept.data.global_src);
      __AGENT_PROG_LINES__ = newLineCounter(percept.data.ai_src);
      __ON_START_LINES__ = newLineCounter(percept.data.start_src);
      __ON_MSG_LINES__ = newLineCounter(percept.data.msg_src);

      eval(
        "(function(){"+
          percept.data.global_src+
          ";(function(){"+
            percept.data.ai_src
              .replace(/(\$(return|perceive)\s*\(.*?\)\s*[;\n])/g, "{$1;return}")+
            ";__AgentProgram__= AGENT_PROGRAM;"+
          "})();"+
          "(function(){"+
            percept.data.start_src+
            ";__onStart__= onStart;"+
          "})();"+
          /*"(function(){"+
            percept.data.end_src+
            ";__onEnd__= onEnd;"+
          "})();"+*/
          "(function(){"+
            percept.data.msg_src+
            ";__onMessageReceived__= onMessageReceived;"+
          "})();"+
        "})()"
      );
      break;

    case _PERCEPT_HEADER.START:
        try{
          __onStart__(percept.data);
        }catch(e){
          var matchs = e.stack.match(/(anonymous|eval)[^0-9 ]*(\d+)[^0-9]*(\d+)/i);
          if (!matchs)    console.error(e.stack);
          else{
            var line = matchs[2];
            if (line <= __GLOBAL_LINES__)
              console.error(e.name + ": " + e.message + " at 'Global Scope' section (Line:"+line+", Column:"+matchs[3]+")");
            else
              console.error(
                e.name + ": " + e.message +
                " at 'Start Event' section (Line:"+(line-(__GLOBAL_LINES__+__AGENT_PROG_LINES__))+
                ", Column:"+matchs[3]+")"
              );
        }
          __error__ = true;
        };
        $return(_ACTION.NONE);
      break;

    case _PERCEPT_HEADER.ERROR:
      if (_LAST_ERROR_SENT != percept.data){
        _LAST_ERROR_SENT = percept.data;
        console.error(percept.data.match(/^'([^]*)'$/)[1]);
      }
      break;

    case _PERCEPT_HEADER.MESSAGE:
      var msg;
      try{msg = JSON.parse(percept.data)}
      catch(e){msg = percept.data}//if not a JSON then pass a sting to "__onMessageReceived__"

      try{
        __onMessageReceived__(msg);
      }catch(e){
        var matchs = e.stack.match(/(anonymous|eval)[^0-9 ]*(\d+)[^0-9]*(\d+)/i);
        if (!matchs)    console.error(e.stack);
        else{
            var line = matchs[2];
            if (line <= __GLOBAL_LINES__)
              console.error(e.name + ": " + e.message + " at 'Global Scope' section (Line:"+line+", Column:"+matchs[3]+")");
            else
              console.error(
                e.name + ": " + e.message +
                " at 'Message Received Event' section (Line:"+(line-(__GLOBAL_LINES__+__AGENT_PROG_LINES__+__ON_START_LINES__))+
                ", Column:"+matchs[3]+")"
              );
        }
        __error__ = true;
      };
      break;

    case _PERCEPT_HEADER.PAUSE:
      /*if (percept.data == "off")
        $perceive();*/
      break;

    case _PERCEPT_HEADER.END:
    default: if (!__error__){
      //HIDDEN
      _PERCEPT = percept.data;
      _GRID = _PERCEPT.environment.grid;
      _GRID.ROWS = _GRID.length;
      _GRID.COLUMNS = _GRID[0].length;

      _AGENT = _PERCEPT.agent;
      _ACTION_SENT = false;

      if (!__thinking__){
        try{
          __AgentProgram__(_PERCEPT);
        }catch(e){
          var matchs = e.stack.match(/(anonymous|eval)[^0-9 ]*(\d+)[^0-9]*(\d+)/i);
          if (!matchs)    console.error(e.stack);
          else{
            var line = matchs[2];
            if (line <= __GLOBAL_LINES__)
              console.error(e.name + ": " + e.message + " at 'Global Scope' section (Line:"+line+", Column:"+matchs[3]+")");
            else
              console.error(e.name + ": " + e.message + " at 'Agent Program' section (Line:"+(line-__GLOBAL_LINES__)+", Column:"+matchs[3]+")");
          }
          __error__ = true;
        };
      }

      if (percept.header == _PERCEPT_HEADER.END){
        //__onEnd__(percept.desc)
        $return(_ACTION._SAVE_MEMORY_ + JSON.stringify($memory));
        self.close();
        break;
      }

      //ACTIONS GUARD
      if (!_ACTION_SENT)
        $perceive();
    }
  }
}onmessage = __AgentProgram__Wrapper__; 

// transition model
function $result(state, action, paint){ if (state.agent.battery == 0) return state;
  //TODO: if multiplier
  state = copy(state);

  var ir=0, ic=0, r=0, c=0;
  var loc = state.agent.location;
  var env = state.environment;
  var grid = env.grid;
  var costs = state.builtin_knowledge.costs;

  function fillHoleCell(row, column){
    for (var i=env.holes.length; i--;)
        for (var j=env.holes[i].cells.length; j--;)
          if (env.holes[i].cells[j].row == row &&
            env.holes[i].cells[j].column == column)
          {
            env.holes[i].cells.remove(j);
            state.agent.stats.filled_cells++;
            state.agent.stats.battery_used += costs.battery.slide_tile;
            state.agent.battery -= costs.battery.slide_tile;

            if (!env.holes[i].cells.length){ // if hole's filled
              //TODO: if multiplier
              state.agent.stats.filled_holes++;
              state.agent.stats.total_score += env.holes[i].value;
              state.agent.score += env.holes[i].value;

              if (!_EASY_MODE)
                env.time += costs.filled_hole/1000;

              env.holes.remove(i);
              break;
            }else{
              state.agent.stats.total_score += (env.holes[i].size - env.holes[i].cells.length)*_SCORE_CELLS_MULTIPLIER;
              state.agent.score += (env.holes[i].size - env.holes[i].cells.length)*_SCORE_CELLS_MULTIPLIER;
            }
          }
  }

  if (!$isValidMove(state, action)){
    state.agent.stats.bad_moves++;
    state.agent.battery -= costs.battery.bad_move;
    state.agent.battery = state.agent.battery >= 0? state.agent.battery : 0;
    env.time += costs.bad_move/1000;
    return state;
  }

  state.agent.stats.good_moves++;
  state.agent.battery -= costs.battery.good_move;
  state.agent.stats.battery_used+= costs.battery.good_move;
  env.time += costs.good_move/1000;

  switch(action){
    case _NORTH:    r = -1; break;
    case _SOUTH:    r =  1; break;
    case _WEST:     c = -1; break;
    case _EAST:     c =  1; break;
    case _RESTORE:
      state.agent.battery = 1000;
      state.agent.stats.battery_restore++;
      state.agent.score -= (state.agent.score/2)|0; 
      return state;
    default:
      console.error('$result: invalid action');
      return state;
  }

  if (paint)
    $paintCell(loc.row+r, loc.column+c);

  if ($isCharger(state, loc.row+r, loc.column+c)){
    state.agent.battery = 1000;
    state.agent.stats.battery_recharge++;
    state.agent.score = state.agent.score-10 >= 0? state.agent.score-10 : 0; 
  }

  for (ir= loc.row+r, ic= loc.column+c; $isTile(state, ir, ic); ir=ir+r, ic=ic+c);

  if (ir == loc.row+r && ic == loc.column+c){//if there is no tile to push

    if (_EASY_MODE && $isHoleCell(state, ir, ic))
      fillHoleCell(loc.row+r, loc.column+c);

    grid[loc.row][loc.column] =  $isCharger(state, loc.row, loc.column)?
                    _GRID_CELL.BATTERY_CHARGER : _GRID_CELL.EMPTY;
    grid[loc.row+r][loc.column+c] = _GRID_CELL.AGENT;
  }else
  if ($isHoleCell(state, ir, ic)) {
    grid[ir][ic] = _GRID_CELL.EMPTY;
    grid[loc.row][loc.column] =  $isCharger(state, loc.row, loc.column)?
                    _GRID_CELL.BATTERY_CHARGER : _GRID_CELL.EMPTY;
    grid[loc.row+r][loc.column+c] = _GRID_CELL.AGENT;

    state.agent.stats.battery_used+= costs.battery.slide_tile;

    for (var t=env.tiles.length; t--;)
      if (env.tiles[t].row == loc.row+r &&
        env.tiles[t].column == loc.column+c)
      {
        env.tiles.remove(t);
        break;
      }

    fillHoleCell(ir, ic);
  }else
  if ($isEmptyCell(state, ir, ic)) {
    grid[ir][ic] = _GRID_CELL.TILE;
    grid[loc.row][loc.column] = $isCharger(state, loc.row, loc.column)?
                    _GRID_CELL.BATTERY_CHARGER : _GRID_CELL.EMPTY;
    grid[loc.row+r][loc.column+c] = _GRID_CELL.AGENT;

    state.agent.stats.battery_used+= costs.battery.slide_tile;
    state.agent.battery -= costs.battery.slide_tile;

    for (var i=env.tiles.length; i--;)
      if (env.tiles[i].row == loc.row+r &&
        env.tiles[i].column == loc.column+c)
      {
        env.tiles[i].row = ir;
        env.tiles[i].column = ic;
        break;
      }
  }

  loc.row = loc.row+r;
  loc.column = loc.column+c;
  state.agent.battery = state.agent.battery >= 0? state.agent.battery : 0; 
  return state;
}var $succesor = $result;

function $Node(e, p, a, g, d){var _self = this;
  this.State = e;     // The state in the state space to which the node corresponds
  this.Parent = p;    // The node in the search tree that generated this node
  this.Action = a;    // The action that was applied to the parent to gennerate the node
  this.g = g||0;      // The cost of the path from the initial state to the node, as indicated by the parent pointers
  this.Depth = d||0;  // depth of the node in the search tree

  // used for informed search strategies
  this.f = function(){
    switch(__search__.algorithm){
      case _SEARCH_ALGORITHM.A_STAR:       return _self.g + h(); break;
      case _SEARCH_ALGORITHM.GREEDY:       return h();           break;
      case _SEARCH_ALGORITHM.UNIFORM_COST: return _self.g;       break;
    }
  }

  // Heuristic function
  var excludedHoles = [];
  var excludedTiles = [];
  function h(){var h = 0;
    //if goal state has to take into account the agent's location
    if ( __search__.goal_location )// Manhattan distance
      h+= manhattand(e.agent.location, __search__.goal.agent.location);

    //if goal state has to take into account the number of battery recharges
    if ( __search__.goal_recharges && e.environment.battery_chargers.length)
      h+= manhattand(
        e.agent.location,
        $getClosestCell(e.agent.location, e.environment.battery_chargers)
      );


    //if goal state has to take into account the agent's score, number of filled holes or filled cells
    if ( __search__.goal_filled_holes || __search__.goal_score ||
       __search__.goal_filled_cells || __search__.goal_total_score)
    {
      excludedHoles.length = 0;

      if (__search__.goal_filled_holes)
        var i=__search__.goal.agent.stats.filled_holes-e.agent.stats.filled_holes;

      if (__search__.goal_filled_cells)
        var cs=__search__.goal.agent.stats.filled_cells-e.agent.stats.filled_cells;

      if (__search__.goal_total_score)
        var tsc = __search__.goal.agent.stats.total_score - e.agent.stats.total_score;

      if (__search__.goal_score){
        var sc = __search__.goal.agent.score - e.agent.score;
        if (__search__.goal_recharges)
          sc+= __search__.goal_recharges*10;
      }

      for (var c1, c0=e.agent.location, t;
         (
          (__search__.goal_filled_holes&&i>0)   ||
          (__search__.goal_filled_cells&&cs>0)  ||
          (__search__.goal_total_score&&tsc>0)  ||
          (__search__.goal_score&&sc>0)
         )
         &&excludedHoles.length!=e.environment.holes.length;
         --i, sc-= c1.value, tsc-= c1.value)
      {
        c1 = $getClosestHole(c0, e.environment.holes, excludedHoles);

        if (c1){
          excludedHoles.push(c1.id);
          excludedTiles.length = 0;
          t=$getClosestCell(c1.cells[0], e.environment.tiles, excludedTiles);
          if (!t){
            h+=manhattand(c0, c1.cells[0]);
            c0 = c1.cells[0];
            cs--;
           }else{
            var holeCell = c1.cells[0];
            excludedTiles.push(t);
            h+= manhattand(c0, t)-1 + manhattand(t, holeCell);
            cs--;

            for (var len=c1.cells.length, hc=1; hc < len;++hc){
              t=$getClosestCell(holeCell, e.environment.tiles, excludedTiles);
              if (t){
                excludedTiles.push(t);
                h+=manhattand(holeCell, t) + manhattand(t, c1.cells[hc]);
                cs--;
              }else break;
              holeCell = c1.cells[hc];
            }
            c0 = holeCell;
          }
        }else
          return Number.MAX_VALUE;
      }
    }

    return h;
  }
}

function $expand(node){
  var successors;

  if (node.State.agent.battery == 0)
    return [new $Node(
      $result(node.State, _ACTION.RESTORE),
      node,
      _ACTION.RESTORE,
      node.g + 1,
      node.Depth + 1
    )];

  successors = [];

  if ($isValidMove(node.State, _ACTION.WEST))
    successors.push(new $Node(
      $result(node.State, _ACTION.WEST),
      node,
      _ACTION.WEST,
      node.g + 1,
      node.Depth + 1
    ));

  if ($isValidMove(node.State, _ACTION.EAST))
    successors.push(new $Node(
      $result(node.State, _ACTION.EAST),
      node,
      _ACTION.EAST,
      node.g + 1,
      node.Depth + 1
    ));

  if ($isValidMove(node.State, _ACTION.NORTH))
    successors.push(new $Node(
      $result(node.State, _ACTION.NORTH),
      node,
      _ACTION.NORTH,
      node.g + 1,
      node.Depth + 1
    ));

  if ($isValidMove(node.State, _ACTION.SOUTH))
    successors.push(new $Node(
      $result(node.State, _ACTION.SOUTH),
      node,
      _ACTION.SOUTH,
      node.g + 1,
      node.Depth + 1
    ));

  return successors;
}

function $solution(node, seq, limit, percept, goal, delay, equalByState, solution){
  var painted = !!seq;
  if (!painted) seq = [];
  else $clearPaintedCells();

  for (; node && node.Action !== undefined; node = node.Parent)
    seq.push(node.Action);

  //if iterative depth first search
  if (!seq.length && limit){
    __search__(percept, goal, 2, true, delay, equalByState, limit+1, null, solution);
    return;
  }
  __thinking__ = false;
   return seq.reverse();
}

function $breadthFirstSearch(percept, goal, paint, delay, equalByGoalStructure){
  return __search__(percept, goal, _SEARCH_ALGORITHM.BFS, paint, delay, !equalByGoalStructure);
}
function $depthFirstSearch(percept, goal, paint, delay, equalByGoalStructure){
  return __search__(percept, goal, _SEARCH_ALGORITHM.DFS, paint, delay, !equalByGoalStructure);
}
function $depthLimitedSearch(percept, goal, limit, paint, delay, equalByGoalStructure){
  return __search__(percept, goal, _SEARCH_ALGORITHM.DFS, paint, delay, !equalByGoalStructure, limit);
}
function $iterativeDepthFirstSearch(percept, goal, paint, delay, equalByGoalStructure){
  var seq, limit=limit||0;
  if (!paint)
    while(13){
      seq = $depthLimitedSearch(percept, goal, ++limit, paint, delay, !equalByGoalStructure)
      if (seq.length) return seq;
    }
  else
    return __search__(percept, goal, _SEARCH_ALGORITHM.IDFS, paint, delay, !equalByGoalStructure, limit+1);
}
function $greedyBestFirstSearch(percept, goal, paint, delay, equalByGoalStructure){
  return __search__(percept, goal, _SEARCH_ALGORITHM.GREEDY, paint, delay, !equalByGoalStructure);
}
function $greedyBestFirstLimitedSearch(percept, goal, limit, timeLimit, paint, delay, equalByGoalStructure){
  return __search__(percept, goal, _SEARCH_ALGORITHM.GREEDY, paint, delay, !equalByGoalStructure, limit, timeLimit);
}
function $aStarBestFirstSearch(percept, goal, paint, delay, equalByGoalStructure){
  return __search__(percept, goal, _SEARCH_ALGORITHM.A_STAR, paint, delay, !equalByGoalStructure);
}
function $aStarBestFirstLimitedSearch(percept, goal, limit, timeLimit, paint, delay, equalByGoalStructure){
  return __search__(percept, goal, _SEARCH_ALGORITHM.A_STAR, paint, delay, !equalByGoalStructure, limit, timeLimit);
}


//equalByState: whether or not states are going to be considered equal according to the structure of the goal state or rather the entire state.
function __search__(percept, goal, type, paint, delay, equalByState, limit, timeLimit, solution){delay=delay||20;
  var initial_state = percept;
  var node = new $Node(initial_state);
  var solution = solution || [];
  var frontier = [node];
  var explored = [];

  var children;
  var child = {State: copy(goal) };

  var timestamp = Date.now();

  //static methods
  __search__.sort = function(a, b){ return a.f()-b.f(); };
  __search__.algorithm = type;
  __search__.goal = goal;
  __search__.goal_location      = structMatch(__search__.goal, {agent:{location:{row:0, column:0}}});
  __search__.goal_filled_holes  = structMatch(__search__.goal, {agent:{stats:{filled_holes:0}}});
  __search__.goal_filled_cells  = structMatch(__search__.goal, {agent:{stats:{filled_cells:0}}});
  __search__.goal_total_score   = structMatch(__search__.goal, {agent:{stats:{total_score:0}}});
  __search__.goal_recharges     = structMatch(__search__.goal, {agent:{stats:{battery_recharge:0}}});
  __search__.goal_score         = structMatch(__search__.goal, {agent:{score:0}});
  //battery_recharge
  //  hacer que la heuristica este guiada por el cargador mas cercano (manhattan al mas cercano) equivalente a agent.location con pos = a charger

  if ( match(node.State, goal) )
    return $solution(node);

  if (paint){

    __thinking__ = true;
    function infiniteLoop(){
      if ( !frontier.length )
        return $solution(null, solution, type==_SEARCH_ALGORITHM.IDFS?limit:null, percept, goal, delay, equalByState, solution);

      switch(type){
        case _SEARCH_ALGORITHM.A_STAR:
        case _SEARCH_ALGORITHM.GREEDY:
        case _SEARCH_ALGORITHM.UNIFORM_COST:
          frontier.sort(__search__.sort);
        case _SEARCH_ALGORITHM.BFS: node = frontier.shift(); break;
        case _SEARCH_ALGORITHM.DFS:
        case _SEARCH_ALGORITHM.IDFS: node = frontier.pop() ; break;
      }

      //painting cell to be expanded
       $paintCell(node.State.agent.location.row, node.State.agent.location.column);

      setTimeout(function(){
        explored.push( node.State );

        if (!limit || node.Depth < limit){
          children = $expand(node);

          for (var n=children.length; n--;){

            if (!equalByState)
              instantiate(child.State, children[n].State);
            else
              child.State = children[n].State;

            if ( !explored.containsMatch(child.State) && !frontier.containsMatch(child) ){
              if (match(child.State, goal))
                return $solution(children[n], solution, type==_SEARCH_ALGORITHM.IDFS?limit:null, percept, goal, delay, equalByState, solution);
              frontier.push(children[n]);
             }
          }
        }
        infiniteLoop();
      }
      ,delay);
    }
    infiniteLoop();
    return solution;

  }else{

    while(13){//infinite loop

      if (timeLimit && Date.now() - timestamp >= timeLimit)
        return undefined;

      if ( !frontier.length ) return [];

      switch(type){
        case _SEARCH_ALGORITHM.A_STAR:
        case _SEARCH_ALGORITHM.GREEDY:
        case _SEARCH_ALGORITHM.UNIFORM_COST:
          frontier.sort(__search__.sort);
        case _SEARCH_ALGORITHM.BFS: node = frontier.shift(); break;
        case _SEARCH_ALGORITHM.DFS: node = frontier.pop()  ; break;
      } 

      explored.push( node.State );

       if (!limit || node.Depth < limit){
        children = $expand(node);

        for (var n=children.length; n--;){

          if (!equalByState)
            instantiate(child.State, children[n].State);
          else
            child.State = children[n].State;

          if ( !explored.containsMatch(child.State) && !frontier.containsMatch(child) ){
            if (match(child.State, goal)) return $solution(children[n]);
            frontier.push(children[n]);
           }
        }
      }
    }

  }
}

function $paintCell(row, column){$return(_ACTION.PAINT_CELL+row+":"+column)}

function $clearPaintedCells(){$return(_ACTION.CLEAR_CELLS)}

function $nextAction(arrayOfActions){
  return (!arrayOfActions || arrayOfActions.length == 0)? _ACTION.NONE : arrayOfActions.shift();
}

function $randomAction(){return random(6)}

function $randomValidAction(percept){
  var actions = new Array();

  if ($isValidMove(percept, _ACTION.NORTH))
    actions.push(_ACTION.NORTH);

  if ($isValidMove(percept, _ACTION.SOUTH))
    actions.push(_ACTION.SOUTH);

  if ($isValidMove(percept, _ACTION.EAST))
    actions.push(_ACTION.EAST);

  if ($isValidMove(percept, _ACTION.WEST))
    actions.push(_ACTION.WEST);

  return (actions.length == 0)? _ACTION.NONE : actions[parseInt(Math.random()*actions.length)];
}

function $return(action){
  switch(action){
    case _ACTION.NORTH:
    case _ACTION.SOUTH:
    case _ACTION.WEST:
    case _ACTION.EAST:
    case _ACTION.NONE:
    case _ACTION.RESTORE:
      _ACTION_SENT = true;
  }
  postMessage(action);
}

function $sendTeamMessage(msg){
  $return(_ACTION.TEAM_MESSAGE + JSON.stringify(msg));
}

function $sendMessage(robId, msg){
  $return(_ACTION.PEER_MESSAGE + robId + ":" + JSON.stringify(msg));
}

function $perceive(){postMessage(_ACTION.NONE)}





function $isInBounds(percept, row, column) {var _grid= percept.environment.grid;
  return (0 <= row && row < _grid.length)&&(0 <= column && column < _grid[0].length);
}

function $isEmptyCell(percept, row, column) {var _grid= percept.environment.grid;
  return  $isInBounds(percept, row,column)&&
      (_grid[row][column] == _GRID_CELL.EMPTY);
}

function $isHoleCell(percept, row, column) {var _grid= percept.environment.grid;
  return  $isInBounds(percept, row,column)&&
      (_grid[row][column] === (_grid[row][column]|0));
}

function $isTile(percept, row, column) {var _grid= percept.environment.grid;
  return  $isInBounds(percept, row,column)&&
      (_grid[row][column] == _GRID_CELL.TILE);
}

function $isAgent(percept, row, column) {var _grid= percept.environment.grid;
  return  $isInBounds(percept, row,column)&&
      (_grid[row][column] == _GRID_CELL.AGENT);
}

function $isObstacle(percept, row, column) {var _grid= percept.environment.grid;
  return  $isInBounds(percept, row,column)&&
      (_grid[row][column] == _GRID_CELL.OBSTACLE);
}

function $isCharger(percept, row, column) {var _bChargerLoc= percept.environment.battery_chargers;
  for (var bc = _bChargerLoc.length; bc--;)
    if (_bChargerLoc[bc].row == row && _bChargerLoc[bc].column == column)
      return bc+1;
  return 0;
}

function $isValidMove(percept, action){
  var arow, acol;
  var r = 0, c = 0;
  var _GRID = percept.environment.grid;
    _GRID.ROWS = _GRID.length;
    _GRID.COLUMNS = _GRID[0].length;

  if (action === undefined){
    arow = _AGENT.location.row;
    acol = _AGENT.location.column;
    action = percept;
  }else{
    arow = percept.agent.location.row;
    acol = percept.agent.location.column;
  }

  switch(action){
    case _ACTION.NORTH:
      if (arow <= 0)
        return false;
      r = -1;
      break;
    case _ACTION.SOUTH:
      if (arow >= _GRID.ROWS-1)
        return false;
      r = 1;
      break;
    case _ACTION.WEST:
      if (acol <= 0)
        return false;
      c = -1;
      break;
    case _ACTION.EAST:
      if (acol >= _GRID.COLUMNS-1)
        return false;
      c = 1;
  }

  if (_GRID[arow+r][acol+c] == _GRID_CELL.TILE){
    var tr = r, tc = c;
    for (; _GRID[arow+tr][acol+tc] == _GRID_CELL.TILE; tr+= r, tc+= c)
      if ( arow+tr+r < 0 || arow+tr+r > _GRID.ROWS-1 ||
         acol+tc+c < 0 || acol+tc+c > _GRID.COLUMNS-1)
        return false;
    r = tr;
    c = tc;
    return  !$isObstacle(percept, arow+r, acol+c) &&
        !$isAgent(percept, arow+r, acol+c);
  }

  return  (!$isHoleCell(percept, arow+r, acol+c) || _EASY_MODE) &&
      !$isObstacle(percept, arow+r, acol+c) &&
      !$isAgent(percept, arow+r, acol+c);
}


function $printGrid(percept, noClear){
  var strgLine = "   ";
  var strgGrid = "";
  var _GRID = percept.environment.grid;
    _GRID.ROWS = _GRID.length;
    _GRID.COLUMNS = _GRID[0].length;

  for (var i=0; i < _GRID.COLUMNS; ++i)
    strgLine+="-  ";
  strgLine+= "\n";

  for (var i=0; i < _GRID.ROWS; ++i){
    strgGrid+= "|  ";

    for (var j=0; j < _GRID.COLUMNS; ++j)
    strgGrid+= (isNaN(parseInt(_GRID[i][j])) || _GRID[i][j] < 10)?
        _GRID[i][j]+"  " :
        ((_GRID[i][j] < 100)?
          _GRID[i][j]+" " :
          _GRID[i][j]
        )

    strgGrid+= "|\n";
  }

  if (!noClear)
    console.clear();
  console.log(
    "\n" +
    strgLine+
    strgGrid+
    strgLine+
    "Score: " + percept.agent.score+
    "\t Battery: " + percept.agent.battery +
    "\t Time: " + percept.environment.time +
    "\n = = = = = = = = = = = = = = = = = = = = = = = = = = = "
  );
}
function $printMatrix(matrix, noClear){
  var strgGrid = "";

  for (var i=0; i < matrix.length; ++i){
    strgGrid+= "|  ";

    for (var j=0, val; j < matrix[i].length; ++j){
      val = !matrix[i][j]&&matrix[i][j]!==0? " ": matrix[i][j];
      strgGrid+= (isNaN(parseInt(val)) || val < 10)?
        val+"  " :
        ((val < 100)?
          val+" " :
          val
        )
      }

    strgGrid+= "\n";
  }

  if (!noClear)
    console.clear();
  console.log("\n" + strgGrid);
}

function $getHoleDistance(cell, hole){
  hole.cells.sort(function(a,b){ return manhattand(cell, a) - manhattand(cell, b); });
  return manhattand(cell, hole.cells[0]);
}

function $getClosestHole(cell, holes, exclude){if (!holes.length) return undefined;
  var closest, min=Number.MAX_VALUE;
  for (var i=holes.length; i--;)
    if (!exclude || !exclude.contains(holes[i].id)){
      holes[i].cells.sort(function(a,b){ return manhattand(cell, a) - manhattand(cell, b); });

      if ( manhattand(cell, holes[i].cells[0]) < min ){
        closest = holes[i];
        min = manhattand(cell, holes[i].cells[0]);
      }
    }
  return closest;
}

function $getClosestCell(cell, cells, exclude){if (!cells.length) return undefined;
  var closest, min=Number.MAX_VALUE;
  for (var i=cells.length; i--;)
    if ( (!exclude || !exclude.containsMatch(cells[i])) && manhattand(cell, cells[i]) < min ){
      closest = cells[i];
      min = manhattand(cell, cells[i]);
    }
  return closest;
}

function $empyMemory(){
  for(var key in $memory) {
    if($memory.hasOwnProperty(key))
      return false;
  }
  return true;
}

var $manhattan = manhattand;
var $match = match;
var $random = random;