const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require('jsonwebtoken');  
const passport = require('passport');
const passportJWT = require('passport-jwt');
const serverless = require("serverless-http");
const userService = require("./user-service.js");
let ExtractJwt = passportJWT.ExtractJwt;
let JwtStrategy = passportJWT.Strategy;
dotenc.config();
let jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey: process.env.JWT_SECRET || '&0y7$noP#5rt99&GB%Pz7j2b1vkzaB0RKs%^N^0zOP89NT04mPuaM!&G8cbNZOtH'
  };

  let strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);
    
    checkUser(jwt_payload.userName)  // Use your existing checkUser()
      .then((user) => {
        next(null, user);  // user has _id & userName only
      })
      .catch((err) => {
        next(err);
      });
  });

  passport.use(strategy);
app.use(passport.initialize());


app.use(express.json());
app.use(cors());

app.use(async (req, res, next) => {
    try {
      await userService.connect();
      next();
    } catch (err) {
      res.status(500).json({ message: "Database connection failed", error: err });
    }
  });
  
app.post("/api/user/register", (req, res) => {
    userService.registerUser(req.body)
    .then((msg) => {
        res.json({ "message": msg });
    }).catch((msg) => {
        res.status(422).json({ "message": msg });
    });
});

app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body)
    .then((user) => {
        if (user) {
             let payload = {
                _id: user._id,
                userName: user.userName
            };
            
            
            let token = jwt.sign(payload, process.env.JWT_SECRET);
            
            
            res.json({ 
                "message": `Welcome back ${user.userName}`,
                "token": token 
            });
        } else {
            res.status(422).json({ "message": "Invalid credentials" });
        }
    }).catch(msg => {
        res.status(422).json({ "message": msg });
    });
});

app.get("/api/user/favourites",passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.getFavourites(req.user._id)
    .then(data => {
        res.json(data);
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })

});

app.put("/api/user/favourites/:id",passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.addFavourite(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});

app.delete("/api/user/favourites/:id",passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.removeFavourite(req.user._id, req.params.id)
    .then(data => {
        res.json(data)
    }).catch(msg => {
        res.status(422).json({ error: msg });
    })
});


module.exports = app;