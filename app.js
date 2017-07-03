var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var execFile = require('child_process').execFile;
var  bodyParser = require('body-parser');

var resultPLFile = {
    hasResult: false
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '/')));
var listFile = [];

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/getListFile', function(req, res){
  res.json(listFile);
});

app.post('/uploadToGetPointCloud', function(req, res, next){
  // create an incoming form object
  var form = new formidable.IncomingForm();
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;
  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads/getPointCloud');
  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    fs.exists(path.join(form.uploadDir, file.name), (exists) =>{
      if (!exists){
        fs.appendFile('uploads/getPointCloud/dataset_files.txt', file.name + ' \n', (err) => {
          if (err) next(err);
          listFile.push(file.name);
        });
      }
      fs.rename(file.path, path.join(form.uploadDir, file.name));
    });
  });
  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });
  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    res.json(listFile);
  });
  // parse the incoming request containing the form data
  form.parse(req);
});
var cornersImageName, findingBooksImageName;

app.post('/uploadToGetCorners', function(req, res, next){
  var form = new formidable.IncomingForm();

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads/getCorners');
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
    cornersImageName = file.name;
  });
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });
  form.on('end', function() {
    res.json("upload successfully!");
  });
  // parse the incoming request containing the form data
  form.parse(req);
});

app.post('/uploadToFindBooks', function(req, res, next){
  function findingBooks(){
    resultPLFile.hasResult = false;
      execFile("C:\\Program Files\\DetectCorners\\FindingBooks.exe", ["uploads/findingBooks/" + findingBooksImageName, path.join(__dirname, "/output/books.jpg")], {maxBuffer: 1024 * 1024 * 64}, (error, stdout, stderr) => {
      if (error) {
         res.status(500).send({ error: error });
      }else{
        res.json('finding books successfully');
      }
      console.log(stdout);
    });
  }
  var form = new formidable.IncomingForm();

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads/findingBooks');
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
    findingBooksImageName = file.name;
    findingBooks();
  });
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });
  // parse the incoming request containing the form data
  form.parse(req);
});



app.get('/removeFile', function(req, res, next) {
  for(var i = 0; i<listFile.length; i++){
    fs.unlink(path.join(__dirname, '/uploads/getPointCloud', listFile[i]));
  }
  listFile = [];
  fs.exists(path.join(__dirname, 'output/pointcloud.txt'), (exists) =>{
    if (exists){
      fs.unlink(path.join(__dirname, 'output/pointcloud.txt' ));
    }
  });
  resultPLFile.hasResult = false;
  resultPLFile.err = false;
  fs.writeFile('uploads/getPointCloud/dataset_files.txt', '', (err) => {
    if (err){
      res.status(500).send({ error: err });
    }else {
      res.sendFile(path.join(__dirname, 'views/index.html'));
    }
  });
});

app.get('/getPointcloudFile', function(req, res, next){
  res.json(resultPLFile);
});

app.post('/getPointcloud', function(req, res, next){
  function getPointcloud(){
    resultPLFile.hasResult = false;
    execFile("C:\\Program Files\\DetectCorners\\GetPointCloud.exe", ["uploads/getPointCloud/dataset_files.txt",req.body.focal, req.body.cx, req.body.cy], {maxBuffer: 1024 * 1024 * 64}, (error, stdout, stderr) => {
      if (error) {
         res.status(500).send({ error: error });
         resultPLFile.err = true;
         resultPLFile.errMes = error;
      }else{
        res.download('output/pointcloud.txt', 'output/pointcloud.txt', function(err){
          if (err) {
          } else {
            // decrement a download credit, etc.
          }
        });
      }
      console.log(stdout);
      resultPLFile.hasResult = true;
    });
  }
  getPointcloud();
});

app.post('/getCorners', function(req, res, next){
  function getCorners(){
    resultPLFile.hasResult = false;
    execFile("C:\\Program Files\\DetectCorners\\DetectCorners.exe", ["uploads/getCorners/" + cornersImageName,req.body.maxCorners, req.body.quality_level, req.body.min_distance, path.join(__dirname, "/output/corners.jpg")], {maxBuffer: 1024 * 1024 * 64}, (error, stdout, stderr) => {
      if (error) {
         res.status(500).send({ error: error });
      }else{
        res.json('get corners successfully');
      }
      console.log(stdout);
    });
  }
  getCorners();
});

app.post('/findingBooks', function(req, res, next){
  function findingBooks(){
    resultPLFile.hasResult = false;
      execFile("C:\\Program Files\\DetectCorners\\FindingBooks.exe", ["uploads/findingBooks/" + findingBooksImageName, path.join(__dirname, "/output/books.jpg")], {maxBuffer: 1024 * 1024 * 64}, (error, stdout, stderr) => {
      if (error) {
         res.status(500).send({ error: error });
      }else{
        res.json('finding books successfully');
      }
      console.log(stdout);
    });
  }
  findingBooks();
});

var server = app.listen(80, function(){
  console.log('Server listening on port 80');
});
