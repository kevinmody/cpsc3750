//Author: Craig Baker && Kevin Mody
const crypto = require("crypto");

//some webserver libs
const express = require("express");
const bodyParser = require("body-parser");
const auth = require("basic-auth");

//promisification
const bluebird = require("bluebird");

//database connector
const redis = require("redis");
//make redis use promises
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

//create db client
const client = redis.createClient();

const port = process.env.NODE_PORT || 3000;

//make sure client connects correctly.
client.on("error", function (err) {
  console.log("Error in redis client.on: " + err);
});

const setUser = function (userObj) {
  return client
    .hmsetAsync("user:" + userObj.id, userObj)
    .then(function () {
      console.log("Successfully created (or overwrote) user " + userObj.id);
    })
    .catch(function (err) {
      console.error(
        "WARNING: errored while attempting to create tester user account"
      );
    });
};

//make sure the test user credentials exist
const userObj = {
  salt: new Date().toString(),
  id: "teacher",
};
userObj.hash = crypto
  .createHash("sha256")
  .update("testing" + userObj.salt)
  .digest("base64");
//this is a terrible way to do setUser
//I'm not waiting for the promise to resolve before continuing
//I'm just hoping it finishes before the first request comes in attempting to authenticate
setUser(userObj);

//start setting up webserver
const app = express();

//decode request body using json
app.use(bodyParser.json());

//allow the API to be loaded from an application running on a different host/port
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Expose-Headers", "X-Total-Count");
  res.header("Access-Control-Allow-Methods", "PUT, DELETE, POST, GET, HEAD");
  next();
});

//protect our API
app.use(function (req, res, next) {
  switch (req.method) {
    case "GET":
    case "POST":
    case "PUT":
    case "DELETE":
      //extract the given credentials from the request
      const creds = auth(req);

      //look up userObj using creds.name
      let name = creds.name;//TODO use creds.name to lookup the user object in the DB
      let data;
      const usr = client.hgetallAsync("user:" + name).then((data) => {
        console.log(data);
        if (data) {
          console.log("User exists");//use the userObj.salt and the creds.pass to generate a hash
          let s = data.salt;
          let hsh = crypto
            .createHash("sha256")
            .update(creds.pass + s)
            .digest("base64");

          if(hsh == data.hash) {//compare the hash, if they match call next() and do not use res object
            console.log("ACCESSED");
            next();
          }else {
            //to send anything to client
            //if they dont or DB doesn't have the user or there's any other error use the res object
            //to return a 401 status code
            console.log("HASHES DIFFERENT:");
            console.log("DB HASH: " + data.hash);
            console.log("CL HASH: " + hsh);
            res.sendStatus(401);
          }
        } else{
          console.log("ACCESS FAILED");
          res.sendStatus(401);
        }
      });
      break;
      default:
      //maybe an options check or something
      next();
      break;
}});

