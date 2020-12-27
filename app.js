var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var url = require('url');
var app = express();
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var assert = require ('assert');
var ObjectID = require('mongodb').ObjectID;
var formidable = require("formidable");
var urlencodedParser = bodyParser.urlencoded({extended:false});
var mongourl = 'mongodb://harry:whereisbosco@cluster0-shard-00-01.uhjsf.mongodb.net:27017/test?ssl=true&replicaSet=atlas-8ctydm-shard-0&authSource=admin';

function FindRestaurants(db,callback)
{
	var restaurants = [];
  traget = db.collection('restaurants').find();
  traget.each(function(err, doc)
  {
    //assert.equal(err, doc)
    if (doc!=null)
      {
        restaurants.push(doc);
      } else
      {
        callback(restaurants);
    }
  });
}


function InsertRestaurants(db,restaurantarray,callback)
{
  db.collection('restaurants').insertOne(restaurantarray,function(err,result)
  {
    assert.equal(err,null);
    callback(result);
  });
}

function UpdateRestaurant(db, doc, restaurantarray, callback)
{
	db.collection('restaurants').updateOne(doc,{$set:restaurantarray}, function(err,result)
  {
    assert.equal(err,null);
    callback(result);
  });
}

function FindRated(db,user,callback)
{
  db.collection('restaurants').findOne(user,function(err,result)
  {
    assert.equal(err,null);
    callback(result);
  });
}
                                         
function FindLRestaurantID(db,callback)
{
  db.collection('restaurants').find().sort({restaurant_id:-1}).toArray(function(err,result)
  {
    assert.equal(err,null);
    callback(result);
  });
}
                                            
function SearchRestaurant(db, restaurantarray, callback)
{
	db.collection("restaurants").find(restaurantarray).toArray(function(err, result)
    {
		assert.equal(err,null);				
		callback(result);		
	});
}                                            

function InsertUser(db,userarray,callback) 
{
  db.collection('user').insertOne(userarray,function(err,result) 
  {
    assert.equal(err,null);
    callback(result);
  });
}

//Cookies
var Key1 = 'Please let me pass 381F';
var Key2 = 'Thank you Romand So';                                           
                                            
app.set('view engine','ejs');                                            
app.use (session (
  {
  	name : 'session',
    keys : [Key1, Key2]
  })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// SLASH
app.get('/',function(req,res) 
{
    if (!req.session.authenticated) 
    {
			res.redirect('/login');
    } else 
    {
        MongoClient.connect(mongourl, function(err, db) 
        {
					assert.equal(err,null);
					console.log('Connected to MongoDB\n');
          FindRestaurants(db,function(restaurants) 
          {
						db.close();			
						res.render('index',{name:req.session.username,data:restaurants});
						return(restaurants);
					});
				});		
		}
});


// LOGIN
app.get('/login',function(req,res) 
{
    res.render('login');
});

app.post('/login',urlencodedParser,function(req,res) 
{
    MongoClient.connect(mongourl, function(err, db) 
    {
    	try 
      {
      	assert.equal(err,null);
      } catch (err) 
      {
      	res.set({"Content-Type":"text/plain"});
        res.status(500).end("connection failed!");
      }
	  console.log("Start search");
      db.collection('user').find({username:req.body.username}, function(err, user) 
      {
		user.next(function(err, doc){
			var username = doc['username'];
			var password = doc['password'];
			if(user ===null)
			{
						res.set({"Content-Type":"text/html"});
						res.end("<title>Error</title><h1>User is not exist.</h1><a href='login'>Go Back</a>");
			}else if (username === req.body.username && password === req.body.password)
			{
						req.session.authenticated = true;
						req.session.username = username;
						res.redirect('/');
			} else 
			{	
						res.set({"Content-Type":"text/html"});
						res.status(404).end("<title>Error</title><h1>Error   Occur.</h1><a href='login'>Go Back</a>");
					}
			});
			
		});
        
	});
});

// ADDUSER 
app.get('/new', function(req, res)
{
	res.status(200);
	res.render('new');
});

app.get('/adduser',function(req,res) 
{
	res.status(200);
	res.render('adduser');	
});

app.post('/adduser', function(req, res)
{
    MongoClient.connect(mongourl, function(err,db) {
    try 
    {
      assert.equal(err,null);
      console.log('connection successful.')
    } catch (err) 
    {
      res.set({"Content-Type":"text/plain"});
      res.status(500).end("connection failed!");
    }
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, form_field, value)
    {
      if (form_field.username) 
      {
        var username = form_field.username;
      }
      var password = form_field.password;
      if (form_field.email) 
      {
        var email = form_field.email;
      }
      var user_array = {};
      user_array['username'] = username;
      user_array['password'] = password;
      user_array['email'] = email;
      InsertUser(db, user_array, function(result)
      {
        db.close();       
      });      
    });
     res.redirect('/');
  });
});

