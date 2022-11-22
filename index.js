const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const app = express();
const fs = require('fs');
const port = process.env.PORT || 5000;
require('dotenv').config();

// for multer
const UPLOADS_FOLDER = './public/uploads/photos/';


app.use(express.static('public'));

let files = [];

const storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, UPLOADS_FOLDER);
    },
    filename : (req, file, cb) => {
        const fileExtention = path.extname(file.originalname);
        const filename = file.originalname.replace(fileExtention, '')
            .toLocaleLowerCase()
            .split(" ")
            .join(".") + "-" + Date.now();

            const fileName = filename + fileExtention;
            files.push(fileName);
            req.body.myFile = files;
        cb(null, fileName);
    }
});

const upload  = multer({
    storage : storage,
    limits : {
        fileSize : 6000000, // 6 MB
    },
    fileFilter : (req, file, cb) => {
        if(file.mimetype === 'image/png' || 
           file.mimetype === 'image/jpg' ||
           file.mimetype === 'image/jpeg'
            ){
                cb(null, true);
            }else{
                cb(new Error("Only jpg,png, jped support"));
            }
    }

});

// middlewares
app.use(cors());
app.use(express.json());


// mongodb connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.r3k7any.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// Token middleware

const verifyToken = (req, res, next) => {
    const tokenInfo = req.headers.accesstoken;
    if(!tokenInfo){
        return res.status(401).send({'message' : 'unauthorized user'});
    }
    const arr = tokenInfo.split(" ");
    const token = arr[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET , function(err, decoded) {
        if(err){
            return res.status(401).send({'message' : 'unauthorized user'})
        }else{
            // console.log("after check user jwt : ", decoded);
            req.decoded = decoded;
        }
    });
    next();
}

// database query

async function run (){
    try{

        // ================== all collection =============
        // ===============================================
        const foodCollection = client.db('assignment11db').collection('foods');
        const reviewCollection = client.db('assignment11db').collection('reviews');
        const galleryCollection = client.db('assignment11db').collection('gallery');

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
                // console.log("query id : ", result);
                // res.send(result);
                const reviews = await reviewCollection.find({foodId : id}).sort({time : -1}).toArray();

                // console.log(reviews,result);
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
            // console.log(review);
            const result = await reviewCollection.insertOne(review);
            // console.log(result);
            res.send(result);
        })
        // fetch review by email
        app.post('/reviews-by-email', verifyToken, async (req, res)=>{
            const decoded = req.decoded;
            const email =await req.body.email;
            if(decoded.email === email){
                const result = await reviewCollection.find({ userEmail : email }).sort({time : -1}).toArray();
                res.send(result);
            }else{
                res.status(401).send({'message' : 'unauthorized user'})
            }
        })

        // add services
        app.post('/add-service', async (req, res) => {
            const data = await req.body.finalUploadData;
            // console.log(data);
            const result = await foodCollection.insertOne(data);
            // console.log(result);
            res.send(result);
        })

        // delete review
        app.delete('/delete-review',verifyToken, async (req,res) => {
            const decoded = req.decoded;
            const email =await req.body.email;
            if(decoded.email === email){
                const delId =await req.body.reviewId;
                const result = await reviewCollection.deleteOne({ _id: ObjectId(delId) });
                res.send(result);
            }else{
                res.status(401).send({'message' : 'unauthorized user'})
            }
        })

        // update review
        app.put('/update-review',verifyToken, async (req, res) => {
            const decoded = req.decoded;
            const email =await req.body.email;

            if(decoded.email === email){
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
                res.send(result);
            }else{
                res.status(401).send({'message' : 'unauthorized user'})
            }
        })

        // get jwt token
        app.post('/jwt', async (req, res) => {
            const email = await req.body.email;
            const token = jwt.sign({email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '7d'});
            res.send({token});
        })

        // file upload 
        app.post('/upload-file',upload.array('files'), async (req,res) => {
            let successUpload = 0;
            const host =await req.body.hostName;
            let files1 = '';
            files1 = await req.body.myFile;
            const fileLen = files?.length;
            files = []; // files array empty set...
            if(fileLen < 1){
                let status = false;
                res.send({status, fileLen});
            }
           
            let status = true;
            files1.forEach(async f => {
                successUpload++ ;
                const url = await { imagePath : `${host}/uploads/photos/${f}`, time : Date.now()};
                const result =await galleryCollection.insertOne(url);
            });
            console.log('latest man ', successUpload);
            if(successUpload === fileLen){
                successUpload = 0;
                console.log('after send request ', successUpload);
                res.send({status, fileLen, successUpload});
            }
        });

        // photo fetch 
        app.get('/get-file', async (req, res) => {
            const result = await galleryCollection.find({}).sort({time : -1}).toArray();
            res.send(result);
        });

        // delete file by routing
        app.post('/delete-each-file',async(req, res) => {
            const getPhotoFullPath = await req.body.imgPath;
            const pathDevide = getPhotoFullPath.split('/');
            const imgName = pathDevide[pathDevide.length - 1];
            const path = `./public/uploads/photos/${imgName}`;
            fs.unlink(path, async (err) => {
                if (err) {
                    res.send({status : false , msg : "an error occured!"});
                }else{
                    const result = await galleryCollection.deleteOne({ imagePath: getPhotoFullPath });
                    if(result.acknowledged){
                        res.send({status : true , msg : "File delete success"});
                    }
                }
              });
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