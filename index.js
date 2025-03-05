const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
const axios = require('axios');


app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tbsccmb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        // strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const historyCollection = client.db(process.env.DB_USER).collection("historyCollection")
        app.post("/text", async (req, res) => {
            console.log(req.body)
            const searchText = req.body.searchText
            const email = req.body.email
            axios.post('https://api.echogpt.live/v1/chat/completions', {
                messages: [{ role: 'system', content: searchText }],
                "model": "EchoGPT"
            }, {
                headers: { 'x-api-key': `${process.env.ECHOGPT_API}` }
            }).then(async (response) => {

                const history = { question: searchText, answer: response.data.choices[0].message.content, email: email }
                const result = await historyCollection.insertOne(history)
                if (result?.insertedId) {
                    res.status(200).json({ content: response.data.choices[0].message.content });

                }

            })
                .catch(error => {
                    res.send(error)
                });

        })

        app.get("/text/:email", async (req, res) => {
            const email=req.params.email
            const result = await historyCollection.find({ email: email }).toArray()
            res.send(result)
        })
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.get("/", async (req, res) => {
    res.send("echoGpt server running....")
})

app.listen(port, () => {
    console.log("echoGpt server running on ", port)
})