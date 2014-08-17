/* global angular, connect, disconnect, render, unrender */

'use strict';
var app = angular.module('modelApp', []);

var tracker = 'localhost:22222';
app.controller('ModelController', function($scope, $http) {

    // Define update function
    $scope.updateModels = function(){

        var url = 'http://' + tracker + '/models';
        console.log('Updating models from', url);
        $http.get(url).success(function(data) {
            $scope.models = data;
            _.each($scope.models, function(model){
                // append extra variables
                model.loaded = false;
                model.gridurl = 'http://' + tracker + '/models/' + model.uuid + '/grid';
                model.callback = function(){$scope.$apply();};
            });
            console.log('setting', (data.length), 'models');
        });

    };

    // And call it
    $scope.updateModels();

    $scope.model = null;
    // Clear all models
    $scope.clearModels = function(){
        // unload all loaded models
        _.each(
            // find loaded models
            _.where($scope.models, {loaded: true}),
            // unload
            function(model){
                $scope.unloadModel(model);
            }
        );
        // reset models
        $scope.models = [];
    };
    // Define other functions
    $scope.getModelByUuid = function(uuid){
        console.log('looking for', uuid);
        var model = _.findWhere($scope.models, {'uuid': uuid});
        console.log('found', model, 'in', $scope.models);
        return model;
    };

    $scope.toggleModel = function(uuid){
        var model = $scope.getModelByUuid(uuid);
        if (model.loaded) {
            $scope.unloadModel(model);
        } else {
            $scope.loadModel(model);
        }
    };
    $scope.loadModel = function(model){
        console.log('loading', model.uuid);
        if (model.loaded) {
            return;
        }
        model.loaded = true;
        connect(model);
        render[model.engine](model);
        $scope.model = model;
        $scope.vars = model.vars;
        $scope.$watch('vars', function(newValue, oldValue) {
            console.log("model vars changed from", oldValue,'to', newValue);
        });
    };

    $scope.unloadModel = function(model){
        console.log('unloading', model.uuid);
        if (!model.loaded) {
            return;
        }
        model.loaded = false;
        disconnect(model);
        unrender[model.engine](model);
        if ($scope.model === model) {
            $scope.model = null;
        }
    };

});



