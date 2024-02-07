# Project Structure

```plaintext
TrojanHousing/
├── view/
│   ├── pages/
│   │   ├── admin/: for Admin role uses 
│   │   ├── landlord/: For Landlord role Uses
│   │   └── student/: For student role uses
│   ├── trojanhousing/ General pages for all roles
│   ├── partials/: header and phooter
│   ├── public/
│   │   └── images/: Images for different web pages
|   |       └── Trojan Housing_files: Icons images
│   ├── pic/: picture for homeage
│   └── layout.ejs:base ejs for homepage
└── app.js: Backend Server for API and FrontEND HTML Managment

To start our project,
run $npm install
Open a MongoDB instance on port 27017 (either through docker compose file, docker desktop or seperate mongo commands)
npm start
go to this like in your browser to begin:http://localhost:3000/trojanhousing/home.html 

To watch our demo:
https://youtu.be/zDsFq-TgQpk
