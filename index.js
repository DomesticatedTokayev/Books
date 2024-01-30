import 'dotenv/config';
import express from "express";
import bodyparser from "body-parser";
import url from "url";
import * as db from "./src/Database/db.mjs"
import formatDate from './src/Utilities/formatDate.mjs';

const app = express();
const port = 4000;

app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));

db.connect();

app.get("/", async (req, res) => {
    let filter = req.query.filter;
    let asc = req.query.asc;

    let _books = await filterBooks(filter, asc);
    var topRated = await db.returnTopRatedBooks(3, 0, false);

    _books = _books <= 0 ? null : _books;
    topRated = topRated <= 0 ? null : topRated;

    // Format Date to (YEAR, MONTH, DAY)
    if (_books != null) {
        for (var i = 0; i < _books.length; i++) {
           _books[i].date_read = formatDate(_books[i].date_read);  
       }
   }

    res.render("index.ejs", {books: _books, topRatedThree: topRated, filter: "date", page: "home"});
});

app.post("/filter", async (req, res) => {
    var filter = req.body.filter;

    //res.redirect("/?filter=" + filter + "&asc=" + "asc");

    res.redirect(url.format({
        pathname: "/",
        query: {
            "filter": filter,
            "asc": "asc"
        }
    }));
});


app.post("/select", async (req, res) => { ///:ID
    const newID = req.body.book_id;
    const _book = await db.getBook(newID); //(id);
    
    _book.date_read = formatDate(_book.date_read);
    
    res.render("book.ejs", { book: _book, page: "selected-book"});
});

//Change that to get (and get id from param)
app.post("/edit", async (req, res) => {
    const id = req.body.id;

    const _book = await db.getBook(id);
    _book.date_read = formatDate(_book.date_read);

    res.render("new_edit.ejs", { book: _book, page: "edit" });
});

app.post("/edit_book", async (req, res) => {
    const updatedBook = {
        id: req.body.book_id,
        title: req.body.book_name,
        summary: req.body.summary,
        notes: req.body.notes,
        id_type: req.body.id_type,
        id_number: req.body.id_number,
        date_read: req.body.date_read,
        rating: req.body.rating
    };
    
    let _book = await db.updateBook(updatedBook);
    _book.date_read = formatDate(_book.date_read);

    res.render("book.ejs", { book: _book, page: "selected-book"});
});

app.get("/new", (req, res) => {
    res.render("new_edit.ejs", {page: "new"});
});

app.post("/new", async (req, res) => {

    const newBook = {
    title: req.body.book_name,
    summary: req.body.summary,
    notes: req.body.notes,
    id_type: req.body.id_type,
    id_number: req.body.id_number,
    date_read: req.body.date_read,
    rating: 0 | req.body.rating
    };
    
    let _book = await db.addNewBook(newBook);
    _book.date_read = formatDate(_book.date_read);

    res.redirect("/"); //?hascover=
});

app.post("/delete", async (req, res) => {
    var bookID = req.body.id;

    await db.deleteBookByID(bookID);
    res.redirect("/");
});

app.listen(port, error => {
    error ? console.log("Error in server start-up") : console.log("Listening on port ", port);
});

async function filterBooks(filterType, asc = true)
{
    let books = null;
    switch (filterType)
    {
        case "date":
        {
            books = await db.returnNewlyAddedBooks(100, 0, false);
            return books;
        }
        case "name":
        {
            books = await db.returnBooksByName(100, 0, asc);    
            return books;
        }
        case "rating":
        {
            books = await db.returnTopRatedBooks(100, 0, false);  // Temp
            return books;
        }
        default:
        {
            books = await db.returnNewlyAddedBooks(100, 0, false);
            return books;
        }
    }
}