/*
* main.js - 
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
(function(){
    var main = angular.module("tworld", ['tworldMainMenu', 'tworldEnvironments', 'tworldAgentPrograms', 'tworldStats', 'ui.bootstrap', 'ui.slider', 'ngRoute', 'ngAnimate']);

    main.config(['$routeProvider', '$locationProvider', '$tooltipProvider',
        function($routeProvider, $locationProvider, $tooltipProvider) {
            $tooltipProvider.setTriggers({
                'click' : 'clickOutsideEvent',
                'errorEvent' : 'dismissError'
            });

            $tooltipProvider.options({
                appendToBody: true,
                popupDelay: 200
            });

            $routeProvider
                .when('/', {
                    templateUrl: 'main-manu.html',
                    controller: 'MainMenuController',
                    controllerAs: 'mmc'
                })
                .when('/account-confirmation', {
                    templateUrl: 'account-confirmation.html'
                })
                .when('/support', {
                    templateUrl: 'support.html'
                })
                .when('/environments', {
                    templateUrl: 'environments.html',
                    controller: 'EnvController',
                    controllerAs: 'ec',
                    resolve:{
                        taskEnvs: function($q) {
                            if (!isLoggedIn()) return getEnvironments();
                            else{
                                var deferred = $q.defer();
                                getEnvironments( function(response){ deferred.resolve(response) } );
                                return deferred.promise;
                            }
                        }
                    }
                })
                .when('/environments/new', {
                    templateUrl: 'environments-new.html',
                    controller: 'EnvNewController',
                    controllerAs: 'enc',
                    resolve:{
                        readOnly: function(){ return false; },
                        taskEnv : function(){ return clone(defaults.taskEnvironment); }
                    }
                })
                .when('/environments/view::id', {
                    templateUrl: 'environments-new.html',
                    controller: 'EnvNewController',
                    controllerAs: 'enc',
                    resolve:{
                        readOnly: function($route, $rootScope, $q){
                            if (!isLoggedIn()) return !emptyTrialsEnvironment($route.current.params.id)
                            else{
                                var deferred = $q.defer();
                                emptyTrialsEnvironment(
                                    $route.current.params.id,
                                    function(response){ deferred.resolve(!response);},
                                    $rootScope
                                );
                                return deferred.promise;
                            }
                        },
                        taskEnv : function ($route, $rootScope, $q) {
                            if (!isLoggedIn()) return clone(getEnvironmentByDate($route.current.params.id));
                            else{
                                var deferred = $q.defer();
                                getEnvironmentByDate(
                                    $route.current.params.id,
                                    function(response){ deferred.resolve(response); },
                                    $rootScope
                                );
                                return deferred.promise;
                            }
                        }
                    }
                })
                .when('/agent-programs', {
                    templateUrl: 'agent-programs.html',
                    controller: 'AgentProgController',
                    controllerAs: 'apc',
                    resolve:{
                        agentProgs : function($q) {
                            if (!isLoggedIn()) return getAgentPrograms();
                            else{
                                var deferred = $q.defer();
                                getAgentPrograms( function(response){ deferred.resolve(response) } );
                                return deferred.promise;
                            }
                        }
                    }
                })
                .when('/agent-programs/view::id', {
                    templateUrl: 'agent-programs-new.html',
                    controller: 'AgentProgNewController',
                    controllerAs: 'apnc',
                    resolve:{
                        agentProg : function ($route, $rootScope, $q) {
                            if (!isLoggedIn()) return clone(getAgentProgramByDate($route.current.params.id));
                            else{
                                var deferred = $q.defer();
                                getAgentProgramByDate(
                                    $route.current.params.id,
                                    function(response){ deferred.resolve(response); },
                                    $rootScope
                                );
                                return deferred.promise;
                            }
                        }
                    }
                })
                .when('/agent-programs/new', {
                    templateUrl: 'agent-programs-new.html',
                    controller: 'AgentProgNewController',
                    controllerAs: 'apnc',
                    resolve:{ agentProg:function(){ return clone(defaults.agentProgram); } }
                })
                .when('/agent-programs/source-code::id', {
                    templateUrl: 'agent-programs-source-code.html',
                    controller: 'AgentProgSourceCodeController',
                    controllerAs: 'apscc',
                    resolve:{
                        agentProg:  function ($route, $rootScope, $q) {
                            if (!isLoggedIn()) return getAgentProgramByDate($route.current.params.id);
                            else{
                                var deferred = $q.defer();
                                getAgentProgramByDate(
                                    $route.current.params.id,
                                    function(response){ deferred.resolve(response); },
                                    $rootScope
                                );
                                return deferred.promise;
                            }
                        }
                    }
                })
                .when('/stats', {
                    templateUrl: 'stats.html',
                    controller: 'StatsController',
                    controllerAs: 'sc',
                    resolve:{
                        taskEnv: function(){return undefined;},
                        agentProg: function(){return undefined;},
                        trials: function($route, $q){
                            if (!isLoggedIn())
                                return getTrials();
                            else{
                                var deferred = $q.defer();
                                getTrials(function(response){ deferred.resolve(response); });
                                return deferred.promise;
                            }
                        }
                    }
                })

                .when('/stats/task-env::task_env_id&agent-prog::agent_prog_id', {
                    templateUrl: 'stats.html',
                    controller: 'StatsController',
                    controllerAs: 'sc',
                    resolve:{
                        taskEnv: function($route, $q){
                            var $params = $route.current.params;
                            var taskEnv;

                            if (!$params.task_env_id)
                                $params.task_env_id = "all";

                            if ($params.task_env_id == "all")
                                taskEnv = undefined;
                            else
                                if (!isLoggedIn())
                                    taskEnv = getEnvironmentByDate($params.task_env_id);
                                else{
                                    var deferred = $q.defer();
                                    getEnvironmentByDate(
                                        $params.task_env_id,
                                        function(response){ deferred.resolve(response); }
                                    );
                                    taskEnv = deferred.promise;
                                }

                            return taskEnv;
                        },
                        agentProg: function($route, $q){
                            var $params = $route.current.params;
                            var agentProg;

                            if (!$params.agent_prog_id)
                                $params.agent_prog_id = "all";

                            if ($params.agent_prog_id == "all")
                                agentProg = undefined;
                            else
                                if (!isLoggedIn())
                                    agentProg = getAgentProgramByDate($params.agent_prog_id);
                                else{
                                    var deferred = $q.defer();
                                    getAgentProgramByDate(
                                        $params.agent_prog_id,
                                        function(response){ deferred.resolve(response); }
                                    );
                                    agentProg = deferred.promise;
                                }

                            return agentProg;
                        },
                        trials: function($route, $q){
                            if (!isLoggedIn())
                                return getTrials();
                            else{
                                var deferred = $q.defer();
                                getTrials(function(response){ deferred.resolve(response); });
                                return deferred.promise;
                            }
                        }
                    }
                })
                .otherwise({
                    templateUrl: '404.html'
                });
        }]
    );

    main.controller('TWorldController', ['$sce', '$route', '$location', '$http', '$scope',
        function($sce, $route, $location, $http, $scope){
            var _self = this;
            this.$loc = $location;
            this.version = getVersion();
            this.LANGUAGES = _LANGUAGES;
            this.language = (window.navigator.userLanguage == 'es' || window.navigator.language == 'es')?
                            this.LANGUAGES.ENGLISH/*this.LANGUAGES.SPANISH*/ :
                            this.LANGUAGES.ENGLISH;

            this.user = getSessionData();
            this.login = {
                state   : this.user.info? _LOGIN_STATE.LOGGED : _LOGIN_STATE.HIDDEN,
                email   : "",
                pwd     : "",
                rember  : true,
                apply   : function(){

                    switch(_self.login.state){
                        case _LOGIN_STATE.HIDDEN:
                            _self.login.state = _LOGIN_STATE.SHOWN;
                            setTimeout(function() {$("#login-email").focus();}, 500);
                            break;
                        case _LOGIN_STATE.SHOWN:
                            if ( Validate($("#frm-login")) ){
                                $http({
                                    method  : 'POST',
                                    url     : 'http://tworld-ai.com/rest/main.php',
                                    headers : {'Content-Type': 'application/x-www-form-urlencoded'},
                                    data    : 'm=user_login&e='+btoa(_self.login.email)+'&p='+btoa(antiNoobsCoder(_self.login.pwd))
                                }).
                                success(function(data, status, headers, config) {
                                    $("#frm-login").removeClass("animate-none");
                                    switch(data.code|0){
                                        case 200:
                                            LoggedIn(data.body,_self.login.rember);
                                            _self.login.state = _LOGIN_STATE.LOGGED;
                                            _self.login.pwd = "";
                                            if ($location.path() != '/account-confirmation')
                                                $route.reload();
                                            else
                                                $location.url('/');
                                            gotoTop();
                                            break;
                                        case 400:
                                            _self.login.state = _LOGIN_STATE.SHOWN;
                                            _self.loginErrorHtml = '<div class="text-red">Invalid e-mail and/or password.</div><div>Please try again</div>';
                                            setTimeout(function() {$("#login-pwd").focus().select(); triggerError();}, 500);
                                    }
                                }).
                                error(function(data, status, headers, config) {
                                    _self.login.state = _LOGIN_STATE.SHOWN;
                                    _self.loginErrorHtml = '<div class="text-red">Couldn\'t connect to the server.</div><div>Please try again</div>';
                                    setTimeout(function() {$("#login-submit").focus(); triggerError();}, 500);
                                });

                                $("#frm-login").addClass("animate-none");
                                triggerDismissError();
                                _self.login.state = _LOGIN_STATE.LOADING;
                            }
                            break;
                    }
                }
            }
            this.logout = function(){
                _self.login.state = _LOGIN_STATE.LOGOUT;
                LogOut(function(){
                    _self.login.state = _LOGIN_STATE.HIDDEN;
                    _self.user.info = null;
                    gotoTop();
                    $route.reload();
                    $scope.$apply();
                });
            }

            this.text = {menu:{}};
            this.createAccountHtml  =   '<iframe style="width:100%; height:100%; opacity: 0" src="http://tworld-ai.com/rest/create-account-form.php" onload="$(this).css(\'opacity\',\'1\');$(\'#load-create-account\').css(\'opacity\',\'0\')"></iframe>'+
                                        '<div id="load-create-account" class="transition-600 text-center" style="position:absolute;left:50%;top:50%;margin-left:-25px;margin-top:-20px"><div class="atebits"><div></div><div></div></div><div class="margin-10">loading</div></div>';

            this.gotoTop = gotoTop;
            this.goto = function(path){
                $location.url(path);
                gotoTop()
            }

            this.getSubPath = function(fi){if (fi == 0) return "/";
                var subPath = "";
                var _$subLoc = $location.url().split('/');

                for (var len= _$subLoc.length, i= 0; i < len; ++i)
                    if (i <= fi)
                        subPath+= (i > 0?"/":"") + _$subLoc[i]
                    else
                        return subPath;
            }

            this.clickOutside = function (){
                triggerClickOutside();
                triggerDismissError();
                if (_self.login.state != _LOGIN_STATE.LOADING &&
                    _self.login.state != _LOGIN_STATE.LOGOUT)
                    _self.login.state= _LOGIN_STATE.HIDDEN;
            }

            this.setLanguage = function(){
                this.text.desc          = $sce.trustAsHtml($text.main.description[ this.language ]);
                this.text.author        = $sce.trustAsHtml($text.main.author[ this.language ]);
                this.text.martha_marc   = $sce.trustAsHtml($text.main.martha_marc[ this.language ]);
                this.text.aima          = $sce.trustAsHtml($text.main.aima[ this.language ]);
                this.text.cc            = $sce.trustAsHtml($text.main.ccLicense[ this.language ]);
                this.text.agpl          = $sce.trustAsHtml($text.main.agplLicense[ this.language ]);

                this.text.menu.btn_start    = $sce.trustAsHtml($text.main.menu.btn_start[ this.language ]);
                this.text.menu.envs         = $sce.trustAsHtml($text.main.menu.environments[ this.language ]);
                this.text.menu.envs.desc    = $sce.trustAsHtml($text.main.menu.environments.description[ this.language ]);
                this.text.menu.envs.btn_new = $sce.trustAsHtml($text.main.menu.environments.btn_new[ this.language ]);
                this.text.menu.envs.btn_mng = $sce.trustAsHtml($text.main.menu.environments.btn_manage[ this.language ]);
                this.text.menu.aps          = $sce.trustAsHtml($text.main.menu.agentPrograms[ this.language ]);
                this.text.menu.aps.desc     = $sce.trustAsHtml($text.main.menu.agentPrograms.description[ this.language ]);
                this.text.menu.aps.btn_new  = $sce.trustAsHtml($text.main.menu.agentPrograms.btn_new[ this.language ]);
                this.text.menu.aps.btn_mng  = $sce.trustAsHtml($text.main.menu.agentPrograms.btn_manage[ this.language ]);
                this.text.menu.sts          = $sce.trustAsHtml($text.main.menu.stats[ this.language ]);
                this.text.menu.sts.desc     = $sce.trustAsHtml($text.main.menu.stats.description[ this.language ]);
                this.text.menu.sts.btn_view = $sce.trustAsHtml($text.main.menu.stats.btn_view[ this.language ]);
                this.text.menu.set          = $sce.trustAsHtml($text.main.menu.settings[ this.language ]);
                this.text.menu.set.desc     = $sce.trustAsHtml($text.main.menu.settings.description[ this.language ]);
                this.text.menu.set.btn_view = $sce.trustAsHtml($text.main.menu.settings.btn_view[ this.language ]);
                this.text.menu.doc          = $sce.trustAsHtml($text.main.menu.documentation[ this.language ]);
                this.text.menu.doc.desc     = $sce.trustAsHtml($text.main.menu.documentation.description[ this.language ]);
                this.text.menu.doc.btn_read = $sce.trustAsHtml($text.main.menu.documentation.btn_read[ this.language ]);
            }

            this.setLanguage();
        }
    ]);

    main.run( function($rootScope, $location) {
        $rootScope.$on( "$routeChangeStart", function() {
            $rootScope.$loadingView = true;
        });

        $rootScope.$on('$routeChangeSuccess', function() {
            $rootScope.$loadingView = false;
        });
    })

    main.directive("popoverHtmlUnsafePopup", function () {
        return {
            restrict: "EA",
            replace: true,
            scope: { title: "@", content: "@", placement: "@", animation: "&", isOpen: "&" },
            templateUrl: "popover-html-unsafe-popup.html"
        };
    })

    main.directive("popoverHtmlUnsafe", [ "$tooltip", function ($tooltip) {
        return $tooltip("popoverHtmlUnsafe", "popover", "click");
    }]);

    main.filter('stringLimit', function() {
        return function(input, limit) {return (input.length > limit)? input.substr(0,limit-3)+"..." : input}
    });

    main.filter('nounderscore', function() {
        return function(input) {return input.replace(/_/g," ")}
    });

    main.filter('num', function() {
        return function(input) {return input|0}
    });

    main.filter('isnum', function() {
        return function(input) {return !Number.isNaN(Number(input))}
    });

    main.filter('tspeed', function() {
        return function(input) {
            return (input < 0 && (-input+1) + " times slower.")|| (input == 0 && "normal.") || ((input+1) + " times faster.")
        }
    });

    main.filter('ttime', function(){
        return function(value){
            var mins = ((value/60)|0);
            var segs = Math.round(value%60);

            mins = (mins < 10)? (mins? "0"+mins+"m":"") : mins+"m";
            segs = (segs < 10)? "0"+segs : segs;

            return mins + segs;
        }
    });

    main.filter('tcellimg', function(){
        return function(value, color){
            switch(value){
                case undefined:
                case null:
                case " ": return "empty";
                case "#": return "obstacle";
                case "A": return "agent";
                case "C": return "charger";
                case "T": return "tile";
                case "X": return "mark-"+color;
                default:  return "hole";
            }
        }
    });

    main.filter('tcellcolor', function() {
        return function(input) {
            return "rgba("+
                pRandom(input,255)+","+
                pRandom(pRandom(input, 1000),255)+","+
                pRandom(pRandom(pRandom(input, 1000), 1000),255)+
                ",0.4)";
        }
    });

    main.filter('tpercent', function() {
        return function(input) {return (input/10).toFixed(1)+"%"}
    });

})();