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
        const students = await studentCollection.find({}).toArray();
        //if recieved respond the array, otherwise send that there were no students
        if (students) {
            console.log(`Fetched ${students.length} students`);
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

      const landlords = await landlordCollection.find({}).toArray();
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
            status: false,              
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
app.post('/api/apply', async (req, res) => {
    console.log("post /api/apply.");
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
//TODO
//Needs to be debugged
/// Purpose: Retrieve all properties, a specific property based on propertyId, or all properties for a specific landlord based on landlordId
// Input Parameters: Optional query parameters propertyId and/or landlordId
// Return Format: JSON object of property(s) or error message
// Example Query: /api/property?propertyId=PROPERTY_ID or /api/property?landlordId=LANDLORD_ID
// Example Return: [{"_id": "PROPERTY_ID", "landlordId": "LANDLORD_ID", "address": "123 Main St", ...}, ...]
app.get('/api/property', async (req, res) => {
    console.log("get /api/property");
    //can take propertyiD or landlord ID
    //framework based off will's homework
    const { propertyId, landlordId } = req.query;
    if(propertyID && landlordID){
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
            const properties = await propertyCollection.find({}).toArray();
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

//*************    front end endpoints as below    ************************************************/ 
/********************** list student users  ***************************************************** */
app.get('/admin/students.html', async (req, res) => {
  try {
    // Use async/await for the fetch operation
    const response = await fetch('/api/student', {
      method: 'GET',
    });

    if (!response.ok) {
      // Handle non-successful responses (e.g., 404, 500)
      throw new Error(`Failed to fetch students: ${response.statusText}`);
    }

    // Parse JSON from the response
    const students = await response.json();

    console.log("students:", students);

    // Set the content type to HTML
    res.status(200).set('Content-Type', 'text/html');

    // Use async/await instead of callbacks
    const render = util.promisify(res.render).bind(res);

    // Assuming you have a layout.ejs file in the 'views' directory
    // res.render('layout.ejs', {
    //   body: await render('pages/admin/list_student_user.ejs', { students }),
    // });

    res.end();
  } catch (error) {
    console.error('Error rendering page:', error.message);
    res.status(500).send('Internal Server Error');
  }
});


/********************* create student user from admin side ****************************************************** */
 app.get('/admin/students/create.html', async (req, res) => {
    try {
     
      // Set the content type to HTML
      res.status(200).set('Content-Type', 'text/html');
  
      // use async/await instead of callbacks
      const render = util.promisify(res.render).bind(res);
  
      // Assuming you have a layout.ejs file in the 'views' directory
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
  app.get('/trojanhousing/home.html',async(req,res)=>{
    res.status(200).json({message: "home page"});
  })
  /*****************  trojan about us  ********************************************************** */
  app.get('/trojanhousing/about.html',async(req,res)=>{
    try {
      // Set the content type to HTML
      res.status(200).set('Content-Type', 'text/html');
  
      // use async/await instead of callbacks
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
  app.get('/admin/landlords/create.html', async (req, res) => {
    try {
     
      // Set the content type to HTML
      res.status(200).set('Content-Type', 'text/html');
  
      // use async/await instead of callbacks
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
 app.get('/users/students/signup.html', async (req, res) => {
  try {
   
    // Set the content type to HTML
    res.status(200).set('Content-Type', 'text/html');

    // use async/await instead of callbacks
    const render = util.promisify(res.render).bind(res);

    // Assuming you have a layout.ejs file in the 'views' directory
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
app.get('/users/landlords/signup.html', async (req, res) => {
  try {
   
    // Set the content type to HTML
    res.status(200).set('Content-Type', 'text/html');

    // use async/await instead of callbacks
    const render = util.promisify(res.render).bind(res);

    // Assuming you have a layout.ejs file in the 'views' directory
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

app.listen(PORT);
console.log(`Server started, port ${PORT}`);
console.log(`To create student user: http://localhost:3000/admin/students/create.html`);
console.log(`To create landlord user: http://localhost:3000/admin/landlords/create.html`);
console.log(`To signup as landlord user: http://localhost:3000/users/landlords/signup.html`);
console.log(`To signup as student user: http://localhost:3000/users/students/signup.html`);
console.log(`To signup as student user: http://localhost:3000/admin/students.html`);

