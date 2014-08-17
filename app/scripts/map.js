/* exported map */
'use strict';

// Nice background map
var mapbox = L.tileLayer('http://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'siggyf.i2m0d18j'
});
var baseLayers = {
    'SiggyF': mapbox
};

// The map
var map = L.map('map',{
    layers: [baseLayers.SiggyF]
});


L.easyButton('fa-pause',
             function (){
                 var $scope = angular.element(this.link).scope();
                 var models = $scope.models;
                 var loaded = _.where(models, {loaded:true});
                 console.log('Sending pause message to models', loaded);
                 _.each(loaded, function(model){
                     model.pause();
                 });
             },
             'Pause'
            ).setPosition('bottomleft');
L.easyButton('fa-play',
             function (){
                 var $scope = angular.element(this.link).scope();
                 var models = $scope.models;
                 var loaded = _.where(models, {loaded:true});
                 console.log('Sending play message to models', loaded);
                 _.each(loaded, function(model){
                     model.play();
                 });
             },
             'Play'
            ).setPosition('bottomleft');
L.easyButton('fa-refresh',
             function (){
                 var $scope = angular.element(this.link).scope();
                 var models = $scope.models;
                 var loaded = _.where(models, {loaded:true});
                 console.log('Sending play message to models', loaded);
                 _.each(loaded, function(model){
                     model.update();
                 });

                 // update(uuid);
             },
             'Update'
            ).setPosition('bottomleft');

map.setView([37.9, -122.2], 10);