//this takes a set of items and filters, sorts and paginates the items.
//it gets it's commands from queryArgs and returns a new set of items
const filterSortPaginate = (type, queryArgs, items) => {
  let keys;

  if (type == "student") {
    keys = ["id", "name"];
  } else {
    keys = ["id", "student_id", "type", "max", "grade"];
  }
  console.log("ITEMS BEFORE FILTER:" + items);
  console.log("args:" + queryArgs);
  //applied to each item in items
  //returning true keeps item
  //TODO: fill out the filterer function
  const filterer = (item) => {

    for(k of keys){//loop through keys defined in above scope
      console.log(k);
      console.log(item);
      if(queryArgs.hasOwnProperty(k)){//if this key exists in queryArgs
        console.log(queryArgs[k]);
        let r = new RegExp(queryArgs[k], "i");//and it's value doesnt match whats's on the item
        if (!item[k].match(r)) {//don't keep the item (return false)
          return false;
        }
      }//else return true
    }
    return true;
  };

  //apply above function using Array.filterer
  items = items.filter(filterer);
  console.log("items after filter:", items);

  //always sort, default to sorting on id
  if (!queryArgs._sort) {
    queryArgs._sort = "id";
  }
  //make sure the column can be sorted
  let direction = 1;
  if (!queryArgs._order) {
    queryArgs._order = "asc";
  }
  if (queryArgs._order.toLowerCase() == "desc") {
    direction = -1;
  }

  //comparator...given 2 items returns which one is greater
  //used to sort items
  //written to use queryArgs._sort as the key when comparing
  //TODO fill out the sorter function
  const sorter = (a, b) => {
    //Note direction and queryArgs are available to us in the above scope
    let something;
    console.log("A " + a[queryArgs._sort] + " B " + b[queryArgs._sort]);
    //compare a[queryArgs._sort] (case insensitive) to the same in b
    if (a[queryArgs._sort] < b[queryArgs._sort]) {
      console.log("B > A");
      something= -1; //save a variable with 1 if a is greater than b, -1 if less and 0 if equal
    } else if (a[queryArgs._sort] > b[queryArgs._sort]) {
      console.log("A > B");
      something= 1; //save a variable with 1 if a is greater than b, -1 if less and 0 if equal
    } else {
      console.log("B == A");
      something= 0; //save a variable with 1 if a is greater than b, -1 if less and 0 if equal
    }
    return something* direction;//multiply by direction to reverse order and return the variable
  };

  //use apply the above comparator using Array.sort
  items.sort(sorter);
  console.log("items after sort:", items);
  //if we need to paginate
  if (queryArgs._start || queryArgs._end || queryArgs._limit) {
    //TODO: fill out this if statement
    //define a start and end variable
    let start, end;
    //start defaults to 0, end defaults to # of items
    if (queryArgs._start) { //if queryArgs._start is set, save into start
      start = queryArgs._start;
    }
    if (queryArgs._end) {//if queryArgs._end is set save it into end
      lend = queryArgs._end;
    } else if (queryArgs._limit) {//else if queryArgs._limit is set, save end as start+_limit
      end = start + queryArgs._limit;
    }
    items = items.slice(start, end);//save over items with items.slice(start,end)
  }
  console.log("items after pagination:", items);
  return items;
};

app.get("/students/:id", function (req, res) {
  //TODO
  //Hint use hgetallAsync
  console.log("TRYING");
  let query = req.params.id;
  console.log(query);
  let exists = client.existsAsync("student:" + query).then((val) => {
    if (val == 0) {
      res.sendStatus(404);
      return;
    }
  });
  return client
    .hgetallAsync("student:" + query)
    .then((data) => {
      console.log(data);
      res.status(200).json(data);
      return;
    })
    .catch((err) => {
      console.log(err);
      console.log("SOME ERROR PULLING STUDENT, RETURNING 404");
      res.sendStatus(404);
    });
});
app.get("/students", function (req, res) {
  //TODO fill out the function
  
  
  console.log(req);
  client.smembersAsync("students").then((data) => {//Hint: use smembersAsync, then an array of promises from hgetallAsync and
    res.setHeader("X-Total-Count", data.length);
    const promises = [];
    const studentData = [];
    console.log("STUD LENGTH: " + data.length);
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      console.log(val);
      promises.push(
        client.hgetallAsync("student:" + val).then((result) => {
          console.log("RESULT: " + result);
          studentData.push(result);
          return;
        })
      );
    }
    return Promise.all(promises).then(() => {//Promise.all to consolidate responses and filter sort paginate and return them
      console.log("EXE PROMISE");
      res.status(200).json(filterSortPaginate("student", req.query, studentData));
      return;
    });
  });
});

app.post("/students", function (req, res) {
  //TODO
  
  //console.log(req.body);
  if(!req.body || !req.body.id || !req.body.name){
    res.sendStatus(400);
    return;
  }
//Hint: use saddAsync and hmsetAsync
  client.saddAsync("students", req.body.id).then((result) => {
    const studObj = {
      id: req.body.id,
      name: req.body.name,
      _ref: "/students/" + req.body.id,
    };
    if(result > 0){
      console.log(studObj);
      client.hmsetAsync("student:" + studObj.id, studObj);
      res.status(200).json(studObj);
      return;
    } 
    else{
      res.sendStatus(400);
      return;
  }});
});
app.delete("/students/:id", function (req, res) {
  //TODO
  //Hint use a Promise.all of delAsync and sremAsync
  client.existsAsync("student:" + req.params.id).then((value) => {
    if(value == 0){
      res.sendStatus(404);
      return;
    }
    client.sremAsync("students", req.params.id);
    client.delAsync("student:" + req.params.id);
    res.status(200).json({ id: req.params.id });
  });
});
app.put("/students/:id", function (req, res) {
  //TODO
  //Hint: use client.hexistsAsync and HsetAsync
  console.log(req.body);
  console.log(req.params);
  let student;
  if (req.body.id || !req.body) {
    res.sendStatus(400);
    return;
  }
  client.existsAsync("student:" + req.params.id).then((value) => {
    client.hsetAsync("student:" + req.params.id, "name", req.body.name);
  });
  res.sendStatus(200);
});

