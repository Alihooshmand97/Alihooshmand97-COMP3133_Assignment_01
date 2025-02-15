const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Employee = require('./models/Employee');
const { ApolloError } = require('apollo-server-express');
const cors = require('cors');

const app = express();
app.use(express.json()); 
app.use(cors());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/comp3133_assignment1', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// GraphQL Schema Definition
const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    created_at: String!
    updated_at: String!
  }

  type Employee {
    id: ID!
    first_name: String!
    last_name: String!
    email: String!
    gender: String!
    designation: String!
    salary: Float!
    date_of_joining: String!
    department: String!
    employee_photo: String
    created_at: String!
    updated_at: String!
  }

  type Query {
    hello: String
    login(username: String!, password: String!): String
    getAllEmployees: [Employee]
    getEmployeeById(eid: ID!): Employee
    searchEmployeeByDesignationOrDepartment(designation: String, department: String): [Employee]
  }

  type Mutation {
    signup(username: String!, email: String!, password: String!): String
    addEmployee(first_name: String!, last_name: String!, email: String!, gender: String!, designation: String!, salary: Float!, date_of_joining: String!, department: String!, employee_photo: String): Employee
    updateEmployee(eid: ID!, first_name: String, last_name: String, email: String, gender: String, designation: String, salary: Float, date_of_joining: String, department: String, employee_photo: String): Employee
    deleteEmployee(eid: ID!): String
  }
`;

// Resolvers for handling GraphQL operations
const resolvers = {
  Query: {
    hello: () => "Hello, welcome to the Employee Management System API!",
    login: async (_, { username, password }) => {
      const user = await User.findOne({ username });
      if (!user) {
        throw new ApolloError("User not found", "USER_NOT_FOUND");
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new ApolloError("Incorrect password", "INCORRECT_PASSWORD");
      }
      return `User ${username} logged in successfully!`;
    },
    getAllEmployees: async () => {
      return await Employee.find();
    },
    getEmployeeById: async (_, { eid }) => {
      return await Employee.findById(eid);
    },
    searchEmployeeByDesignationOrDepartment: async (_, { designation, department }) => {
      const filter = {};
      if (designation) filter.designation = designation;
      if (department) filter.department = department;
      return await Employee.find(filter);
    },
  },
  Mutation: {
    signup: async (_, { username, email, password }) => {
        console.log('Password:', password); 
        const userExists = await User.findOne({ username });
        if (userExists) {
          throw new ApolloError("Username already exists", "USERNAME_EXISTS");
        }
        const newUser = new User({ username, email, password });
        await newUser.save();
        return "User created successfully!";
      },
      
    addEmployee: async (_, { first_name, last_name, email, gender, designation, salary, date_of_joining, department, employee_photo }) => {
      const newEmployee = new Employee({ first_name, last_name, email, gender, designation, salary, date_of_joining, department, employee_photo });
      await newEmployee.save();
      return newEmployee;
    },
    updateEmployee: async (_, { eid, first_name, last_name, email, gender, designation, salary, date_of_joining, department, employee_photo }) => {
      const employee = await Employee.findById(eid);
      if (!employee) {
        throw new ApolloError("Employee not found", "EMPLOYEE_NOT_FOUND");
      }
      if (first_name) employee.first_name = first_name;
      if (last_name) employee.last_name = last_name;
      if (email) employee.email = email;
      if (gender) employee.gender = gender;
      if (designation) employee.designation = designation;
      if (salary) employee.salary = salary;
      if (date_of_joining) employee.date_of_joining = date_of_joining;
      if (department) employee.department = department;
      if (employee_photo) employee.employee_photo = employee_photo;

      await employee.save();
      return employee;
    },
    deleteEmployee: async (_, { eid }) => {
        const employee = await Employee.findById(eid);
        if (!employee) {
          throw new ApolloError("Employee not found", "EMPLOYEE_NOT_FOUND");
        }
        await employee.deleteOne();  // Use deleteOne() instead of remove()
        return `Employee with ID ${eid} deleted successfully!`;
      },
      
  },
};

// Initialize ApolloServer with schema and resolvers
const server = new ApolloServer({ typeDefs, resolvers });

// Start the server before applying middleware
const startApolloServer = async () => {
  await server.start();
  server.applyMiddleware({ app });
};

// Run the Apollo server setup
startApolloServer();

// Server Setup
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}${server.graphqlPath}`);
});
