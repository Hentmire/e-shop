const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
    try {
        const userList = await User.find().select("-passwordHash");
        if (!userList) {
            res.status(500).json({
                success: false,
            });
        }
        res.send(userList);
    } catch (e) {
        console.log("ERROR GET ALL USERS ", e.message);
        next(e);
    }
});

router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select("-passwordHash");

        if (!user) {
            res.status(500).json({
                success: false,
                message: "The category with the given ID was not found",
            });
        }

        res.status(200).send(user);
    } catch (e) {
        console.log("ERROR GET USER ", e.message);
        next(e);
    }
});

router.post("/", async (req, res) => {
    try {
        const { password } = req.body;
        let user = new User({
            ...req.body,
            passwordHash: bcrypt.hashSync(password, 10),
        });
        user = await user.save();

        if (!user) {
            return res.status(400).send("The user cannot be created.");
        }
        res.send(user);
    } catch (e) {
        console.log("ERROR POST USER ", e.message);
        next(e);
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        const secret = process.env.secret;

        if (!user) {
            return res.status(400).send("The user are not found");
        }

        if (user && bcrypt.compareSync(password, user.passwordHash)) {
            const token = jwt.sign(
                {
                    userId: user.id,
                    isAdmin: user.isAdmin,
                },
                secret,
                { expiresIn: "1d" },
            );

            res.status(200).send({ user: user.email, token });
        } else {
            res.status(400).send("Password is wrong");
        }
    } catch (e) {
        console.log("ERROR LOGIN USER ", e.message);
        next(e);
    }
});

router.post("/register", async (req, res) => {
    try {
        const { password } = req.body;
        let user = new User({
            ...req.body,
            passwordHash: bcrypt.hashSync(password, 10),
        });
        user = await user.save();

        if (!user) {
            return res.status(400).send("The user cannot be created.");
        }
        res.send(user);
    } catch (e) {
        console.log("ERROR POST USER ", e.message);
        next(e);
    }
});

router.get("/get/count", async (req, res) => {
    try {
        const userCount = await User.countDocuments();

        if (!userCount) {
            res.status(500).json({
                success: false,
            });
        }
        res.send({
            userCount,
        });
    } catch (e) {
        console.log("ERROR GET USER COUNT ", e.message);
        next(e);
    }
});

router.delete("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const deletedUser = await User.findByIdAndRemove(userId);

        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: "The user isn't found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "The user is deleted",
        });
    } catch (e) {
        console.log("ERROR DELETE USER ", e.message);
        next(e);
    }
});

module.exports = router;
