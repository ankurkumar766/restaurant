const express = require("express");
const router = express.Router();

const agent = require("../ai/agent");

router.post("/chat", async (req, res) => {

    try {

        const userId = req.user
            ? req.user._id.toString()
            : req.ip;

        const { message } = req.body;

        const reply = await agent.chat(userId, message);

        res.json({
            success: true,
            reply
        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            reply: "Sorry, I am unable to process your request at the moment. "
        });

    }

});

module.exports = router;



