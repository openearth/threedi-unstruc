/* exported tracker */
'use strict';

var tracker;

$(document).foundation();

$.getJSON('config.json', function(data) {
    tracker = data.tracker;
});
