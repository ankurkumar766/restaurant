

const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");
const Order = require("../models/order");
const sendEmail = require("../utils/sendEmail");

router.get("/", (req, res) => {

    res.render("admin/adminLogin");

});


router.post("/login", (req, res) => {

    console.log("BODY =", req.body);

    if (!req.body) {
        return res.send("req.body is undefined");
    }

    const adminPassword = "Ankur@123#";

    if (req.body.password === adminPassword) {

        req.session.isAdmin = true;

        return res.redirect("/admin/dashboard");

    }

    res.send("Wrong Password");

});

router.get("/logout",(req,res)=>{

    req.session.isAdmin=false;

    res.redirect("/admin");

});
// router.get("/dashboard", (req, res) => {
//     res.render("admin/dashboard");
// });
router.get("/dashboard", async (req, res) => {
     if(!req.session.isAdmin){

        return res.redirect("/admin");

    }

    const totalUsers = await User.countDocuments();
   const unreadOrders = await Order.countDocuments({
    $or: [
        { isSeen: false },
        { isSeen: { $exists: false } }
    ]
});

    const totalMenu = await Listing.countDocuments();

    const totalReviews = await Review.countDocuments();

    const totalOrders = await Order.countDocuments();

    const totalRevenue = await Order.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$totalPrice" }
            }
        }
    ]);

    const revenue =
        totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    const latestUsers = await User.find()
        .sort({ _id: -1 })
        .limit(10);

    const latestOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(20);

    res.render("admin/dashboard", {

        totalUsers,

        totalMenu,

        totalReviews,

        totalOrders,
        unreadOrders,

        revenue,

        latestUsers,

        latestOrders

    });

});
router.get("/user", async (req, res) => {

    if (!req.session.isAdmin) {
        return res.redirect("/admin");
    }

    const page = parseInt(req.query.page) || 1;

    const limit = 20;

    const search = req.query.search || "";

    const query = {
        $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
        ]
    };

    const totalUsers = await User.countDocuments(query);

    const users = await User.find(query)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/user", {
        users,
        page,
        totalPages,
        search,
        totalUsers
    });

});
router.delete("/users/:id", async (req, res) => {

    if (!req.session.isAdmin) {
        return res.redirect("/admin");
    }

    await User.findByIdAndDelete(req.params.id);

    req.flash("success", "User Deleted Successfully");

    res.redirect("/admin/user");

});

router.get("/order", async (req, res) => {
   await Order.updateMany(
    {
        $or: [
            { isSeen: false },
            { isSeen: { $exists: false } }
        ]
    },
    {
        $set: { isSeen: true }
    }
);

    if (!req.session.isAdmin) {
        return res.redirect("/admin");
    }

    const orders = await Order.find()
        .sort({ createdAt: -1 });

    res.render("admin/order", {

        orders

    });

});
router.post("/order/:id/delete", async (req, res) => {

    if (!req.session.isAdmin) {
        return res.redirect("/admin");
    }

    try {

        await Order.findByIdAndDelete(req.params.id);

        req.flash("success", "Order Deleted Successfully.");

        res.redirect("/admin/order");

    } catch (err) {

        console.log(err);

        req.flash("error", "Unable to delete order.");

        res.redirect("/admin/order");

    }

});
router.get("/menu", async (req, res) => {

    if (!req.session.isAdmin) {
        return res.redirect("/admin");
    }

    const listings = await Listing.find();

    res.render("admin/menu", {

        listings

    });

});
router.get("/reviews", async (req, res) => {

    if (!req.session.isAdmin) {
        return res.redirect("/admin");
    }

    const reviews = await Review.find({})
        .populate("author")
        .sort({ _id: -1 });

    res.render("admin/reviews", {
        reviews
    });

});
router.post("/reviews/:id/delete", async (req, res) => {

    if (!req.session.isAdmin) {
        return res.redirect("/admin");
    }

    await Review.findByIdAndDelete(req.params.id);

    req.flash("success", "Review Deleted Successfully");

    res.redirect("/admin/reviews");

});
router.get("/analytics", async (req, res) => {

    if (!req.session.isAdmin) {
        return res.redirect("/admin");
    }

    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalMenu = await Listing.countDocuments();
    const totalReviews = await Review.countDocuments();

    const revenueData = await Order.aggregate([
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$totalPrice"
                }
            }
        }
    ]);

    const totalRevenue =
        revenueData.length > 0 ? revenueData[0].total : 0;

    const today = new Date();

    today.setHours(0,0,0,0);

    const todayOrders = await Order.countDocuments({
        createdAt: { $gte: today }
    });

    const todayRevenueData = await Order.aggregate([
        {
            $match:{
                createdAt:{ $gte: today }
            }
        },
        {
            $group:{
                _id:null,
                total:{ $sum:"$totalPrice" }
            }
        }
    ]);

    const todayRevenue =
        todayRevenueData.length>0
        ? todayRevenueData[0].total
        :0;

    res.render("admin/analytics",{

        totalUsers,
        totalOrders,
        totalMenu,
        totalReviews,
        totalRevenue,
        todayOrders,
        todayRevenue

    });

});

