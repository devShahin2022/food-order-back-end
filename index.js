const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
                // res.send(result);
                const reviews = await reviewCollection.find({foodId : id}).sort({time : -1}).toArray();

                console.log(reviews,result);
                res.send({reviews, result});
            }
            
            
        });
        // fetch all reviews
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find({}).sort({time : -1}).toArray();
            res.send(result);
        });

        // add a reviews
        app.post('/add-review', async (req, res) => {
            const review = await req.body.finalReview;
            console.log(review);
            const result = await reviewCollection.insertOne(review);
            console.log(result);
            res.send(result);
        })
        // fetch review by email
        app.get('/reviews-by-email', async (req, res)=>{
            const email =await req.query.email;
            console.log(email);
            if(email !== ''){
                const result = await reviewCollection.find({ userEmail : email }).sort({time : -1}).toArray();
                console.log(result);
                res.send(result);
            }
        })

        // add services
        app.post('/add-service', async (req, res) => {
            const data = await req.body.finalUploadData;
            console.log(data);
            const result = await foodCollection.insertOne(data);
            console.log(result);
            res.send(result);
        })

        // delete review
        app.delete('/delete-review', async (req,res) => {
            const delId =await req.body.reviewId;
            const result = await reviewCollection.deleteOne({ _id: ObjectId(delId) });
            console.log("delete id ", result);
            res.send(result);
        })

        // update review
        app.put('/update-review', async (req, res) => {
            const ratting =await req.body.updatedRatting;
            const text =await req.body.updatedText;
            const id =await req.body.id;
            const date = new Date();
            const time = date.getTime();
            const setData = {
                ratings : ratting,
                revText : text,
                time : time
            }
            const result = await reviewCollection.updateOne({_id : ObjectId(id)}, {$set : setData})
            console.log(result);
            res.send(result);
        })

        // get jwt token
        app.post('/jwt', async (req, res) => {
            const email = await req.body.email;
            const token = jwt.sign({email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '7d'});
            res.send({token});
        })

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