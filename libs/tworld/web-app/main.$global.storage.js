/*
* main.$global.storage.js - 
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
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>
*/

//TODO: all evocative services (such as get/remove etc) should be implemented by a "bisection search" O(log(n)) over date
var taskEnvironments;
var agentPrograms;
var trials;
var __lookupSession__ = {info: localStorage.session_info || null};

var _KEYBOAR_MAP = ["","","","CANCEL","","","HELP","","BACK_SPACE","TAB","","","CLEAR","ENTER","RETURN","","SHIFT","CONTROL","ALT","PAUSE","CAPS_LOCK","KANA","EISU","JUNJA","FINAL","HANJA","","ESCAPE","CONVERT","NONCONVERT","ACCEPT","MODECHANGE","SPACE","PAGE_UP","PAGE_DOWN","END","HOME","LEFT","UP","RIGHT","DOWN","SELECT","PRINT","EXECUTE","PRINTSCREEN","INSERT","DELETE","","0","1","2","3","4","5","6","7","8","9","COLON","SEMICOLON","LESS_THAN","EQUALS","GREATER_THAN","QUESTION_MARK","AT","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","WIN","","CONTEXT_MENU","","SLEEP","NUMPAD0","NUMPAD1","NUMPAD2","NUMPAD3","NUMPAD4","NUMPAD5","NUMPAD6","NUMPAD7","NUMPAD8","NUMPAD9","MULTIPLY","ADD","SEPARATOR","SUBTRACT","DECIMAL","DIVIDE","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18","F19","F20","F21","F22","F23","F24","","","","","","","","","NUM_LOCK","SCROLL_LOCK","WIN_OEM_FJ_JISHO","WIN_OEM_FJ_MASSHOU","WIN_OEM_FJ_TOUROKU","WIN_OEM_FJ_LOYA","WIN_OEM_FJ_ROYA","","","","","","","","","","CIRCUMFLEX","EXCLAMATION","DOUBLE_QUOTE","HASH","DOLLAR","PERCENT","AMPERSAND","UNDERSCORE","OPEN_PAREN","CLOSE_PAREN","ASTERISK","PLUS","PIPE","HYPHEN_MINUS","OPEN_CURLY_BRACKET","CLOSE_CURLY_BRACKET","TILDE","","","","","VOLUME_MUTE","VOLUME_DOWN","VOLUME_UP","","","","","COMMA","","PERIOD","SLASH","BACK_QUOTE","","","","","","","","","","","","","","","","","","","","","","","","","","","OPEN_BRACKET","BACK_SLASH","CLOSE_BRACKET","QUOTE","","META","ALTGR","","WIN_ICO_HELP","WIN_ICO_00","","WIN_ICO_CLEAR","","","WIN_OEM_RESET","WIN_OEM_JUMP","WIN_OEM_PA1","WIN_OEM_PA2","WIN_OEM_PA3","WIN_OEM_WSCTRL","WIN_OEM_CUSEL","WIN_OEM_ATTN","WIN_OEM_FINISH","WIN_OEM_COPY","WIN_OEM_AUTO","WIN_OEM_ENLW","WIN_OEM_BACKTAB","ATTN","CRSEL","EXSEL","EREOF","PLAY","ZOOM","","PA1","WIN_OEM_CLEAR",""];
var _LOGIN_STATE = {HIDDEN : 0, SHOWN: 1, LOADING:2, LOGGED: 3, LOGOUT: 4}

