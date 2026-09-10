const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");
console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },

        async (accessToken, refreshToken, profile, done) => {

            try {

                const email = profile.emails?.[0]?.value;

                if (!email || !email.endsWith("@gmail.com")) {
                    return done(null, false, {
                        message: "Only Gmail accounts are allowed."
                    });
                }

                let user = await User.findOne({ email });

                if (!user) {

                    user = new User({
                        email: email,
                        username:
                            profile.displayName ||
                            email.split("@")[0],
                        isVerified: true
                    });

                    await User.register(
                        user,
                        Math.random().toString(36) +
                        Date.now()
                    );

                }

                return done(null, user);

            } catch (err) {

                return done(err, null);

            }

        }
    )
);