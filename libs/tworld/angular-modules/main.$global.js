var taskEnvironments = getEnvironments();
var agentPrograms = getAgentPrograms();

function getEnvironments(){return localStorage.taskEnvironments? JSON.parse(localStorage.taskEnvironments) : []}
function getAgentPrograms(){return localStorage.agentPrograms? JSON.parse(localStorage.agentPrograms) : []}
function saveEnvironments(){localStorage.taskEnvironments = JSON.stringify(taskEnvironments)}
function saveAgentPrograms(){localStorage.agentPrograms = JSON.stringify(agentPrograms)}
function clearEnvironments(){localStorage.removeItem("taskEnvironments")}
function clearAgentPrograms(){localStorage.removeItem("agentPrograms")}

function getEnvironmentByDate(date){
	var i = taskEnvironments.length;
	while (i--)
		if (taskEnvironments[i].date === date)
			return taskEnvironments[i];
	return null;
}

function getAgentProgramByDate(date){date=parseInt(date);
	var i = agentPrograms.length;
	while (i--)
		if (agentPrograms[i].date === date)
			return agentPrograms[i];
	return null;
}

function getKnobs(){return localStorage.knobs? JSON.parse(localStorage.knobs) : null}
function saveKnobs(knobs){
	localStorage.knobs = JSON.stringify(knobs);
	knobs.trial.test = false;
}
function clearKnobs(){localStorage.removeItem("knobs")}

var _tworldWindow;
function startTWorld(){
	if (!_tworldWindow || !_tworldWindow.window)
		_tworldWindow = window.open('tworld.html');//,'T-World','width=712, height=450');//height=400
	else
		_tworldWindow.location = 'tworld.html';
	_tworldWindow.focus();
}

function environmentsListController($scope, $modalInstance){
	var _selected = -1;

	$scope.taskEnvironments = taskEnvironments;
	$scope.orderCond = "-date";
	$scope.query = {
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

	$scope.ok = function () {$modalInstance.close(_selected)};
	$scope.close = function () {$modalInstance.dismiss()};

	$scope.setSelected = function(value){_selected = value}
	$scope.isSelected = function(value){return _selected == value}
	$scope.userFilter = function(task_env){
		var regEx = new RegExp($scope.query.name,"i");
		var p = $scope.query.prop;

		return regEx.test(task_env.name) && (
				$scope.query.allProps ||
				(
					$scope.query.battery == task_env.battery &&
					p.fullyObservable == task_env.prop.fullyObservable &&
					p.multiagent == task_env.prop.multiagent &&
					p.deterministic == task_env.prop.deterministic &&
					p.dynamic == task_env.prop.dynamic &&
					p.known == task_env.prop.known
				)
		);
	}
};