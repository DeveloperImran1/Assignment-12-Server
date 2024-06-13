require('dotenv').config()
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');


// middleware
app.use(cors({
    origin: ["http://localhost:5173", "https://assignment-twelve-9109d.web.app", "https://6669286d5bcbed6117973b2c--frabjous-starburst-2077bc.netlify.app"],
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
        const verifyToken = async (req, res, next) => {
            // console.log("Inside verify token: --", req.headers.authorization);
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


        // use verify admin after verify token
        const verifyAdmin = async (req, res, next)=> {
            const email = req.decoded.email;
            console.log(email)
            const query = {userEmail: email};
            const user = await usersCollection.findOne(query);
            console.log(user)
            const isAdmin = user?.userRole === "Admin"
            if(!isAdmin){
                return res.status(403).send({message: 'forbidden access'})
            }
            next()
        }

        // use verify tour Guide after verify token
        const verifyTourGuide = async (req, res, next)=> {
            const email = req.decoded.email;
            console.log(email)
            const query = {userEmail: email};
            const user = await usersCollection.findOne(query);
            console.log(user)
            const isTourGuide = user?.userRole === "tourGuide"
            if(!isTourGuide){
                return res.status(403).send({message: 'forbidden access'})
            }
            next()
        }


        const spotsCollection = client.db("tourism").collection('touristSpots');
        const wishListCollection = client.db("tourism").collection('wishlist');
        const packageBookingCollection = client.db("tourism").collection('packageBooking');
        const usersCollection = client.db("tourism").collection('users');
        const blogsCollection = client.db("tourism").collection('blogsData');
        const storyCollection = client.db("tourism").collection('story');
        const cardStoryCollection = client.db("tourism").collection('cardStory');
        const paymentCollection = client.db('tourism').collection('payment');
        const notificationCollection = client.db('tourism').collection('notification');

        // Post Spot in db
        app.post('/spots', verifyAdmin, async (req, res) => {
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
 

        // get spots with search, filter, sorting price range
        app.get('/allSpots', async (req, res) => {
            const category = req.query.category;
            const search = req.query.search;
            const minimumPrice = parseInt(req.query.minimumPrice);
            const maximumPrice = parseInt(req.query.maximumPrice);

            let query = {};
            if (category) {
                query.tourType = category;
            }
            if (minimumPrice && maximumPrice) {
                query.price = { $gt: minimumPrice, $lt: maximumPrice }
            }
            if (search) {
                query.$or = [
                    { tripName: { $regex: search, $options: 'i' } },
                    { tripTitle: { $regex: search, $options: 'i' } }
                ]
            }

            const result = await spotsCollection.find(query).toArray();
            res.send(result)
        })

        // add wishlist in DB
        app.post('/wishlist', verifyToken, async (req, res) => {
            const spot = req.body;
            const result = await wishListCollection.insertOne(spot);
            res.send(result)
        })

        // get specific user all wishlist
        app.get('/myWishLists/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const result = await wishListCollection.find(query).toArray();
            res.send(result)
        })

        // get all wishlist length specific user 
        app.get('/myTotalWishLists/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };
            const result = await wishListCollection.countDocuments(query);
            res.send({ result })
        })

        // deleteOne wishlist collection with id
        app.delete('/deleteWishList/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await wishListCollection.deleteOne(query);
            res.send(result)
        })

        // post packageBookin Info in db
        app.post('/packageBooking', verifyToken, async (req, res) => {
            const bookingInfo = req.body;
            const result = await packageBookingCollection.insertOne(bookingInfo);

            console.log(bookingInfo.email)
            // user er email dia total booking length up korbo
            const query = { userEmail: bookingInfo.email }
            const options ={ upsert: true}
            let totalBooking = 1;
            const currentUser = await usersCollection.findOne(query)
            console.log(currentUser)
            if (currentUser?.totalBooking) {
                console.log('total booking property ase')
                totalBooking = totalBooking + currentUser?.totalBooking
            }
            const updatedDoc = {
                $set: {
                    totalBooking

                }
            }
            const updateResult = await usersCollection.updateOne(query, updatedDoc, options)
            console.log("Updated Result", updateResult)

            res.send(result)

        })

        // packageBooking er bookingStatus update koro when tour guide action
        app.patch('/updatePackageBooking/:id', verifyToken, async (req, res) => {
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
        app.delete('/deletePackageBooking/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await packageBookingCollection.deleteOne(query);
            res.send(result)
        })


        // get all booking data a tourGuide email
        app.get('/requestedTourGuide/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { guideEmail: email }
            const result = await packageBookingCollection.find(query).toArray();
            res.send(result)
        })

        // get specific user all booking
        app.get('/myBookings/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await packageBookingCollection.find(query).toArray();
            res.send(result)
        })

        // get all booking length specific user 
        app.get('/myTotalBookings/:email',verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await packageBookingCollection.countDocuments(query);
            res.send({ result })
        })

        // get all tourist length 
        app.get('/allTouristLen', verifyToken, verifyAdmin,  async (req, res) => {
            const query = { userRole: "Tourist" };
            const result = await usersCollection.countDocuments(query);
            res.send({ result })
        })

        // get all tour guides length 
        app.get('/allTourGuideLen', verifyToken, verifyAdmin, async (req, res) => {
            const query = { userRole: "tourGuide" };
            const result = await usersCollection.countDocuments(query);
            res.send({ result })
        })

        // get all tour Package length 
        app.get('/allTourPackageLen', verifyToken, verifyAdmin, async (req, res) => {
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
        app.patch('/updateUser/:email', verifyToken, async (req, res) => {
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
        app.patch('/updateUserRole/:email', verifyToken, verifyAdmin, async (req, res) => {
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
        app.get('/user/:email', async (req, res) => {  // aita publick vabe get kora jabe.
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
        app.get('/blogs', async (req, res) => {
            const search = req.query.search;
            let query = {};
            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { content: { $regex: search, $options: 'i' } },
                    { userName: { $regex: search, $options: 'i' } },
                ]
            }
            const result = await blogsCollection.find(query).toArray();
            res.send(result)
        })

        // bloger er 1st data get
        app.get('/blogsFirst', async (req, res) => {

            const result = await blogsCollection.findOne();
            res.send(result)
        })

        //  get specific blog data with id
        app.get('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await blogsCollection.findOne(query)
            res.send(result)
        })

        // blog a comment add korbo
        app.patch('/blogsComment/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const commentInfo = req.body;

            const query = { _id: new ObjectId(id) };
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


        // story section start
        // post story 
        app.post('/storys', verifyToken, async (req, res) => {
            const storyInfo = req.body;
            const result = await storyCollection.insertOne(storyInfo);
            res.send(result)
        })


        // update korbo post
        app.patch('/storys/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const updateInfo = req.body;
            const query = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    ...updateInfo
                }
            }
            const result = await storyCollection.updateOne(query, updatedDoc)
            res.send(result)
        })


        // get all story 
        app.get("/storys", async (req, res) => {
            const search = req.query.search;
            console.log(search)
            const query = {};
            if (search) {
                query.$or = [
                    { userName: { $regex: search, $options: 'i' } },
                    { spotTitle: { $regex: search, $options: 'i' } },
                    { spotDescription: { $regex: search, $options: 'i' } }
                ]
            }
            const result = await storyCollection.find(query).toArray();
            res.send(result)
        })

        // get my story with email
        app.get("/storys/:email", verifyToken, async (req, res) => {
            const email = req.params.email;
            const query = { userEmail: email };

            const result = await storyCollection.find(query).toArray();
            res.send(result)
        })

        // delte a post 
        app.delete('/deletePost/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await storyCollection.deleteOne(query);
            res.send(result)
        })

        // story a comment add korbo
        app.patch('/storyComment/:id', async (req, res) => {
            const id = req.params.id;
            const commentInfo = req.body;

            const query = { _id: new ObjectId(id) };
            const commentsData = await storyCollection.findOne(query);
            const comments = commentsData?.comments;
            comments.push(commentInfo)

            const updatedDoc = {
                $set: {
                    comments: comments
                }
            }
            const updateResult = await storyCollection.updateOne(query, updatedDoc)
            res.send(updateResult)
        })


        // small cardStorySection
        // small cardStoryCollection er data get korbo
        app.get("/cardStorys", async (req, res) => {
            const result = await cardStoryCollection.find().toArray();
            res.send(result)
        })

        // small cardStory data post korbo
        app.post('/cardStorys', async (req, res) => {
            const storyInfo = req.body;
            const result = await cardStoryCollection.insertOne(storyInfo);
            res.send(result)
        })



        // Payment intent
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })


        // payment er infromation gulo DB te add korbo 
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const paymentResult = await paymentCollection.insertOne(payment);

            // carefully delete each item from the cart in db
            console.log('Payment info', payment)
            const query = { _id: new ObjectId(payment?.cartIds) }
            const options = { upsert: true };

            const updatedDoc = {
                $set: {
                    payment: "success"
                }
            }
            const updateResult = await packageBookingCollection.updateOne(query, updatedDoc, options)

            res.send({ paymentResult, updateResult })
        })

        // get specific card payment info
        app.get('/paymentInfo/:id', async (req, res) => {
            const id = req.params.id;
            const query = { cartIds: id };
            const result = await paymentCollection.findOne(query);
            res.send(result)
        })


        // notification 
        app.get('/notification', async(req, res)=> {
            const result = await notificationCollection.find().toArray();
            res.send(result)
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