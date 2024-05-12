const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminLayout = "../views/layouts/admin";
const jwtSecret = process.env.JWT_SECRET;

/**
 * Check - Login 
 */
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}


/**
 * GET /
 * Admin - Login Page
 */
router.get("/admin", async (req, res) => {
    const locals = {
        title: "Admin",
        description: "Admin"
    }
    try {
        res.render("admin/index", { locals, layout: adminLayout });
    } catch (error) {
        console.log(error)
    }
})

/**
 * POST /
 * Admin - Check Login
 */
router.post("/admin", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ userId: user._id }, jwtSecret);
        res.cookie("token", token, { httpOnly: true });
        res.redirect("/dashboard");
    } catch (error) {
        console.log(error)
    }
})

/**
 * POST /
 * Admin - Dashboard
 */
router.get("/dashboard", authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Admin Dashboard",
            description: "Admin Dashboard"
        }
        const data = await Post.find();
        res.render("admin/dashboard", {
            locals,
            data,
            layout: adminLayout
        });
    } catch (error) {
        console.log(error);
    }
})

/**
 * POST /
 * Admin - Register
 */
router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
            const user = await User.create({ username, password: hashedPassword });
            res.status(201).json({ message: "User Created", user });
        } catch (error) {
            if (error.code === 11000) {
                res.status(409).json({ message: "User already in use" });
            }
            res.status(500).json({ message: "Internal server error" });
        }
    } catch (error) {
        console.log(error)
    }
})


/**
 * GET /
 * Admin - Create New Post
 */
router.get("/add-post", authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Add New Post",
            description: "Add New Post"
        }
        const data = await Post.find();
        res.render("admin/add-post", {
            locals,
            layout: adminLayout
        });
    } catch (error) {
        console.log(error);
    }
})

/**
 * POST /
 * Admin - Create New Post
 */
router.post("/add-post", authMiddleware, async (req, res) => {
    try {
        try {
            const newPost = new Post({
                title: req.body.title,
                body: req.body.body
            });
            await Post.create(newPost);
            res.redirect("/dashboard");
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
})

/**
 * GET /
 * Admin - Edit Post
 */
router.get("/edit-post/:id", authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: "Edit Post",
            description: "Edit Post"
        }
        const data = await Post.findOne({ _id: req.params.id });
        res.render("admin/edit-post", {
            data,
            layout: adminLayout,
            locals
        });
    } catch (error) {
        console.log(error);
    }
})

/**
 * PUT /
 * Admin - Edit Post
 */
router.put("/edit-post/:id", authMiddleware, async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        });
        res.redirect(`/edit-post/${req.params.id}`);
    } catch (error) {
        console.log(error);
    }
})

/**
 * DELETE /
 * Admin - Delete Post
 */
router.delete("/delete-post/:id", authMiddleware, async (req, res) => {
    try {
        await Post.deleteOne({ _id: req.params.id });
        res.redirect("/dashboard");
    } catch (error) {
        console.log(error);
    }
})

/**
 * GET /
 * Admin - Logout
 */
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
})

module.exports = router;
