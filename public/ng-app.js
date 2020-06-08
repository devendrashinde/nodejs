'use strict';

var app = angular.module('myApp',[]);

app.controller('appController', function($scope) {
  this.testing = "Test string from Angular. Yay!";
  
  this.repeat = [
    {name: 'google', url: 'https://www.google.com'},
    {name: 'yahoo', url: 'https://www.yahoo.com'},
    {name: 'bing', url: 'https://www.bing.com'}
  ];
});

