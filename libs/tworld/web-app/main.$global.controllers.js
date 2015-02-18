/*
* main.$global.controllers.js - 
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

function itemsListEnvsResolver($rootScope, $q) {
    if (!isLoggedIn()) return getEnvironments();
    else{
        var deferred = $q.defer();
        getEnvironments( function(response){ deferred.resolve(response); }, $rootScope );
        return deferred.promise;
    }
}

function itemsListAgentsResolver($rootScope, $q) {
    if (!isLoggedIn()) return getAgentPrograms();
    else{
        var deferred = $q.defer();
        getAgentPrograms( function(response){ deferred.resolve(response); }, $rootScope );
        return deferred.promise;
    }
}

function itemsListController($rootScope, $scope, $modalInstance, items, agentProgramsFlag){
    var _selected = -1;

    $scope.items = items;
    $scope.orderCond = "-date";
    $scope.environments = !agentProgramsFlag;
    $scope.page = 1
    $scope.itemsPerPage = 8;
    $scope.query = agentProgramsFlag?
                {
                    name:"",
                    ai:true,
                    javascript:true,
                    keyboard:true,
                    allProps: true,
                }
                :
                {
                    name:"",
                    allProps: true,
                    battery: false,
                    prop: {
                        fullyObservable: true,
                        multiagent: false,
                        deterministic: true,
                        dynamic: 0, //0 static; 1 semidynamic; 2 dynamic
                        known: true
                    }
                };

    $scope.text = {
        title: agentProgramsFlag? "Select An Agent Program" : "Select A Task Environment",
        filter: agentProgramsFlag? "Only Agent Programs that are:" : "Only Task environments that are:"
    }

    $scope.gotoTop = function(){
        $('.modal').animate({
            scrollTop: 0
        }, 1000, "easeOutExpo")
    }

    $scope.ok = function () {
        if (_selected == -1){
            $modalInstance.close(undefined);
            return;
        }

        if (!isLoggedIn())
            $modalInstance.close(
                agentProgramsFlag?
                        getAgentProgramByDate(_selected):
                        getEnvironmentByDate(_selected)
            );
        else
            if (!agentProgramsFlag)
                getEnvironmentByDate(
                    _selected,
                    function(response){ $modalInstance.close(response) }, $rootScope
                );
            else
                getAgentProgramByDate(
                    _selected,
                    function(response){ $modalInstance.close(response) }, $rootScope
                );
    };
    $scope.close = function () {$modalInstance.dismiss()};

    $scope.setSelected = function(value){_selected = value}
    $scope.isSelected = function(value){return _selected == value}
    $scope.userFilter = function(item){
        var regEx = new RegExp($scope.query.name,"i");

        if (agentProgramsFlag){
            var q = $scope.query;
            return regEx.test(item.name) && (
                    $scope.query.allProps ||
                    (
                        q.ai == item.ai && (
                            (q.ai && q.javascript == item.javascript)
                            ||
                            (!q.ai && q.keyboard == item.keyboard)
                        )
                    )
                );
        }else{
            var p = $scope.query.prop;
            return regEx.test(item.name) && (
                    $scope.query.allProps ||
                    (
                        $scope.query.battery == item.battery &&
                        p.fullyObservable == item.prop.fullyObservable &&
                        p.multiagent == item.prop.multiagent &&
                        p.deterministic == item.prop.deterministic &&
                        p.dynamic == item.prop.dynamic &&
                        p.known == item.prop.known
                    )
            );
        }
    }
};

function runTaskEnvResolver(id, $rootScope, $q) {
    if (!isLoggedIn()) return getEnvironmentByDate(id);
    else{
        var deferred = $q.defer();
        getEnvironmentByDate( id, function(response){ deferred.resolve(response); }, $rootScope );
        return deferred.promise;
    }
}

function runModalController($rootScope, $scope, $modal, $modalInstance, taskEnv, agentProgs){
    var nAgents = 0;
    $scope.task_env = taskEnv;
    $scope.agents = taskEnv.trial.agents;
    $scope.teams = new Array(taskEnv.teams.length);
    $scope.cameras = _CAMERA_TYPE;

    $scope.run = function () {if (Validate()){
        $scope.task_env.trial.agents = $scope.agents;
        $scope.task_env.trial.test= false;

        saveKnobs($scope.task_env);
        saveEnvironmentRunDefaults($scope.task_env, $rootScope)

        startTWorld();
        $modalInstance.close()
    }};
    $scope.close = function () {$modalInstance.dismiss()};

    $scope.singleTeam = function(){return $scope.task_env.teams.length === 1}
    $scope.singleAgent = function(){return !$scope.task_env.prop.multiagent}

    $scope.selectAgentProgram = function(agent_id){
        $modal.open({
            size: 'lg',
            templateUrl: 'items-list-modal.html',
            controller: itemsListController,
            resolve:{
                items: itemsListAgentsResolver,
                agentProgramsFlag:function(){return true}
            }
        })
        .result.then(
            function (agentProg) { $scope.agents[agent_id].program = agentProg; }
        );
    }

    $scope.viewSettings = function(){
        $modal.open({
            templateUrl: 'settings-modal.html',
            controller: settingsModalController
        })
    }

    function loadAgentProgAsync(agent, date){
        if (!isLoggedIn())
            agent.program = getAgentProgramByDate(date);
        else{
            getAgentProgramByDate(
                date,
                function(response){
                    agent.program = response;
                    $scope.$apply();
                },
                $rootScope
            );
            agent.program = {date: date, name: "Loading..."};
        }
    }

    //updating previously saved list of agents and teams (from the last execution)
    for (var len=$scope.agents.length, a=agentProgs.length; a < len;++a)
        if ($scope.agents[a].program)
            loadAgentProgAsync($scope.agents[a], $scope.agents[a].program.date)

    //initializing list of agents and teams
    for (var elen=taskEnv.teams.length, t=0; t < elen; ++t){
        $scope.teams[t] = new Array(taskEnv.teams[t].members)
        for (var tlen=$scope.teams[t].length, m=0; m < tlen; ++m, ++nAgents){
            if ($scope.agents.length <= nAgents)
                $scope.agents.push(null);

            if (!$scope.agents[nAgents])
                $scope.agents[nAgents] = {
                    team: t,
                    id: nAgents,
                    program: agentProgs[nAgents]
                };
            else
                if (agentProgs[nAgents])
                    $scope.agents[nAgents].program = agentProgs[nAgents];

            $scope.agents[nAgents].team = t;
            $scope.teams[t][m] = $scope.agents[nAgents];
        }
    }
    //updating number of agents (in case user has edited the task envitonment)
    $scope.agents.length = nAgents;
}

function APIReferenceController($scope, $modal, $modalInstance){
    var _selected = 0;
    var _fSeleced = "";
    var _TYPE = {
        ARRAYA: {name:"ArrayA",   desc:"array of Actions. See constants section to see what Actions look like"},
        ARRAYC: {name:"ArrayC",   desc:"array of Cell Objects"},
        ARRAYH: {name:"ArrayH",   desc:"array of Hole Objects"},
        MATRIX: {name:"Matrix",   desc:"array of arrays of string"},
        ACTION: {name:"Action",   desc:"a special constant (see constants section)"},
        OBJECT: {name:"Object",   desc:"a JavaScript Object"},
        PERCT:  {name:"Percept",  desc:"Percept object (see Percept section)"},
        CELL:   {name:"Cell",     desc:"an Object of the form {row:N,column:M}; N and M are integers"},
        GOAL:   {name:"Goal",     desc:"a Goal Object"},
        MIXED:  {name:"mixed",    desc:"mixed indicates that a parameter may accept multiple types"},
        BOOL:   {name:"bool",     desc:""},
        STR:    {name:"string",   desc:""},
        INT:    {name:"int",      desc:"integer number greater than or equal to 0"}
    }

    $scope.TYPE = _TYPE;

    $scope.isPerceptTab = function(){return _selected === 0}
    $scope.isConstantsTab = function(){return _selected === 1}
    $scope.isFunctionsTab = function(){return _selected === 2}

    $scope.setPerceptTab = function(){_selected = 0}
    $scope.setConstantsTab = function(){_selected = 1}
    $scope.setFunctionsTab = function(){_selected = 2}

    $scope.close = function () {$modalInstance.dismiss()};

    $scope.setFunction = function(value){_fSeleced = $scope.isFunction(value)? "" : value;}
    $scope.isFunction = function(value){return _fSeleced == value;}

    $scope.functions = [
        {
            name: "copy",
            params : [{t:_TYPE.OBJECT, i:"obj"}],
            desc: "Clones the obj object and returns it."
        },
        {
            name: "printf",
            params : [{t:_TYPE.STR, i:"format"}, {t:"", i:"..."}],
            desc: "The well-known C printf function. Writes the format string to the T-World console. "+
            "If format includes format specifiers (subsequences beginning with %), the additional arguments "+
            "following format are formatted and inserted in the resulting string replacing their respective specifiers."
        },
        {
            name: "$printGrid",
            params : [{t:_TYPE.PERCT, i:"p"}/*, {t:_TYPE.BOOL, i:"noCLear"}*/],
            desc: "This function is useful for debugging purpose. "+
                  "It prints the percept grid plus some other useful information such as perceived "+
                  "time, score, etc. Note: this function clears the console before printing."
        },
        {
            name: "$printMatrix",
            params : "(Matrix m, bool noClear)",
            params : [{t:_TYPE.MATRIX, i:"m"}/*, {t:_TYPE.BOOL, i:"noCLear"}*/],
            desc: "This function is useful for debugging purpose. "+
                  "It prints a matrix (an array of arrays). Note: this function clears the console before printing."
        },
        {
            name: "random",
            params : [{t:_TYPE.INT, i:"min"}, {t:_TYPE.INT, i:"max"}],
            desc: "Returns a pseudo-random number between a and b. "+
                  "If called without the optional max arguments random(n) returns a pseudo-random integer between 0 and n-1 (inclusive)."
        },
        {
            name: "$isInBounds",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.INT, i:"row"}, {t:_TYPE.INT, i:"column"}],
            desc: "Returns true if the specified row and column position is inside the bounds of the grid."
        },
        {
            name: "$isEmptyCell",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.INT, i:"row"}, {t:_TYPE.INT, i:"column"}],
            desc: "Returns true if the cell located at the specified row and column is empty/free."
        },
        {
            name: "$isHoleCell",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.INT, i:"row"}, {t:_TYPE.INT, i:"column"}],
            desc: "Returns true if the cell located at the specified row and column is a Hole cell."
        },
        {
            name: "$isTile",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.INT, i:"row"}, {t:_TYPE.INT, i:"column"}],
            desc: "Returns true if there is a Tile at the specified row and column position."
        },
        {
            name: "$isAgent",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.INT, i:"row"}, {t:_TYPE.INT, i:"column"}],
            desc: "Returns true if there is an Agent(Robot) at the specified row and column position."
        },
        {
            name: "$isObstacle",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.INT, i:"row"}, {t:_TYPE.INT, i:"column"}],
            desc: "Returns true if cell at the specified row and column position is an obstacle."
        },
        {
            name: "$isCharger",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.INT, i:"row"}, {t:_TYPE.INT, i:"column"}],
            desc: "Returns true if there is a battery charger cell at the specified row and column position."
        },
        {
            name: "$isValidMove",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.ACTION, i:"a"}],
            desc: "Returns true if performing the specified action results in a valid movement. "+
                  "e.g. $isValidMove(p, _NORTH) will return true if it is valid to move the agent one cell to the north."
        },
        {
            name: "$getClosestHole",
            params : [{t:_TYPE.CELL, i:"c"}, {t:_TYPE.ARRAYH, i:"holes"}, {t:_TYPE.ARRAYH, i:"ignore"}],
            desc: "Given a list of holes, this function returns the closest hole to the specified cell 'c'. "+
                  "The 'ignore' parameter is optional, it contains the holes that this function must "+
                  "ignore when computing the closest hole."
        },
        {
            name: "$getClosestCell",
            params : "(Cell c, Array cells, Array ignore=[])",
            params : [{t:_TYPE.CELL, i:"c"}, {t:_TYPE.ARRAYC, i:"cells"}, {t:_TYPE.ARRAYC, i:"ignore"}],
            desc: "Given a list of cells, this function returns the closest cell to the specified cell 'c'. "+
                  "The 'ignore' parameter is optional, it contains the cells that this function must "+
                  "ignore when computing the closest cell."
        },
        {
            name: "$return",
            params : "(Action a)",
            params : [{t:_TYPE.ACTION, i:"a"}],
            desc: "This is the function user must use to return actions. "+
                  "For instance, $return(_NORTH) makes the agent move north one cell. Note: "+
                  "when this function is called it behaves exactly as return statement does, that is, "+
                  "$return causes execution to leave the current function."
        },
        {
            name: "$perceive",
            params : [],
            desc: "This function causes execution to leave the current function and "+
                  "recalls AGENT_PROGRAM function with an updated Percept object. "+
                  "It is equivalent to call the function $return with _NONE action, i.e. $return(_NONE)."
        },
        {
            name: "$randomAction",
            params : [],
            desc: "Returns a random action (including _NONE and _RESTORE)."
        },
        {
            name: "$randomValidAction",
            params : [{t:_TYPE.PERCT, i:"p"}],
            desc: "Returns a random action, as long as $isValidMove function returns true for that action"
        },
        {
            name: "$paintCell",
            params : [{t:_TYPE.INT, i:"row"},{t:_TYPE.INT, i:"column"}],
            desc: "Paints a little square over the 3D environment grid, located at the given position. "+
                  "For instance, this may be useful to illustrate algorithms behavior. Note: "+
                  "built-in search algorithms (such as $breadthFirstSearch, $depthFirstSearch, etc.) use "+
                  "this function to illustrate how they explore the space state."
        },
        {
            name: "$clearPaintedCells",
            params : [],
            desc: "Removes all the cells painted via the $paintCell function."
        },
        {
            name: "$result",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.ACTION, i:"a"}],
            desc: "Implementation of the result/succesor function defined in chapter 3 of the book 'Artificial Intelligence'. "+
                  "This function returns the state that results from doing action a in state p. Note: In T-World, the structure "+
                  "of a state is equivalent to that of a Percept Object."
        },
        {
            name: "$succesor",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.ACTION, i:"a"}],
            desc: "This function is an alias for $result."
        },
        {
            name: "$sendTeamMessage",
            params : [{t:_TYPE.OBJECT, i:"message"}],
            desc: "Sends the given message object to all the agent's teammates. For example, "+
                  "$sendTeamMessage({row:10, column:10}) will send the JavaScript Object {row:10, column:10} "+
                  "to all the agent's teammates. Note: This function is useful when working with cooperative "+
                  "task environments where agents need to communicate with each other."
        },
        {
            name: "$sendMessage",
            params : [{t:_TYPE.INT, i:"teammateId"}, {t:_TYPE.STR, i:"message"}],
            desc: "Sends the given message object to the given teammate. For example, "+
                  "$sendMessage({row:10, column:10}, 1) will send the JavaScript Object {row:10, column:10} "+
                  "to the teammate with id 10. Note: This function is useful when working with cooperative "+
                  "task environments where agents need to communicate with each other."
        },
        {
            name: "$nextAction",
            params : [{t:_TYPE.ARRAYA, i:"actions"}],
            desc: "Given an array of actions, this function removes the first action (actions[0]) and then returns it."
        },
        {
            name: "$breadthFirstSearch",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.GOAL, i:"g"}, {t:_TYPE.BOOL, i:"paint"}, {t:_TYPE.INT, i:"delay"}],
            desc: "Breadth-first search strategy implementation (see section 3.4 of the book 'Artificial Intelligence: A Modern Approach'). "+
                  "This function searches for an action sequence that leads from the given state, p, to a state that matches with the given goal, g."+
                  "The paint argument is optional, when set to true this function graphically shows the states it explores while searching. "+
                  "In order to do this, it paints the cell where the agent is located in the state corresponding to the current search tree node. "+
                  "The delay argument is optional, it indicates the number of milliseconds to delay execution of the next algorithm step (default is 20)."
        },
        {
            name: "$depthFirstSearch",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.GOAL, i:"g"}, {t:_TYPE.BOOL, i:"paint"}, {t:_TYPE.INT, i:"delay"}],
            desc: "Depth-first search strategy implementation (see section 3.4 of the book 'Artificial Intelligence: A Modern Approach'). "+
                  "This function searches for an action sequence that leads from the given state, p, to a state that matches with the given goal, g."+
                  "The paint argument is optional, when set to true this function graphically shows the states it explores while searching. "+
                  "In order to do this, it paints the cell where the agent is located in the state corresponding to the current search tree node. "+
                  "The delay argument is optional, it indicates the number of milliseconds to delay execution of the next algorithm step (default is 20)."
        },
        {
            name: "$depthLimitedSearch",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.GOAL, i:"g"}, {t:_TYPE.INT, i:"limit"}, {t:_TYPE.BOOL, i:"paint"}, {t:_TYPE.INT, i:"delay"}],
            desc: "Depth-limited search strategy implementation (see section 3.4 of the book 'Artificial Intelligence: A Modern Approach'). "+
                  "This function searches for an action sequence that leads from the given state, p, to a state that matches with the given goal, g."+
                  "The paint argument is optional, when set to true this function graphically shows the states it explores while searching. "+
                  "In order to do this, it paints the cell where the agent is located in the state corresponding to the current search tree node. "+
                  "The delay argument is optional, it indicates the number of milliseconds to delay execution of the next algorithm step (default is 20)."
        },
        {
            name: "$iterativeDepthFirstSearch",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.GOAL, i:"g"}, {t:_TYPE.BOOL, i:"paint"}, {t:_TYPE.INT, i:"delay"}],
            desc: "Iterative deepening depth-first search strategy implementation (see section 3.4 of the book 'Artificial Intelligence: A Modern Approach'). "+
                  "This function searches for an action sequence that leads from the given state, p, to a state that matches with the given goal, g."+
                  "The paint argument is optional, when set to true this function graphically shows the states it explores while searching. "+
                  "In order to do this, it paints the cell where the agent is located in the state corresponding to the current search tree node. "+
                  "The delay argument is optional, it indicates the number of milliseconds to delay execution of the next algorithm step (default is 20)."
        },
        {
            name: "$greedyBestFirstSearch",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.GOAL, i:"g"}, {t:_TYPE.BOOL, i:"paint"}, {t:_TYPE.INT, i:"delay"}],
            desc: "Greedy best-first search strategy implementation (see section 3.5 of the book 'Artificial Intelligence: A Modern Approach'). "+
                  "This function searches for an action sequence that leads from the given state, p, to a state that matches with the given goal, g."+
                  "The paint argument is optional, when set to true this function graphically shows the states it explores while searching. "+
                  "In order to do this, it paints the cell where the agent is located in the state corresponding to the current search tree node. "+
                  "The delay argument is optional, it indicates the number of milliseconds to delay execution of the next algorithm step (default is 20)."
        },
        {
            name: "$aStarBestFirstSearch",
            params : [{t:_TYPE.PERCT, i:"p"}, {t:_TYPE.GOAL, i:"g"}, {t:_TYPE.BOOL, i:"paint"}, {t:_TYPE.INT, i:"delay"}],
            desc: "A* search strategy implementation (see section 3.5 of the book 'Artificial Intelligence: A Modern Approach'). "+
                  "This function searches for an action sequence that leads from the given state, p, to a state that matches with the given goal, g."+
                  "The paint argument is optional, when set to true this function graphically shows the states it explores while searching. "+
                  "In order to do this, it paints the cell where the agent is located in the state corresponding to the current search tree node. "+
                  "The delay argument is optional, it indicates the number of milliseconds to delay execution of the next algorithm step (default is 20)."
        }
    ];

    $scope.constants = [
        {
            name: "_ACTION.NORTH",
            desc: ""
        },
        {
            name: "_ACTION.SOUTH",
            desc: ""
        },
        {
            name: "_ACTION.WEST",
            desc: ""
        },
        {
            name: "_ACTION.EAST",
            desc: ""
        },
        {
            name: "_ACTION.RESTORE",
            desc: ""
        },
        {
            name: "_ACTION.NONE",
            desc: ""
        },
        {
            name: "_NORTH",
            desc: ""
        },
        {
            name: "_SOUTH",
            desc: ""
        },
        {
            name: "_WEST",
            desc: ""
        },
        {
            name: "_EAST",
            desc: ""
        },
        {
            name: "_RESTORE",
            desc: ""
        },
        {
            name: "_NONE",
            desc: ""
        }
        //_GRID_CELL  = {EMPTY:" ", TILE:"T", OBSTACLE:"#", HOLE_CELL:1, AGENT:"A", BATTERY_CHARGER:"C"};
    ];
}

