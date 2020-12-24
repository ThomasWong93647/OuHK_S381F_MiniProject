//OUHK_S381F_MiniProject
var express = require('express');
var session = require('session');
var bodyParser = require('body-parser');
const { assert } = require('console');
var app = express();
var mongourl = '';

app.set('view engine','ejs');
app.use(express.static(_dirname + '/public'));
app.use(bodyParser.urlencoded(( extended => false)));
app.use(bodyParser.json());

app.get('/',function(req,res)
{
    res.redirect('login');
});

app.post('/login',function(req,res)
{
    var name = req.body.name;
    var password = req.body.password;
    MongoClient.connect(mongourl,function(err,db)
    {
        assert.equal(err,null);
        var user = db.collection('user').find({'name':name,'password':password});
        user.each(function(err,doc)
        {
            assert.equal(err,null);
            if (doc != null)
            {
                req.session.passed = true;
                req.session.username = name;
            }else
            {
                res.render("login.ejs");
            }
        })
    });
});
