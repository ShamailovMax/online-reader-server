// Текущий пользователь залогинен?
var logged_in = false;
var current_user_name = "";

// To connect with your mongoDB database
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://diplomUser:gt6vdUn13fDGqf79@cluster0.9icuq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority', {
    dbName: 'Cluster0',
    useNewUrlParser: true,
    useUnifiedTopology: true
}, err => err ? console.log(err) : 
    console.log('Connected to Cluster0 database'));

const BookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tech_name: {
    type: String,
    required: true,
    unique: true,
  },
  page_count: {
    type: Number,
    required: true,
    unique: false,
  },
});
const Book = mongoose.model("books", BookSchema);
Book.createIndexes();

// Schema for users of app
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    unique: false,
  },
});
const User = mongoose.model("users", UserSchema);
User.createIndexes();

// For backend and express
const express = require("express");
const app = express();
const cors = require("cors");
console.log("App listen at port 5000");
app.use(express.json());
app.use(cors());
app.get("/", (req, resp) => {
  resp.send("App is Working");
  // You can check backend is working or not by
  // entering http://loacalhost:5000

  // If you see App is working means
  // backend working properly
});

app.post("/register", async (req, resp) => {
  try {
    const user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    if (result) {
      //delete result.password;
      resp.send("reg_ok");
      console.log(result);
    }
  } catch (e) {
    resp.send("reg_error");
  }
});

app.post("/login", async (req, resp) => {
  try {
    const input_user = new User(req.body);
    User.countDocuments({
      name: input_user.name,
      password: input_user.password,
    }, function(err, e) {
      if (e === 1) {
        if (logged_in) {
          resp.send("login_already");
        } else {
          // Пользователь залогинился.
          logged_in = true;
          current_user_name = input_user.name;
          resp.send("login_ok");
        }
      } else if (e === 0) {
        resp.send("user_not_exist");
      } else {
        resp.send("user_not_unique");
      }
    });
  } catch (e) {
    resp.send("login_error");
  }
});

app.post("/profile_data", async (req, resp) => {
  try {
    // Сброс пользователя если не залогинен.
    if (!logged_in) {
      resp.send("user_not_login");
    }
    // Тут можно сделать запрос в БД и получить все данные пользователя, например.
    const user = {
      name: current_user_name,
    }
    const userJSON = JSON.stringify(user);
    resp.send(userJSON);
  } catch (e) {
    resp.send("profile_data_error");
  }
});

app.post("/unlogin", async (req, resp) => {
  try {
    // Сброс пользователя если не залогинен.
    if (!logged_in) {
      resp.send("user_not_login");
    }
    logged_in = false;
    current_user_name = "";
    resp.send("user_unlogin");
  } catch (e) {
    resp.send("unlogin_error");
  }
});

app.post("/get_page", async (req, resp) => {
  try {
    // Сброс пользователя если не залогинен.
    if (!logged_in) {
      resp.send("user_not_login");
    }
    // name="книга1"&page=3
    var book_data = req.body.split("&");
    var name = book_data[0].split("=")[1];
    var page = book_data[1].split("=")[1];

    var tech_name = "";
    var page_count = 0;

    Book.find()
      .where("name")
      .equals(name)
      .limit(1)
      .select("tech_name page_count")
      .exec(function (err, books) {
        if (err) return handleError(err);
        tech_name = books[0].tech_name; // ["tech_name"]
        page_count = books[0].page_count; // ["page_count"]
      });

    if (tech_name !== "") {
      if (page > page_count) {
        resp.send("page_out");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        // Отправили текст страницы на фронт
        const page = {
          page: text,
        }
        const pageJSON = JSON.stringify(page);
        resp.send(pageJSON);
      };
      reader.readAsText("/books/" + tech_name + "/page_" + page + ".txt");
    } else {
      resp.send("page_error");
    }
  } catch (e) {
    resp.send("Something Went Wrong");
  }
});

app.post("/get_book", async (req, resp) => {
  try {
    // Сброс пользователя если не залогинен.
    if (!logged_in) {
      resp.send("user_not_login");
    }

    // Выдача json всех книг
    // resp.send(json(Book.get_data()));
  } catch (e) {
    resp.send("Something Went Wrong");
  }
});
app.listen(5000);