function yesNoModalController($scope, $modal, $modalInstance, title, msg){
    $scope.title = title;
    $scope.msg = msg;
    $scope.ok = function(){$modalInstance.close()};
    $scope.close = function () {$modalInstance.dismiss()};
}

function readKeyController($scope, $modal, $modalInstance){
    function _keyDownHandler(e){
        if ($modalInstance)
            $modalInstance.close(e.keyCode);
        $(document).unbind('keydown', _keyDownHandler);
    }

    $(document).keydown(_keyDownHandler);
}

function settingsModalController($scope, $modal, $modalInstance){
    var _selected = 0;
    $scope.sett = getSettings();

    $scope.isVideoTab = function(){return _selected === 0}
    $scope.isDisplayTab = function(){return _selected === 1}
    $scope.isAudioTab = function(){return _selected === 2}
    $scope.isGeneralTab = function(){return _selected === 3}

    $scope.setVideoTab = function(){_selected = 0}
    $scope.setDisplayTab = function(){_selected = 1}
    $scope.setAudioTab = function(){_selected = 2}
    $scope.setGeneralTab = function(){_selected = 3}

    $scope.save = function(){
        saveSettings($scope.sett, $modalInstance.close);
        if (!isLoggedIn())
            $modalInstance.close();
    };
    $scope.cancel = function () {$modalInstance.dismiss()};

}
