const express = require("express");
const fs = require("fs");
const morgan = require("morgan");
const app = express();
var methodOverride = require("method-override");
const path = require("path");

const bodyparser = require("body-parser");
app.use(bodyparser.urlencoded({ extended: true }));
const port = 3000;
app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});
// Setting template engion

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
// SERVING STATIC FILES
app.use(express.static(path.join(__dirname, "public")));

// Connecting Mongoose data base
const mongoose = require("mongoose");

const uri =
  "mongodb+srv://aryan:SsBA3ROsf1mPQIog@cluster0.i7ndl.mongodb.net/test?retryWrites=true&w=majority";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
  })
  .then(() => {
    console.log("DB connection succesfull");
  });

app.use(express.json());
app.use(morgan("dev"));

//Cutomer schema

const customer = new mongoose.Schema({
  user_id: {
    type: Number,
  },
  name: {
    type: String,
  },
  AcNo: {
    type: Number,
  },
  MobileNo: {
    type: Number,
  },
  EmailId: {
    type: String,
  },
  Balance: {
    type: Number,
  },
  LastTransactionAmount: {
    type: Number,
  },
  LastTransactionDate: {
    type: String,
  },
  LastTransactionType: {
    type: String,
  },
  RecentTransactions: [
    {
      TransferedTo: {
        type: String,
      },
      TransferedToUserId: {
        type: Number,
      },
      BalenceLeft: {
        type: Number,
      },
      Amount: {
        type: Number,
      },
      Date: {
        type: String,
      },
      Type: {
        type: String,
      },
      transactionno: String,
    },
  ],
});

const customers = mongoose.model("customers", customer);

// -----------***Route**--------------------////
const homepage = async (req, res) => {
  res.status(200).render("homepage");
};

app.get("/", homepage);

//---------***Post a transaction***-----------//

const postatransct = async (req, res) => {
  try {
    res.status(201).json({
      status: "success",
    });
    console.log(req.body);
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};
app.post("/send-money", postatransct);

//----------POST A CUSTOMERDATA---------------//

const postacstmr = async (req, res) => {
  try {
    const addtcstmr = await customers.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        customers: addtcstmr,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "failed",
      message: err,
    });
  }
};
app.post("/customers/add", postacstmr);

//-----PROFILEPAGE---------////////
const getcstmrbyid = async (req, res) => {
  try {
    const cstmrupdatedata = await customers.findById(req.params.id);

    res.status(200).render("profile", {
      cstmrupdatedata,
    });
  } catch (err) {
    res.status(404).render("profile", {
      cstmrupdatedata,
    });
  }
};

app.get("/customers/:id", getcstmrbyid);

//------------********Customers rendering *******----------//

//const customerbox = document.querySelector(".list");

const getallcstmr = async (req, res) => {
  try {
    const data = await customers.find();

    res.status(200).render("customerpage", {
      data,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
  }
};
app.get("/customers", getallcstmr);

//---------SEND MONEY-----------------//
app.use(methodOverride("_method"));
const sendbyid = async (req, res) => {
  try {
    const cstmrbyid = await customers.findById(req.params.id);
    const amtsendto = await customers.findById(req.body.account_id);
    const amt = req.body.amount;
    const balanceleft = cstmrbyid.Balance - req.body.amount * 1;
    const date = new Date().toJSON().slice(0, 10);
    const Transactionno = Math.floor(Math.random() * 1000000000000);
    //const array = cstmrbyid.RecentTransactions;
    const add = {
      TransferedTo: amtsendto.name,
      TransferedToUserId: amtsendto.user_id,
      BalenceLeft: balanceleft,
      Amount: amt,
      Date: date,
      Type: "send",
      transactionno: Transactionno,
    };
    cstmrbyid.Balance = balanceleft;
    amtsendto.Balance = amtsendto.Balance + req.body.amount * 1;

    // recievers data
    const rcver = {
      TransferedTo: cstmrbyid.name,
      TransferedToUserId: cstmrbyid.user_id,
      BalenceLeft: amtsendto.Balance,
      Amount: amt,
      Date: date,
      Type: "rcv",
      transactionno: Transactionno,
    };
    cstmrbyid.LastTransactionType = "send";
    cstmrbyid.LastTransactionAmount = amt;
    amtsendto.LastTransactionType = "rcv";
    amtsendto.LastTransactionAmount = amt;
    cstmrbyid.RecentTransactions.push(add);
    amtsendto.RecentTransactions.push(rcver);
    //array.slice(0, 9);
    console.log(cstmrbyid);

    const cstmrbyidupdate = await customers.findByIdAndUpdate(
      req.params.id,
      cstmrbyid,
      {
        new: true,
        runValidators: true,
        upsert: true,
      }
    );
    const recieverbyidupdate = await customers.findByIdAndUpdate(
      amtsendto._id,
      amtsendto,
      {
        new: true,
        runValidators: true,
        upsert: true,
      }
    );
    const cstmrupdatedata = await customers.findById(req.params.id);

    res.status(200).render("profile", {
      cstmrupdatedata,
      amtsendto,
      amt,

      balanceleft,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
    console.log(err);
  }
};

app.patch("/send-money/:id", sendbyid);

//----------REQUEST MONEY----------//

app.use(methodOverride("_method"));
const requestbyid = async (req, res) => {
  try {
    const cstmrbyid = await customers.findById(req.params.id);
    const amtsendto = await customers.findById(req.body.account_id);
    const amt = req.body.amount;
    const balanceleft = cstmrbyid.Balance + req.body.amount * 1;
    const date = new Date().toJSON().slice(0, 10);
    const Transactionno = Math.floor(Math.random() * 1000000000000);
    //const array = cstmrbyid.RecentTransactions;
    const add = {
      TransferedTo: amtsendto.name,
      TransferedToUserId: amtsendto.user_id,
      BalenceLeft: balanceleft,
      Amount: amt,
      Date: date,
      Type: "rcv",
      transactionno: Transactionno,
    };
    cstmrbyid.Balance = balanceleft;
    amtsendto.Balance = amtsendto.Balance - amt;
    // recievers data
    const rcver = {
      TransferedTo: cstmrbyid.name,
      TransferedToUserId: cstmrbyid.user_id,
      BalenceLeft: amtsendto.Balance,
      Amount: amt,
      Date: date,
      Type: "send",
      transactionno: Transactionno,
    };
    cstmrbyid.LastTransactionType = "rcv";
    amtsendto.LastTransactionType = "send";
    cstmrbyid.LastTransactionAmount = amt;
    amtsendto.LastTransactionAmount = amt;
    cstmrbyid.RecentTransactions.push(add);
    amtsendto.RecentTransactions.push(rcver);
    //array.slice(0, 9);

    const cstmrbyidupdate = await customers.findByIdAndUpdate(
      req.params.id,
      cstmrbyid,
      {
        new: true,
        runValidators: true,
        upsert: true,
      }
    );
    const recieverbyidupdate = await customers.findByIdAndUpdate(
      amtsendto._id,
      amtsendto,
      {
        new: true,
        runValidators: true,
        upsert: true,
      }
    );
    const cstmrupdatedata = await customers.findById(req.params.id);

    res.status(200).render("profile", {
      cstmrupdatedata,
      amtsendto,

      amt,
      balanceleft,
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err,
    });
    console.log(err);
  }
};

app.patch("/request-money/:id", requestbyid);
