(function(){
	var mod = angular.module("tworldMainMenu", []);

	mod.controller("MainMenuController", function(){
		var _self = this;

		this.menu = -1;
		this.overStart = false;
		this.tworldWindow = null;

		this.leave = function(){this.menu = -1}
		this.setActive = function(i){this.menu = i}
		this.isActive = function(i){return this.menu === i}

		this.startEnter = function(){this.overStart = true}
		this.startLeave = function(){this.overStart = false}
		this.isOnStart = function(){return this.overStart}

		this.startTWorld = function(){
			this.tworldWindow = window.open('tworld.html','T-World','width=712, height=400, resizable=0, toolbar=0, directories=0, location=0, titlebar=0, status=0');
			$(this.tworldWindow).unload(function(){_self.tworldWindow=null});
			$(this.tworldWindow).load(function(){_self.tworldWindow=true});
		}
	})

})();