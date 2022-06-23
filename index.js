const express = require('express');
const app = express();
const port = 8081;
const path = require('path');
const session = require('express-session');

const passport = require('passport');
const YandexStrategy = require('passport-yandex').Strategy;
const VKontakteStrategy = require('passport-vkontakte').Strategy;

app.use(session({ secret: 'supersecret', resave: true, saveUninitialized: true }));

let Users = [];

const findUserByLogin = (login) => {
    return Users.find((element)=> {
        return element.login == login;
    })
}

const findUserByEmail = (email) => {
    return Users.find((element)=> {
        return element.email.toLowerCase() == email.toLowerCase();
    })
}

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user, done) => {
    done(null, user.login);
  });
//user - объект, который Passport создает в req.user
passport.deserializeUser((login, done) => {
    user = findUserByLogin(login);
    done(null, user);
});

passport.use(new YandexStrategy({
    clientID: 'c8b54602364446c49d12469e5e9b23b1',
    clientSecret: '5e38f92c8a4746838a640990ff626220',
    callbackURL: 'http://localhost:8081/auth/yandex/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    let user = findUserByEmail(profile.emails[0].value);

    if (user) {
        user.profile = profile;
        return done(null, user);
    } else {
        Users.push({
            'login': profile.id,
            'email': profile.emails[0].value
        });
        user = Users[Users.length - 1];
        user.profile = profile;
        return done(null, user);
    }
  }
));

passport.use(
    new VKontakteStrategy(
        {
            clientID: 8201770,
            clientSecret: 'afwmmiz1KBCx8cjOw7jK',
            callbackURL: 'http://localhost:8081/auth/vkontakte/callback',
        },
        (accessToken, refreshToken, params, profile, done) => {
            let user = findUserByLogin(profile.id);

            if (user) {
                user.profile = profile;
                return done(null, user);
            }
            else {
                Users.push({
                    'login': profile.id,
                    'email': ''
                });
                user = Users[Users.length - 1];
                user.profile = profile;
                return done(null, user);
            }
        }
    )
);

const isAuth = (req, res, next)=> {
    if (req.isAuthenticated()) return next();

    res.redirect('/sorry');
}

app.get('/', (req, res)=> {
    res.sendFile(path.join(__dirname, 'main.html'));
});
app.get('/sorry', (req, res)=> {
    res.sendFile(path.join(__dirname, 'sorry.html'));
});
app.get('/auth/yandex', passport.authenticate('yandex'));

app.get('/auth/yandex/callback', passport.authenticate('yandex', { failureRedirect: '/sorry', successRedirect: '/private' }));

app.get('/auth/vkontakte', passport.authenticate('vkontakte'));

app.get('/auth/vkontakte/callback', passport.authenticate('vkontakte', { failureRedirect: '/sorry', successRedirect: '/private'}));

app.get('/private', isAuth, (req, res)=>{
    res.send(req.user);
});

app.listen(port, () => console.log(`App listening on port ${port}!`))