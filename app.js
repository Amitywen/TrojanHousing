'use strict';
//import mongo MongoClient and ObjectIDs
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
//const cors = require('cors');
const axios = require('axios');

const fs = require('fs');
const path = require('path');
const util = require('util');

const express = require('express');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
// Assuming you have configured your view engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const bodyParser = require('body-parser');
app.use(bodyParser.json());


app.use(express.json());
const PORT = 3000;
// Default configuration, in case there is no ./config/mongo.json file
const defaultConfig  = {
  host: "localhost",
  port: "27017",
  db:   "ee547_hw",
  useUnifiedTopology: true
}

let dbConfig = defaultConfig;

// Connect to MongoDB
const uri = `mongodb://${dbConfig.host}:${dbConfig.port}/${dbConfig.db}`;
const client = new MongoClient(uri);

client.connect(err => {
  if (err) {
      console.error("Failed to connect to MongoDB:", err);
   
      process.exit(5);  
  } else {
      console.log("Successfully connected to MongoDB");
  }
});

//DISCLAMIER.........
//USED CHATGPT TO CREATE FUNCTION DOCMANTATION,DESCRIPTIONS AND EXAMPLES


//basic endpoint structure mainly taken from Will's homeworks. Modified to fit our use case.


//DONE
// Purpose: Check if the server is running and responsive
// Input Parameters: None
// Return Format: HTTP status 204 (No Content)
  app.get('/ping', (req, res) => {
    console.log("GET /ping")
    res.status(204).send( "pinged");
  });

// GET /api/login
// Purpose: Authenticate users by username, password, and role.
// Input Parameters: 'username', 'password', 'role' (query string).
// Functionality: Validates role, fetches user from database, checks credentials.
// Return Format: JSON object with login success status.
// Example Input: /api/login?username=user&password=pass&role=student
// Example Return: { loginSuccess: true } or { loginSuccess: false }
// Error Handling: Returns error messages for invalid role, unsuccessful login, or server issues.
  app.get('/api/login', async (req, res) => {
    //taken and changed slightly from Will's Homeworks
   console.log("GET /api/login");
   try {
        const { username, password,role } = req.query;
       //grab all the students and put them in an array
       console.log(role);
       if(!(role == "student" || role =="landlord" || role == "admin")){
        return res.status(404).json({ message: "role not found" });
       }
       const collection = client.db(dbConfig.db).collection(role);
       const data = await collection.find({}).toArray();
       const user = await collection.findOne({ username: username, password: password});
       //if recieved respond the array, otherwise send that there were no students
       if (user) {
        console.log(`login sucess for user: ${username}`);
        res.status(200).json({ loginSuccess: true });
    } else {
        console.log(`login failed for username: ${username} and that password combination`);
        res.status(200).json({ loginSuccess: false });
    }
   } catch (err) {
       console.error("failed to work through login:", err);
       res.status(500).json({ error: "Internal server error" });
   }
});

