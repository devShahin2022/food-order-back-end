const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();

// middlewares
app.use(cors());
app.use(express.json());


// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.r3k7any.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// database query

async function run (){
    try{

        // ================== all collection =============
        // ===============================================
        const foodCollection = client.db('assignment11db').collection('foods');
        const reviewCollection = client.db('assignment11db').collection('reviews');

        // fetch all foods
        app.get('/all-food', async (req, res) => {
            const result = await foodCollection.find({}).toArray();
            res.send(result);
        });
        // fetch all reviews
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find({}).sort({time : -1}).toArray();
            res.send(result);
        });

    }catch{ 
        console.log("an error occured!");
    }
}

run();

// testing server
app.get('/', (req,res) => {
    res.send('server running');
});
// server listen
app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});