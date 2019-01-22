const express = require('express')
const app = express()
const port = 3333
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');
const session = require('express-session');

app.set('view engine', 'pug');
app.set('views','./views');
var sess = {
  secret: 'something',
  cookie: {httpOnly: false}
}
app.use(session(sess))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
var getprofile = function (userid) {
  profiles = {313: {username: 'donald', account_balance: 'USD 13'}, 45: {username: 'trump', account_balance: 'USD -10000000000000'}}
  var user = profiles[userid]
  if (user) {
    return user
  } else {
    return 0
  }

}
app.get('/', (req, res) => res.render('hello'))

app.get('/profile/userid/:user', (req, res) => {
  var user = req.params.user
  var userdata = getprofile(user)
  if (userdata == 0) {
    res.status(404).end('404 Not Found')
  } else {
    res.json({username: userdata['username'], account_balance: userdata['account_balance']})
  }
})

app.get('/search', (req, res) => {
  if (req.session.login) {
    res.set('X-XSS-Protection','0')
    var something = req.query.q
    res.render('fakesearch', {injected: something})
  } else {
    res.redirect('/login?err=You need to log in to use search')
  }
})

var db = new sqlite3.Database('demo.db')

db.serialize(function () {
  app.post('/login', (req, res) => {
    username = req.body.username
    password = req.body.password
    myquery = "SELECT * FROM Users Where uname='" + username +"' AND pword = '" + password +"';"
    console.log(myquery)
    if (username) {
      db.get(myquery, function(err, out) {
        if (err) {
          res.redirect('/login?err=' + err)
        } else {
          if (out) {
            req.session.login=true
            res.redirect('/search')
          } else {
            res.redirect('/login?err=Login error')
          }
        }
      })
    } else {
      res.render('login')
    }
  })

  app.get('/login', (req, res) => {
    errmsg = req.query.err
    if (req.session.login) {
      res.redirect('/search')
    }
    if (errmsg) {
      context = {err: errmsg}
    } else {
      context = {}
    }
    res.render('login', context)
  })
})

app.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/login')
})



app.listen(port, () => console.log(`Example app listening on port ${port}!`))