// Create new restaurant 
app.post('/create', function(req, res)
{
	var form = new formidable.IncomingForm();
  form.parse(req, function (err, form_field, files)
  {		 
  	if (form_field.name) 
    {
			var name = form_field.name;
		}
    if (form_field.borough) 
    {
			var borough = form_field.borough;
		}
    if (form_field.cuisine) 
    {
			var cuisine = form_field.cuisine;
		}
    if (form_field.street) 
    {
			var street = form_field.street;
		}
    if (form_field.building) 
    {
			var building = form_field.building;
		}
    if (form_field.zipcode) 
    {
			var zipcode = form_field.zipcode;
		}
    if (form_field.lon && form_field.lat) 
    {
			var lon = form_field.lon;
			var lat = form_field.lat;
			var havemap = true;
    }else
    {			  
			var havemap = false;
		}	
		  var filename = files.filetoupload.path;
      if (files.filetoupload.type) 
      {
				var mimetype = files.filetoupload.type;			  
		  }
		  if(files.filetoupload.size > 0 && mimetype=="image/jpeg")
      {
			  var showphoto = true;			  
		  }else
      {
			  var showphoto = false;			  
		  }
		  var owner = req.session.username;
      fs.readFile(filename, function(err,data) 
      {
      	MongoClient.connect(mongourl, function(err,db) 
      {
      	try 
        {
			  	assert.equal(err,null);
			    console.log('connection successful.')
        } catch (err) 
        {
			    res.set({"Content-Type":"text/plain"});
			    res.status(500).end("connection failed!");
			  }
        FindLRestaurantID(db, function(result)
        {
        	if(result == '')
          {
						var restid = 1;
          }else
          {
						var restid = result[0].restaurant_id + 1;
					}
					console.log("restid " + restid + " inserted");
			    var restaurant_array = {};
			    restaurant_array['restaurant_id'] = restid;
			    restaurant_array['name'] = name;
			    restaurant_array['borough'] = borough;
			    restaurant_array['cuisine'] = cuisine;
			    restaurant_array['address'] = {'street':street, 'building':building, 'zipcode':zipcode, 'coord':[lon, lat]};
			    restaurant_array['owner'] = owner;
          if (files.filetoupload.size > 0 && mimetype=="image/jpeg")
          {
				    restaurant_array['mimetype'] = mimetype;
				    restaurant_array['photo'] = new Buffer(data).toString('base64');
          }else
          {
						console.log("not jpg");
			    }
          InsertRestaurants(db, restaurant_array, function(result)
          {
			    	db.close();			  
			      var cid = result.ops;
			      var _id = cid[0]._id;
            res.render('create',
            {
				    	name:name, 
				    	borough:borough, 
				      owner:owner, 
				      cuisine:cuisine, 
				      street:street, 
				      building:building, 
				      zipcode:zipcode, 
				      lon:lon, 
				      lat:lat,				   
				      photo:restaurant_array['photo'], 
				      mimetype:mimetype, 
				      restid:restid, 
				      _id:_id,  
				      showphoto:showphoto,
				      havemap:havemap
			      });
		      });
		    });
		 });
	  });
   });
});

//Change 
app.get('/change', function(req, res)
{
  var parsedURL = url.parse(req.url,true);
	var query_Object = parsedURL.query;
  if (query_Object._id.length === 24) 
  {
		res.status(200);
		var doc = {};
		doc['_id'] = ObjectID(query_Object._id);		
    MongoClient.connect(mongourl, function(err, db) 
    {
      try 
      {
				assert.equal(err,null);
      } catch (err) 
      {
				res.set({"Content-Type":"text/plain"});
				res.status(500).end("connection failed!");
			}
      db.collection('restaurants').findOne(doc, function(err, result) 
      {			
				db.close();						
        if(result.owner===req.session.username)
        {	
					console.log("You are owner");
          res.render('change',
          {
						name:result.name,
						_id:query_Object._id,
						borough:result.borough, 
						cuisine:result.cuisine, 
						street:result.address.street, 
						building:result.address.building,
						zipcode:result.address.zipcode,
						lon:result.address.coord[0],
						lat:result.address.coord[1]
					});
      	}else
        {
					console.log("You are not owner");
					res.set({"Content-Type":"text/html"});
					res.status(404).end(
					"<title>Error</title><h1>You are not authorized to edit.</h1><a href='display?_id="+query_Object._id+"'>Go Back</a>");
				}								
			});
		});		
    }else  
    {
		res.set({"Content-Type":"text/html"});
		res.status(404).end("<title>Error</title><h1>Invalid ID.</h1><a href='/'>Go Back</a>");
		}
});

