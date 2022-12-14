const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 7000;
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s3uhktq.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const usersCollection = client.db('poridhan').collection('users');
        const productCollection = client.db('poridhan').collection('product');
        const adveticeCollection = client.db('poridhan').collection('advetice');
        const bookingCollection = client.db('poridhan').collection('booking');

        //  jwt verify funtion 
        function verifyJWT(req, res, next) {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.ststus(401).send({ accessToken: 'Unauthorized Access' });
            }
            const token = authHeader.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
                if (err) {
                    return res.ststus(403).send({ message: 'Forbidden Access' });
                }
                req.decoded = decoded;
                next();
            })

        }

        // user create add in db
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        //Add product Api 
        app.post('/addproduct', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        })


        //Add Buying product Api 
        app.post('/addbooking', async (req, res) => {
            const product = req.body;
            const result = await bookingCollection.insertOne(product);
            res.send(result);
        })


        //Add advetice Api
        app.post('/advetice', async (req, res) => {
            const product = req.body;
            const result = await adveticeCollection.insertOne(product);
            res.send(result);
        })



        //get all product from db
        app.get('/products/:category', async (req, res) => {
            const category = req.params.category;
            console.log(category)

            const filter = { booking: "false" };
            if (category === "all") {
                const products = await productCollection.find(filter).toArray();
                res.send(products,);
            }

            else {
                const query = { category: category, booking: "false" };
                const products = await productCollection.find(query).toArray();
                res.send(products);
            }
        })


        app.get('/totalproducts', async (req, res) => {
            const filter = { booking: "false" };
            const products = await productCollection.find(filter).toArray();
            res.send(products,);

        })

        //get all advetice from db
        app.get('/adds', async (req, res) => {
            const filter = { addvertise: 'true', booking: "false" };
            const addvertise = await productCollection.find(filter).toArray();
            res.send(addvertise);

        })


        //Add advetice Api
        app.get('/advetice', async (req, res) => {
            const query = {};
            const products = await adveticeCollection.find(query).toArray();
            res.send(products);
        })

        //get product from db with matching uid
        app.get('/myproducts/:uid', async (req, res) => {
            const uid = req.params.uid;
            const query = { uid: uid };
            const products = await productCollection.find(query).toArray();
            res.send(products);
        })


        //get  booking product from db with matching uid
        app.get('/booked/:uid', async (req, res) => {
            const uid = req.params.uid;
            // console.log(uid)
            const query = { buyerUid: uid };
            const booked = await bookingCollection.find(query).toArray();
            res.send(booked);
        })


        // user get from db
        app.get('/users', verifyJWT, async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        //jwt token
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10h' })
                return res.send({ accessToken: token });
            }
            res.ststus(403).send({ accessToken: 'token invalid' });
        })

        // admin validation api 
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email };
            const user = await usersCollection.findOne(filter);
            res.send({ isAdmin: user?.role === 'admin' })
        })


        // seller validation api 
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email };
            const user = await usersCollection.findOne(filter);
            res.send({ isSeller: user?.seller === true })
        })

        // get all seller   
        app.get('/allseller', async (req, res) => {
            const filter = { seller: true };
            const user = await usersCollection.find(filter).toArray();
            res.send(user);
        })

        //get all only users 
        app.get('/onlyusers', async (req, res) => {
            const query = { seller: false };
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        })

        // get reported items
        app.get('/report', async (req, res) => {
            const query = { report: "true" };
            const product = await productCollection.find(query).toArray();
            res.send(product);
        })




        //delete a user 
        app.delete('/userdelete/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

        //delete a product 
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(filter);
            res.send(result);
        })


        // bokking a product
        app.put('/bookproducts/:id', async (req, res) => {
            const id = req.params.id;

            console.log(id)
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    booking: "true",
                }
            }
            const result = await productCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })



        // addvertise a product
        app.put('/adds/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    addvertise: "true",
                }
            }
            const result = await productCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })





        // report a product
        app.put('/report/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    report: "true",
                }
            }
            const result = await productCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        //////
        app.put('/users/verifide/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id)
            const filter = { email: id };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    verifide: "true",
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        //Make Admin API
        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            console.log(req.headers.authorization)
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await usersCollection.findOne(query);
            if (user.role !== 'admin') {
                return res.ststus(403).send({ message: 'Forbidden Access' });
            }
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        // app.put('/users/verifide/:id', verifyJWT, async (req, res) => {
        //     console.log(req.headers.authorization)
        //     const decodedEmail = req.decoded.email;
        //     const email = req.params.id;
        //     console.log(decodedEmail)
        //     const query = { email: decodedEmail };
        //     const user = await usersCollection.findOne(query);
        //     if (user.role !== 'admin') {
        //         return res.ststus(403).send({ message: 'Forbidden Access' });
        //     }
        //     const id = req.params.id;
        //     const filter = { _id: ObjectId(id) }
        //     const options = { upsert: true };
        //     const updateDoc = {
        //         $set: {
        //             verifide: 'true'
        //         }
        //     }
        //     const result = await usersCollection.updateOne(filter, updateDoc, options);
        //     res.send(result);
        // })
    }

    finally {

    }
}
run().catch(console.log);



app.get('/', async (req, res) => {
    res.send('Server Is Running');
})

app.listen(port, () => console.log(`Running On ${port}`))