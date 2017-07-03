var app = angular.module('myApp', ['ngMaterial']);

app.directive('fileModel', ['$parse', function ($parse) {
    return {
       restrict: 'A',
       link: function(scope, element, attrs) {
          var model = $parse(attrs.fileModel);
          var modelSetter = model.assign;
          element.bind('change', function(){
              var values = [];
              angular.forEach(element[0].files, function (item) {
                var value = item;
                values.push(value);
              });
             scope.$apply(function(){
                modelSetter(scope, values);
             });
          });
       }
    };
 }]);

app.service('fileUpload', ['$http', function ($http) {
    this.getListFile = function(){
      return $http.get('/getListFile');
    }
    this.uploadFileToUrl = function(files, uploadUrl){
      var fd = new FormData();
      for(var i = 0; i<files.length; ++i){
        fd.append('file', files[i], files[i].name);
      }
      return $http.post(uploadUrl, fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
      });
    }
    this.removeFile = function(){
      return $http.get('/removeFile');
    }
    this.getPL = function(pointcloud) {
      return $http.post('/getPointcloud', pointcloud);
    }
    this.getPLF = function() {
      return $http.get('/getPointcloudFile');
    }
 }]);
 app.service('cornersService',['$http', function($http) {
   this.getCorners = function(corner) {
     return $http.post('/getCorners', corner);
   }
 }]);

app.controller('AppCtrl', ['$scope', 'fileUpload', '$timeout', 'cornersService', function($scope, fileUpload, $timeout, cornersService){
  $scope.filesName = [];
  $scope.dataLoadingSFM = false;
  $scope.dataLoadingCorners = false;
  $scope.dataLoadingBooks = false;
  $scope.hasCorners = false;
  $scope.hasBooks = false;
  $scope.pointcloud = {
    focal: null,
    cx: null,
    cy: null
  };
  fileUpload.getPLF()
    .then(function(result){
      if (result.data.hasResult){
        if (!result.data.err){
          $scope.showDownload = true;
        }
      }
    }, function(err){
  });

  fileUpload.getListFile()
    .then(function(result){
      $scope.filesName = result.data;
    }, function(err){
      console.log(err);
    });
  $scope.uploadFile = function(){
     var files = $scope.myFile;
     var uploadUrl = "/uploadToGetPointCloud";
     fileUpload.uploadFileToUrl(files, uploadUrl)
     .then(function(result){
       angular.forEach(files, function(item){
         if ($scope.filesName.indexOf(item.name) == -1){
            $scope.filesName.push(item.name);
         }
       });
     }, function(err){
       console.log(err);
     });
  };

  $scope.renew = function(){
      fileUpload.removeFile()
        .then(function(result) {
          console.log('ok remove');
          $scope.filesName = [];
          $scope.dataLoadingSFM = false;
          $scope.pointcloud = {
            focal: null,
            cx: null,
            cy: null
          };
          $scope.showDownload = false;
        }, function(err){
          console.log(err);
        });
  }
  $scope.getPointCloud = function(pointcloud){
      $scope.dataLoadingSFM = true;
      console.log(pointcloud);
      fileUpload.getPL(pointcloud)
        .then(function(result){
            console.log(result);
            var anchor = angular.element('<a/>');
            anchor.attr({
                 href: 'data:attachment/txt;charset=utf-8,' + encodeURI(result.data),
                 target: '_blank',
                 download: 'pointcloud.txt'
            })[0].click();
            $scope.dataLoadingSFM = false;
        }, function(err){
            console.log(err);
            function getPLFile(){
              fileUpload.getPLF()
                .then(function(result){
                  if (result.data.hasResult){
                    if (!result.data.err){
                      var anchor = angular.element('<a/>');
                      anchor.attr({
                           href: '/pointcloud.txt',
                           target: '_blank',
                           download: 'pointcloud.txt'
                      })[0].click();
                      $scope.showDownload = true;
                    }else{
                      alert(result.data.errMes);
                    }
                    $scope.dataLoadingSFM = false;
                  }else{
                    $timeout(function(){
                        getPLFile();
                    }, 5000);
                  }
                }, function(err){
                });
            }
          getPLFile();
        });
  }
  $scope.corner = {
    maxCorners : null,
    quality_level : null,
    min_distance : null
  }
   $scope.uploadToGetCorners = function(corners){
      var files = $scope.myFile;
      $scope.dataLoadingCorners = true;
      var uploadUrl = "/uploadToGetCorners";
      fileUpload.uploadFileToUrl(files, uploadUrl)
      .then(function(result){
        cornersService.getCorners(corners)
         .then(function(){
           $scope.hasCorners = true;
          // $scope.outputCornersUrl = "";
           $scope.outputCornersUrl = "output/corners.jpg?_ts=" + new Date().getTime();
           $scope.dataLoadingCorners = false;
         }, function(err) {
           console.log(err);
           $scope.dataLoadingCorners = false;
         })
      }, function(err){
        console.log(err);
        $scope.dataLoadingCorners = false;
      });
   };
   $scope.uploadToFindBooks = function(){
      var files = $scope.myFile;
      $scope.dataLoadingBooks = true;
      var uploadUrl = "/uploadToFindBooks";
      fileUpload.uploadFileToUrl(files, uploadUrl)
      .then(function(result){
           $scope.hasBooks = true;
        //   $scope.ouputBooksUrl = "";
           $scope.ouputBooksUrl = "output/books.jpg?_ts=" + new Date().getTime();
           $scope.dataLoadingBooks = false;
      }, function(err){
        console.log(err);
        $scope.dataLoadingBooks = false;
      });
   };

}]);
