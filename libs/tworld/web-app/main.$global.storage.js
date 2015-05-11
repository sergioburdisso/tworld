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
                async_tiles_holes: false,
                dynamism:{range:[6,13], prob:[]},
                dynamism_tiles:{range:[6,13], prob:[]},
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
                    '* Click the Help button (?) in the upper right or press the F1 key on your keyboard to open the Help\n'+
                    '* menu. There you\'ll find everything you need to start coding, for instance, the structure of the percept\n'+
                    '* argument below and a list of built-in functions, constants, variable, data types, etc.\n'+
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
                    '* Write here the code you want to run only once, when the simulation starts\n'+
                    '* and the first perception is received.\n'+
                    '* (Useful for variables / data structures initialization)\n'+
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
    return [{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[{"team":0,"id":0,"program":{"date":1411409468971,"name":"Keyboard (Arrows+Shift)"}}],"speed":0,"pause":false,"camera":2},"name":"AIMA Figure 17.1","desc":"The stochastic environment described in the chapter 17 of the book \"Artificial Intelligence: A Modern Approach 3rd edition\". A simple 3x4 environment that presents the agent with a sequential decision problem. The transition model of the environment is: the intended outcome occurs with probability 0.8 but with probability 0.2 the agent moves at right angles to the intended direction.","battery":false,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":false,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":"3","prob":[800,100,100,0,0]}},"environment":{"rows":3,"columns":4,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," ",1],[" ","#"," "," "],["A"," "," "," "]],"final_state":[{"name":"Agent(s) location","value":[{"row":1,"column":3}],"result":"2","$$hashKey":"0N5"},{"name":"Filled holes","value":1,"result":1,"$$hashKey":"0N6"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"05O"}],"final_tweaks":{"easy":true,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411017022456,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[],"speed":0,"pause":true,"camera":4},"name":"15x15 Search Strategies illustrator","desc":"The single goal is to locate the agent at a given location. It was created to visually see how differently each one of the Search Strategies explores the State Space. It is intended to be used  to illustrate (a) each search strategy behavior and (b) how the use of heuristic guides, and radically improves, the search.","battery":false,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":15,"columns":15,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null],[" "," ","#","#"," "," ",null,null,null,null,null,null,"#","#",null],[" ","#","#"," "," "," ",null,null,null,null,null,null,"#","#",null],[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null],[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null],[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,"A",null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,null,null,"#"],[null,"#","#","#",null,null,null,null,null,null,null,null,null,null,"#"],[" ",null," ","#",null,null,null,null,null,null,null,null,"#","#","#"]],"final_state":[{"name":"Agent(s) location","value":[{"row":14,"column":1}],"result":1,"$$hashKey":"0JA"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"04E"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411019329319,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[],"speed":0,"pause":true,"camera":4},"name":"Partially Observable (5x5 Square)","desc":"This is a static, deterministic and partially observable task environment in which the goal is to fill all the five holes. The agent's vision is limited to a 5x5 square. Easy-Mode is enabled, so if the agent walks over a hole cell, this cell is automatically filled.","battery":false,"prop":{"fullyObservable":false,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":10,"columns":14,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," "," "," "," ",null,null,null,null,null,null,null,null],[" ","#","#","#","#"," ",null,null,null,null,"#",null,"#",null],[" ","#",6," "," "," ","#",null,null,"#","#",null,"#",null],[" "," ",6,"#"," "," ","#",null," ","#",4,null,null,null],[" "," "," ","#"," "," ","#",8," ","#",null,null,null,null],[" ","#","#","#"," "," ","#",null," ","#",null,null,null,null],[null,null,null," "," ",null,"#",null," ","#",null,null,"#",null],[null,null,null,null,null,null,null,null,null,null,null,null,"#",null],[null,null,"#","#","#","#",null,null,null,"#","#","#","#",3],[null,null,1,1,null,null,null,null,null,null,null,null,3,3]],"final_state":[{"name":"Filled holes","value":5,"result":1,"$$hashKey":"3AJ"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"3VH"}],"final_tweaks":{"easy":true,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411022433403,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[{"team":0,"id":0,"program":{"date":1411412233884,"name":"SAPMG Cooperative"}},{"team":0,"id":1,"program":{"date":1411412233884,"name":"SAPMG Cooperative"}},{"team":0,"id":2,"program":{"date":1411412233884,"name":"SAPMG Cooperative"}},{"team":0,"id":3,"program":{"date":1411412233884,"name":"SAPMG Cooperative"}}],"speed":0,"pause":true,"camera":4},"name":"\"Hello World\"-Like Cooperative Environment (4 agents)","desc":"16x16 completely empty grid. There is a single team of 4 agents that need to cooperate to achieve a single goal which is to locate each agent at one of the 4 corners. This environment is meant to be used as a starting point for cooperative task environments where user needs, for instance, to test simple communication mechanisms among the team members.","battery":false,"prop":{"fullyObservable":true,"multiagent":true,"multiagent_type":1,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":16,"columns":16,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null,null],[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null,null],[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null,null],[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null,null],[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null,null],[" "," "," "," "," "," ",null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]],"final_state":[{"name":"Agent(s) location","value":[{"row":15,"column":15},{"row":15,"column":0},{"row":0,"column":15},{"row":0,"column":0}],"result":1,"$$hashKey":"1G7"}]},"teams":[{"name":"Team0","color":"red","members":4,"$$hashKey":"13C"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411022822403,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[{"team":0,"id":0,"program":{"date":1411921145795,"name":"Multigoal"}}],"speed":0,"pause":true,"camera":4},"name":"14x14 Multiple Goals","desc":"The agent's goals are to score at least 30 points and to get to the battery charger cell at least once. Note: take into account that the agent lost 10 points when its battery is recharged by the charger cell. Advanced search strategies are needed to be able to solve this problem, e.g. greedy best-first or A*  search.","battery":true,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":14,"columns":14,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," ",12,12,"#","#","#",null,null,null,null,null,null],[8,"#","#"," "," "," ",null,null,null,null,"#","#","#",null],[8,"#"," "," ","T"," ",null,null,null,null,null,null,"#",null],[" ","T"," "," ","T"," ",null,null,null,null,2,null,"#",null],[" "," ","T"," "," "," ",null,null," ","T",null,null,null,null],["#"," "," "," "," "," ",null,null,null,null,null,null,"#","#"],[null,null,"#",null,null,null,null,"A",null,null,null," ","#","#"],[null,"#","#",null,null,null," "," ",null,"T",null,6,"#","#"],[null,"#",null,null,null,null,null,null,null,null,null,null,"#","#"],[null,"#",null,null,null,null,null,null,null,"T",null,null,null,null],[null,"#",null,null,null,null,null,null,null,null,null,null,"#",null],[null,"#",null,null,null,null,null,null,3,null,null,"#","#",null],[null,"#","#",null,null,null,null,null,null,null,null,"#","#",null],[null,"C","#",null,null,null,null,null,null,null,null,null,null,null]],"final_state":[{"name":"Battery recharge","value":1,"result":"1","$$hashKey":"1AI"},{"name":"Score","value":30,"result":1,"$$hashKey":"1AE"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"010"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":0,"bad_move":0,"sliding":0},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411060605543,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[{"team":0,"id":0,"program":{"date":1411591281612,"name":"Simple Problem-Solving Agent (Figure 3.1)"}}],"speed":0,"pause":true,"camera":2},"name":"Pacman-Like Puzzle","desc":"The agent's goal is to fill all the holes . Holes are filled by walking over them (i.e. Easy-Mode is enabled) and therefore holes are analogous to Pacman's \"food\" dots. This problem is quite hard for those problem-solving agents that search the solution in terms of an atomic goal state, some hybrid approach must be taken in order to achieve the goal. (e.g. filling the closest hole one at a time)","battery":false,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":9,"columns":18,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[1," ",25," ","#",26,53," "," ",56," ",58," ","#"," ",74," ",76],[" ","#","#",22,"#"," ","#","#","#","#","#","#"," ","#",72,"#","#",77],[" ","#",20," ",32," ",2," ",65," ",63," ",61," "," ",81,"#"," "],[4,"#"," ","#","#"," ","#","#","#","#","#","#",67,"#","#"," ","#"," "],[" ",17," ",33," ",30,"#","#","#","#","#","#"," "," ",88," ",84," "],[" ","#"," ","#","#"," ","#","#","#","#","#","#",69,"#","#",85,"#",96],[7,"#",15," "," ",36," ",40," ","A",47," "," ",89," "," ","#"," "],[" ","#","#",13,"#"," ","#","#","#","#","#","#",50,"#",90,"#","#",97],[" ",10," "," ","#"," ",42," "," ",45," ",52," ","#",91," ",93," "]],"final_state":[{"name":"Filled holes","value":44,"result":1,"$$hashKey":"22F"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"1QP"}],"final_tweaks":{"easy":true,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411067311418,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[{"team":0,"id":0,"program":{"date":1411411233884,"name":"PROLOG Iterative Depth-First Search"}}],"speed":0,"pause":true,"camera":4},"name":"6x6 Puzzle","desc":"This task environment is perfect as a starting point when it comes to the implementation of Problem-Solving Agents Programs. The  goals are to  fill all 3 holes and to locate the agent at (0,0). Note: Since the floor is a 6x6 square, Uninformed search strategies should solve this problem perfectly well.","battery":false,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":6,"columns":6,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," "," "," ","#"],["#"," "," ","2"," ","#"],[" ","#"," ","T"," ","A"],["1","T"," "," "," ","#"],["#"," "," "," ","T","#"],[" ","#"," ","#","3"," "]],"final_state":[{"name":"Agent(s) location","value":[{"row":0,"column":0}],"result":1,"$$hashKey":"0PO"},{"name":"Filled holes","value":3,"result":1,"$$hashKey":"0PP"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"0MX"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411073490467,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[],"speed":0,"pause":true,"camera":4},"name":"20x20 Maze","desc":"A classic maze game; the agent has to get to the battery charger cell. Since it is a observable, discrete, known and deterministic task environment, this may be useful to illustrate how basic kind of agent programs (such as  model-based reflex or goal-based agents) can rapidly solve this well-known game.","battery":true,"prop":{"fullyObservable":true,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":20,"columns":20,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1," "," "," ",1," "," "," "," "," ",1," "," "," "," "," "," "," "," "," "],[1,1,1," ",1,1,1," ",1,null,1," ",1,1,1,1,1,1,1," "],[1," ",1," "," "," ",1," ",1," "," "," ",1," "," "," "," "," ",1," "],[1," ",1,1,1," ",1,null,1,1,1,1,1," ",1," ",1,1,1," "],[1," ",1," "," "," ",1,null,1,null," "," ",1," ",1," "," "," ",1," "],[1," ",1,null,1,1,1,null,1,null,1,null,1,1,1,1,1," ",1," "],[1," ",1," ",1," "," "," ",1,null,1,null," "," ",1," "," "," ",1," "],[1," ",1,null,1,1,1," ",1," ",1,1,1," ",1," ",1,1,1," "],[1," ",1," "," "," ",1," ",1,null,1," "," "," ",1," ",null," ",1," "],[1," ",1,1,1," ",1,null,1,null,1," ",1,1,1,1,1," ",1," "],[1," "," "," "," "," ",1," "," ",null,1," ",1," "," "," ",null," ",1," "],[1," ",1,1,1,null,1,null,1,1,1," ",1,1,1," ",1," ",1," "],[1," "," "," ",1,null,1," ",1," "," "," ",1," "," "," ",1," ",1," "],[1,1,1," ",1,null,1,1,1," ",1,1,1," ",1,1,1," ",1," "],[1," "," "," ",1," "," "," "," "," ",1," "," "," ",1," "," "," ",1," "],[1," ",1," ",1,1,1,1,1,1,1,null,1,1,1,1,1,1,1," "],["A"," ",1," "," "," "," "," ",1," "," "," ",null," ",1," "," "," "," "," "],[1," ",1,1,1,1,1,1,1," ",1,1,1,1,1," ",1,1,1,1],[1," "," "," "," "," "," "," "," "," "," "," ",1," "," "," "," "," "," ","C"]],"final_state":[{"name":"Battery recharge","value":1,"result":"1","$$hashKey":"5HM"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"0IQ"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":0,"bad_move":0,"sliding":0},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411080490467,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[{"team":0,"id":0,"program":{"date":1411584560161,"name":"Model-Based Reflex Agent  (Figure 2.12)"}}],"speed":0,"pause":true,"camera":4},"name":"20x20 Maze (Partially Observable 3x3)","desc":"A classic maze game; the agent has to get to the battery charger cell. Since it is a partially observable, discrete, known and deterministic task environment, this may be useful to illustrate how basic kind of agent programs (such as  model-based reflex) can rapidly solve this well-known game.","battery":true,"prop":{"fullyObservable":false,"multiagent":false,"multiagent_type":0,"deterministic":true,"dynamic":0,"known":true},"agents":{"percept":{"partialGrid":true,"radius":1,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":20,"columns":20,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],[1," "," "," ",1," "," "," "," "," ",1," "," "," "," "," "," "," "," "," "],[1,1,1," ",1,1,1," ",1,null,1," ",1,1,1,1,1,1,1," "],[1," ",1," "," "," ",1," ",1," "," "," ",1," "," "," "," "," ",1," "],[1," ",1,1,1," ",1,null,1,1,1,1,1," ",1," ",1,1,1," "],[1," ",1," "," "," ",1,null,1,null," "," ",1," ",1," "," "," ",1," "],[1," ",1,null,1,1,1,null,1,null,1,null,1,1,1,1,1," ",1," "],[1," ",1," ",1," "," "," ",1,null,1,null," "," ",1," "," "," ",1," "],[1," ",1,null,1,1,1," ",1," ",1,1,1," ",1," ",1,1,1," "],[1," ",1," "," "," ",1," ",1,null,1," "," "," ",1," ",null," ",1," "],[1," ",1,1,1," ",1,null,1,null,1," ",1,1,1,1,1," ",1," "],[1," "," "," "," "," ",1," "," ",null,1," ",1," "," "," ",null," ",1," "],[1," ",1,1,1,null,1,null,1,1,1," ",1,1,1," ",1," ",1," "],[1," "," "," ",1,null,1," ",1," "," "," ",1," "," "," ",1," ",1," "],[1,1,1," ",1,null,1,1,1," ",1,1,1," ",1,1,1," ",1," "],[1," "," "," ",1," "," "," "," "," ",1," "," "," ",1," "," "," ",1," "],[1," ",1," ",1,1,1,1,1,1,1,null,1,1,1,1,1,1,1," "],["A"," ",1," "," "," "," "," ",1," "," "," ",null," ",1," "," "," "," "," "],[1," ",1,1,1,1,1,1,1," ",1,1,1,1,1," ",1,1,1,1],[1," "," "," "," "," "," "," "," "," "," "," ",1," "," "," "," "," "," ","C"]],"final_state":[{"name":"Battery recharge","value":1,"result":"1","$$hashKey":"5HM"}]},"teams":[{"name":"Team0","color":"red","members":1,"$$hashKey":"06U"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":0,"bad_move":0,"sliding":0},"multiplier":{"enabled":false,"timeout":6},"score":{"cell":false},"shapes":false},"date":1411412859470,"builtin":true},{"trial":{"test":false,"runs":1,"saveStats":false,"agents":[{"team":0,"id":0,"program":{"date":1420761780137,"name":"Closed-Loop Problem-Solving Agent"}},{"team":1,"id":1,"program":{"date":1411409468971,"name":"Keyboard (Arrows+Shift)"}}],"speed":0,"pause":true,"camera":4},"name":"Dynamic and  Competitive (2 agents)","desc":"Default dynamic task environment, in which 2 agents compete  against each other for the highest score within a time limit of 5 minutes.\n-Grid dimension: 9 rows x 10 columns.\n-Battery use:  default values.\n-Probability distribution: uniform.\n-Multiplier: enabled (6 seconds).\n-Partial rewards: enabled.","battery":true,"prop":{"fullyObservable":true,"multiagent":true,"multiagent_type":0,"deterministic":true,"dynamic":2,"known":true},"agents":{"percept":{"partialGrid":true,"radius":2,"noise":false,"noise_cfg":{"tile":0.3,"obstacle":0.3,"hole":0.3}},"stochastic_model":{"type":1,"prob":[700,100,100,100,0]}},"environment":{"rows":9,"columns":10,"holes_size":{"range":[1,3],"prob":[334,333,333]},"num_holes":{"range":[2,3],"prob":[500,500]},"num_obstacles":{"range":[1,2],"prob":[500,500]},"difficulty":{"range":[0,0],"prob":[]},"scores_variability":0,"dynamic":{"dynamism":{"range":[6,13],"prob":[125,125,125,125,125,125,125,125]},"hostility":{"range":[1,13],"prob":[77,77,77,77,77,77,77,77,77,77,77,77,76]},"hard_bounds":true},"random_initial_state":false,"initial_state":[[" "," "," "," "," ","#",null,null,null,null],["#"," "," ","2"," ","#",null,null,null,null],[" ","#"," ","T"," ","A",null,null,null,null],["1","T"," "," "," ","#",null,null,null,null],["#"," "," "," ","T","#",null,null,null,null],[" ","#"," ","#","3"," ",null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null],[null,null,null,null,null,null,null,null,null,null]],"final_state":[{"name":"Time","value":300,"result":0,"$$hashKey":"093"}]},"teams":[{"name":"Team0","color":"orange","members":1,"$$hashKey":"0C2"},{"name":"Team1","color":"green","members":1,"$$hashKey":"0C3"}],"final_tweaks":{"easy":false,"battery":{"level":1000,"good_move":20,"bad_move":5,"sliding":10},"multiplier":{"enabled":true,"timeout":6},"score":{"cell":true},"shapes":false},"date":1411693091084,"builtin":true}];
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
                //console.log(JSON.stringify(defaults.agentPrograms));
            }
        );
    return [{"name":"Closed-Loop Problem-Solving Agent","desc":"This is a Goal-Based Agent that keeps perceiving while he is executing a plan, and therefore if something changes in the environment that doesn't let him to reach the goal state, he creates a new plan.  This agent can be used in dynamic task environment.","date":1420761780137,"team":-1,"ai":true,"javascript":true,"source":{"file":false,"agentProgram":{"cursor":{"row":99,"column":0},"code":"/*\n* Use this function to write your \"agent program\" (Colloquially speaking, your robot's \"brain\")\n* This function is called each time the agent (i.e. the robot) finish performing an action.\n* It receives a <percept> object and based on the information provided by this object it should $return\n* the right _ACTION.\n* NOTE: Allowed _ACTIONS(s) are:\n*       _ACTION.NORTH   or _NORTH\n*       _ACTION.SOUTH   or _SOUTH\n*       _ACTION.WEST    or _WEST\n*       _ACTION.EAST    or _EAST\n*       _ACTION.RESTORE or _RESTORE    robot restores its battery\n*       _ACTION.NONE    or _NONE       robot do nothing so it just perceives, i.e. this\n*                                      AGENT_PROGRAM function is executed with a\n*                                      new, updated, <percept> object (calling the $perceive()\n*                                      function produces the same effect)\n*\n* Click the Help button (?) in the upper right or press the F1 key on your keyboard to open the Help\n* menu. There you'll find everything you need to start coding, for instance, the structure of the percept\n* argument below and a list of built-in functions, constants, variable, data types, etc.\n*/\nfunction AGENT_PROGRAM(percept){\n  var env = percept.environment;\n  var my = percept.agent;\n  var knowledge = percept.builtin_knowledge;\n\n  if (my.battery <= 0)\n    $return(_RESTORE);\n\n  goal.agent.stats.battery_recharge = my.stats.battery_recharge;\n\n  if (!seq) seq = [];\n\n  if ( !$match(my.location, ExpectedLoc) )\n    seq.length = 0; //re-planificar\n\n  if (LOW_BATTERY && $match(my.location, env.battery_chargers[0]))\n    $return($randomValidAction(percept));\n\n  if ((!seq || !seq.length) && env.holes.length && env.tiles.length){\n    goal.agent.stats.filled_cells = my.stats.filled_cells + 1;\n\n    seq = $aStarBestFirstLimitedSearch(percept, goal, 30, 3000);\n\n    if (seq && seq.length){\n      targetCell.row = my.location.row; targetCell.column = my.location.column;\n      for(var i=0; i<seq.length;i++)\n        switch(seq[i]){\n          case _NORTH:\n            targetCell.row--; break;\n          case _SOUTH:\n            targetCell.row++; break;\n          case _WEST:\n            targetCell.column--; break;\n          case _EAST:\n            targetCell.column++;\n        }\n      switch(seq[seq.length-1]){\n        case _NORTH:\n          targetCell.row--; break;\n        case _SOUTH:\n          targetCell.row++; break;\n        case _WEST:\n          targetCell.column--; break;\n        case _EAST:\n          targetCell.column++;\n      }\n    }else{\n      my.battery = 1000;\n      seq = $greedyBestFirstLimitedSearch(percept, goalToCenter, knowledge.grid_total_rows + knowledge.grid_total_columns, 1500);\n      if ((!seq || !seq.length)){\n        seq = [];\n        $return($randomValidAction(percept));\n      }\n    }\n    LOW_BATTERY = false;\n  }\n\n  if (!LOW_BATTERY){\n\n    if ( !$isHoleCell(percept, targetCell.row, targetCell.column) )\n      seq.length = 0; //re-planificar\n\n    if (env.battery_chargers.length && my.battery < ($manhattan(my.location, env.battery_chargers[0]) + 5)*knowledge.costs.battery.good_move && my.score > 20){\n      goal.agent.stats.filled_cells = my.stats.filled_cells;\n      goal.agent.stats.battery_recharge = my.stats.battery_recharge + 1;\n      my.battery = 1000;\n      seq = $greedyBestFirstLimitedSearch(percept, goal, knowledge.grid_total_rows + knowledge.grid_total_columns, 1500);\n      if ((!seq || !seq.length)){\n        goal.agent.location;\n        $return($randomValidAction(percept));\n      }else\n        LOW_BATTERY = true;\n    }\n  }\n\n  action = $nextAction(seq);\n\n  ExpectedLoc.row = my.location.row;\n  ExpectedLoc.column = my.location.column;\n\n  switch(action){\n    case _NORTH:\n      ExpectedLoc.row--; break;\n    case _SOUTH:\n      ExpectedLoc.row++; break;\n    case _WEST:\n      ExpectedLoc.column--; break;\n    case _EAST:\n      ExpectedLoc.column++;\n  }\n\n  $return(action);\n}"},"onStart":{"cursor":{"row":16,"column":0},"code":"/*\n* Write here the code you want to run only once, when the simulation starts\n* and the first perception is received.\n* (Useful for variables / data structures initialization)\n*/\n\n\n/*\n* this function handles the on-start event.\n* The On-start event is fired when the 3D T-World game starts\n* and the perception is sent for the very first time.\n*/\nfunction onStart(percept){\n  ExpectedLoc = percept.agent.location;\n  goalToCenter.agent.location.row = (percept.builtin_knowledge.grid_total_rows/2)|0;\n  goalToCenter.agent.location.column = (percept.builtin_knowledge.grid_total_columns/2)|0;\n}"},"onMessage":{"cursor":{"row":0,"column":0},"code":"/*\n* NOTE: If your agent is not going to perform in a cooperative\n* multiagent environment, then just ignore this section of code;\n* Otherwise write here the code you want to run every time your agent \n* receives a message from a teammate.\n*/\n\n\n/*\n* this function handles the on-message-received event.\n* The on-message-received event is fired when the agent receives a message\n* from a teammate.\n* NOTE: there are two functions to send messages to the agent's teammates:\n*\n*   $sendMessage(agentID, message)  sends <message> object to the agent\n*                                   with id <agentID> e.g.\n*                                   $sendMessage(1, {newGoal: [10,15]});\n*                                   sends a message to the \"agent 1\" to let him know,\n*                                   for instance, that the \"New Goal\" is at (10,15)\n*\n*   $sendTeamMessage(message))      sends <message> object to all the\n*                                   agent's teammates\n*/\nfunction onMessageReceived(message){\n  \n}"},"global":{"cursor":{"row":10,"column":4},"code":"/*\n* this section of code is used to declare/define functions and variables that are visible/accessible\n* from all the other sections of code, namely the \"Agent Program\", \"Start Event\" and \"Message Received Event\"\n* sections above\n*/\nvar hole;\n\nvar seq = [];\n\nvar goalToCenter = {agent:{location:{row:-1,column:-1}}};\nvar targetCell = {row:-1, column:-1};\nvar goal = {\n              agent:{\n                stats:{\n                  filled_cells:0,\n                  battery_recharge:0\n                }\n              }\n            };\n\n\nvar LOW_BATTERY = false;\n\nvar ExpectedLoc;\nvar action;\n"}},"socket":{"ip_address":"localhost","port":3313,"magic_string":"Closed-Loop Problem-Solving Agent","percept_format":0},"percept":{"sync":true,"interval":500},"keyboard":true,"controls":{"Up":38,"Down":40,"Left":37,"Right":39,"Restore":16},"builtin":true,"default_task_env":1411693091084}, {"name":"Human Remote Control","desc":"Agent will be controlled by the user using a remote control app (you can download the tw-control app for Android from this link: http://tworld-ai.com/resrc/tw-control.apk)","date":1411409368971,"team":-1,"ai":false,"javascript":true,"source":{"file":false,"agentProgram":{"cursor":{"row":0,"column":0},"code":"/*\n* Use this function to write your \"agent program\" (Colloquially speaking, your robot's \"brain\")\n* This function is called each time the agent (i.e. the robot) finish performing an action.\n* It receives a <percept> object and based on the information provided by this object it should $return\n* the right _ACTION.\n* NOTE: Allowed _ACTIONS(s) are:\n*       _ACTION.NORTH   or _NORTH\n*       _ACTION.SOUTH   or _SOUTH\n*       _ACTION.WEST    or _WEST\n*       _ACTION.EAST    or _EAST\n*       _ACTION.RESTORE or _RESTORE    robot restores its battery\n*       _ACTION.NONE    or _NONE       robot do nothing so it just perceives, i.e. this\n*                                      AGENT_PROGRAM function is executed with a\n*                                      new, updated, <percept> object (calling the $perceive()\n*                                      function produces the same effect)\n*\n* The structure of the <percept> parameter below is described in the support material\n*/\nfunction AGENT_PROGRAM(percept){\n\n    $return(_ACTION.NONE); //<- An example of how actions should be returned\n}"},"onStart":{"cursor":{"row":0,"column":0},"code":"/*\n* Write here the code you want to run only once, when the simulation starts, e.g.\n* variables / data structures initialization\n*/\n\n\n/*\n* this function handles the on-start event.\n* The On-start event is fired when the 3D T-World game starts\n* and the perception is sent for the very first time.\n*/\nfunction onStart(percept){\n\n}"},"onMessage":{"cursor":{"row":0,"column":0},"code":"/*\n* NOTE: If your agent is not going to perform in a cooperative\n* multiagent environment, then just ignore this section of code;\n* Otherwise write here the code you want to run every time your agent \n* receives a message from a teammate.\n*/\n\n\n/*\n* this function handles the on-message-received event.\n* The on-message-received event is fired when the agent receives a message\n* from a teammate.\n* NOTE: there are two functions to send messages to the agent's teammates:\n*\n*   $sendMessage(agentID, message)  sends <message> object to the agent\n*                                   with id <agentID> e.g.\n*                                   $sendMessage(1, {newGoal: [10,15]});\n*                                   sends a message to the \"agent 1\" to let him know,\n*                                   for instance, that the \"New Goal\" is at (10,15)\n*\n*   $sendTeamMessage(message))      sends <message> object to all the\n*                                   agent's teammates\n*/\nfunction onMessageReceived(message){\n  \n}"},"global":{"cursor":{"row":0,"column":0},"code":"/*\n* this section of code is used to declare/define variables that are visible/accessible\n* from all the other sections of code, namely the \"Agent Program\", \"Start Event\" and \"Message Received Event\"\n* sections above\n*/"}},"socket":{"ip_address":"localhost","port":3313,"magic_string":"human","percept_format":0},"percept":{"sync":true,"interval":500},"keyboard":false,"controls":{"Up":38,"Down":40,"Left":37,"Right":39,"Restore":16},"builtin":true},{"name":"Keyboard (Arrows+Shift)","desc":"Agent will be controlled by the user using the keyboard.\nControls: Use the keyboard (Up, Down, Left, Right) to move the agent forwards, backwards, left and right; Use the Shift key to restore the agent's battery when it runs out of energy (agent loses half of its score points when doing this)","date":1411409468971,"team":-1,"ai":false,"javascript":true,"source":{"file":false,"agentProgram":{"cursor":{"row":0,"column":0},"code":"/*\n* Use this function to write your \"agent program\" (Colloquially speaking, your robot's \"brain\")\n* This function is called each time the agent (i.e. the robot) finish performing an action.\n* It receives a <percept> object and based on the information provided by this object it should $return\n* the right _ACTION.\n* NOTE: Allowed _ACTIONS(s) are:\n*       _ACTION.NORTH   or _NORTH\n*       _ACTION.SOUTH   or _SOUTH\n*       _ACTION.WEST    or _WEST\n*       _ACTION.EAST    or _EAST\n*       _ACTION.RESTORE or _RESTORE    robot restores its battery\n*       _ACTION.NONE    or _NONE       robot do nothing so it just perceives, i.e. this\n*                                      AGENT_PROGRAM function is executed with a\n*                                      new, updated, <percept> object (calling the $perceive()\n*                                      function produces the same effect)\n*\n* The structure of the <percept> parameter below is described in the support material\n*/\nfunction AGENT_PROGRAM(percept){\n\n    $return(_ACTION.NONE); //<- An example of how actions should be returned\n}"},"onStart":{"cursor":{"row":0,"column":0},"code":"/*\n* Write here the code you want to run only once, when the simulation starts, e.g.\n* variables / data structures initialization\n*/\n\n\n/*\n* this function handles the on-start event.\n* The On-start event is fired when the 3D T-World game starts\n* and the perception is sent for the very first time.\n*/\nfunction onStart(percept){\n\n}"},"onMessage":{"cursor":{"row":0,"column":0},"code":"/*\n* NOTE: If your agent is not going to perform in a cooperative\n* multiagent environment, then just ignore this section of code;\n* Otherwise write here the code you want to run every time your agent \n* receives a message from a teammate.\n*/\n\n\n/*\n* this function handles the on-message-received event.\n* The on-message-received event is fired when the agent receives a message\n* from a teammate.\n* NOTE: there are two functions to send messages to the agent's teammates:\n*\n*   $sendMessage(agentID, message)  sends <message> object to the agent\n*                                   with id <agentID> e.g.\n*                                   $sendMessage(1, {newGoal: [10,15]});\n*                                   sends a message to the \"agent 1\" to let him know,\n*                                   for instance, that the \"New Goal\" is at (10,15)\n*\n*   $sendTeamMessage(message))      sends <message> object to all the\n*                                   agent's teammates\n*/\nfunction onMessageReceived(message){\n  \n}"},"global":{"cursor":{"row":0,"column":0},"code":"/*\n* this section of code is used to declare/define variables that are visible/accessible\n* from all the other sections of code, namely the \"Agent Program\", \"Start Event\" and \"Message Received Event\"\n* sections above\n*/"}},"socket":{"ip_address":"localhost","port":3313,"magic_string":"Keyboard (Arrows+Shift)","percept_format":0},"percept":{"sync":true,"interval":500},"keyboard":true,"controls":{"Up":38,"Down":40,"Left":37,"Right":39,"Restore":16},"builtin":true},{"name":"Keyboard WASDE","desc":"Agent will be controlled by the user using the keyboard.\nControls: Use the keyboard (W, A,S,D) to move the agent forwards, backwards, left and right; Use the E key to restore the agent's battery when it runs out of energy (agent loses half of its score points when doing this)","date":1411409974028,"team":-1,"ai":false,"javascript":true,"source":{"file":false,"agentProgram":{"cursor":{"row":0,"column":0},"code":"/*\n* Use this function to write your \"agent program\" (Colloquially speaking, your robot's \"brain\")\n* This function is called each time the agent (i.e. the robot) finish performing an action.\n* It receives a <percept> object and based on the information provided by this object it should $return\n* the right _ACTION.\n* NOTE: Allowed _ACTIONS(s) are:\n*       _ACTION.NORTH   or _NORTH\n*       _ACTION.SOUTH   or _SOUTH\n*       _ACTION.WEST    or _WEST\n*       _ACTION.EAST    or _EAST\n*       _ACTION.RESTORE or _RESTORE    robot restores its battery\n*       _ACTION.NONE    or _NONE       robot do nothing so it just perceives, i.e. this\n*                                      AGENT_PROGRAM function is executed with a\n*                                      new, updated, <percept> object (calling the $perceive()\n*                                      function produces the same effect)\n*\n* The structure of the <percept> parameter below is described in the support material\n*/\nfunction AGENT_PROGRAM(percept){\n\n    $return(_ACTION.NONE); //<- An example of how actions should be returned\n}"},"onStart":{"cursor":{"row":0,"column":0},"code":"/*\n* Write here the code you want to run only once, when the simulation starts, e.g.\n* variables / data structures initialization\n*/\n\n\n/*\n* this function handles the on-start event.\n* The On-start event is fired when the 3D T-World game starts\n* and the perception is sent for the very first time.\n*/\nfunction onStart(percept){\n\n}"},"onMessage":{"cursor":{"row":0,"column":0},"code":"/*\n* NOTE: If your agent is not going to perform in a cooperative\n* multiagent environment, then just ignore this section of code;\n* Otherwise write here the code you want to run every time your agent \n* receives a message from a teammate.\n*/\n\n\n/*\n* this function handles the on-message-received event.\n* The on-message-received event is fired when the agent receives a message\n* from a teammate.\n* NOTE: there are two functions to send messages to the agent's teammates:\n*\n*   $sendMessage(agentID, message)  sends <message> object to the agent\n*                                   with id <agentID> e.g.\n*                                   $sendMessage(1, {newGoal: [10,15]});\n*                                   sends a message to the \"agent 1\" to let him know,\n*                                   for instance, that the \"New Goal\" is at (10,15)\n*\n*   $sendTeamMessage(message))      sends <message> object to all the\n*                                   agent's teammates\n*/\nfunction onMessageReceived(message){\n  \n}"},"global":{"cursor":{"row":0,"column":0},"code":"/*\n* this section of code is used to declare/define variables that are visible/accessible\n* from all the other sections of code, namely the \"Agent Program\", \"Start Event\" and \"Message Received Event\"\n* sections above\n*/"}},"socket":{"ip_address":"localhost","port":3313,"magic_string":"Keyboard WASDE","percept_format":0},"percept":{"sync":true,"interval":500},"keyboard":true,"controls":{"Up":87,"Down":83,"Left":65,"Right":68,"Restore":69},"builtin":true},{"name":"PROLOG Iterative Depth-First Search","desc":"Iterative Depth-First search implementation in PROLOG. This agent program works in any task environment in which the goal is to fill a certain number of holes and then locate the agent at a certain location. Instructions are in the README file that is included along with the source code in the zip file.","date":1411411233884,"team":-1,"ai":true,"javascript":false,"source":{"file":true,"agentProgram":{"cursor":{"row":0,"column":0},"code":"/*\n* Use this function to write your \"agent program\" (Colloquially speaking, your robot's \"brain\")\n* This function is called each time the agent (i.e. the robot) finish performing an action.\n* It receives a <percept> object and based on the information provided by this object it should $return\n* the right _ACTION.\n* NOTE: Allowed _ACTIONS(s) are:\n*       _ACTION.NORTH   or _NORTH\n*       _ACTION.SOUTH   or _SOUTH\n*       _ACTION.WEST    or _WEST\n*       _ACTION.EAST    or _EAST\n*       _ACTION.RESTORE or _RESTORE    robot restores its battery\n*       _ACTION.NONE    or _NONE       robot do nothing so it just perceives, i.e. this\n*                                      AGENT_PROGRAM function is executed with a\n*                                      new, updated, <percept> object (calling the $perceive()\n*                                      function produces the same effect)\n*\n* The structure of the <percept> parameter below is described in the support material\n*/\nfunction AGENT_PROGRAM(percept){\n\n    $return(_ACTION.NONE); //<- An example of how actions should be returned\n}"},"onStart":{"cursor":{"row":0,"column":0},"code":"/*\n* Write here the code you want to run only once, when the simulation starts, e.g.\n* variables / data structures initialization\n*/\n\n\n/*\n* this function handles the on-start event.\n* The On-start event is fired when the 3D T-World game starts\n* and the perception is sent for the very first time.\n*/\nfunction onStart(percept){\n\n}"},"onMessage":{"cursor":{"row":0,"column":0},"code":"/*\n* NOTE: If your agent is not going to perform in a cooperative\n* multiagent environment, then just ignore this section of code;\n* Otherwise write here the code you want to run every time your agent \n* receives a message from a teammate.\n*/\n\n\n/*\n* this function handles the on-message-received event.\n* The on-message-received event is fired when the agent receives a message\n* from a teammate.\n* NOTE: there are two functions to send messages to the agent's teammates:\n*\n*   $sendMessage(agentID, message)  sends <message> object to the agent\n*                                   with id <agentID> e.g.\n*                                   $sendMessage(1, {newGoal: [10,15]});\n*                                   sends a message to the \"agent 1\" to let him know,\n*                                   for instance, that the \"New Goal\" is at (10,15)\n*\n*   $sendTeamMessage(message))      sends <message> object to all the\n*                                   agent's teammates\n*/\nfunction onMessageReceived(message){\n  \n}"},"global":{"cursor":{"row":0,"column":0},"code":"/*\n* this section of code is used to declare/define variables that are visible/accessible\n* from all the other sections of code, namely the \"Agent Program\", \"Start Event\" and \"Message Received Event\"\n* sections above\n*/"}},"socket":{"ip_address":"localhost","port":3313,"magic_string":"idfs","percept_format":"tw_msg(header(%s), data(%s)).\n"},"percept":{"sync":true,"interval":500},"keyboard":true,"controls":{"Up":38,"Down":40,"Left":37,"Right":39,"Restore":16},"builtin":true},{"name":"SAPMG Cooperative","desc":"Agent program that solves the default \"Hello World\"-Like Cooperative Environment. This is meant to be a basic example to illustrate how agents can communicate with each other (via message passing) in order to solve a goal. Once an agent has been located at the right location, sends a message to the next agent to tell him that it is his turn to perform. Note that, in this example, every agent program runs the same agent program code but in the more general case each agent can run its own code, even written in any other language other than just JavaScript.","date":1411412233884,"team":-1,"ai":true,"javascript":true,"source":{"file":false,"agentProgram":{"cursor":{"row":9,"column":2},"code":"/*\n  Agent program that solves the default \"Hello World\"-Like Cooperative Environment.\n  This is  meant to  be a basic  example  to  illustrate how agents can communicate\n  with  each other (via message passing) in order  to solve a goal.  Once an  agent\n  has been located at the right location, it sends a  message to the  next agent to\n  tell  him that  it is his turn   to perform. Note that,  in this  example,  every \n  agent  program  runs the  same agent program  code but in the more  general  case\n  each agent can run its  own code, even  written in  any other language other than\n  just JavaScript.\n*/\nfunction AGENT_PROGRAM(percept){\n  var my = percept.agent;\n\n  switch(state){\n\n    case _STATE.RECEIVED: // case I have received the massage from my teammate\n      // create a new goal, exluding the already solved locations that I have\n      // received from my teammate\n      goal.agent.location = $getClosestCell(my.location, _GOAL_LOCATIONS, alreadySolved);\n      // add this location to the \"alreadySolved\" list\n      // so that the next teammate dosn't take it into account\n      alreadySolved.push(goal.agent.location);\n      // and search for a solution (an action sequence)\n      seq = $greedyBestFirstSearch(percept, goal, true, 100);\n      state = _STATE.SOLVED;\n      break;\n\n    case _STATE.SOLVED: // case I have generated a solution\n      // if I have actions to be executed\n      if (!seq.empty())\n        $return($nextAction(seq));\n      else{\n        // if I have executed all the actions of the solution,\n        // send a mesage to the next teammate to let him know\n        // it his time to act and find a free location\n        // (not in the alreadySolved list)\n        $sendMessage(my.id + 1, alreadySolved);\n        state = _STATE.DONE;\n      }\n\n  }\n\n}"},"onStart":{"cursor":{"row":11,"column":49},"code":"/*\n* this function handles the on-start event.\n* The On-start event is fired when the 3D T-World game starts\n* and the perception is sent for the very first time.\n*/\nfunction onStart(percept){\n  var teams = percept.builtin_knowledge.teams;\n  var my = percept.agent;\n  var I_am_the_leader = false;\n\n  // _GOAL_LOCATIONS initialization\n  _GOAL_LOCATIONS = percept.builtin_knowledge.end.success.agents_location;\n\n  // shearching for my team\n  for (var t=teams.length; t--;)\n    //if my team is the i-th team and I am the leader\n    if (teams[t].id == my.team_id && teams[t].leader == my.id)\n      //then, I know I'm the leader\n      I_am_the_leader = true;\n  \n  // if I am the leader\n  if (I_am_the_leader){\n    // create a new goal\n    goal.agent.location = $getClosestCell(my.location, _GOAL_LOCATIONS);\n    // add this location to the \"alreadySolved\" list\n    // so that the next teammate dosn't take it into account\n    alreadySolved.push(goal.agent.location);\n    // and search for a solution (an action sequence)\n    seq = $greedyBestFirstSearch(percept, goal, true, 100);\n    state = _STATE.SOLVED;\n  }\n}"},"onMessage":{"cursor":{"row":18,"column":1},"code":"/*\n* this function handles the on-message-received event.\n* The on-message-received event is fired when the agent receives a message\n* from a teammate.\n* NOTE: there are two functions to send messages to the agent's teammates:\n*\n*   $sendMessage(agentID, message)  sends <message> object to the agent\n*                                   with id <agentID> e.g.\n*                                   $sendMessage(1a, {newGoal: [10,15]});\n*                                   sends a message to the \"agent 1\" to let him know,\n*                                   for instance, that the \"New Goal\" is at (10,15)\n*\n*   $sendTeamMessage(message))      sends <message> object to all the\n*                                   agent's teammates\n*/\nfunction onMessageReceived(data){\n  alreadySolved = data;\n  state = _STATE.RECEIVED;\n}"},"global":{"cursor":{"row":0,"column":0},"code":"\n// constants\nvar _GOAL_LOCATIONS;\nvar _STATE = {RECEIVED:0, SOLVED:1, DONE:2};\n\n// current state\nvar state = _STATE.WAITING;\n\n// an action sequence\nvar seq = [];\n\n// list of already solved locations\n// (this list is going to be received from the last teammate that has been located\n//  at the right location)\nvar alreadySolved = [];\n\n// the goal to be accomplished, that is, the location the agent has to\n// be located at, initially undefined\nvar goal = { agent:{ location: undefined } };"}},"socket":{"ip_address":"localhost","port":3313,"magic_string":"SAPMG Cooperative","percept_format":0},"percept":{"sync":true,"interval":500},"keyboard":true,"controls":{"Up":38,"Down":40,"Left":37,"Right":39,"Restore":16},"builtin":true,"default_task_env":1411022822403},{"name":"Simple Reflex Agent (Figure 2.10)","desc":"Implementation of the algorithm shown in Figure 2.10 of the book Artificial Intelligence: A modern approach. It acts according  to a rule whose condition matches the current state, as defined by the percept.","date":1411507555867,"team":-1,"ai":true,"javascript":true,"source":{"file":false,"agentProgram":{"cursor":{"row":0,"column":0},"code":"/*\n  SIMPLE REFLEX AGENT\n*/\nfunction AGENT_PROGRAM(percept){\n  // generate an abstracted description of the current state of the world\n  state = INTERPRET_INPUT(percept);\n  // see what rule matches the given state description\n  rule = RULE_MATCH(state, rules);\n  // get the action of the matched rule\n  action = rule.ACTION;\n  // and return it\n  $return(action);\n}"},"onStart":{"cursor":{"row":7,"column":1},"code":"/*\n* this function handles the on-start event.\n* The On-start event is fired when the 3D T-World game starts\n* and the perception is sent for the very first time.\n*/\nfunction onStart(percept){\n /*nothing here*/\n}"},"onMessage":{"cursor":{"row":0,"column":2},"code":"/*\n* this function handles the on-message-received event.\n* The on-message-received event is fired when the agent receives a message\n* from a teammate.\n* NOTE: there are two functions to send messages to the agent's teammates:\n*\n*   $sendMessage(agentID, message)  sends <message> object to the agent\n*                                   with id <agentID> e.g.\n*                                   $sendMessage(1, {newGoal: [10,15]});\n*                                   sends a message to the \"agent 1\" to let him know,\n*                                   for instance, that the \"New Goal\" is at (10,15)\n*\n*   $sendTeamMessage(message))      sends <message> object to all the\n*                                   agent's teammates\n*/\nfunction onMessageReceived(message){\n  /*nothing here*/\n}"},"global":{"cursor":{"row":0,"column":0},"code":"\nvar state; // the agent's current conception of the world state\nvar rules = new Array(4); // a set of condition-action rules\n\n/*\n  INTERPRET_INPUT function generates an abstracted of the current state\n  from the percept\n*/\nfunction INTERPRET_INPUT(percept){\n  var state = new Array(4);\n  var loc = percept.agent.location;\n\n  state[_NORTH] = $isValidMove(percept, _NORTH);\n  state[_SOUTH] = $isValidMove(percept, _SOUTH);\n  state[_WEST ] = $isValidMove(percept, _WEST );\n  state[_EAST ] = $isValidMove(percept, _EAST );\n  \n  if (state[_NORTH] && $isTile(percept, loc.row-1, loc.column))\n    state[_NORTH] = _GRID_CELL.TILE;\n\n  if (state[_SOUTH] && $isTile(percept, loc.row+1, loc.column))\n    state[_SOUTH] = _GRID_CELL.TILE;\n\n  if (state[_WEST] && $isTile(percept, loc.row, loc.column-1))\n    state[_WEST] = _GRID_CELL.TILE;\n\n  if (state[_EAST] && $isTile(percept, loc.row, loc.column+1))\n    state[_EAST] = _GRID_CELL.TILE;\n\n  return state;\n}\n\n/*\n  RULE_MATCH function returns the first rule in the set of rules that matches\n  the given state description, or a random rule in case of no matches\n*/\nfunction RULE_MATCH(state, rules){\n  var r_rules = [];\n\n  for(var i=rules.length;i--;)\n    if (rules[i].match(state))\n      return rules[i];\n    else\n    if (state[i])\n      r_rules.push(rules[i]);\n\n  return r_rules[random(r_rules.length)];\n}\n\n/*\n  rules: a set of condition-action rules\n*/\nrules[_NORTH] = {\n    ACTION: _NORTH,\n    match: function(state){return state[_NORTH] == _GRID_CELL.TILE}\n  };\n\nrules[_SOUTH] = {\n    ACTION: _SOUTH,\n    match: function(state){return state[_SOUTH] == _GRID_CELL.TILE}\n  };\n\nrules[_EAST] = {\n    ACTION: _EAST,\n    match: function(state){return state[_EAST] == _GRID_CELL.TILE}\n  };\n\nrules[_WEST] = {\n    ACTION: _WEST,\n    match: function(state){return state[_WEST] == _GRID_CELL.TILE}\n  };\n"}},"socket":{"ip_address":"localhost","port":3313,"magic_string":"Simple Reflex Agent (Figure 2.10)","percept_format":0},"percept":{"sync":true,"interval":500},"keyboard":true,"controls":{"Up":38,"Down":40,"Left":37,"Right":39,"Restore":16},"builtin":true,"default_task_env":1411073490467},{"name":"Model-Based Reflex Agent  (Figure 2.12)","desc":"Implementation of the algorithm shown in Figure 2.12 of the book Artificial Intelligence: A modern approach. It keeps track of the current state of the world, using an internal model. It then chooses an action in the same way as the reflex agent. The agent remembers all the cells it has perceived and the number of times it has been located at a certain cell.","date":1411584560161,"team":-1,"ai":true,"javascript":true,"source":{"file":false,"agentProgram":{"cursor":{"row":0,"column":0},"code":"/*\n  MODEL-BASED REFLEX AGENT\n*/\nfunction AGENT_PROGRAM(percept){var rule;\n  // create a new, updated, internal state\n  state = UPDATE_STATE(state, action, percept, model);\n  // see what rule matches the current internal state\n  rule = RULE_MATCH(state, rules);\n  // get the action of the matched rule\n  action = rule.ACTION;\n  // and return it\n  $return(action);\n}"},"onStart":{"cursor":{"row":0,"column":0},"code":"/*\n* this function handles the on-start event.\n* The On-start event is fired when the 3D T-World game starts\n* and the perception is sent for the very first time.\n*/\nfunction onStart(percept){\n /*nothing here*/\n}"},"onMessage":{"cursor":{"row":0,"column":0},"code":"/*\n* this function handles the on-message-received event.\n* The on-message-received event is fired when the agent receives a message\n* from a teammate.\n* NOTE: there are two functions to send messages to the agent's teammates:\n*\n*   $sendMessage(agentID, message)  sends <message> object to the agent\n*                                   with id <agentID> e.g.\n*                                   $sendMessage(1, {newGoal: [10,15]});\n*                                   sends a message to the \"agent 1\" to let him know,\n*                                   for instance, that the \"New Goal\" is at (10,15)\n*\n*   $sendTeamMessage(message))      sends <message> object to all the\n*                                   agent's teammates\n*/\nfunction onMessageReceived(message){\n  /*nothing here*/\n}"},"global":{"cursor":{"row":0,"column":0},"code":"\nvar model = {}; // a description of how the next state depends on the current state and action\nvar rules = new Array(8); // a set of condition-action rules\nvar action = _NONE; // the most recent action, initially none\nvar state = { // the agent's current conception of the world state\n              grid:[\n                [\"\",\"\",\"\"],\n                [\"\",\"\",\"\"],\n                [\"\",\"\",\"\"]\n              ],\n              loc:{row:0, column:0} //percept matrix origin\n            }; \n\n/*\n  UPDATE_STATE function is responsable for creating a new internal state\n*/\nfunction UPDATE_STATE(state, action, percept, model){\n  var grid, loc = state.loc;\n\n  // 1) updating the internal state structure according to what my action was\n  // and the new percept object and making room for the new data provided by the percept\n  model.apply_action(action, state);\n\n  // 2) updating the cells value of our internal state grid according to our current perception\n  for (var r=0, percept_cell, state_cell; r < 3; ++r)\n    for (var c=0; c < 3; ++c){\n      percept_cell = percept.environment.grid[r][c];\n      state_cell = state.grid[loc.row+r][loc.column+c];\n\n      if (state.grid[loc.row+r].length-1 < loc.column+c)\n        state.grid[loc.row+r].length = loc.column+c+1;\n\n      if (percept_cell != _GRID_CELL.AGENT){\n        if (!state_cell && state_cell!==0)\n          state.grid[loc.row+r][loc.column+c] = isHoleCell(percept_cell)?\n                                                  _GRID_CELL.OBSTACLE :\n                                                  (percept_cell == _GRID_CELL.EMPTY? 0 : percept_cell);\n      }else{\n        if (!state_cell)\n          state.grid[loc.row+r][loc.column+c] = 0;\n\n        state.grid[loc.row+r][loc.column+c]++;\n      }\n    }\n\n  // 3) printing the new internal state\n  grid = copy(state.grid);\n  grid[loc.row+1][loc.column+1] = _GRID_CELL.AGENT;\n  $printMatrix(grid);\n\n  return state;\n}\n\n/*\n  RULE_MATCH function returns the first rule in the set of rules that\n  matches the given state description.\n*/\nfunction RULE_MATCH(state, rules){\n  for (var i=0; i < rules.length; ++i)\n    if (rules[i].match(state))\n      return rules[i];\n}\n\n/*\n  model: a description of how the next state depends on the current state and action\n*/\nmodel.apply_action = function(action, state){ var r, loc = state.loc;\n  // update the internal state structure according to what my action was\n  // and the new percept object;\n  // if needed, make room in the grid for the new data provided by the percept\n  switch(action){\n    case _NORTH:\n      state.loc.row--;\n      if (state.loc.row < 0){\n        state.loc.row=0;\n        state.grid.unshift([\"\",\"\",\"\"]); // adding new row on demand at the top\n      }\n      break;\n    case _SOUTH:\n      state.loc.row++;\n      if (state.grid.length < state.loc.row+3)\n        state.grid.push([\"\",\"\",\"\"]); // adding new row on demand at the bottom\n      break;\n    case _WEST:\n      state.loc.column--;\n      if (state.loc.column < 0){\n        state.loc.column=0;\n        for (r=0; r < state.grid.length; ++r)\n          state.grid[r].unshift(\"\"); // adding new column on demand on the left side\n      }\n      break;\n    case _EAST:\n      state.loc.column++;\n      for (r=loc.row; r < loc.row+3; ++r)\n        if (state.grid[r].length < loc.row.column+3)\n          state.grid[r].push(\"\"); // adding new column on demand on the right side\n      break;\n  }\n};\n\n/*\n  rules: a set of condition-action rules\n*/\nrules[0] = {\n  ACTION: _NORTH,\n  match : function(state){\n    return  state.grid[(state.loc.row+1)-1][state.loc.column+1] == _GRID_CELL.BATTERY_CHARGER;\n  }\n};\nrules[1] = {\n  ACTION: _SOUTH,\n  match : function(state){\n    return  state.grid[(state.loc.row+1)+1][state.loc.column+1] == _GRID_CELL.BATTERY_CHARGER;\n  }\n};\nrules[2] = {\n  ACTION: _WEST,\n  match : function(state){\n    return  state.grid[state.loc.row+1][(state.loc.column+1)-1] == _GRID_CELL.BATTERY_CHARGER;\n  }\n};\nrules[3] = {\n  ACTION: _EAST,\n  match : function(state){\n    return  state.grid[state.loc.row+1][(state.loc.column+1)+1] == _GRID_CELL.BATTERY_CHARGER;\n  }\n};\nrules[4] = {\n  ACTION: _NORTH,\n  match : function(state){ return  findCellWithTheLeastNumber(state) == _NORTH; }\n};\nrules[5] = {\n  ACTION: _SOUTH,\n  match : function(state){ return  findCellWithTheLeastNumber(state) == _SOUTH; }\n};\nrules[6] = {\n  ACTION: _WEST,\n  match : function(state){ return  findCellWithTheLeastNumber(state) == _WEST; }\n};\nrules[7] = {\n  ACTION: _EAST,\n  match : function(state){ return  findCellWithTheLeastNumber(state) == _EAST; }\n};\n\n\n\n/*\n  AUXILIARY STUFF ZONE\n*/\n\n// returns the action that takes the agent to the cell with the least number\n// (note: this number represent the number of times the agent has been located at a certain cell)\nfunction findCellWithTheLeastNumber(state){\n  var a_r = state.loc.row+1;\n  var a_c = state.loc.column+1;\n  var cells = [];\n\n  if (isNumber(state.grid[a_r-1][a_c]))\n    cells.push({ACTION: _NORTH, val: state.grid[a_r-1][a_c]});\n  if (isNumber(state.grid[a_r+1][a_c]))\n    cells.push({ACTION: _SOUTH, val: state.grid[a_r+1][a_c]});\n  if (isNumber(state.grid[a_r][a_c-1]))\n    cells.push({ACTION: _WEST, val: state.grid[a_r][a_c-1]});\n  if (isNumber(state.grid[a_r][a_c+1]))\n    cells.push({ACTION: _EAST, val: state.grid[a_r][a_c+1]});\n\n  //sorting the cells (ascending)\n  cells.sort(function(a,b){return a.val - b.val});\n\n  // returing action that takes the agent to the cell with the least number\n  return cells[0].ACTION;\n}\n\nfunction isHoleCell(cell){return isNumber(cell);}"}},"socket":{"ip_address":"localhost","port":3313,"magic_string":"Model-Based Reflex Agent  (Figure 2.12)","percept_format":0},"percept":{"sync":true,"interval":500},"keyboard":true,"controls":{"Up":38,"Down":40,"Left":37,"Right":39,"Restore":16},"builtin":true,"default_task_env":1411412859470},{"name":"Simple Problem-Solving Agent (Figure 3.1)","desc":"Implementation of the algorithm shown in Figure 3.1 of the book Artificial Intelligence: A modern approach. A simple problem-solving agent. It first formulates a goal and a problem, searches for a sequence of actions that would solve the problem, and then executes the actions one at a time. When this is complete, it formulates another goal (fill the closest hole cell) and starts over.","date":1411591281612,"team":-1,"ai":true,"javascript":true,"source":{"file":false,"agentProgram":{"cursor":{"row":9,"column":26},"code":"/*\n  SIMPLE PROBLEM-SOLVING AGENT\n*/\nfunction AGENT_PROGRAM(percept){var action;\n  state = UPDATE_STATE(state, percept);\n  \n  // if you don't have a solution\n  // (i.e. if the action sequence that solve the problem is empty)\n  if (seq.empty()){\n    // Formulate a new goal and \n    goal = FORMULATE_GOAL(state);\n    // problem to solve, then\n    problem = FORMULATE_PROBLEM(state, goal);\n    // search for a solution (an action sequence)\n    seq = SEARCH(problem, _SEARCH_ALGORITHM.A_STAR);\n    if (seq.empty()) $return(_ACTION.NONE);\n  }\n  \n  // use the solution to guide your actions\n  // doing whatever the solution recommends as the next thing to do\n  action = FIRST(seq);\n  //and then remove that step from the sequence\n  seq = REST(seq);\n\n  $return(action);\n}"},"onStart":{"cursor":{"row":6,"column":16},"code":"/*\n* this function handles the on-start event.\n* The On-start event is fired when the 3D T-World game starts\n* and the perception is sent for the very first time.\n*/\nfunction onStart(percept){\n  /*nothing here*/\n}"},"onMessage":{"cursor":{"row":1,"column":54},"code":"/*\n* this function handles the on-message-received event.\n* The on-message-received event is fired when the agent receives a message\n* from a teammate.\n* NOTE: there are two functions to send messages to the agent's teammates:\n*\n*   $sendMessage(agentID, message)  sends <message> object to the agent\n*                                   with id <agentID> e.g.\n*                                   $sendMessage(1, {newGoal: [10,15]});\n*                                   sends a message to the \"agent 1\" to let him know,\n*                                   for instance, that the \"New Goal\" is at (10,15)\n*\n*   $sendTeamMessage(message))      sends <message> object to all the\n*                                   agent's teammates\n*/\nfunction onMessageReceived(message){\n  /*nothing here*/\n}"},"global":{"cursor":{"row":0,"column":0},"code":"\r\nvar seq = []; // an action sequence, initially empty\r\nvar state; // some description of the current world state\r\nvar goal = null; // a goal, initially null\r\nvar problem; // a problem formulation\r\n\r\nfunction UPDATE_STATE(state, percept){return percept;}\r\nfunction FIRST(seq){if (!seq.empty()) return seq[0]; else return _ACTION.NONE;}\r\nfunction REST(seq){seq.shift(); return seq;}\r\nfunction FORMULATE_PROBLEM(state, goal){ return {state: state, goal:goal} }\r\n\r\nfunction FORMULATE_GOAL(state){\r\n  if (goal === null)\r\n    goal = {\r\n      agent:{ stats:{ filled_holes:0 } }\r\n    };\r\n  \r\n  goal.agent.stats.filled_holes++;\r\n  \r\n  return goal;\r\n}\r\n\r\nfunction SEARCH(problem, strategy){ var illustrated = true;\r\n  switch(strategy){\r\n    case _SEARCH_ALGORITHM.BFS:    return $breadthFirstSearch(problem.state, problem.goal, illustrated);\r\n    case _SEARCH_ALGORITHM.DFS:    return $depthFirstSearch(problem.state, problem.goal, illustrated);\r\n    case _SEARCH_ALGORITHM.IDFS:   return $iterativeDepthFirstSearch(problem.state, problem.goal, illustrated);\r\n    case _SEARCH_ALGORITHM.A_STAR: return $aStarBestFirstSearch(problem.state, problem.goal, illustrated);\r\n    case _SEARCH_ALGORITHM.GREEDY: return $greedyBestFirstSearch(problem.state, problem.goal, illustrated);\r\n  }\r\n}"}},"socket":{"ip_address":"localhost","port":3313,"magic_string":"Simple Problem-Solving Agent (Figure 3.1)","percept_format":0},"percept":{"sync":true,"interval":500},"keyboard":true,"controls":{"Up":38,"Down":40,"Left":37,"Right":39,"Restore":16},"builtin":true,"default_task_env":1411067311418},{"name":"Greedy Best-First Search (Multiple Goals)","desc":"This agent program solves the \"14x14 Multiple Goals\" default task environment using an informed search strategy (Greedy Best-First Search).  The code shows how the use of built-in functions such as $nextAction and $greedyBestFirstSearch can help to solve this kind of problems with just a few lines of code.","date":1411921145795,"team":-1,"ai":true,"javascript":true,"source":{"file":false,"agentProgram":{"cursor":{"row":6,"column":2},"code":"/*\n  Agent program that solves the default \"14x14 Multiple Goals\" task environment.\n  When simulation starts and the very first percept is received (see \"Start Event\" section above)\n  the agent searches for a solution, i.e. an action sequence that leads from the initial state\n  to a goal state. Once a solution is found is stored in the \"seq\" variable, and finally\n  the agent executes every action of the solution one at a time.\n*/\nfunction AGENT_PROGRAM(percept){\n  $return($nextAction(seq));\n}"},"onStart":{"cursor":{"row":6,"column":26},"code":"/*\n* this function handles the on-start event.\n* The On-start event is fired when the 3D T-World game starts\n* and the perception is sent for the very first time.\n*/\nfunction onStart(percept){\n  // search for a solution\n  seq = $greedyBestFirstSearch(percept, goal, true);\n}"},"onMessage":{"cursor":{"row":16,"column":18},"code":"/*\n* this function handles the on-message-received event.\n* The on-message-received event is fired when the agent receives a message\n* from a teammate.\n* NOTE: there are two functions to send messages to the agent's teammates:\n*\n*   $sendMessage(agentID, message)  sends <message> object to the agent\n*                                   with id <agentID> e.g.\n*                                   $sendMessage(1, {newGoal: [10,15]});\n*                                   sends a message to the \"agent 1\" to let him know,\n*                                   for instance, that the \"New Goal\" is at (10,15)\n*\n*   $sendTeamMessage(message))      sends <message> object to all the\n*                                   agent's teammates\n*/\nfunction onMessageReceived(message){\n  /* nothing here */\n}"},"global":{"cursor":{"row":2,"column":32},"code":"\nvar seq = []; // an action sequence that leads from the initial state\n              // to a goal state. (a solution)\n\n\n// \"The agent's goals are to score at least 30 points and to get to the\n// battery charger cell at least once\"\nvar goal = { // goal state (agent's goals)\n            agent: {\n              score: 30,\n              stats:{ battery_recharge:1 }\n            }\n          };"}},"socket":{"ip_address":"localhost","port":3313,"magic_string":"Greedy Best-First Search (Multiple Goals)","percept_format":0},"percept":{"sync":true,"interval":500},"keyboard":true,"controls":{"Up":38,"Down":40,"Left":37,"Right":39,"Restore":16},"builtin":true,"default_task_env":1411060605543}];
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

    $root.$error = false;

    $.ajax({
        type: "POST",
        url : 'http://tworld-ai.com/rest/main.php',
        data : data,
        success: function(data, textStatus, jqXHR){
            $root.$loading = false;
            onsucces(data, textStatus, jqXHR);
        },
        error: function(jqXHR, textStatus, errorThrown){
            onerror(jqXHR, textStatus, errorThrown);
            $root.$error = true;
            if ($root.$apply)
                $root.$apply();
        }
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
        error: function(jqXHR, textStatus, errorThrown){
            onerror(jqXHR, textStatus, errorThrown);
            $root.$error = true;
            if ($root.$apply)
                $root.$apply();
        }
    });
}