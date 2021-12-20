const e = require("express");
const express = require("express");
const { Category } = require("../models/category");
const router = express.Router();
const { Product } = require("../models/product");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");

const FILE_TYPE_MAP = {
    "image/png": "png",
    "image/jpeg": "jpeg",
    "image/jpg": "jpg",
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        const uploadError = isValid ? null : new Error("invalid image type");
        cb(uploadError, path.join(__dirname, "../public/uploads/"));
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(" ").join("-");
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    },
});

const upload = multer({ storage });

router.get("/", async (req, res) => {
    try {
        const { categories } = req.query;
        let filter = {};
        if (req.query.categories) {
            filter = {
                category: categories.split(","),
            };
        }
        const productList = await Product.find(filter).populate("category");

        if (!productList) {
            res.status(500).json({
                success: false,
            });
        }
        res.send(productList);
    } catch (e) {
        console.log("ERROR GET PRODUCTS ", e.message);
        next(e);
    }
});

router.get("/names", async (req, res) => {
    try {
        const productList = await Product.find().select(
            "name description -_id",
        );
        if (!productList) {
            res.status(500).json({
                success: false,
            });
        }
        res.send(productList);
    } catch (e) {
        console.log("ERROR GET PRODUCTS NAMES ", e.message);
        next(e);
    }
});

router.get("/:productId", async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId).populate("category");

        if (!product) {
            res.status(500).json({
                success: false,
            });
        }
        res.send(product);
    } catch (e) {
        console.log("ERROR GET PRODUCT ", e.message);
        next(e);
    }
});

router.post("/", upload.single("image"), async (req, res) => {
    try {
        const category = await Category.findById(req.body.category);
        if (!category) {
            return res.status(400).send("You sent the wrong category");
        }
        const file = req.file;
        if (!file) return res.status(400).send("The image is required");

        const basePath = `${req.protocol}://${req.get("host")}/public/upload/`;
        const fileName = req.file.filename;
        let product = new Product({
            ...req.body,
            image: `${basePath}${fileName}`,
        });

        product = await product.save();

        if (!product) {
            return res.status(500).send("The product can't be created");
        }

        return res.status(200).send(product);
    } catch (e) {
        console.log("ERROR POST PRODUCT ", e.message);
        next(e);
    }
});

router.put("/:productId", async (req, res) => {
    try {
        const { productId } = req.params;
        if (!mongoose.isValidObjectId(productId)) {
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
            res.status(500).send("The product can't be created");
        }

        res.send(product);
    } catch (e) {
        console.log("ERROR PUT PRODUCT ", e.message);
        next(e);
    }
});

router.put(
    "/gallery-images/:productId",
    upload.array("images"),
    async (req, res) => {
        try {
            const { productId } = req.params;
            if (!mongoose.isValidObjectId(productId)) {
                return res.status(400).send("Invalid Product ID");
            }

            const files = req.files;
            if (!files) {
                res.status(400).send("Images are required");
            }

            const basePath = `${req.protocol}://${req.get(
                "host",
            )}/public/upload/`;
            let imagesPathes = [];
            files.forEach((file) => {
                imagesPathes.push(`${basePath}${file.originalname}`);
            });

            const product = await Product.findByIdAndUpdate(
                req.params.productId,
                { images: imagesPathes },
                { new: true },
            );

            if (!product) {
                res.status(500).send("The product can't be created");
            }

            res.send(product);
        } catch (e) {
            console.log("ERROR PUT IMAGE GALLER ", e.message);
            next(e);
        }
    },
);

router.delete("/:productId", async (req, res) => {
    try {
        const { productId } = req.params;
        const deletedProduct = await Product.findByIdAndRemove(productId);

        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: "The product isn't found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "The product is deleted",
        });
    } catch (e) {
        console.log("ERROR DELETE PRODUCT ", e.message);
        next(e);
    }
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
        }).limit(Number.parseInt(count, 10));

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
