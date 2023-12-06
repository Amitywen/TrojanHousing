'use strict';
//import mongo MongoClient and ObjectIDs
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
//const cors = require('cors');


const fs = require('fs');
const path = require('path');

const express = require('express');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
//app.use(cors());
app.use(express.json());
const PORT = 3000;


//coppied from handout, in case there is no ./config/mongo.json file
const defaultConfig  = {
            host: "localhost",
            port: "27017",
            db:   "ee547_hw",
            opts: {
              useUnifiedTopology: true
        }
}
  
  let dbConfig;
  try {
    dbConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './config/mongo.json'), 'utf-8'));
    
  
    if (typeof dbConfig.host !== 'string' || !dbConfig.host) {
      throw new Error('invalid host');
    }
  
    if (typeof dbConfig.port !== 'string' || !dbConfig.port) {
      throw new Error('invalid port');
    }
  
    if (typeof dbConfig.db !== 'string' || !dbConfig.db) {
      throw new Error('invalid db');
    }
  
    if (typeof dbConfig.opts.useUnifiedTopology !== 'boolean' || !dbConfig.opts.useUnifiedTopology) {
      throw new Error('invalid UT');
    }
  
  } catch (error) {
    //Check if invalid JSON, exit with 2
    if (error instanceof SyntaxError) {
      console.error("Invalid JSON.");
      process.exit(2);
    }
    console.warn("Config File Failed", error.message);
    dbConfig = defaultConfig;
  }

  
  // Connect to MongoDB, inspiration from Discussion code
  const uri = `mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.db}`;
  const client = new MongoClient(uri, dbConfig.opts);

    
  client.connect(err => {
    if (err) {
      console.error("Failed to connect to MongoDB:", err);
      //exit as accoridng to handout
      process.exit(5);  
    } else {
      console.log("Successfully connected to MongoDB");
    }
  });


  app.get('/ping', (req, res) => {
    console.log("GET /ping")
    res.status(204).end();
  });

  app.get('/api/students', async (req, res) => {
    try {
        const studentCollection = client.db(dbConfig.db).collection("students");

        const students = await studentCollection.find({}).toArray();
        if (students) {
            res.status(200).json(students);
        } else {
            res.status(404).json({ message: "No students found" });
        }
    } catch (err) {
        console.error("Failed to retrieve students:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/api/landlords', async (req, res) => {
  try {
      const landlordCollection = client.db(dbConfig.db).collection("landlords");

      const landlords = await landlordCollection.find({}).toArray();
      if (landlords) {
          res.status(200).json(landlords);
      } else {
          res.status(404).json({ message: "No landlords found" });
      }
  } catch (err) {
      console.error("Failed to retrieve landlords:", err);
      res.status(500).json({ error: "Internal server error" });
  }
});



  app.post('/api/student', async (req, res) => {
    const { fname, lname, email, password } = req.body;

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
            fname,
            lname,
            email,
            password
        };

        const result = await studentCollection.insertOne(newStudent);
        if (result.insertedId) {
            res.status(201).json({ message: "Student added successfully" });
        } else {
            throw new Error("Failed to add student");
        }
    } catch (err) {
        console.error("Failed to add student:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/api/landlord', async (req, res) => {
  const { fname, lname, email, password, companyName } = req.body;

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
          fname,
          lname,
          email,
          password,
          companyName: companyName || null // Store companyName if provided
      };

      const result = await landlordCollection.insertOne(newLandlord);
      if (result.insertedId) {
          res.status(201).json({ message: "Landlord added successfully" });
      } else {
          throw new Error("Failed to add landlord");
      }
  } catch (err) {
      console.error("Failed to add landlord:", err);
      res.status(500).json({ error: "Internal server error" });
  }
});