//DONE
// Purpose: Retrieve all students from the database
// Input Parameters: None
// Return Format: JSON array of student objects or error message
// Example Return: [{ "_id": "123", "username": "johndoe", "fname": "John", "lname": "Doe", "email": "johndoe@example.com" }, ...]
  app.get('/api/student', async (req, res) => {
     //taken and changed slightly from Will's Homeworks
    console.log("GET /api/student");
    try {
        //grab all the students and put them in an array
        const studentCollection = client.db(dbConfig.db).collection("student");

        let query = {};
        if (req.query.fname) {
            query.fname = { $regex: new RegExp(req.query.fname, 'i') }; 
        }
        if (req.query.lname) {
            query.lname = { $regex: new RegExp(req.query.lname, 'i') };
        }

        const students = await studentCollection.find(query).toArray();

        if (students) {
            console.log(`got ${students.length} students`);
            res.status(200).json(students);
            console.log("test students:",students)
        } else {
            console.log("students not found");
            res.status(404).json({ message: "Students not found" });
        }
    } catch (err) {
        console.error("failed to get students:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
//DONE
// GET /api/homeinfo
// Purpose: Retrieve counts of students, properties, and landlords for homepage information.
// Input Parameters: None
// Return Format: JSON object with counts of students, landlords, and properties or an error message.
// Example Return: { "studentCount": 100, "landlordCount": 40, "propertyCount": 200 }
app.get('/api/homeinfo', async (req, res) => {
  //taken and changed slightly from Will's Homeworks
 console.log("GET /api/homeinfo");
 try {
     //grabs all students, properties, and landlords and puts their length in an object for frontend
     const studentCollection = client.db(dbConfig.db).collection("student");
     const propertyCollection = client.db(dbConfig.db).collection("property");
     const landlordCollection = client.db(dbConfig.db).collection("landlord");

     const student = await studentCollection.find({}).toArray();
     const landlord = await landlordCollection.find({}).toArray();
     const property = await propertyCollection.find({}).toArray();

    const homepageInfo = {
      studentCount: student.length,
      landlordCount: landlord.length,
      propertyCount: property.length
    }
    console.log(homepageInfo);

     if (homepageInfo) {
         console.log(`Fetched homepage info`);
         res.status(200).json(homepageInfo);
     } else {
         console.log("info not found");
         res.status(404).json({ message: "failed to get info" });
     }
 } catch (err) {
     console.error("failed to get students:", err);
     res.status(500).json({ error: "Internal server error" });
 }
});
// DONE
// GET /api/application/:studentId
// Purpose: Retrieve application details for a specific student based on their ID.
// Input Parameters: studentId (as part of the URL path)
// Return Format: JSON object containing the application details of the specified student, or an error message if not found.
// Example Return: [{ "applicationId": "12345", "studentId": "67890", "propertyId": "54321", "status": "pending" }]
app.get('/api/application/:studentId', async (req, res) => {
  //taken and changed slightly from Will's Homeworks
 console.log("GET /api/application/:studentId");
 try {
     //grab all the students and put them in an array

     const studentId = req.params.studentId;
     const applicationCollection = client.db(dbConfig.db).collection("application");

     console.log(await applicationCollection.find({}).toArray());

     const application = await applicationCollection.find({ studentId: new ObjectId(studentId) }).toArray();
      console.log(application);
     if (application) {
         console.log(`got ${application.length} applicaitons for ${studentId}`);
         res.status(200).json(application);
     } else{
         console.log("no applicaitons found");
         res.status(404).json({ message: `applications with student id ${studentId} not found: `});
     }
 } catch (err) {
     console.error("failed to get application:", err);
     res.status(500).json({ error: "Internal server error" });
 }
});
//DONE
// Purpose: Retrieve all landlords from the database
// Input Parameters: None
// Return Format: JSON array of landlord objects or error message
// Example Return: [{ "_id": "456", "username": "janedoe", "fname": "Jane", "lname": "Doe", "email": "janedoe@example.com", "companyName": "Doe Rentals" }, ...]
app.get('/api/landlord', async (req, res) => {
    console.log("GET /api/student");
     //taken and changed slightly from Will's Homeworks
  try {
    //grab all landlords and put them in array
        const landlordCollection = await client.db(dbConfig.db).collection("landlord");
        
        let query = {};
        if (req.query.fname) {
            query.fname = { $regex: new RegExp(req.query.fname, 'i') }; 
        }
        if (req.query.lname) {
            query.lname = { $regex: new RegExp(req.query.lname, 'i') };
        }

        const landlords = await landlordCollection.find(query).toArray();
    //if landlords exist, respond, if not respond and say none
      if (landlords) {
          console.log(`got landlords`);
          console.log(landlords);
          res.status(200).json(landlords);
      } else {
          console.log("landlords not found");
          res.status(404).json({ message: "landlords not found" });
      }
  } catch (err) {
      console.error("Failed to get landlords:", err);
      res.status(500).json({ error: "Internal server error" });
  }
});

//Done
// GET /api/property
// Purpose: Retrieve properties based on propertyId, landlordId, numberOfRooms, or location.
// Input Parameters: Optional 'propertyId', 'landlordId', 'numberOfRooms', 'location' in query. Not to be used together: 'propertyId' and 'landlordId'.
// Return Format: JSON array of property objects or error message.
// Error Handling: Handles errors for invalid query combinations, non-existent properties, or internal server errors.
// Example Query: /api/property?propertyId=PROPERTY_ID, /api/property?landlordId=LANDLORD_ID
// Example Return: [{"_id": "PROPERTY_ID", "landlordId": "LANDLORD_ID", "address": "123 Main St", ...}, ...]
app.get('/api/property', async (req, res) => {
  console.log("get /api/property");
  //can take propertyiD or landlord ID
  //framework based off will's homework
  const { propertyId, landlordId,numberOfRooms,location} = req.query;
  console.log(numberOfRooms);
  if(propertyId && landlordId){
      return res.status(422).json({ error: "must only search property or landlordid" });
  }

  try {
      const propertyCollection = client.db(dbConfig.db).collection("property");

      if (propertyId) {
          // get a specifc property for an iD
          const property = await propertyCollection.findOne({ _id: new ObjectId(propertyId) });
          
          if (property) {
              console.log(`got property with ID: ${propertyId}`);

              res.status(200).json(property);
          } else {

              console.log(`specific property not found`);
              res.status(404).json({ message: `Property with ID ${propertyId} not found` });
          }
      } 
      //Not working yet
      else if (landlordId) {
          // get the properties for a landlord
          const properties = await propertyCollection.find({ landlordId: new ObjectId(landlordId) }).toArray();
          if (properties.length > 0) {
              console.log(`got properties for landlord with ID: ${landlordId}`);
              res.status(200).json(properties);
          } else {
              console.log(`No properties found for landlord with ID: ${landlordId}`);
              res.status(404).json({ message: `No properties found for landlord with ID ${landlordId}` });
          }
      } else {

          // get all the properties
          let query = {};
          if (location) {
            query.location = {$regex: new RegExp(req.query.location, 'i') }; 
          }
       
          if (numberOfRooms) {
            query.numberOfRooms = Number(numberOfRooms);
          }
          console.log(query);
          const properties = await propertyCollection.find(query).toArray();
          if (properties.length > 0) {
              console.log("got properties");
              res.status(200).json(properties);
          } else {
              console.log("No properties found");
              res.status(404).json({ message: "No properties found" });
          }
      }
  } catch (err) {
      console.error("Failed to retrieve properties:", err);
      res.status(500).json({ error: "Internal server error" });
  }
});


//Done
// Purpose: Retrieve all applications for a specific property
// Input Parameters: propertyId as URL parameter
// Return Format: JSON array of application objects or error message
// Example URL: /api/property/application/PROPERTY_ID
// Example Return: [{"_id": "APPLICATION_ID", "studentId": "STUDENT_ID", "propertyId": "PROPERTY_ID", ...}, ...]
app.get('/api/property/application/:propertyId', async (req, res) => {
  console.log("GET /api/property/application/:propertyId");
  const propertyId = req.params.propertyId;
  //missing property id
  if (!propertyId) {
      return res.status(400).json({ error: "Missing propertyId" });
  }

  try {
      //gets all applications
      const applicationCollection = client.db(dbConfig.db).collection("application");
      // gets all the applicaitons for a specifc property
      const application = await applicationCollection.find({ propertyId: new ObjectId(propertyId) }).toArray();
      if (application.length > 0) {
          
          console.log(`num applications:  ${application.length} for propertyId: ${propertyId}`);
          res.status(200).json(application);
      } else {
          console.log(`no apps found for propertyid: ${propertyId}`);
          res.status(404).json({ message: "no applications found for given propertyID" });
      }
  } catch (err) {
      console.error(`failed to get applications for ${propertyId}:`, err);
      res.status(500).json({ error: "Internal server error" });
  }
});



//DONE
// Purpose: Create a new student
// Input Parameters: JSON object with username, fname, lname, email, and password
// Return Format: JSON object with success message or error message
// Example Input: {"username":"johndoe","fname":"John","lname":"Doe","email":"johndoe@example.com","password":"password123"}
// Example Return: {"message": "Student added"}
  app.post('/api/student', async (req, res) => {
    console.log("post /api/student");
    const { username,fname, lname, email, password } = req.body;
    //taken and changed from Will's Homeworks, check input when posting student
    const invalidFields = [];

    if (!fname || !/^[a-zA-Z]+$/.test(fname)) invalidFields.push('fname');
    if (!lname || !/^[a-zA-Z]+$/.test(lname)) invalidFields.push('lname');
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) invalidFields.push('email');
    if (!password || password.length < 8) invalidFields.push('password'); 
    if (invalidFields.length) {
        return res.status(422).json({ error: `Invalid fields: ${invalidFields.join(', ')}` });
    }

    try {
        //see if student exists already
        const studentCollection = client.db(dbConfig.db).collection("student");
        const existingStudent = await studentCollection.findOne({ email: email });

        if (existingStudent) {
            return res.status(409).json({ error: "email already in use" });
        }
        //form new student object
        const newStudent = {
            _id: new ObjectId(),
            created_at: new Date(),
            username,
            fname,
            lname,
            email,
            password
        };
        //put it into db
        const result = await studentCollection.insertOne(newStudent);
        if (result&& result && result.insertedId) {
          console.log(`Student created}`);
          res.status(201).json({ message: "Student added" });
      } else {
          console.log("failed to add student");
          throw new Error("failed to add student");
      }
  } catch (err) {
      console.error("failed to add student:", err);
      res.status(500).json({ error: "Internal server error" });
  }
});
//DONE
// Purpose: Create a new landlord
// Input Parameters: JSON object with fname, username, lname, email, password, and optional companyName
// Return Format: JSON object with success message or error message
// Example Input: {"fname":"Jane","username":"janedoe","lname":"Doe","email":"janedoe@example.com","password":"password123","companyName":"Doe Rentals"}
// Example Return: {"message": "landlord added"}
app.post('/api/landlord', async (req, res) => {
  console.log("post /api/landlord");
  //framework taken from Will's homework
  const { fname, username,lname, email, password, companyName } = req.body;
  const invalidFields = [];
  if (!fname || !/^[a-zA-Z]+$/.test(fname)) invalidFields.push('fname');
  if (!lname || !/^[a-zA-Z]+$/.test(lname)) invalidFields.push('lname');
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) invalidFields.push('email');
  if (!password || password.length < 8) invalidFields.push('password'); 
  if (companyName && typeof companyName !== 'string') invalidFields.push('companyName');

  if (invalidFields.length) {
      return res.status(422).json({ error: `Invalid fields: ${invalidFields.join(', ')}` });
  }

  try {
    //get the landlords and check if that email is in use
      const landlordCollection = client.db(dbConfig.db).collection("landlord");
      const existingLandlord = await landlordCollection.findOne({ email: email });
      if (existingLandlord) {
          return res.status(409).json({ error: "Email already in use" });
      }
      //create new landlord object
      const newLandlord = {
          _id: new ObjectId(),
          created_at: new Date(),
          username,
          fname,
          lname,
          email,
          password,
          companyName: companyName || null
      };
      //add it to db
      const result = await landlordCollection.insertOne(newLandlord);
        if (result&& result.insertedId) {
          console.log(`landlord created}`);
          res.status(201).json({ message: "landlord added" });
      } else {
          console.log("failed to add landlord");
          throw new Error("failed to add landlord");
      }
  } catch (err) {
      console.error("failed to add landlord:", err);
      res.status(500).json({ error: "Internal server error" });
  }
});
//DONE
// Purpose: Create a new property
// Input Parameters: JSON object with landlordId, address, numberOfRooms, rent, optional securityDeposit, summary, nickname, and location
// Return Format: JSON object with success message including propertyId, or error message
// Example Input: {"landlordId":"LANDLORD_ID","address":"123 Main St","numberOfRooms":3,"rent":1000,"nickname":"Main St Apartment","location":"Downtown","securityDeposit":500,"summary":"A lovely three-bedroom apartment."}
// Example Return: {"message": "Property added successfully", "propertyId": "PROPERTY_ID"}
app.post('/api/property', async (req, res) => {
    console.log("post /api/property");
    const { landlordId, address, numberOfRooms, rent, securityDeposit, summary,nickname,location } = req.body;
    //basic framework taken from Will's hoemwork
    // Basic input validation, just makes sure the fields exists that need to be there
    if (!landlordId || !address || !numberOfRooms || !rent|| !location) {
        return res.status(400).json({ error: "missing req fields" });
    }

    try {
        //get colleciton
        const propertyCollection = client.db(dbConfig.db).collection("property");
        //create new property object
        const newProperty = {
            _id: new ObjectId(),
            created_at: new Date(),
            landlordId: new ObjectId(landlordId),
            address,
            numberOfRooms,
            rent,
            nickname,
            location,
            securityDeposit: securityDeposit || null, 
            summary: summary || [],  
            taken: false,              
            applicationIds: []                    
        };
        //insert new property
        const result = await propertyCollection.insertOne(newProperty);
        if (result&& result.insertedId) {
            console.log(`Property created successfully with ID: ${result.insertedId}`);
            res.status(201).json({ message: "Property added successfully", propertyId: result.insertedId });
        } else {
            throw new Error("Failed to add property");
        }
    } catch (err) {
        console.error("Failed to add property:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
//Done
// Purpose: Create a new application for a property
// Input Parameters: JSON object with studentId and propertyId
// Return Format: JSON object with success message or error message
// Example Input: {"studentId":"STUDENT_ID","propertyId":"PROPERTY_ID"}
// Example Return: {"message": "app created"}
app.post('/api/application', async (req, res) => {
    console.log("post /api/application.");
    const { studentId, propertyId } = req.body;
    //framework taken from wills homework
    //makes sure student and property id were given
    if (!studentId || !propertyId) {
        return res.status(400).json({ error: "missing studentId or propertyId" });
    }

    try {
        //get property and application collections
        const applicationCollection = client.db(dbConfig.db).collection("application");
        const propertyCollection = client.db(dbConfig.db).collection("property");

        //create new application
        const newApplication = {
            _id: new ObjectId(),
            created_at: new Date(),
            studentId: new ObjectId(studentId), 
            propertyId: new ObjectId(propertyId),
            accepted: false
        };
        //insert new application
        const applicationResult = await applicationCollection.insertOne(newApplication);
        if (!applicationResult||!applicationResult.insertedId) {
            throw new Error("failed to create application");
        }

        //MongoDb documentation and MongoDB's AI refrenced to help with this
        const updateResult = await propertyCollection.updateOne(
            { _id: new ObjectId(propertyId) },
            { $push: { applicationIds: applicationResult.insertedId } }
        );
            //return success
        if (updateResult) {
            console.log(`application created`);
            res.status(201).json({ message: "app created"});
        } else {
            throw new Error("failed to create app");
        }
    } catch (err) {
        console.error("failed to submit app:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Purpose: Update student details in the database.
// Input Parameters: 'id' as a URL parameter; 'username', 'fname', 'lname', 'password' in request body.
// Validation: Checks formatting of 'fname', 'lname', and 'password' length.
// Return Format: JSON object with success or error message.
// Error Handling: Error for student not found, invalid fields, or update failure.
// Example Input: /api/student/student_ID with updated details in body.
// Example Return: Success message with studentId or error message.
app.post('/api/student/:id', async(req, res) => {
  //modified endpoint from Will's hoemwork to fit 
  console.log('POST /student/:id');
 
  //grab current player data ported to MongoDB 
  const studentId = req.params.id;
  const studentCollection = client.db(dbConfig.db).collection("student");

  let student = await studentCollection.findOne({ _id: new ObjectId(studentId) });
 // console.log("Player data fetched:", playersData);
//check mongo return, if player found
  if (student.length === 0) {
      return res.status(404).send({ error: "Player not found" });
    }
    //Ported for ease of understanding
    student = student[0];    

    const { username, fname, lname, password } = req.body;
  

  //check each for correct formatting
  const invalidFields = [];

  //push to invalidFields array if incorrect formattign
  if (fname && !/^[a-zA-Z]+$/.test(fname)) invalidFields.push('fname');
  if (lname && !/^[a-zA-Z]+$/.test(lname)) invalidFields.push('lname');
  if (password && password.length < 8) invalidFields.push('password');

  
//if invalidFields has anything, report error.

  if (invalidFields.length) {
    return res.status(422).send(`invalid fields: ${invalidFields.join(', ')}`);
  }

  if (username) student.username = username;
  if (fname) student.fname = fname;
  if (lname) student.lname = lname;
  if (password) student.password = password;
try {
  const result = await studentCollection.updateOne({ _id: new ObjectId(studentId) }, { $set: student });
    //console.log("Player data updated:", result);
    if (result && result.modifiedCount) {
        res.status(202).send(`sucessfully modified student with id:${studentId}`);
    } else {
        console.error("failed to modify student");
        return res.status(500).send({ error: "failed to modify student" });
    }
} catch (err) {
    console.error("Failed to update player:", err);
    return res.status(500).send({ error: "Failed to update player" });
}


});

// POST /api/landlord/:id
// Purpose: Update landlord details in the database.
// Input Parameters: 'id' as a URL parameter; 'username', 'fname', 'lname', 'password' in request body.
// Validation: Checks formatting of 'fname', 'lname', and 'password' length.
// Return Format: JSON object with success or error message.
// Error Handling: Error for landlord not found, invalid fields, or update failure.
// Example Input: /api/landlord/landlord_ID with updated details in body.
// Example Return: Success message with landlordId or error message.

app.post('/api/landlord/:id', async(req, res) => {
  //modified endpoint from Will's hoemwork to fit 
  console.log('POST /landlord/:id');
 
  //grab current player data ported to MongoDB 
  const landlordId = req.params.id;
  const landlordCollection = client.db(dbConfig.db).collection("landlord");

  let landlord = await landlordCollection.findOne({ _id: new ObjectId(landlordId) });
 // console.log("Player data fetched:", playersData);
//check mongo return, if player found
  if (landlord.length === 0) {
      return res.status(404).send({ error: "Player not found" });
    }
    //Ported for ease of understanding
    landlord = landlord[0];    

    const { username, fname, lname, password } = req.body;
  

  //check each for correct formatting
  const invalidFields = [];

  //push to invalidFields array if incorrect formattign
  if (fname && !/^[a-zA-Z]+$/.test(fname)) invalidFields.push('fname');
  if (lname && !/^[a-zA-Z]+$/.test(lname)) invalidFields.push('lname');
  if (password && password.length < 8) invalidFields.push('password');

  
//if invalidFields has anything, report error.

  if (invalidFields.length) {
    return res.status(422).send(`invalid fields: ${invalidFields.join(', ')}`);
  }
  if (username) landlord.username = username;
  if (fname) landlord.fname = fname;
  if (lname) landlord.lname = lname;
  if (password) landlord.password = password;
try {
  const result = await landlordCollection.updateOne({ _id: new ObjectId(landlordId) }, { $set: landlord });
    //console.log("Player data updated:", result);
    if (result && result.modifiedCount) {
        res.status(202).send(`sucessfully modified landlord with id:${landlordId}`);
    } else {
        console.error("failed to modify landlord");
        return res.status(500).send({ error: "failed to modify landlord" });
    }
} catch (err) {
    console.error("Failed to update player:", err);
    return res.status(500).send({ error: "Failed to update player" });
}


});
// POST /api/application/:id
// Purpose: Update application details in the database.
// Input Parameters: 'id' as a URL parameter; 'studentId', 'propertyId', 'accepted' in request body.
// Return Format: JSON object with success or error message.
// Error Handling: Error for application not found or update failure.
// Example Input: /api/application/application_ID with updated details in body.
// Example Return: Success message with applicationId or error message.
app.post('/api/application/:id', async(req, res) => {
  //modified endpoint from Will's hoemwork to fit 
  console.log('POST /application/:id');
 
  //grab current player data ported to MongoDB 
  const applicationId = req.params.id;
  const applicationCollection = client.db(dbConfig.db).collection("application");

  let application = await applicationCollection.findOne({ _id: new ObjectId(applicationId) });
 // console.log("Player data fetched:", playersData);
//check mongo return, if player found
  if (application.length === 0) {
      return res.status(404).send({ error: "Player not found" });
    }
    //Ported for ease of understanding
    application = application[0];    

    const { studentId, propertyId, accepted } = req.body;


 

  if (studentId) application.studentId = new ObjectId(studentId);
  if (propertyId) application.propertyId = new ObjectId(propertyId);
  if (accepted !== undefined) application.accepted = accepted;

try {
  const result = await applicationCollection.updateOne({ _id: new ObjectId(applicationId) }, { $set: application });
    //console.log("Player data updated:", result);
    if (result && result.modifiedCount) {
        res.status(202).send(`sucessfully modified application with id:${applicationId}`);
    } else {
        console.error("failed to modify application");
        return res.status(500).send({ error: "failed to modify application" });
    }
} catch (err) {
    console.error("Failed to update player:", err);
    return res.status(500).send({ error: "Failed to update player" });
}


});

// POST /api/property/:id
// Purpose: Update property details in the database.
// Input Parameters: 'id' as a URL parameter; 'landlordId', 'address', 'numberOfRooms', 'rent', 'nickname', 'location', 'securityDeposit', 'summary', 'taken' in request body.
// Return Format: JSON object with success or error message.
// Error Handling: Error for property not found or update failure.
// Example Input: /api/property/property_ID with updated details in body.
// Example Return: Success message with propertyId or error message.
app.post('/api/property/:id', async(req, res) => {
  //modified endpoint from Will's hoemwork to fit 
  console.log('POST /property/:id');
 
  //grab current player data ported to MongoDB 
  const propertyId = req.params.id;
  const propertyCollection = client.db(dbConfig.db).collection("property");

  let property = await propertyCollection.findOne({ _id: new ObjectId(propertyId) });
 // console.log("Player data fetched:", playersData);
//check mongo return, if player found
  if (property.length === 0) {
      return res.status(404).send({ error: "Player not found" });
    }
    //Ported for ease of understanding
    property = property[0];    
    const { landlordId, address, numberOfRooms, rent, nickname, location, securityDeposit, summary, taken } = req.body;

 

    if (landlordId) property.landlordId = new ObjectId(landlordId);
    if (address) property.address = address;
    if (numberOfRooms) property.numberOfRooms = numberOfRooms;
    if (rent) property.rent = rent;
    if (nickname) property.nickname = nickname;
    if (location) property.location = location;
    if (securityDeposit) property.securityDeposit = securityDeposit;
    if (summary) property.summary = summary;
    if (taken !== undefined) property.taken = taken;


  
try {
  const result = await propertyCollection.updateOne({ _id: new ObjectId(propertyId) }, { $set: property });
    //console.log("Player data updated:", result);
    if (result && result.modifiedCount) {
        res.status(202).send(`sucessfully modified property with id:${propertyId}`);
    } else {
        console.error("failed to modify property");
        return res.status(500).send({ error: "failed to modify property" });
    }
} catch (err) {
    console.error("Failed to update player:", err);
    return res.status(500).send({ error: "Failed to update player" });
}


});
// POST /api/application/accept/:id
// Purpose: Accept an application and update the corresponding property status in the database.
// Input Parameters: 'id' as a URL parameter for the application ID; 'accepted' status in the request query.
// Return Format: JSON object with a success message including applicationId and propertyId, or an error message.
// Error Handling: Handles errors for application not found, invalid 'accepted' status, and failures in updating the application or property.
// Example Input: /api/application/accept/application_ID?accepted=true
// Example Return: Success message "successfully accepted application with id:application_ID and marked property taken with ID: propertyId" or an error message.
app.post('/api/application/accept/:id', async(req, res) => {
  //modified endpoint from Will's hoemwork to fit 
  console.log('POST /application/accept/:id');
 
  //grab current player data ported to MongoDB 
  const applicationId = req.params.id;
  const applicationCollection = client.db(dbConfig.db).collection("application");
  const propertyCollection = client.db(dbConfig.db).collection("property");
  let accepted  = req.query.accepted;
  

  let application = await applicationCollection.findOne({ _id: new ObjectId(applicationId) });
 
 // console.log("Player data fetched:", playersData);
//check mongo return, if player found
  if (!application) {
      return res.status(404).send({ error: "application not found" });
    }
    //Ported for ease of understanding
      
    
  if (accepted !== undefined){
    
    if(accepted.toLowerCase() === 'true'){
      accepted = true;
    }else if(accepted.toLowerCase() === 'false'){

    }else{
      return res.status(422).send({ error: "accepted query must be either true or false exactly" });
    }
    
  }
  console.log(application)
  const propertyId = application.propertyId
  console.log(propertyId)
  console.log(typeof accepted)


try {
  const resultApplication = await applicationCollection.updateOne({ _id: application._id }, { $set: {accepted: accepted} });
  const resultProperty = await propertyCollection.updateOne({ _id: propertyId },{ $set: { taken: accepted } }
);
    //console.log("Player data updated:", result);
    console.log(resultApplication , resultProperty , resultProperty.matchedCount , resultApplication.matchedCount)
    if (resultApplication && resultProperty && resultProperty.matchedCount && resultApplication.matchedCount) {
        res.status(202).send(`sucessfully accepted application with id:${applicationId} and marked property taken with ID: ${application.propertyId}`);
    } else {
        console.error("failed to modify application or property");
        return res.status(500).send({ error: "failed to modify application or property" });
    }
} catch (err) {
    console.error("Failed to accept application:", err);
    return res.status(500).send({ error: "Failed to accept application" });
}


});

// Purpose: Delete a student record
// Input Parameters: studentId as a URL parameter
// Return Format: JSON object with success or error message
// Example Input: URL with studentId (e.g., /api/student/STUDENT_ID)
// Example Return: Redirect to '/student' or error message
app.delete('/api/student/:id', async (req, res) => {
    console.log('DELETE /student/:id');
    const studentId = req.params.id;

    try {
        const result = await deleteFromDb(studentId, "student");
        res.status(200).json({ message: `student deleted with id: ${studentId}`});
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});
// Purpose: Delete a landlord record
// Input Parameters: landlordId as a URL parameter
// Return Format: JSON object with success or error message
// Example Input: URL with landlordId (e.g., /api/landlord/landlord_ID)
// Example Return: Redirect to '/landlord' or error message
app.delete('/api/landlord/:id', async (req, res) => {
    console.log('DELETE /landlord/:id');
    const landlordId = req.params.id;

    try {
        const result = await deleteFromDb(landlordId, "landlord");
        res.status(200).json({ message: `landlord deleted with id: ${landlordId}`});
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});
// Purpose: Delete a property record
// Input Parameters: propertyId as a URL parameter
// Return Format: JSON object with success or error message
// Example Input: URL with propertyId (e.g., /api/property/property_ID)
// Example Return: Redirect to '/property' or error message
app.delete('/api/property/:id', async (req, res) => {
    console.log('DELETE /property/:id');
    const propertyId = req.params.id;

    try {
        const result = await deleteFromDb(propertyId, "property");
        res.status(200).json({ message: `property deleted with id: ${propertyId}`});
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});
// Purpose: Delete a application record
// Input Parameters: applicationId as a URL parameter
// Return Format: JSON object with success or error message
// Example Input: URL with applicationId (e.g., /api/application/application_ID)
// Example Return: Redirect to '/application' or error message
app.delete('/api/application/:id', async (req, res) => {
    console.log('DELETE /application/:id');
    const applicationId = req.params.id;

    try {
        const result = await deleteFromDb(applicationId, "application");
        res.status(200).json({ message: `application deleted with id: ${applicationId}`});
    } catch (err) {
        console.error(err.message);
        res.status(500).send({ error: err.message });
    }
});
//code taken from Will's homework to make a function that limits the copy and pasting to make more modular. 
async function deleteFromDb(id, collectionName) {
    //grab the data's collection
    const collection = client.db(dbConfig.db).collection(collectionName);
    let data = await collection.find({ _id: new ObjectId(id) }).toArray();

    //make sure it exists
    if (data.length === 0) {
        throw new Error(`${collectionName} not found`);
    }
    //delete
    try {
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            throw new Error("no result returned");
        }
        console.log(`data deleted with Id: ${id}`);
        return result;
    } catch (err) {
        throw new Error(`Failed to delete ${collectionName}: ${err.message}`);
    }
}





//*************    front end endpoints as below    ************************************************/ 
/********************** list student users  ***************************************************** */
/** by Qingyu */
app.get('/admin/students.html', async (req, res) => {
  try {
    // Use async/await for the fetch operation
    const response = await fetch('http://localhost:3000/api/student', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch students: ${response.statusText}`);
    }
    const users= await response.json();
    // console.log("students:", users);
    res.status(200).set('Content-Type', 'text/html');
    const render = util.promisify(res.render).bind(res);
    res.render('layout.ejs', {
      body: await render('pages/admin/list_student_user.ejs', { users }),
    });

    res.end();
  } catch (error) {
    console.error('Error rendering page:', error.message);
    res.status(500).send('Internal Server Error');
  }
});
/********************** list landlord users  ***************************************************** */
/** by Qingyu */
app.get('/admin/landlords.html', async (req, res) => {
  try {
    // Use async/await for the fetch operation
    const response = await fetch('http://localhost:3000/api/landlord', {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch students: ${response.statusText}`);
    }
    const users= await response.json();
    // console.log("students:", users);
    res.status(200).set('Content-Type', 'text/html');
    const render = util.promisify(res.render).bind(res);
    res.render('layout.ejs', {
      body: await render('pages/admin/list_landlord_user.ejs', { users }),
    });

    res.end();
  } catch (error) {
    console.error('Error rendering page:', error.message);
    res.status(500).send('Internal Server Error');
  }
});


/********************* create student user from admin side ****************************************************** */
/** by Qingyu */ 
app.get('/admin/students/create.html', async (req, res) => {
    try {
      res.status(200).set('Content-Type', 'text/html');
      const render = util.promisify(res.render).bind(res);
      res.render('layout.ejs', {
        body: await render('pages/admin/create_student_user.ejs')
      });
      res.end();
  
    } catch (error) {
      console.error('Error rendering page:', error);
      res.status(500).send('Internal Server Error');
    }
  });  
  /*****************  trojan home page  ********************************************************** */
  /** by Qingyu  */
  app.get('/trojanhousing/home.html',async(req,res)=>{
    try {
      res.status(200).set('Content-Type', 'text/html');
      const render = util.promisify(res.render).bind(res);
      res.render('layout.ejs', {
        body: await render('pages/trojanhousing/home.ejs')
      });
      res.end();
  
    } catch (error) {
      console.error('Error rendering page:', error);
      res.status(500).send('Internal Server Error');
    }
  })
  /*****************  trojan about us  ********************************************************** */
  /** by Qingyu  */
  app.get('/trojanhousing/about.html',async(req,res)=>{
    try {
      res.status(200).set('Content-Type', 'text/html');
      const render = util.promisify(res.render).bind(res);
      res.render('layout.ejs', {
        body: await render('pages/trojanhousing/about.ejs')
      });
      res.end();
  
    } catch (error) {
      console.error('Error rendering page:', error);
      res.status(500).send('Internal Server Error');
    }
  })
  /*******************  create landlord user from admin side  ********************************************************************************** */
  /**   */
  app.get('/admin/landlords/create.html', async (req, res) => {
    try {
      res.status(200).set('Content-Type', 'text/html');
      const render = util.promisify(res.render).bind(res);
  
      res.render('layout.ejs', {
        body: await render('pages/admin/create_landlord_user.ejs')
      });
      res.end();
  
    } catch (error) {
      console.error('Error rendering page:', error);
      res.status(500).send('Internal Server Error');
    }
  });
/********************* signup as student user from user side ****************************************************** */
/**   */ 
app.get('/users/students/signup.html', async (req, res) => {
  try {
    res.status(200).set('Content-Type', 'text/html');
    const render = util.promisify(res.render).bind(res);
    res.render('layout.ejs', {
      body: await render('pages/admin/signup_student_user.ejs')
    });
    res.end();

  } catch (error) {
    console.error('Error rendering page:', error);
    res.status(500).send('Internal Server Error');
  }
});
/********************* signup as landlord user from user side ****************************************************** */
/**   */
app.get('/users/landlords/signup.html', async (req, res) => {
  try {
    res.status(200).set('Content-Type', 'text/html');
    const render = util.promisify(res.render).bind(res);
    res.render('layout.ejs', {
      body: await render('pages/admin/signup_landlord_user.ejs')
    });
    res.end();

  } catch (error) {
    console.error('Error rendering page:', error);
    res.status(500).send('Internal Server Error');
  }
});
  /** admin frontend endpoints as above */
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
/********************* signup as landlord user from user side ****************************************************** */
/**   */
app.get('/users/landlords/signup.html', async (req, res) => {
  try {
    res.status(200).set('Content-Type', 'text/html');
    const render = util.promisify(res.render).bind(res);
    res.render('layout.ejs', {
      body: await render('pages/admin/signup_landlord_user.ejs')
    });
    res.end();

  } catch (error) {
    console.error('Error rendering page:', error);
    res.status(500).send('Internal Server Error');
  }
});
/**************************** admin manager board ************************************************************* */
app.get('/admin/managerboard.html', async (req, res) => {
  try {
    res.status(200).set('Content-Type', 'text/html');
    const render = util.promisify(res.render).bind(res);
    res.render('layout.ejs', {
      body: await render('pages/admin/manager_board.ejs')
    });
    res.end();

  } catch (error) {
    console.error('Error rendering page:', error);
    res.status(500).send('Internal Server Error');
  }
});
/** ***********************admin frontend endpoints as above ****************************/

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
console.log(`To create student user: http://localhost:3000/admin/students/create.html`);
console.log(`To create landlord user: http://localhost:3000/admin/landlords/create.html`);
console.log(`To signup as landlord user: http://localhost:3000/users/landlords/signup.html`);
console.log(`To signup as student user: http://localhost:3000/users/students/signup.html`);
console.log(`To look up all student user as manager: http://localhost:3000/admin/students.html`);
console.log(`To look up all student user as manager: http://localhost:3000/admin/landlords.html`);