var defaults = {
    settings:{
        video:{
            lq_grid:false,
            lq_env:false,
            cover_window: false,
            resolution: "854x480"
        },
        display:{
            show_fps: true,
            show_holes_helpers: true,
            show_visibility_bounds: true,
            show_console: true
        },
        audio:{
            enabled: true,
            volume: 80
        },
        general:{}
    },
    taskEnvironment: {
        trial: {//Each trial is a self-contained simulation
            /*default trial values*/
            test: false,
            runs: 1,
            saveStats: false,
            agents : [],
            speed: 0, //[-9..9]
            pause:  true,
            camera: _CAMERA_TYPE.AROUND_GRID
        },
        name:'',
        desc:'',
        date:undefined,
        battery: false,
        prop: {
            fullyObservable: true,
            multiagent: false,
            multiagent_type: 0, //0 competitive; 1 cooperative; 2 both
            deterministic: true,
            dynamic: 0, //0 static; 1 semidynamic; 2 dynamic
            known: true
        },
        agents:{
            percept:{
                partialGrid: true,
                radius: 2,
                noise: false,
                noise_cfg:{
                    tile:0.3,
                    obstacle:0.3,
                    hole:0.3
                }
            },
            stochastic_model: {
                type: _STOCHASTIC_ACTIONS_MODEL.ANOTHER_ACTION,
                prob: [700, 0, 0, 0, 0]
            }
        },
        environment:{
            rows:6,
            columns:6,
            holes_size:{range:[1,3], prob:[]},
            num_holes:{range:[2,3], prob:[]},
            num_obstacles:{range:[1,2], prob:[]},
            difficulty:{range:[0,0], prob:[]},
            scores_variability: 0,
            dynamic:{
                dynamism:{range:[6,13], prob:[]},
                hostility:{range:[1,13], prob:[]},
                hard_bounds:true,
            },
            random_initial_state:false,
            initial_state:[
                [" "," "," "," "," ","#"],
                ["#"," "," ","2"," ","#"],
                [" ","#"," ","T"," ","A"],
                ["1","T"," "," "," ","#"],
                ["#"," "," "," ","T","#"],
                [" ","#"," ","#","3"," "]
            ],
            final_state:[{name:_ENDGAME.TIME.NAME, value:5*60, result:_GAME_RESULT.NEUTRAL}] //default value
        },
        teams:[],
        final_tweaks:{
            easy: false,
            battery:{
                level:1000,
                good_move:20,
                bad_move:5,
                sliding:10
            },
            multiplier:{
                enabled:false,
                timeout:6
            },
            score:{
                cell: true
            },
            shapes:false
        }
    },
    agentProgram: { 
        name:"",
        desc:"",
        date:0,
        team:-1,
        ai: true,
        javascript:true,
        source:{
            file: false,
            agentProgram:{
                cursor:{row:0, column:0},
                code:
                    '/*\n'+
                    '* Use this function to write your "agent program" (Colloquially speaking, your robot\'s "brain")\n'+
                    '* This function is called each time the agent (i.e. the robot) finish performing an action.\n'+
                    '* It receives a <percept> object and based on the information provided by this object it should $return\n'+
                    '* the right _ACTION.\n'+
                    '* NOTE: Allowed _ACTIONS(s) are:\n'+
                    '*       _ACTION.NORTH   or _NORTH\n'+
                    '*       _ACTION.SOUTH   or _SOUTH\n'+
                    '*       _ACTION.WEST    or _WEST\n'+
                    '*       _ACTION.EAST    or _EAST\n'+
                    '*       _ACTION.RESTORE or _RESTORE    robot restores its battery\n'+
                    '*       _ACTION.NONE    or _NONE       robot do nothing so it just perceives, i.e. this\n'+
                    '*                                      AGENT_PROGRAM function is executed with a\n'+
                    '*                                      new, updated, <percept> object (calling the $perceive()\n'+
                    '*                                      function produces the same effect)\n'+
                    '*\n'+
                    '* The structure of the <percept> parameter below is described in the support material\n'+
                    '*/\n'+
                    'function AGENT_PROGRAM(percept){\n'+
                    '\n'+
                    '    $return(_ACTION.NONE); //<- An example of how actions should be returned\n'+
                    '}'
            },
            onStart:{
                cursor:{row:0, column:0},
                code:
                    '/*\n'+
                    '* Write here the code you want to run only once, when the simulation starts, e.g.\n'+
                    '* variables / data structures initialization\n'+
                    '*/\n'+
                    '\n'+
                    '\n'+
                    '/*\n'+
                    '* this function handles the on-start event.\n'+
                    '* The On-start event is fired when the 3D T-World game starts\n'+
                    '* and the perception is sent for the very first time.\n'+
                    '*/\n'+
                    'function onStart(percept){\n'+
                    '\n'+
                    '}'
            },
            onMessage:{
                cursor:{row:0, column:0},
                code:
                    '/*\n'+
                    '* NOTE: If your agent is not going to perform in a cooperative\n'+
                    '* multiagent environment, then just ignore this section of code;\n'+
                    '* Otherwise write here the code you want to run every time your agent \n'+
                    '* receives a message from a teammate.\n'+
                    '*/\n'+
                    '\n'+
                    '\n'+
                    '/*\n'+
                    '* this function handles the on-message-received event.\n'+
                    '* The on-message-received event is fired when the agent receives a message\n'+
                    '* from a teammate.\n'+
                    '* NOTE: there are two functions to send messages to the agent\'s teammates:\n'+
                    '*\n'+
                    '*   $sendMessage(agentID, message)  sends <message> object to the agent\n'+
                    '*                                   with id <agentID> e.g.\n'+
                    '*                                   $sendMessage(1, {newGoal: [10,15]});\n'+
                    '*                                   sends a message to the "agent 1" to let him know,\n'+
                    '*                                   for instance, that the "New Goal" is at (10,15)\n'+
                    '*\n'+
                    '*   $sendTeamMessage(message))      sends <message> object to all the\n'+
                    '*                                   agent\'s teammates\n'+
                    '*/\n'+
                    'function onMessageReceived(message){\n'+
                    '  \n'+
                    '}'
            },
            global:{
                cursor:{row:0, column:0},
                code:
                    '/*\n'+
                    '* this section of code is used to declare/define functions and variables that are visible/accessible\n'+
                    '* from all the other sections of code, namely the "Agent Program", "Start Event" and "Message Received Event"\n'+
                    '* sections above\n'+
                    '*/'
            }
        },
        socket:{
            ip_address: "localhost",
            port:3313,
            magic_string: "",
            percept_format: _PERCEPT_FORMAT.JSON
        },
        percept:{
                sync:true,
                interval:500
        },
        keyboard:true,
        controls:{Up:38, Down:40, Left:37, Right:39, Restore:16}
    },
    taskEnvironments : getDefaultEnvironments(),
    agentPrograms : getDefaultAgentPrograms()
}

