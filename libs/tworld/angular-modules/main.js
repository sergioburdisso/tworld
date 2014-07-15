var taskEnvironments = getEnvironments();
var agentPrograms = [];

//ver si no mover esto a otro archivo (tal vez el auxiliar)
function getEnvironments(){return localStorage.taskEnvironments? JSON.parse(localStorage.taskEnvironments) : []}
function saveEnvironments(){localStorage.taskEnvironments = JSON.stringify(taskEnvironments)}
function clearEnvironments(){localStorage.removeItem("taskEnvironments")}

function getKnobs(){return localStorage.knobs? JSON.parse(localStorage.knobs) : null}
function saveKnobs(knobs){localStorage.knobs = JSON.stringify(knobs)}
function clearKnobs(){localStorage.removeItem("knobs")}

var _tworldWindow;
function startTWorld(){
	if (!_tworldWindow)
		_tworldWindow = window.open('tworld.html');//,'T-World','width=712, height=450');//height=400
	else
		_tworldWindow.location = 'tworld.html';
	_tworldWindow.focus();
	/*$(_tworldWindow).unload(function(){_tworldWindow=null});
	$(_tworldWindow).load(function(){_tworldWindow=true});*/
}
function isTWorldRunning(){return _tworldWindow}

(function(){
	var main = angular.module("tworld", ['tworldMainMenu', 'tworldEnvironmentsNew', 'ui.bootstrap', 'ui.slider', 'ngRoute', 'ngAnimate']);

	main.config(['$routeProvider', '$locationProvider', '$tooltipProvider',
		function($routeProvider, $locationProvider, $tooltipProvider) {
			$routeProvider
				.when('/', {
					templateUrl: 'main-manu.html',
					controller: 'MainMenuController',
					controllerAs: 'mmc'
				})
				.when('/environments/new', {
					templateUrl: 'environments-new.html',
					controller: 'EnvNewController',
					controllerAs: 'enc'
				})
				.otherwise({
					templateUrl: '404.html'
				});

			$tooltipProvider.options({
				appendToBody: true,
				placement: 'left',
				popupDelay: 200
			});
		}]
	);

	main.controller("TWorldController", ["$sce", "$location",
		function($sce, $location){
			this.$loc = $location;
			this.LANGUAGES = _LANGUAGES;
			this.language = (window.navigator.userLanguage || window.navigator.language) == 'es'? this.LANGUAGES.SPANISH : this.LANGUAGES.ENGLISH;
			this.text = {menu:{}};
			//this.isTWorldRunning = isTWorldRunning;
			this.taskEnvironments = taskEnvironments;
			this.agentPrograms = agentPrograms;

			this.goto = function(path){$location.url(path)}


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

Array.prototype.remove = function(index) {
	var output=this[index];

	for (var i= index; i < this.length; ++i)
		this[i] = this[i+1];
	this.length--;

	return output;
}

Array.prototype.setTo = function(arr) {
	if (arr.length != this.length)
		this.length = arr.length;

	var i= this.length;
	while(i--)
		this[i] = arr[i];
}