app.post('/change', function(req, res)
{
    if(req.session.authenticated == true)
    {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, form_field, files)
        {		
            var doc = {};
            doc['_id'] = ObjectID(form_field._id);	 
            var filename = files.filetoupload.path;
            if (files.filetoupload.type) 
            {
            	var mimetype = files.filetoupload.type;			  
            }
            if (form_field.name) 
            {
            	var name = form_field.name;
            }
            if (form_field.borough) 
            {
            	var borough = form_field.borough;
            }
            if (form_field.cuisine) 
            {
            	var cuisine = form_field.cuisine;
            }
            if (form_field.street) 
            {
            	var street = form_field.street;
            }
            if (form_field.building) 
            {
            	var building = form_field.building;
            }
            if (form_field.zipcode) 
            {
            	var zipcode = form_field.zipcode;
            }
            if (form_field.lon && form_field.lat) 
            {
            	var lon = form_field.lon;
              var lat = form_field.lat;			  
            }	        
            fs.readFile(filename, function(err,data) 
            {
              MongoClient.connect(mongourl, function(err,db)
              {
              try 
              {
                assert.equal(err,null);
                console.log('connection successful.')
              } catch (err) 
              {
                res.set({"Content-Type":"text/plain"});
                res.status(500).end("connection failed!");
              }			
              var update_array = {};			
              update_array['name'] = name;
              update_array['borough'] = borough;
              update_array['cuisine'] = cuisine;
              update_array['address'] = {'street':street, 'building':building, 'zipcode':zipcode, 'coord':[lon, lat]};					
              update_array['mimetype'] = mimetype;
              update_array['photo'] = new Buffer(data).toString('base64');           
              UpdateRestaurant(db, doc, update_array, function(result)
              {
                db.close();
                res.redirect('/display?_id=' + form_field._id);
              });		   
            });
        });
       });
    }else
    {
    	res.redirect('/login');
    }	
});
 
// Delete
app.get('/delete', function(req, res)
{
	var parsedURL = url.parse(req.url,true);
	var query_Object = parsedURL.query;
  if (query_Object._id.length === 24) 
  {
		res.status(200);
		var doc = {};
		doc['_id'] = ObjectID(query_Object._id);
    MongoClient.connect(mongourl, function(err, db) 
    {
    	try 
      {
				assert.equal(err,null);
      } catch (err) 
      {
				res.set({"Content-Type":"text/plain"});
				res.status(500).end("connection failed!");
			}
      db.collection('restaurants').findOne(doc, function(err, result) 
      {
        console.log(result);
        if(result.owner===req.session.username)
        {
					console.log("You are owner");
          console.log(result.name);
          db.collection('restaurants').deleteOne(doc, function(err, result) 
          {
            if(err) throw err;
            console.log(result +"was deleted");
          });
			    res.redirect('/');
        }else
        {
					console.log("You are not owner");
					res.set({"Content-Type":"text/html"});
					res.status(404).end(
          "<title>Error</title><h1>You are not authorized to delete.</h1><a href='display?_id="+query_Object._id+"'>Go Back</a>");
				}
		    });
	    });
  }else
  {
		res.set({"Content-Type":"text/html"});
		res.status(404).end("<title>Error</title><h1>Invalid .</h1><a href='/'>Go Back</a>");
	}
});

//Search
app.get('/search',urlencodedParser,function(req,res) 
{
	var parsedURL = url.parse(req.url,true);
  var query_Object = parsedURL.query;
	if(query_Object.opt !=null && query_Object.keywords !=null
  && query_Object.opt !="" && query_Object.keywords !="")
  {			
		var keyword = query_Object.keywords;
		var opt = query_Object.opt;		
		var search_array = {};
		search_array[opt] = new RegExp(keyword);	
    MongoClient.connect(mongourl, function(err, db) 
    {
      try 
      {
				assert.equal(err,null);
      } catch (err) 
      {
				res.set({"Content-Type":"text/plain"});
				res.status(500).end("connection failed!");
			}
      SearchRestaurant(db, search_array, function(result)
      {
				db.close(); 
				res.status(200);
        res.render('search',
        {
					keyword:keyword,
					opt:opt,
					result:result
				});			
			});		
		});		
  }else
  {
		res.status(200);
    res.render('search',
    {
			keyword:null,
			opt:null,
			result:null
		});		
	}	
});

//Grades 
app.get('/rate', function(req, res)
{
	var parsedURL = url.parse(req.url,true);
	var query_Object = parsedURL.query;
  if (query_Object._id.length === 24) 
  {
		console.log(query_Object._id);
		res.status(200);
		res.render('rate',{name:query_Object.name, _id:query_Object._id});
  }else
  {
		res.set({"Content-Type":"text/html"});
		res.status(404).end("<title>Error</title><h1>Invalid ID.</h1><a href='/'>Go Back</a>");
	}
});

