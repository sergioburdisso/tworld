(function(){
	var main = angular.module("tworld", ['tworldMainMenu', 'tworldEnvironments', 'tworldAgentPrograms', 'ui.bootstrap', 'ui.slider', 'ngRoute', 'ngAnimate']);

	main.config(['$routeProvider', '$locationProvider', '$tooltipProvider',
		function($routeProvider, $locationProvider, $tooltipProvider) {
			$routeProvider
				.when('/', {
					templateUrl: 'main-manu.html',
					controller: 'MainMenuController',
					controllerAs: 'mmc'
				})
				.when('/environments', {
					templateUrl: 'environments.html',
					controller: 'EnvController',
					controllerAs: 'ec'
				})
				.when('/environments/new', {
					templateUrl: 'environments-new.html',
					controller: 'EnvNewController',
					controllerAs: 'enc',
					resolve:{
						taskEnv : function(){ 
						return {
								trial: {//Each trial is a self-contained simulation
									/*default trial*/
									test: false,
									runs: 1,
									agents : [],
									speed: 0, //[-9..9]
									pause:  true,
									camera: _CAMERA_TYPE.FREE_GRID
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
										radius: 3,
										noise: false,
										noise_cfg:{
											tile:0.3,
											obstacle:0.3,
											hole:0.3
										}
									},
									determinism:0.8,
									stochastic_model: _STOCHASTIC_ACTIONS_MODEL.ANOTHER_ACTION
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
										["C"," "," "," "," ","#"],
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
							}
						}
					}
				})
				.when('/environments/view/:id', {
					templateUrl: 'environments-new.html',
					controller: 'EnvNewController',
					controllerAs: 'enc',
					resolve:{
						taskEnv : function($route){ 
							return clone(getEnvironmentByDate($route.current.params.id))
						}
					}
				})
				.when('/agent-programs', {
					templateUrl: 'agent-programs.html',
					controller: 'AgentProgController',
					controllerAs: 'apc'
				})
				.when('/agent-programs/view/:id', {
					templateUrl: 'agent-programs-new.html',
					controller: 'AgentProgNewController',
					controllerAs: 'apnc',
					resolve:{
						agentProg:function($route){
						return clone(getAgentProgramByDate($route.current.params.id))
						}
					}
				})
				.when('/agent-programs/new', {
					templateUrl: 'agent-programs-new.html',
					controller: 'AgentProgNewController',
					controllerAs: 'apnc',
					resolve:{
						agentProg:function(){
						return {
								name:"",
								desc:"",
								date:0,
								team:-1,
								ai: true,
								javascript:true,
								source:{
									code: "function AgentProgram(percept){\n\t\n}",
									msg_code: "function onMsgReceived(msg){\n\t\n}",
									cursor:{row:0, column:0}
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
							}
						}
					}
				})
				.when('/agent-programs/source-code/:id', {
					templateUrl: 'agent-programs-source-code.html',
					controller: 'AgentProgSourceCodeController',
					controllerAs: 'apscc'
				})
				.otherwise({
					templateUrl: '404.html'
				});

			$tooltipProvider.options({
				appendToBody: true,
				//placement: 'left',
				popupDelay: 200
			});
		}]
	);

	main.controller("TWorldController", ["$sce", "$location",
		function($sce, $location){
			this.$loc = $location;
			this.LANGUAGES = _LANGUAGES;
			this.language = (window.navigator.userLanguage == 'es' || window.navigator.language == 'es')? this.LANGUAGES.SPANISH : this.LANGUAGES.ENGLISH;
			this.text = {menu:{}};
			this.taskEnvironments = taskEnvironments;
			this.agentPrograms = agentPrograms;

			this.gotoTop = gotoTop;
			this.goto = function(path){
				$location.url(path);
				gotoTop()
			}

			this.toggleFullScreen = function(id){toggleFullScreen(document.getElementById(id))}

			this.getSubPath = function(fi){if (fi == 0) return "/";
				var subPath = "";
				var _$subLoc = $location.url().split('/');

				for (var len= _$subLoc.length, i= 0; i < len; ++i)
					if (i <= fi)
						subPath+= (i > 0?"/":"") + _$subLoc[i]
					else
						return subPath;
			}

			this.setLanguage = function(){
				this.text.desc			= $sce.trustAsHtml($text.main.description[ this.language ]);
				this.text.martha_marc	= $sce.trustAsHtml($text.main.martha_marc[ this.language ]);
				this.text.cc			= $sce.trustAsHtml($text.main.ccLicense[ this.language ]);
				this.text.agpl			= $sce.trustAsHtml($text.main.agplLicense[ this.language ]);

				this.text.menu.btn_start	= $sce.trustAsHtml($text.main.menu.btn_start[ this.language ]);
				this.text.menu.envs			= $sce.trustAsHtml($text.main.menu.environments[ this.language ]);
				this.text.menu.envs.desc	= $sce.trustAsHtml($text.main.menu.environments.description[ this.language ]);
				this.text.menu.envs.btn_new	= $sce.trustAsHtml($text.main.menu.environments.btn_new[ this.language ]);
				this.text.menu.envs.btn_mng	= $sce.trustAsHtml($text.main.menu.environments.btn_manage[ this.language ]);
				this.text.menu.aps			= $sce.trustAsHtml($text.main.menu.agentPrograms[ this.language ]);
				this.text.menu.aps.desc		= $sce.trustAsHtml($text.main.menu.agentPrograms.description[ this.language ]);
				this.text.menu.aps.btn_new	= $sce.trustAsHtml($text.main.menu.agentPrograms.btn_new[ this.language ]);
				this.text.menu.aps.btn_mng	= $sce.trustAsHtml($text.main.menu.agentPrograms.btn_manage[ this.language ]);
				this.text.menu.sts			= $sce.trustAsHtml($text.main.menu.stats[ this.language ]);
				this.text.menu.sts.desc		= $sce.trustAsHtml($text.main.menu.stats.description[ this.language ]);
				this.text.menu.sts.btn_view	= $sce.trustAsHtml($text.main.menu.stats.btn_view[ this.language ]);
				this.text.menu.set			= $sce.trustAsHtml($text.main.menu.settings[ this.language ]);
				this.text.menu.set.desc		= $sce.trustAsHtml($text.main.menu.settings.description[ this.language ]);
				this.text.menu.set.btn_view	= $sce.trustAsHtml($text.main.menu.settings.btn_view[ this.language ]);
				this.text.menu.doc			= $sce.trustAsHtml($text.main.menu.documentation[ this.language ]);
				this.text.menu.doc.desc		= $sce.trustAsHtml($text.main.menu.documentation.description[ this.language ]);
				this.text.menu.doc.btn_read	= $sce.trustAsHtml($text.main.menu.documentation.btn_read[ this.language ]);
			}

			this.setLanguage();
		}
	]);
})();