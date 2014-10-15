/* global angular, connect, disconnect, render, unrender, update, play, pause, tracker */
'use strict';

var app = angular.module('modelApp', []);

app.controller('ModelController', function($scope, $http) {

    $scope.settings = {view: 'map'};
    // Define update function
    $scope.updateModels = function(){

        var url = 'http://' + tracker + '/models';
        console.log('Updating models from', url);
        $http.get(url).success(function(data) {
            $scope.clearModels();
            $scope.models = data;
            _.each($scope.models, function(model){
                // append extra variables
                model.loaded = false;
                model.gridurl = 'http://' + tracker + '/models/' + model.uuid + '/grid';
                model.callback = function(){$scope.$apply();};
                model.update = function(){
                    console.log('updating model', model.uuid);
                    update[model.engine](model);
                };
                model.play = function(){
                    console.log('playing model', model.uuid);
                    play[model.engine](model);
                };
                model.pause = function(){pause[model.engine](model);};
            });
            console.log('setting', (data.length), 'models');
        });

    };

    // And call it
    $scope.updateModels();

    $scope.selectedModel = null;
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
        var model = _.findWhere($scope.models, {'uuid': uuid});
        console.log('found', model, 'in', $scope.models);
        return model;
    };

    $scope.toggleSelection = function(uuid){
        console.log('Comparing', $scope.selectedModel, 'and', uuid);
        if ($scope.selectedModel && $scope.selectedModel === uuid) {
            console.log('Disabling', uuid);
            $scope.selectedModel = null;
        } else {
            console.log('Enabling', uuid);
            $scope.selectedModel = uuid;
        }
    };


    $scope.toggleModel = function(uuid){
        console.log('Toggling model', uuid);
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
    };

    $scope.unloadModel = function(model){
        console.log('unloading', model.uuid);
        if (!model.loaded) {
            return;
        }
        model.loaded = false;
        disconnect(model);
        unrender[model.engine](model);
        if ($scope.selectedModel === model) {
            $scope.selectedModel = null;
        }
    };

});



