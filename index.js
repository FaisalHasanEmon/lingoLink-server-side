const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5500;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware
app.use(cors());
app.use(express.json());

// Default response
app.get("/", (req, res) => {
  res.send("Language Learners Heaven");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rmsmw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const lingoLinkDB = client.db("lingoLink");
    const tutorsCollection = lingoLinkDB.collection("tutors");
    const usersCollection = lingoLinkDB.collection("users");

    // Add user
    app.post("/newUser", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/countUser&Tutorials", async (req, res) => {
      const numberOfUsers = await usersCollection.estimatedDocumentCount();
      const numberOfTutorials = await tutorsCollection.estimatedDocumentCount();

      res.send({ numberOfUsers, numberOfTutorials });
    });

    // Add Tutorial
    app.post("/addTutorial", async (req, res) => {
      const newTutorial = req.body;
      const result = await tutorsCollection.insertOne(newTutorial);
      res.send(result);
    });
    // Send all Teacher data
    app.get("/tutors", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await tutorsCollection
        .find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    // Send Teachers data by category
    app.get("/category", async (req, res) => {
      const category = req.query.category;
      const query = { language: category };
      const result = await tutorsCollection.find(query).toArray();
      res.send(result);
    });
    // Send My Added Tutorials data
    app.get("/myTutorials", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await tutorsCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/myTutorials", async (req, res) => {
      const updateTutorial = req.body;
      const id = updateTutorial.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: updateTutorial.newName,
          email: updateTutorial.newEmail,
          image: updateTutorial.newImage,
          price: updateTutorial.newPrice,
          review: updateTutorial.newReview,
          language: updateTutorial.newLanguage,
          description: updateTutorial.newDescription,
        },
      };
      const result = await tutorsCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      res.send(result);
    });
    // Delete a document by id
    app.delete("/myTutorials/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await tutorsCollection.deleteOne(query);
      res.send(result);
    });

    //Get tutor details by id
    app.get("/tutorDetails/:tutorId", async (req, res) => {
      const id = req.params.tutorId;
      const query = { _id: new ObjectId(id) };
      const result = await tutorsCollection.findOne(query);
      res.send(result);
    });

    //Send Teacher number per category
    app.get("/category/numberOfTutors", async (req, res) => {
      try {
        const result = await tutorsCollection
          .aggregate([
            {
              $group: {
                _id: "$language", // Group by the language field
                count: { $sum: 1 }, // Count the number of tutors for each language
              },
            },
            {
              $project: {
                language: "$_id",
                count: 1,
                _id: 0,
              },
            },
          ])
          .toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching language counts:", error);
        res.status(500).send("Server Error");
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
