require('dotenv').config()
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');


// middleware
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@assignment-12.moncfbx.mongodb.net/?retryWrites=true&w=majority&appName=Assignment-12`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Token related kaj
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            // console.log("Token er user", user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })

        // Middleware
        const verifyToken = (req, res, next) => {
            console.log("Inside verify token: --", req.headers.authorization);
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "unauthorized access" });
            }

            const token = req.headers.authorization.split(" ")[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: "unauthorized access" });
                }
                req.decoded = decoded;
                next()
            })

        }


        const spotsCollection = client.db("tourism").collection('touristSpots');
        const wishListCollection = client.db("tourism").collection('wishlist');
        const packageBookingCollection = client.db("tourism").collection('packageBooking');
        const usersCollection = client.db("tourism").collection('users');
        const blogsCollection = client.db("tourism").collection('blogsData');

        // Post Spot in db
        app.post('/spots', async (req, res) => {
            const package = req.body;
            const result = await spotsCollection.insertOne(package)
            res.send(result)
        })

        // get all spots in db
        app.get('/spots', async (req, res) => {
            const result = await spotsCollection.find().toArray()
            res.send(result)
        })

        // get specific type spots in db
        app.get('/spots/:tourType', async (req, res) => {
            const tourType = req.params.tourType;
            const query = { tourType: tourType }
            const result = await spotsCollection.find(query).toArray()
            res.send(result)
        })

        // get specific spot with id
        app.get('/spot/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await spotsCollection.findOne(query);
            res.send(result)
        })
        // ------------- demo
        // app.get('/users', async (req, res) => {
        //     const filterRole = req.query.filterValue;
        //     const searchValue = req.query.searchValue;
        //     console.log(filterRole, searchValue)
        //     let query = {};
        //     if(filterRole){
        //         query.userRole = filterRole
        //     }
        //     if(searchValue){
        //         query.userName = {$regex: searchValue, $options: 'i'}
        //     }

        //     const result = await usersCollection.find(query).toArray();
        //     res.send(result)
        // })

        //---------demo

        // get spots with search, filter, sorting price range
        app.get('/allSpots', async (req, res) => {
            const category = req.query.category;
            const search = req.query.search;
            const minimumPrice = parseInt(req.query.minimumPrice);
            const maximumPrice = parseInt(req.query.maximumPrice);
            
            let query = {};
            if(category){
                query.tourType = category;
            }
            if(minimumPrice && maximumPrice){
                query.price = {$gt: minimumPrice, $lt: maximumPrice}
            }
            if(search){
                query.$or = [
                    {tripName: {$regex: search, $options: 'i'}},
                    {tripTitle: {$regex: search, $options: 'i'}}
                ]
            }

            const result = await spotsCollection.find(query).toArray();
            res.send(result)
        })

        // add wishlist in DB
        app.post('/wishlist', async (req, res) => {
            const spot = req.body;
            const result = await wishListCollection.insertOne(spot);
            res.send(result)
        })

        // get specific user all wishlist
        app.get('/myWishLists/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const result = await wishListCollection.find(query).toArray();
            res.send(result)
        })

        // get all wishlist length specific user 
        app.get('/myTotalWishLists/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const result = await wishListCollection.countDocuments(query);
            res.send({ result })
        })

        // deleteOne wishlist collection with id
        app.delete('/deleteWishList/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await wishListCollection.deleteOne(query);
            res.send(result)
        })

        // post packageBookin Info in db
        app.post('/packageBooking', async (req, res) => {
            const bookingInfo = req.body;
            const result = await packageBookingCollection.insertOne(bookingInfo);
            res.send(result)
        })

        // packageBooking er bookingStatus update koro when tour guide action
        app.patch('/updatePackageBooking/:id', async (req, res) => {
            const id = req.params.id;
            const { status } = req.body;
            console.log(status)
            const query = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    bookingStatus: status
                }
            }
            const result = await packageBookingCollection.updateOne(query, updatedDoc)
            res.send(result)
        })

        // deleteOne packageBooking collection with id
        app.delete('/deletePackageBooking/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await packageBookingCollection.deleteOne(query);
            res.send(result)
        })


        // get all booking data a tourGuide email
        app.get('/requestedTourGuide/:email', async (req, res) => {
            const email = req.params.email;
            const query = { guideEmail: email }
            const result = await packageBookingCollection.find(query).toArray();
            res.send(result)
        })

        // get specific user all booking
        app.get('/myBookings/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await packageBookingCollection.find(query).toArray();
            res.send(result)
        })

        // get all booking length specific user 
        app.get('/myTotalBookings/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await packageBookingCollection.countDocuments(query);
            res.send({ result })
        })

        // get all tourist length 
        app.get('/allTouristLen', async (req, res) => {
            const query = { userRole: "Tourist" };
            const result = await usersCollection.countDocuments(query);
            res.send({ result })
        })

        // get all tour guides length 
        app.get('/allTourGuideLen', async (req, res) => {
            const query = { userRole: "tourGuide" };
            const result = await usersCollection.countDocuments(query);
            res.send({ result })
        })

        // get all tour Package length 
        app.get('/allTourPackageLen', async (req, res) => {
            const result = await spotsCollection.countDocuments();
            res.send({ result })
        })

        // newUserAdd DB
        app.post('/users', async (req, res) => {
            const userInfo = req.body;
            // check now. If user already exist than return now . Otherwise add now
            const query = { userEmail: userInfo.userEmail }
            const isExist = await usersCollection.findOne(query);
            if (isExist) {
                return res.send({ message: "This user already exist in DB", insertedId: null })
            }
            const result = await usersCollection.insertOne(userInfo)
            res.send(result)
        })


        // get all tourGuides data
        app.get('/users', async (req, res) => {
            const filterRole = req.query.filterValue;
            const searchValue = req.query.searchValue;
            console.log(filterRole, searchValue)
            let query = {};
            if (filterRole) {
                query.userRole = filterRole
            }
            if (searchValue) {
                query.userName = { $regex: searchValue, $options: 'i' }
            }

            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })

        // When user request become a tourGuide
        app.patch('/updateUser/:email', async (req, res) => {
            const email = req.params.email;
            const updateInfo = req.body;
            // if status === pending . tahole return now
            const filter = { userEmail: email }
            const find = await usersCollection.findOne(filter);
            if (find?.userStatus === "Pending" && find?.userRole === "Tourist") {
                return res.send({ message: "Already Pending Your Request", updatedDoc: null })
            }

            const options = { upsert: true };

            const query = { userEmail: email };
            const updatedDoc = {
                $set: {
                    userStatus: "Pending",
                    timestamp: Date.now(),
                    ...updateInfo
                }
            }
            const result = await usersCollection.updateOne(query, updatedDoc, options);
            res.send(result)
        })

        // Just admin change now any user status and role
        app.patch('/updateUserRole/:email', async (req, res) => {
            const email = req.params.email;
            const { updateRole } = req.body;
            console.log(email, updateRole)
            const query = { userEmail: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    userStatus: "Verified",
                    userRole: updateRole,
                    timestamp: Date.now()
                }
            }
            const result = await usersCollection.updateOne(query, updatedDoc, options)
            res.send(result)
        })

        // review add usersCollection review array
        app.patch('/review/:email', async (req, res) => {
            const email = req.params.email;
            const review = req.body;
            // console.log(email, review)
            const query = { userEmail: email };
            const result = await usersCollection.findOne(query);
            const reviews = result?.reviews;
            reviews.push(review)
            const updatedDoc = {
                $set: {
                    reviews: reviews
                }
            }
            const updateResult = await usersCollection.updateOne(query, updatedDoc)
            res.send(updateResult)
        })

        // fixed kono user er role get korbo
        app.get('/userRole/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email }
            const options = {
                projection: { _id: 0, userRole: 1 }
            }
            const result = await usersCollection.findOne(query, options)
            res.send(result)
        })

        // get all tourGuides data
        app.get('/tourGuides', async (req, res) => {
            const query = { userRole: "tourGuide" }
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })


        // get specific user data with id
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email }
            const result = await usersCollection.findOne(query);
            res.send(result)
        })

        // get just tour guide name
        app.get('/tourGuidesName', async (req, res) => {
            const options = {
                projection: { _id: 0, userEmail: 1, userName: 1 }
            }
            const result = await usersCollection.find({}, options).toArray()
            res.send(result)
        })


        // bloger er all data get
        app.get('/blogs', async(req, res)=> {
            const search = req.query.search;
            let query = {};
            if(search){
                query.$or = [
                    {title: {$regex: search, $options: 'i'}},
                    {content: {$regex: search, $options: 'i'}},
                    {userName: {$regex: search, $options: 'i'}},
                ]
            }
            const result = await blogsCollection.find(query).toArray();
            res.send(result)
        })

        // bloger er 1st data get
        app.get('/blogsFirst', async(req, res)=> {
         
            const result = await blogsCollection.findOne();
            res.send(result)
        })

        //  get specific blog data with id
        app.get('/blog/:id', async(req, res)=> {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const result = await blogsCollection.findOne(query)
            res.send(result)
        })

        // blog a comment add korbo
        app.patch('/blogsComment/:id', async(req, res)=> {
            const id = req.params.id;
            const commentInfo = req.body;
          
            const query = {_id: new ObjectId(id)};
            const commentsData = await blogsCollection.findOne(query);
            const comments = commentsData?.comments;
            comments.push(commentInfo)
          
            const updatedDoc = {
                $set: {
                    comments: comments
                }
            }
            const updateResult = await blogsCollection.updateOne(query, updatedDoc)
            res.send(updateResult)
        })

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);






app.get('/', async (req, res) => {
    res.send("Your server is Running")
})

app.listen(port, () => {
    console.log("Your Tourist server is Running in port", port)
})