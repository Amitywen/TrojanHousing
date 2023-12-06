'use strict';
//import mongo MongoClient and ObjectIDs
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
//const cors = require('cors');


const fs = require('fs');
const path = require('path');

const express = require('express');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
const PORT = 3000;
// Default configuration, in case there is no ./config/mongo.json file
const defaultConfig  = {
  host: "localhost",
  port: "27017",
  db:   "ee547_hw"
  // Removed useUnifiedTopology option as it's deprecated
}

let dbConfig = defaultConfig;

// Connect to MongoDB
const uri = `mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.db}`;
const client = new MongoClient(uri);

client.connect(err => {
  if (err) {
      console.error("Failed to connect to MongoDB:", err);
      // Exit according to handout
      process.exit(5);  
  } else {
      console.log("Successfully connected to MongoDB");
  }
});



  app.get('/ping', (req, res) => {
    console.log("GET /ping")
    res.status(204).end();
  });

  app.get('/api/student', async (req, res) => {
    console.log("Fetching all students...");
    try {
        const studentCollection = client.db(dbConfig.db).collection("students");

        const students = await studentCollection.find({}).toArray();
        if (students) {
            console.log(`Fetched ${students.length} students`);
            res.status(200).json(students);
        } else {
            console.log("No students found");
            res.status(404).json({ message: "No students found" });
        }
    } catch (err) {
        console.error("Failed to retrieve students:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.get('/api/landlords', async (req, res) => {
  console.log("Fetching all landlords...");
  try {
      const landlordCollection = client.db(dbConfig.db).collection("landlords");

      const landlords = await landlordCollection.find({}).toArray();
      if (landlords) {
          console.log(`Fetched ${landlords.length} landlords`);
          res.status(200).json(landlords);
      } else {
          console.log("No landlords found");
          res.status(404).json({ message: "No landlords found" });
      }
  } catch (err) {
      console.error("Failed to retrieve landlords:", err);
      res.status(500).json({ error: "Internal server error" });
  }
});



  app.post('/api/student', async (req, res) => {
    console.log("Creating new student...");
    const { username,fname, lname, email, password } = req.body;

    const invalidFields = [];

    if (!fname || !/^[a-zA-Z]+$/.test(fname)) invalidFields.push('fname');
    if (!lname || !/^[a-zA-Z]+$/.test(lname)) invalidFields.push('lname');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) invalidFields.push('email');
    if (!password || password.length < 8) invalidFields.push('password'); // Example length check

    if (invalidFields.length) {
        return res.status(422).json({ error: `Invalid fields: ${invalidFields.join(', ')}` });
    }

    try {
       

        const studentCollection = client.db(dbConfig.db).collection("student");

        // Check if email already exists
        const existingStudent = await studentCollection.findOne({ email: email });
        if (existingStudent) {
            return res.status(409).json({ error: "Email already in use" });
        }

        const newStudent = {
            _id: new ObjectId(),
            created_at: new Date(),
            username,
            fname,
            lname,
            email,
            password
        };

        const result = await studentCollection.insertOne(newStudent);
        if (result.insertedId) {
          console.log(`Student created successfully with ID: ${result.insertedId}`);
          res.status(201).json({ message: "Student added successfully" });
      } else {
          console.log("Failed to add student: No ID returned");
          throw new Error("Failed to add student");
      }
  } catch (err) {
      console.error("Failed to add student:", err);
      res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/landlord', async (req, res) => {
  console.log("Creating new landlord...");
  const { fname, username,lname, email, password, companyName } = req.body;

  const invalidFields = [];

  if (!fname || !/^[a-zA-Z]+$/.test(fname)) invalidFields.push('fname');
  if (!lname || !/^[a-zA-Z]+$/.test(lname)) invalidFields.push('lname');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) invalidFields.push('email');
  if (!password || password.length < 8) invalidFields.push('password'); 
  // companyName is optional, but if provided, it should be validated
  if (companyName && typeof companyName !== 'string') invalidFields.push('companyName');

  if (invalidFields.length) {
      return res.status(422).json({ error: `Invalid fields: ${invalidFields.join(', ')}` });
  }

  try {

      const landlordCollection = client.db(dbConfig.db).collection("landlords");

     
      const existingLandlord = await landlordCollection.findOne({ email: email });
      if (existingLandlord) {
          return res.status(409).json({ error: "Email already in use" });
      }

      const newLandlord = {
          _id: new ObjectId(),
          created_at: new Date(),
          username,
          fname,
          lname,
          email,
          password,
          companyName: companyName || null // Store companyName if provided
      };

      const result = await landlordCollection.insertOne(newLandlord);
      if (result.insertedId) {
        console.log(`Landlord created successfully with ID: ${result.insertedId}`);
        res.status(201).json({ message: "Landlord added successfully" });
    } else {
        console.log("Failed to add landlord: No ID returned");
        throw new Error("Failed to add landlord");
    }
} catch (err) {
    console.error("Failed to add landlord:", err);
    res.status(500).json({ error: "Internal server error" });
}
});


//error handler from demo handout
app.use((err,req,res,next) => {
  console.error(err);

  if(res.headersSent){
    return next(err);
  }

  res.writeHead(500,{'Content-Type': 'text/plain'});
  res.write(`${err.message}`);
  res.end();
});

app.listen(PORT);
console.log(`Server started, port ${PORT}`);