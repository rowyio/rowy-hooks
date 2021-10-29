
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

// simple use case of connect service
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

// the row Data is always passed as the body object this can be used to customize options for each row
app.post('/useRowData', (req, res) => {
    const rowData = req.body
    res.send({ results: rowData.options})  
});
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`connect-service: listening on port ${port}!`);
});


// Exports for testing purposes.
module.exports = app;