// router.post("/order/:id/out-for-delivery", async (req, res) => {

//     if (!req.session.isAdmin) {
//         return res.redirect("/admin");
//     }

//     try {

//        const order = await Order.findByIdAndUpdate(
//     req.params.id,
//     { status: "Out for Delivery" },
//     { new: true }
// ).populate("user");

// await sendEmail(
//     order.user.email,
//     "🚚 Your Order is Out for Delivery",
// `Hello ${order.name},

// Your order is now Out for Delivery.

// Thank you for ordering with us.

// Team Restaurant`
// );
//         req.flash("success", "Order is now Out for Delivery.");

//         res.redirect("/admin/order");

//     } catch (err) {

//         console.log(err);

//         req.flash("error", "Unable to update order status.");

//         res.redirect("/admin/order");

//     }

// });

router.post("/order/:id/out-for-delivery", async (req, res) => {

    if (!req.session.isAdmin) {
        return res.redirect("/admin");
    }

    try {

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const order = await Order.findById(req.params.id)
            .populate("user");

        order.status = "Out for Delivery";
        order.deliveryOTP = otp;

        await order.save();

        await sendEmail(
            order.user.email,
            "🚚 Your Order is Out for Delivery",

`Hello ${order.name},

Your order is now Out for Delivery.

Delivery OTP : ${otp}

Please share this OTP only after receiving your order.

Thank you for ordering with us.

Team Restaurant`
        );

        req.flash(
            "success",
            "Order is now Out for Delivery."
        );

        res.redirect("/admin/order");

    } catch (err) {

        console.log(err);

        req.flash(
            "error",
            "Unable to update order status."
        );

        res.redirect("/admin/order");
    }

});
router.post("/order/:id/delivered", async (req, res) => {

    if (!req.session.isAdmin) {
        return res.redirect("/admin");
    }

    try {

       const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status: "Delivered" },
    { new: true }
).populate("user");

await sendEmail(
    order.user.email,
    "✅ Your Order Has Been Delivered",
`Hello ${order.name},

Your order has been delivered successfully.

We hope you enjoyed your meal.

Thank you for ordering with us.

⭐⭐⭐⭐⭐
Please visit again.

Team Restaurant`
);

        req.flash("success", "Order Delivered Successfully.");

        res.redirect("/admin/order");

    } catch (err) {

        console.log(err);

        req.flash("error", "Unable to update order status.");

        res.redirect("/admin/order");

    }

});

router.post("/order/:id/verify-otp", async (req, res) => {

    if (!req.session.isAdmin) {
        return res.redirect("/admin");
    }

    try {

        const order = await Order.findById(req.params.id);

        if (!order) {

            req.flash("error","Order Not Found");

            return res.redirect("/admin/order");

        }

        if (order.deliveryOTP === req.body.otp) {

            order.status = "Delivered";

            order.deliveryOTP = null;

            order.otpVerified = true;

            await order.save();

            req.flash(
                "success",
                "OTP Verified Successfully."
            );

        } else {

            req.flash(
                "error",
                "Wrong Delivery OTP."
            );

        }

        res.redirect("/admin/order");

    } catch (err) {

        console.log(err);

        req.flash(
            "error",
            "Something went wrong."
        );

        res.redirect("/admin/order");

    }

});


module.exports = router;