app.post("/grades", function (req, res) {
  //TODO
  //Hint use incrAsync and hmsetAsync
  if(!req.body || !req.body.student_id || !req.body.type || !req.body.max || !req.body.grade){
    res.sendStatus(400);
    return;
  }
  client.incrAsync("grades").then((data)=>{
    const db = {
      id: "" + data + "",
      _ref: "/grades/" + data,
      student_id: req.body.student_id,
      type: req.body.type,
      max: req.body.max,
      grade: req.body.grade,
    };
    client.hmsetAsync("grade:" + data, db);
    res.status(200).json({ _ref: "/grades/" + data, id: "" + data });
    return;
  });
});
app.get("/grades/:id", function (req, res) {
  //TODO
  //Hint use hgetallAsync
  client.existsAsync("grade:" + req.params.id).then((data)=>{
    if (data == 0) {
      res.sendStatus(404);
      return;
    } else {
      client.hgetallAsync("grade:" + req.params.id).then((data)=>{
        console.log("DATA" + data);
        res.status(200).json(data);
      });
    }
  });
});
app.put("/grades/:id", function (req, res) {
  //TODO
  //Hint use hexistsAsyncand hmsetAsync
  console.log(req.body);

  console.log(req.params.id);
  let student;
  if (!req.body) {
    res.sendStatus(400);
    return;
  }
  client.existsAsync("grade:" + req.params.id).then((value) => {
    console.log(value);
    console.log(req.params.id);
    if (value == 0) {
      res.sendStatus(404);
      return;
    } else {
      client.hsetAsync("grade:" + req.params.id, "grade", req.body.grade);
      res.sendStatus(200);
    }
  });
});
app.delete("/grades/:id", function (req, res) {
  //TODO
  //Hint use delAsync .....duh
  client.existsAsync("grade:" + req.params.id).then((value) => {
    if(value == 0){
      res.sendStatus(404);
      return;
    }
    client.delAsync("grade:" + req.params.id);
    res.sendStatus(200);
  });
});

app.get("/grades", function (req, res) {
  //TODO
  //Hint use getAsync, hgetallAsync
  //and consolidate with Promise.all to filter, sort, paginate
  client.getAsync("grades").then((data)=>{
    if(data == null){
      data = 0;
    }
    res.setHeader("X-Total-Count", data);
    const promises = [];
    const studentData = [];
    console.log("STUD LENGTH: " + data);
    for(let i = 1; i <= data; i++){
      promises.push(
        client.hgetallAsync("grade:" + i).then((result) => {
          console.log("RESULT: " + result);
          if(result != null){
            studentData.push(result);
          }
          return;
        })
      );
    }
    console.log(studentData);
    return Promise.all(promises).then(()=>{
      console.log("EXE PROMISE");
      console.log(studentData);
      res.status(200).json(filterSortPaginate("grade", req.query, studentData));
      return;
    });
  });
});
app.delete("/db", function (req, res) {
  client.flushallAsync().then(function () {
      //make sure the test user credentials exist
      const userObj = {
        salt: new Date().toString(),
        id: "teacher",
      };
      userObj.hash = crypto
        .createHash("sha256")
        .update("testing" + userObj.salt)
        .digest("base64");
      //this is a terrible way to do setUser
      //I'm not waiting for the promise to resolve before continuing
      //I'm just hoping it finishes before the first request comes in attempting to authenticate
      setUser(userObj).then(() => {
        res.sendStatus(200);
      });
    })
    .catch(function (err) {
      res.status(500).json({ error: err });
    });
});

app.listen(port, function () {
  console.log("Example app listening on port " + port + "!");
});
