const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        app.get('/services', async (req, res) => {
            const result = await foodCollection.find({}).toArray();
            res.send(result);
        });
         // fetch 3 foods
         app.get('/services-3', async (req, res) => {
            const result = await foodCollection.find({}).limit(3).toArray();
            res.send(result);
        });
         // fetch data by id
         app.get('/each-service', async (req, res) => {
            const id = await req.query.id;
            if(id !== ''){
                const condition = {_id : ObjectId(id)};
                const result = await foodCollection.find(condition).toArray();
                console.log("query id : ", result);
                res.send(result);
            }
            
            
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