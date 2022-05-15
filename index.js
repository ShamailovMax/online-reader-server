// Текущий пользователь залогинен?
var logged_in = false;
var current_user_name = "";

// * Подключение к базе данных MongoDB
const mongoose = require("mongoose");
mongoose.connect(
  "mongodb+srv://diplomUser:gt6vdUn13fDGqf79@cluster0.9icuq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  {
    dbName: "Cluster0",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) =>
    err ? console.log(err) : console.log("Connected to Cluster0 database")
);

// Коллекция книг
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
  category: {
    type: String,
    required: true,
    unique: false,
  },
  // description: {
  //   type: String,
  //   required: true,
  //   unique: true,
  // },
});

const Book = mongoose.model("books", BookSchema);
Book.createIndexes();

// Коллекция для данных пользователей
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
    const input_user = new User(req.body); // Создание нового пользователя
    User.countDocuments(
      {
        name: input_user.name,
        password: input_user.password,
      },
      function (err, e) {
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
      }
    );
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
    };
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

// * все самое интересное начинается именно здесь
app.post("/get_page", async (req, resp) => {
  try {
    // Сброс пользователя если не залогинен.
    if (!logged_in) {
      resp.send("user_not_login");
    }
    // name="книга1"&page=3
    console.log(req.body);
    // var book_data = req.body.split("&");

    var name = req.body["name"];
    var page = req.body["pageNumber"];

    var tech_name = "";
    var page_count = 0;

    // Фильтр по книгам
    Book.find()
      .where("name")
      .equals(name)
      .limit(1)
      .select("tech_name page_count")
      .exec(function (err, books) {
        if (err) return handleError(err);
        console.log("books[0].tech_name: " + books[0].tech_name);
        tech_name = books[0].tech_name; // ["tech_name"]
        page_count = books[0].page_count; // ["page_count"]
        if (tech_name !== "") {
          if (page > page_count) {
            console.log("hello");
            resp.send("page_out");
            return;
          }

          var fs = require("fs");
          var path = process.cwd();
          var buffer = fs.readFileSync(
            "./books/" + tech_name + "/page_" + page + ".txt",
            "utf-8"
          );

          const text = buffer.toString();
          // Отправили текст страницы на фронт
          const pageJSONStruct = {
            page: text,
            max_page_count: page_count,
          };
          const pageJSON = JSON.stringify(pageJSONStruct);
          resp.send(pageJSON);
        } else {
          resp.send("page_error");
        }
      });
  } catch (e) {
    resp.send("Something Went Wrong: " + e);
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

// запрос на получение категорий
app.get("/book/", async (req, resp) => {
  console.log(req.query);
  const selectedCategory = req.query.category;
});

app.listen(5000);
