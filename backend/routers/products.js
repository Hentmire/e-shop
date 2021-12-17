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
        res.status(500).send("The product can't be created");
    }

    res.send(product);
});

router.put(
    "/gallery-images/:productId",
    upload.array("images"),
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.productId)) {
                return res.status(400).send("Invalid Product ID");
            }

            const files = req.files;
            console.log("files", files);
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
            console.log("ERROR POST IMAGE GALLERY", e);
            res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    },
);

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