app.post('/rate', function(req, res)
{  
    var query = {};
    query['_id'] = ObjectID(req.body._id);
    var newrate = {$push: {grades: { score:req.body.score, user:req.session.username} }} ;
    var user_array = {};
    user_array['_id'] = ObjectID(req.body._id);
    user_array['grades.user'] = req.session.username;  
    MongoClient.connect(mongourl, function(err,db) 
    {
      FindRated(db,user_array,function(result)
      {
        if(result!=null)
        {
          res.set({"Content-Type":"text/html"});		
          res.status(404).end("<title>Error</title><h1>Restaurant had been rated already.</h1><a href='display?_id="+req.body._id+"'>Go Back</a>");
        }else
        {
          db.collection("restaurants").updateOne(query, newrate, function(err, res) 
          {
            if (err) throw err;
            console.log("grades added");
            db.close();
          });
          res.redirect('/display?_id=' + req.body._id);
        }
      });     
    });
});

//Display
app.get('/display',urlencodedParser,function(req,res) 
{
    var parsedURL = url.parse(req.url,true);
    var query_Object = parsedURL.query;
    if (query_Object._id.length === 24) 
    {
				var doc = {};			  
				doc['_id'] = ObjectID(query_Object._id);		
    		MongoClient.connect(mongourl, function(err, db) 
    		{
      		try 
     	 	{
			  	assert.equal(err,null);
      	} catch (err) 
      	{
			 	 	res.set({"Content-Type":"text/plain"});
			  	res.status(500).end("connection failed!");
		    }
		console.log("start");
        db.collection('restaurants').findOne(doc, function(err, result) 
        {			
			    db.close();
			console.log(result);
          if(result.mimetype==null && result.photo==null)
          {				
				    var showphoto = false;
          }else  
          {
						var showphoto = true;
          }
          if(result.address.coord[0]==null && result.address.coord[1]==null)
          {				
						var havemap = false;
          }else
          {
						var havemap = true;
					}				
				var grades = result.grades;
        if(grades==null)
        {				
					var haverate = false;
					grades = "";
        }else
        {
					var haverate = true;
				}		
			res.status(200);
      res.render('display', 
      {
				_id:result._id,
				name:result.name, 
				borough:result.borough, 
				cuisine:result.cuisine, 
				street:result.address.street, 
				building:result.address.building,
				zipcode:result.address.zipcode,
				lon:result.address.coord[0],
				lat:result.address.coord[1],
				owner:result.owner,
				rate:result.grades,
				grades:grades,				
				mimetype:result.mimetype, 
				photo:result.photo,
				showphoto:showphoto,
				havemap:havemap,
				haverate:haverate,
			});
		  });
		 });
    }else
    {
      res.set({"Content-Type":"text/html"});
	    res.status(404).end("<title>Error</title><h1>Invalid ID.</h1><a href='/'>Go Back</a>");
    }
});

//Google Map
app.get("/gmap", urlencodedParser, function(req,res) 
{
  var parsedURL = url.parse(req.url,true);
  var query_Object = parsedURL.query;	
  if (query_Object.lat != "" && query_Object.lon != "" && query_Object.name != "") 
  {
		res.status(200);
		res.render('gmap', {lat:query_Object.lat, lon:query_Object.lon, name:query_Object.name});
  }else
  {			
		res.set({"Content-Type":"text/html"});
		res.status(404).end("<title>Error</title><h1>Name or lat or lon is missing.</h1><a href='/'>Go Back</a>");		
	}
});

// Use
app.use(express.static(__dirname +  '/public'));


// RESTFUL service 
app.get('/api/restaurant/:name/:data',function(req, res) {
	var name = req.params.name;
	var data = req.params.data;
	var criteria = {};
	criteria[req.params.name] = req.params.data;
    MongoClient.connect(mongourl, function(err, db) {
    	findRestaurants(db,criteria,0,function(r) {
    			if(r.length>0){
    				res.status(200).json(r).end();
    			}else{
    				res.status(200).json({}).end();
    			}
				
    	});
    });
});

// For Restful Function 
function findRestaurants(db,criteria,max,callback) {
	var restaurants = [];
	if (max > 0) {
		cursor = db.collection('restaurant').find(criteria).limit(max); 		
	} else {
		cursor = db.collection('restaurant').find(criteria); 				
	}
	cursor.each(function(err, doc) {
		assert.equal(err, null); 
		if (doc != null) {
			restaurants.push(doc);
		} else {
			callback(restaurants); 
		}
	});
}

//Logout
app.get('/logout',function(req,res) 
{
	req.session = null;
	res.render('logout');
});

app.get('*', function(req,res) 
{
    res.status(404).end('File not found');
});
  
app.listen(process.env.PORT || 3000);