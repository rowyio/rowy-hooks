
import express from 'express'
import cors from "cors";

const app = express();
// json is the default content-type for POST requests
app.use(express.json());
app.use(cors());


const users = [
  {
      "name": "John Smith",
      "email": "john.smith@fake.com"
  },
  {
      "name": "Matthew Jones",
      "email": "matthew.jones@fake.com"
  },
  {
      "name": "Jane Doe",
      "email": "jane.doe@fake.com"
  }
];

app.post('/', (req, res) => {
  let filteredUsers = users;
    const searchQuery:any = req.query.q;
    if (req.query.q) {
        filteredUsers = users.filter((u) => u.name.includes(searchQuery) || u.email.includes(searchQuery))
    }
    res.send({
        results: filteredUsers
    })
});


const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`connect-service: listening on port ${port}!`);
});


// Exports for testing purposes.
module.exports = app;
