const e = require("express");
const express = require("express");
const { Category } = require("../models/category");
const router = express.Router();
const { Product } = require("../models/product");
const mongoose = require("mongoose");

router.get("/", async (req, res) => {
    let filter = {};
    if (req.query.categories) {
        filter = {
            category: req.query.categories.split(","),
        };
    }
    const productList = await Product.find(filter).populate("category");

    if (!productList) {
        res.status(500).json({
            success: false,
        });
    }
    res.send(productList);
});

router.get("/names", async (req, res) => {
    //TODO try catch
    const productList = await Product.find().select("name description -_id");
    if (!productList) {
        res.status(500).json({
            success: false,
        });
    }
    res.send(productList);
});

router.get("/:productId", async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId).populate(
            "category",
        );

        if (!product) {
            res.status(500).json({
                success: false,
            });
        }
        res.send(product);
    } catch (e) {
        console.log("ERROR GET PRODUCT", e);
        res.status(500).json({
            error: e,
            success: false,
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const category = await Category.findById(req.body.category);
        if (!category) {
            return res.status(400).send("You sent the wrong category");
        }

        let product = new Product(req.body);

        product = await product.save();

        if (!product) {
            return res.status(500).send("The product can't be created");
        }

        product
            .save()
            .then((createdProduct) => {
                res.status(201).json(createdProduct);
            })
            .catch((err) => {
                res.status(500).json({
                    error: err,
                    success: false,
                });
            });
    } catch (e) {
        console.log("ERROR POST PRODUCT", e);
        res.status(500).json({
            error: e,
            success: false,
        });
    }
});

router.put("/:productId", async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.productId)) {
        return res.status(400).send("Invalid Product ID");
    }
    //TODO try/catch
    const category = await Category.findById(req.body.category);
    if (!category) {
        return res.status(400).send("You sent the wrong category");
    }

    const product = await Product.findByIdAndUpdate(
        req.params.productId,
        req.body,
        { new: true },
    );

    if (!product) {
        res.status(400).send("The product can't be created");
    }

    res.send(product);
});

router.delete("/:productId", (req, res) => {
    Product.findByIdAndRemove(req.params.productId)
        .then((product) => {
            if (product) {
                return res.status(200).json({
                    success: true,
                    message: "The product is deleted",
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "The product isn't found",
                });
            }
        })
        .catch((err) => {
            return res.status(400).json({
                success: false,
                error: err,
            });
        });
});

router.get("/get/count", async (req, res) => {
    try {
        const productCount = await Product.countDocuments();

        if (!productCount) {
            res.status(500).json({
                success: false,
            });
        }
        res.send({
            productCount,
        });
    } catch (e) {
        console.log("ERROR GET PRODUCT COUNT", e);
        return res.status(400).json({
            success: false,
            error: e,
        });
    }
});

router.get("/get/featured/:count", async (req, res) => {
    try {
        const count = req.params.count ? req.params.count : 5;
        const products = await Product.find({
            isFeatured: true,
        }).limit(+count); //TODO to number;

        if (!products) {
            res.status(500).json({
                success: false,
            });
        }
        res.send(products);
    } catch (e) {
        console.log("ERROR GET PRODUCT COUNT", e);
        return res.status(400).json({
            success: false,
            error: e,
        });
    }
});

module.exports = router;