// TASk ENVIRONMENTS
function saveEnvironments(){
    for (var te=taskEnvironments.length;te--;)
        if (taskEnvironments[te].builtin) taskEnvironments.remove(te);
    localStorage.taskEnvironments = JSON.stringify(taskEnvironments)
}
function clearEnvironments(){localStorage.removeItem("taskEnvironments")}
function updateEnvitonments(){return ( taskEnvironments= getEnvironments() )}
function getEnvironments(callback, $root){
    if (!isLoggedIn()){
        var envs = localStorage.taskEnvironments? JSON.parse(localStorage.taskEnvironments) : []
        return defaults.taskEnvironments.concat(envs);
    }else
        sendToTCloud(
            {m:'get_environments'},
            function(data, textStatus, jqXHR){
                callback.call(this, defaults.taskEnvironments.concat(data));
            },
            $root
        );
}
function getDefaultEnvironments(){
    if (isLoggedIn())
        sendToTCloud(
            {m:'get_default_environments'},
            function(data, textStatus, jqXHR){
                defaults.taskEnvironments.length = 0;
                for (var len=data.length,e=0;e<len;++e)
                    defaults.taskEnvironments.push(data[e]);
                //console.log(JSON.stringify(defaults.taskEnvironments));
            }
        );
    return [{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[],"speed":0,"pause":true,"camera":4},"name":"6x6 Puzzle","desc":"This task environment is perfect as a starting point when it comes to the implementation of Problem-Solving Agents Programs. The  goals are to  fill all 3 holes and to locate the agent at (0,0). Note: Since the floor is a 6x6 square, Uninformed search strategies should solve this problem perfectly well.","battery":false,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":6,"columns":6,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," "," "," ","#"],["#"," "," ","2"," ","#"],[" ","#"," ","T"," ","A"],["1","T"," "," "," ","#"],["#"," "," "," ","T","#"],[" ","#"," ","#","3"," "]],"final_state":[{"name":"Agent(s) location","value":[{"row":0,"column":0}],"result":1,"$$hashKey":"0PO"},{"name":"Filled holes","value":3,"result":1,"$$hashKey":"0PP"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"0MX"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411017022456,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[],"speed":0,"pause":true,"camera":4},"name":"15x15 Search Strategies illustrator","desc":"The single goal is to locate the agent at a given location. It was created to visually see how differently each one of the Search Strategies explores the State Space. It is intended to be used  to illustrate (a) each search strategy behavior and (b) how the use of heuristic guides, and radically improves, the search.","battery":false,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":15,"columns":15,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null],[" "," ","#","#"," "," ",null,null,null,null,null,null,"#","#",null],[" ","#","#"," "," "," ",null,null,null,null,null,null,"#","#",null],[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null],[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null],[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,"A",null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,null,null,"#"],[null,"#","#","#",null,null,null,null,null,null,null,null,null,null,"#"],[" ",null," ","#",null,null,null,null,null,null,null,null,"#","#","#"]],"final_state":[{"name":"Agent(s) location","value":[{"row":14,"column":1}],"result":1,"$$hashKey":"0JA"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"04E"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411019329319,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[{"team":0,"id":0,"program":{"date":1411022986730,"name":"Solving-Problem Uninformed"}}],"speed":0,"pause":true,"camera":4},"name":"20x20 Maze","desc":"A classic maze game; the agent has to get to the battery charger cell. Since it is a observable, discrete, known and deterministic task environment, this may be useful to illustrate how basic kind of agent programs (such as  model-based reflex or goal-based agents) can rapidly solve this well-known game.","battery":true,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":20,"columns":20,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1," "," "," ",1," "," "," "," "," ",1," "," "," "," "," "," "," "," "," "],[1,1,1," ",1,1,1," ",1,null,1," ",1,1,1,1,1,1,1," "],[1," ",1," "," "," ",1," ",1," "," "," ",1," "," "," "," "," ",1," "],[1," ",1,1,1," ",1,null,1,1,1,1,1," ",1," ",1,1,1," "],[1," ",1," "," "," ",1,null,1,null," "," ",1," ",1," "," "," ",1," "],[1," ",1,null,1,1,1,null,1,null,1,null,1,1,1,1,1," ",1," "],[1," ",1," ",1," "," "," ",1,null,1,null," "," ",1," "," "," ",1," "],[1," ",1,null,1,1,1," ",1," ",1,1,1," ",1," ",1,1,1," "],[1," ",1," "," "," ",1," ",1,null,1," "," "," ",1," ",null," ",1," "],[1," ",1,1,1," ",1,null,1,null,1," ",1,1,1,1,1," ",1," "],[1," "," "," "," "," ",1," "," ",null,1," ",1," "," "," ",null," ",1," "],[1," ",1,1,1,null,1,null,1,1,1," ",1,1,1," ",1," ",1," "],[1," "," "," ",1,null,1," ",1," "," "," ",1," "," "," ",1," ",1," "],[1,1,1," ",1,null,1,1,1," ",1,1,1," ",1,1,1," ",1," "],[1," "," "," ",1," "," "," "," "," ",1," "," "," ",1," "," "," ",1," "],[1," ",1," ",1,1,1,1,1,1,1,null,1,1,1,1,1,1,1," "],["A"," ",1," "," "," "," "," ",1," "," "," ",null," ",1," "," "," "," "," "],[1," ",1,1,1,1,1,1,1," ",1,1,1,1,1," ",1,1,1,1],[1," "," "," "," "," "," "," "," "," "," "," ",1," "," "," "," "," "," ","C"]],"final_state":[{"name":"Battery recharge","value":1,"result":"1","$$hashKey":"5HM"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"0IQ"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":0,"bad_move":0,"sliding":0},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411022433403,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[{"team":0,"id":0,"program":{"date":1411022986730,"name":"Solving-Problem Uninformed"}}],"speed":0,"pause":true,"camera":4},"name":"14x14 Multiple Goals","desc":"The agent's goals are to score at least 30 points and to get to the battery charger cell at least once. Note: take into account that the agent lost 10 points when its battery is recharged by the charger cell. Advanced search strategies are needed to be able to solve this problem, e.g. greedy best-first or A*  search.","battery":true,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":14,"columns":14,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," ",12,12,"#","#","#",null,null,null,null,null,null],[8,"#","#"," "," "," ",null,null,null,null,"#","#","#",null],[8,"#"," "," ","T"," ",null,null,null,null,null,null,"#",null],[" ","T"," "," ","T"," ",null,null,null,null,2,null,"#",null],[" "," ","T"," "," "," ",null,null," ","T",null,null,null,null],["#"," "," "," "," "," ",null,null,null,null,null,null,"#","#"],[null,null,"#",null,null,null,null,"A",null,null,null," ","#","#"],[null,"#","#",null,null,null," "," ",null,"T",null,6,"#","#"],[null,"#",null,null,null,null,null,null,null,null,null,null,"#","#"],[null,"#",null,null,null,null,null,null,null,"T",null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,"#",null],[null,"#",null,null,null,null,null,null,3,null,null,"#","#",null],[null,"#","#",null,null,null,null,null,null,null,null,"#","#",null],[null,"C","#",null,null,null,null,null,null,null,null,null,null,null]],"final_state":[{"name":"Battery recharge","value":1,"result":"1","$$hashKey":"1AI"},{"name":"Score","value":30,"result":1,"$$hashKey":"1AE"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"010"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":0,"bad_move":0,"sliding":0},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411060605543,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[{"team":0,"id":0,"program":{"date":1411022986730,"name":"Solving-Problem Uninformed"}}],"speed":0,"pause":true,"camera":2},"name":"Pacman-Like Puzzle","desc":"The agent's goal is to fill all the holes . Holes are filled by walking over them (i.e. Easy-Mode is enabled) and therefore holes are analogous to Pacman's \"food\" dots. This problem is quite hard for those problem-solving agents that search the solution in terms of an atomic goal state, some hybrid approach must be taken in order to achieve the goal. (e.g. filling the closest hole one at a time)","battery":false,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":9,"columns":18,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[1," ",25," ","#",26,53," "," ",56," ",58," ","#"," ",74," ",76],[" ","#","#",22,"#"," ","#","#","#","#","#","#"," ","#",72,"#","#",77],[" ","#",20," ",32," ",2," ",65," ",63," ",61," "," ",81,"#"," "],[4,"#"," ","#","#"," ","#","#","#","#","#","#",67,"#","#"," ","#"," "],[" ",17," ",33," ",30,"#","#","#","#","#","#"," "," ",88," ",84," "],[" ","#"," ","#","#"," ","#","#","#","#","#","#",69,"#","#",85,"#",96],[7,"#",15," "," ",36," ",40," ","A",47," "," ",89," "," ","#"," "],[" ","#","#",13,"#"," ","#","#","#","#","#","#",50,"#",90,"#","#",97],[" ",10," "," ","#"," ",42," "," ",45," ",52," ","#",91," ",93," "]],"final_state":[{"name":"Filled holes","value":44,"result":1,"$$hashKey":"22F"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"1QP"}],"final_tweaks":{"easy":true,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411067311418,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[{"team":0,"id":0,"program":{"date":1411022986730,"name":"Solving-Problem Uninformed"}}],"speed":0,"pause":false,"camera":2},"name":"Figure 17.1","desc":"The stochastic environment described in the chapter 17 of the book \"Artificial Intelligence: A Modern Approach 3rd edition\". A simple 3x4 environment that presents the agent with a sequential decision problem. The transition model of the environment is: the intended outcome occurs with probability 0.8 but with probability 0.2 the agent moves at right angles to the intended direction.","battery":false,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":false,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":"3","prob":[800,100,100,0,0]}},"environment":{"rows":3,"columns":4,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," ",1],[" ","#"," "," "],["A"," "," "," "]],"final_state":[{"name":"Agent(s) location","value":[{"row":1,"column":3}],"result":"2","$$hashKey":"0N5"},{"name":"Filled holes","value":1,"result":1,"$$hashKey":"0N6"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"06A"}],"final_tweaks":{"easy":true,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411073490467,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[],"speed":0,"pause":true,"camera":4},"name":"Dynamic and  Competitive (2 agents)","desc":"Default dynamic task environment, in which 2 agents compete  against each other for the highest score within a time limit of 5 minutes.\n-Grid dimension: 9 rows x 10 columns.\n-Battery use:  default values.\n-Probability distribution: uniform.\n-Multiplier: enabled (6 seconds).\n-Partial rewards: enabled.","battery":true,"prop":{"fullyObservable":true,"multiagent":true,"multiagent_type":0,"deterministic":true,"dynamic":2,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":9,"columns":10,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," "," "," ","#",null,null,null,null],["#"," "," ","2"," ","#",null,null,null,null],[" ","#"," ","T"," ","A",null,null,null,null],["1","T"," "," "," ","#",null,null,null,null],["#"," "," "," ","T","#",null,null,null,null],[" ","#"," ","#","3"," ",null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null]],"final_state":[{"name":"Time","value":300,"result":0,"$$hashKey":"093"}]},"teams":[{"name":"Team0","color":"orange","members":1,"$$hashKey":"0C2"},{"name":"Team1","color":"green","members":1,"$$hashKey":"0C3"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":true,"timeout":6},"score":{"cell":true},"shapes":false},"date":1411080490467,"builtin":true}];
}
function newEnvironment(env, callback, $root){
    env.date = Date.now();
    if (!isLoggedIn())
        {updateEnvitonments(); taskEnvironments.push(env); saveEnvironments();}
    else
        sendToTCloud(
            {m:'new_environment', env: JSON.stringify(env)},
            function(data, textStatus, jqXHR){ callback.call(); },
            $root
        );
}
function removeEnvironmentByDate(date, callback, $root){date=parseInt(date);
    if (!isLoggedIn()){
        var i = getEnvironmentIndexByDate(date);
        //1) removing trials
        var _trials = getTrials();
        for (var j=_trials.length; j--;)
            if (_trials[j].task_env_id == date)
                _trials.remove(j);
        saveTrials(_trials);
        //2) removing environment from list
        if (i != -1){
            taskEnvironments.remove(i);
            saveEnvironments();
        }
        return getEnvironments();
    }else
        sendToTCloud(
            {m:'remove_environment', date: date},
            function(data, textStatus, jqXHR){ callback.call(this, defaults.taskEnvironments.concat(data)); },
            $root
        );
}
function updateEnvironment(env, callback, $root){
    if (!isLoggedIn()){
        updateEnvitonments();
        taskEnvironments[ getEnvironmentIndexByDate(env.date, true) ] = env;
        saveEnvironments();
        if (callback) callback.call();
    }else
        sendToTCloud(
            {m:'update_environment', date: env.date, env: JSON.stringify(env)},
            function(data, textStatus, jqXHR){ if (callback) callback.call(); },
            $root
        );
}
function getEnvironmentByDate(date, callback, $root){date=parseInt(date);
    if (!isLoggedIn()){
        var i = getEnvironmentIndexByDate(date);
        return (i != -1)? taskEnvironments[i] : null;
    }else
        sendToTCloud(
            {m:'get_environment', date: date},
            function(data, textStatus, jqXHR){ callback.call(this, data); },
            $root
        );
}
function emptyTrialsEnvironment(date, callback, $root){
    if (!isLoggedIn()){
        var _trials = getTrials();
        for (var i=_trials.length; i--;)
            if (_trials[i].task_env_id == date)
                return false;
        return true;
    }else
        sendToTCloud(
            {m:'empty_trials_environment', date: date},
            function(data, textStatus, jqXHR){ callback.call(this, data.v); },
            $root
        );
}
function saveEnvironmentRunDefaults(env, $root){
    /*deleting not useful information*/
    for (var a = env.trial.agents.length; a--;)
        env.trial.agents[a].program = {
            date: env.trial.agents[a].program.date,
            name: env.trial.agents[a].program.name
        };
    updateEnvironment(env, null, $root);
}

// AGENT PROGRAMS
function saveAgentPrograms(){
    for (var ap=agentPrograms.length;ap--;)
        if (agentPrograms[ap].builtin) agentPrograms.remove(ap);
    localStorage.agentPrograms = JSON.stringify(agentPrograms)
}
function clearAgentPrograms(){localStorage.removeItem("agentPrograms")}
function updateAgentPrograms(){return ( agentPrograms = getAgentPrograms() )}
function newAgentProgram(ap, callback, $root){
    if (!isLoggedIn()){
        ap.date = Date.now();
        updateAgentPrograms(); agentPrograms.push(ap); saveAgentPrograms();
    }else
        sendToTCloud(
            {m:'new_agent_program', ap: JSON.stringify(ap)},
            function(data, textStatus, jqXHR){ callback.call(this, data.date); },
            $root
        );
}
function getAgentPrograms(callback, $root){
    if (!isLoggedIn()){
        var agentProgs = localStorage.agentPrograms? JSON.parse(localStorage.agentPrograms) : [];
        return defaults.agentPrograms.concat(agentProgs);
    }else
        sendToTCloud(
            {m:'get_agent_programs'},
            function(data, textStatus, jqXHR){ callback.call(this, defaults.agentPrograms.concat(data)); },
            $root
        );
}
function getDefaultAgentPrograms(){
    if (isLoggedIn())
        sendToTCloud(
            {m:'get_default_agent_programs'},
            function(data, textStatus, jqXHR){
                defaults.agentPrograms.length = 0;
                for (var len=data.length,e=0;e<len;++e)
                    defaults.agentPrograms.push(data[e]);
            }
        );
    return [];//json!!!
}
function updateAgentProgram(ap, callback, $root){
    if (!isLoggedIn()){
        updateAgentPrograms();
        agentPrograms[ getAgentProgramIndexByDate(ap.date, true) ] = ap;
        saveAgentPrograms();
        if (callback) callback.call();
    }else
    if (!ap.builtin)
        sendToTCloud(
            {m:'update_agent_program', date: ap.date, ap: JSON.stringify(ap)},
            function(data, textStatus, jqXHR){ if (callback) callback.call(this, ap.date); },
            $root
        );
}
function removeAgentProgramByDate(date, callback, $root){date=parseInt(date);
    if (!isLoggedIn()){
        var k = getAgentProgramIndexByDate(date);
        //1) remove trials
        var _trials = getTrials();
        for (var i=_trials.length; i--;)
            for (var j=_trials[i].agents.length; j--;)
                if (_trials[i].agents[j].program_id == date){
                    _trials.remove(i);
                    break;
                }
        saveTrials(_trials);
        //2) remove memory
        if (localStorage.memory){
            var mem = JSON.parse(localStorage.memory);
            delete mem[date];
            localStorage.memory = JSON.stringify(mem);
        }
        //3) remove from list
        if (k != -1){
            agentPrograms.remove(k);
            saveAgentPrograms();
        }
        return getAgentPrograms();
    }else
        sendToTCloud(
            {m:'remove_agent_program', date: date},
            function(data, textStatus, jqXHR){ callback.call(this, defaults.agentPrograms.concat(data)); },
            $root
        );
}
function getAgentProgramByDate(date, callback, $root){date=parseInt(date);
    if (!isLoggedIn()){
        var i = getAgentProgramIndexByDate(date);
        return (i != -1)? agentPrograms[i] : null;
    }else
        sendToTCloud(
            {m:'get_agent_program', date: date},
            function(data, textStatus, jqXHR){ callback.call(this, data); },
            $root
        );
}
function downloadAgentProgramSourceCode(date, $root){if (isLoggedIn()){//$root.$loading = true;
    var data, name, tmp = gettt().split('&'),
        iframe = document.getElementsByName("download-iframe")[0],
        form = document.createElement("form"),
        node = document.createElement("input");

    data = {m : 'get_agent_program_code', date: date};

    for (var i=tmp.length; i--;){
        tmp[i] = tmp[i].split('=');
        data[tmp[i][0]] = tmp[i][1];
    }

    iframe.addEventListener("load", function () { $root.$loading = false; });//not working

    form.action = 'http://tworld-ai.com/rest/main.php';
    form.target = iframe.name;
    form.method = "post";
    form.style.display = "none";

    for(name in data) 
        if (!(data[name] instanceof Function)){
            node.name  = name;
            node.value = data[name].toString();
            form.appendChild(node.cloneNode());
        }

    document.body.appendChild(form);

    form.submit();

    document.body.removeChild(form);

}}
function emptyTrialsAgentProgram(date, callback, $root){
    if (!isLoggedIn()){
        var _trials = getTrials();
        for (var i=_trials.length; i--;)
            for (var j=_trials[i].agents.length; j--;)
                if (_trials[i].agents[j].program_id == date)
                    return false;
        return true;
    }else
        sendToTCloud(
            {m:'empty_trials_agent_program', date: date},
            function(data, textStatus, jqXHR){ callback.call(this, data.v); },
            $root
        );
}
function getMemoryByAgentProgramDate(date, callback, $root){
    if (!isLoggedIn())
        return localStorage.memory? JSON.parse(localStorage.memory)[date] : undefined;
    else
        sendToTCloud(
            {m:'get_agent_program_memory', date: date},
            function(data, textStatus, jqXHR){ callback.call(this, data); },
            $root
        );
}
function saveMemoryByAgentProgramDate(date, memory/*json string*/, callback, $root){try{memory=JSON.parse(memory);}catch(e){if(callback)callback.call();return;};
    if (!memory) {if(callback)callback.call();return;};
    if (!isLoggedIn()){
        var mem = {};
        if (localStorage.memory)
            mem = JSON.parse(localStorage.memory);
        mem[date] = memory;
        localStorage.memory = JSON.stringify(mem);
    }else
        sendToTCloud(
            {m:'save_agent_program_memory', date: date, mem: JSON.stringify(memory)},
            function(data, textStatus, jqXHR){ if(callback)callback.call(); },
            $root
        );
}

// STATS/TRIALS
function saveTrials(trials){localStorage.trials = JSON.stringify(trials)}
function clearTrials(){localStorage.removeItem("trials")}
function getTrials(callback, $root){
    if (!isLoggedIn())
        return localStorage.trials? JSON.parse(localStorage.trials) : [];
    else
        sendToTCloud(
            {m:'get_trials'},
            function(data, textStatus, jqXHR){ callback.call(this,data); },
            $root
        );
}
function getTrialByDate(date, callback, $root){date=parseInt(date);
    if (!isLoggedIn()){
        var trials = getTrials();
        for (var i = trials.length; i--;)
            if (trials[i].date === date)
                return trials[i];
        return null;
    }else
        sendToTCloud(
            {m:'get_trial', date: date},
            function(trial, textStatus, jqXHR){ callback.call(this, trial); },
            $root
        );
}
function newTrial(trial, taskEnvDate, agentProgs, callback){
    if (!isLoggedIn()){
        trials = getTrials();
        trials.push(trial);
        saveTrials(trials);
    }else
        sendToTCloud(
            {
                m:'new_trial',
                trial: JSON.stringify(trial),
                env_date: taskEnvDate,
                agents: JSON.stringify(agentProgs)
            },
            function(data, textStatus, jqXHR){ callback.call(); }
        );
}
function removeTrial(date, callback, $root){
    if (!isLoggedIn()){
        _trials = getTrials();

        for (var t=_trials.length; t--;)
            if (_trials[t].date == date)
                _trials.remove(t);

        saveTrials(_trials);
    }else
        sendToTCloud(
            {m:'remove_trial', date: date},
            function(data, textStatus, jqXHR){ callback.call(); },
            $root
        );
}

// SETTINGS
function getSettings(callback, $root){
    if ( !isLoggedIn() )
        return localStorage.settings? JSON.parse(localStorage.settings) : defaults.settings;
    else
        return getSessionData().info.settings || defaults.settings;
}
function saveSettings(settings, callback, $root){
    if (!isLoggedIn())
        localStorage.settings = JSON.stringify(settings)
    else{
        getSessionData().info.settings = settings;
        saveSessionInfo();
        sendToTCloud(
            {m:'save_settings', sett: JSON.stringify(settings)},
            function(data, textStatus, jqXHR){ callback.call(); },
            $root
        );
    }
}
function clearSettings(){localStorage.removeItem("settings")}

function getEnvironmentIndexByDate(date, noUpdate){date=parseInt(date);
    if (!noUpdate)
        updateEnvitonments();
    for (var i = taskEnvironments.length; i--;)
        if (taskEnvironments[i].date === date)
            return i;
    return -1;
}

function getAgentProgramIndexByDate(date, noUpdate){date=parseInt(date);
    if (!noUpdate)
        updateAgentPrograms();
    for (var i = agentPrograms.length; i--;)
        if (agentPrograms[i].date === date)
            return i;
    return -1;
}

// KNOBS
function getKnobs(){return localStorage.knobs? JSON.parse(localStorage.knobs) : null}
function clearKnobs(){localStorage.removeItem("knobs")}
function saveKnobs(env, test){
    if (test) env.trial.test= true; //default trial (test trial)
    localStorage.knobs = JSON.stringify(env);
}

// T-USER
function isLoggedIn(){ return gettt() != undefined}
function getSessionData(){
    if (isLoggedIn()){
        __lookupSession__.info = localStorage.session_info?
                        JSON.parse(localStorage.session_info)
                        :
                        (sessionStorage.session_info?
                            JSON.parse(sessionStorage.session_info)
                            :
                            null
                        );
    }else
        __lookupSession__.info = null;
    return __lookupSession__;
}
function saveSessionInfo(){
    if (localStorage.session_info)
        localStorage.session_info = JSON.stringify(__lookupSession__.info);
    else
        sessionStorage.session_info = JSON.stringify(__lookupSession__.info);
}
function LoggedIn(data, remember){
    var session_info = {
                    email   : atob(data.e),
                    username: atob(data.u),
                    name    : atob(data.n),
                    settings: data.s? JSON.parse(atob(data.s)) : null
                }
    __lookupSession__.info = session_info;
    if (remember){
        localStorage.tt = data.tt;
        localStorage.session_info = JSON.stringify(session_info);
    }else{
        sessionStorage.tt = data.tt;
        sessionStorage.session_info = JSON.stringify(session_info);
    }
    getDefaultAgentPrograms();
    getDefaultEnvironments();
}
function LogOut(callback){
    sendToTCloud(
        {m:'user_logout'},
        function(data, textStatus, jqXHR){
            localStorage.removeItem('session_info');
            sessionStorage.removeItem('session_info');
            localStorage.removeItem('tt');
            sessionStorage.removeItem('tt');
            if (callback)
            callback.call();
        },
        null,
        function(jqXHR, textStatus, errorThrown){
            localStorage.removeItem('session_info');
            sessionStorage.removeItem('session_info');
            localStorage.removeItem('tt');
            sessionStorage.removeItem('tt');
            location.reload();
        }
    );
}
function gettt(){
    return localStorage.tt? localStorage.tt :
            (sessionStorage.tt? sessionStorage.tt : undefined);
}

// T-World T-Cloud interface
function sendToTCloud($data, onsucces, $root, onerror){
    var data = gettt();

    if (!$root)$root = {}
    $root.$loading = true;

    for (p in $data)
        if (!($data[p] instanceof Function))
            data+= "&"+p+"="+encodeURIComponent($data[p]);
    //data+="&ch="+antiNoobsHash(data);

    onerror = onerror || function(jqXHR, textStatus, errorThrown){
                            //console.error(jqXHR, textStatus, errorThrown);
                            /*if (jqXHR.status == 404)
                                LogOut();*/
                            $root.$loading = false;
                        };

    $.ajax({
        type: "POST",
        url : 'http://tworld-ai.com/rest/main.php',
        data : data,
        success: function(data, textStatus, jqXHR){
            $root.$loading = false;
            onsucces(data, textStatus, jqXHR);
        },
        error: onerror
    });
}

function sendToTCloudWithFile($data, $file, onsucces, $root, onerror){
    var data = new FormData();
    var tmp = gettt().split('&');

    if (!$root)$root = {}
    $root.$loading = true;

    onerror = onerror || function(jqXHR, textStatus, errorThrown){
                            //console.error(jqXHR, textStatus, errorThrown);
                            /*if (jqXHR.status == 404)
                                LogOut();*/
                            $root.$loading = false;
                        };

    for (var i=tmp.length; i--;){
        tmp[i] = tmp[i].split('=');
        data.append(tmp[i][0], tmp[i][1]);
    }
    for (p in $data)
        if (!($data[p] instanceof Function))
            data.append(p, $data[p]);
    data.append('file', $file);

    $.ajax({
        url: 'http://tworld-ai.com/rest/main.php',
        data: data,
        processData: false,
        contentType: false,
        type: 'POST',
        success: function(data, textStatus, jqXHR){
            $root.$loading = false;
            onsucces(data, textStatus, jqXHR);
        },
        error: onerror
    });
}