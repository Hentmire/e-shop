const express = require("express");
const router = express.Router();
const { Category } = require("../models/category");

router.get("/", async (req, res) => {
    try {
        const categoryList = await Category.find();
        if (!categoryList) {
            res.status(500).json({
                success: false,
            });
        }
        res.status(200).send(categoryList);
    } catch (e) {
        console.log("ERROR GET CATEGORIES ", e.message);
        next(e);
    }
});

router.get("/:categoryId", async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await Category.findById(categoryId);

        if (!category) {
            res.status(500).json({
                success: false,
                message: "The category with the given ID was not found",
            });
        }

        res.status(200).send(category);
    } catch (e) {
        console.log("ERROR GET CATEGORY ", e.message);
        next(e);
    }
});

router.post("/", async (req, res) => {
    try {
        const { name, icon } = req.body;
        let category = new Category({
            name,
            icon,
        });
        category = await category.save();

        if (!category) {
            res.status(400).send("The category can't be created");
        }

        res.send(category);
    } catch (e) {
        console.log("ERROR POST CATEGORY ", e.message);
        next(e);
    }
});

router.put("/:categoryId", async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await Category.findByIdAndUpdate(
            categoryId,
            req.body,
            { new: true },
        );

        if (!category) {
            res.status(400).send("The category can't be updated");
        }

        res.send(category);
    } catch {
        console.log("ERROR UPDATE CATEGORY ", e.message);
        next(e);
    }
});

router.delete("/:categoryId", async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndRemove(categoryId);

        if (!deletedCategory) {
            return res.status(404).json({
                success: false,
                message: "The category isn't found",
            });
        }
        return res.status(200).json({
            success: true,
            message: "The category is deleted",
        });
    } catch (e) {
        console.log("ERROR UPDATE CATEGORY ", e.message);
        next(e);
    }
});

module.exports = router;
