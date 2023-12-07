'use strict';
//import mongo MongoClient and ObjectIDs
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');
//const cors = require('cors');


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

        // const students = await studentCollection.find({}).toArray();
        const students=[
          { id:"1",
            fname:"Donna",
          lname:"Zhou",
        userName:"donna",
      email:"1usc.edu",
    password:"12345678"},
    {id:"2",
    fname:"Donna",
          lname:"Zhou",
        userName:"donna",
      email:"2@usc.edu",
    password:"12345678"}
        ];
        if (students) {
            console.log(`Fetched ${students.length} students`);
            
            console.log(students);
            res.status(200).json(students);
            console.log("test students:",students)
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

//*************    front end endpoints as below    ************************************************/ 
/********************** list student users  ***************************************************** */
app.get('/admin/students.html', async (req, res) => {
  try {
   let students = 
    // Set the content type to HTML
    res.status(200).set('Content-Type', 'text/html');

    // use async/await instead of callbacks
    const render = util.promisify(res.render).bind(res);

    // Assuming you have a layout.ejs file in the 'views' directory
    res.render('layout.ejs', {
      body: await render('pages/admin/list_student_user.ejs',students)
    });
    res.end();

  } catch (error) {
    console.error('Error rendering page:', error);
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

