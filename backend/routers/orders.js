const express = require("express");
const router = express.Router();
const { Order } = require("../models/order");
const { OrderItem } = require("../models/order-item");

router.get("/", async (req, res) => {
    try {
        const orderList = await Order.find()
            .populate("user", "name")
            .sort({ dateOrdered: -1 });
        if (!orderList) {
            res.status(500).json({
                success: false,
            });
        }
        res.status(200).send(orderList);
    } catch (e) {
        console.log("ERROR GET ORDER LIST", e);
        res.status(500).json({
            success: false,
            error: e.message,
        });
    }
});

router.get("/:orderId", async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate("user", "name")
            .populate({
                path: "orderItems",
                populate: { path: "product", populate: "category" },
            });

        if (!order) {
            res.status(500).json({
                success: false,
            });
        }
        res.status(200).send(order);
    } catch (e) {
        console.log("ERROR GET ORDER", e);
        res.status(500).json({
            success: false,
            error: e.message,
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const orderItemsIds = await Promise.all(
            req.body.orderItems.map(async (item) => {
                let newOrderItem = new OrderItem(item);
                newOrderItem = await newOrderItem.save();
                return newOrderItem._id;
            }),
        );

        console.log("orderItemsIds", orderItemsIds);

        const prices = await Promise.all(
            orderItemsIds.map(async (itemId) => {
                const orderItem = await OrderItem.findById(itemId).populate(
                    "product",
                    "price",
                );
                return orderItem.product.price * orderItem.quantity;
            }),
        );

        const totalPrice = prices.reduce((a, b) => a + b, 0);

        let order = new Order({
            ...req.body,
            orderItems: orderItemsIds,
            totalPrice,
        });

        order = await order.save();

        if (!order) {
            return res.status(400).send("The order cannot be created");
        }
        res.send(order);
    } catch (e) {
        console.log("ERROR POST ORDER", e);
        res.status(500).json({
            success: false,
            error: e.message,
        });
    }
});

router.put("/:orderId", async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.orderId,
            { status: req.body.status },
            { new: true },
        );

        if (!order) {
            res.status(400).send("The order can't be updated");
        }

        res.send(order);
    } catch (e) {
        console.log("ERROR UPDATE ORDER", e);
        res.status(500).json({
            success: false,
            error: e.message,
        });
    }
});

router.delete("/:orderId", async (req, res) => {
    try {
        const order = await Order.findByIdAndRemove(req.params.orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "The order to delete isn't found",
            });
        }

        await order.orderItemsIds.forEach(async (item) => {
            await OrderItem.findByIdAndRemove(item);
        });

        return res.status(200).json({
            success: true,
            message: "The order is deleted",
        });
    } catch (e) {
        console.log("ERROR DELETE ORDER", e);
        res.status(500).json({
            success: false,
            error: e.message,
        });
    }
});

router.get("/get/totalsales", async (req, res) => {
    try {
        const totalSales = await Order.aggregate([
            {
                $group: { _id: null, totalSales: { $sum: "$totalPrice" } },
            },
        ]);

        if (!totalSales) {
            return res.status(400).send("Order sales cannot be generated");
        }

        res.status(200).send({ totalSales: totalSales.pop().totalSales });
    } catch (e) {
        console.log("ERROR GET TOTAL SALES", e);
        res.status(500).json({
            success: false,
            error: e.message,
        });
    }
});

router.get("/get/count", async (req, res) => {
    try {
        const orderCount = await Order.countDocuments();

        if (!orderCount) {
            res.status(500).json({
                success: false,
            });
        }
        res.send({
            orderCount,
        });
    } catch (e) {
        console.log("ERROR GET ORDER COUNT", e);
        return res.status(400).json({
            success: false,
            error: e.message,
        });
    }
});

module.exports = router;
