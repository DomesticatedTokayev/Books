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

    let _books = null;
    let topRated = null;

    try {
        topRated = await db.returnTopRatedBooks(3, 0, false);
    } catch (err) {
        console.log("Couldn't load top rated books", err.message);
        res.sendStatus(404).send("Something went wrong");
    }
    
    try {
        _books = await db.filterBooks(filter, asc);
    
    } catch (err) {
        console.log("Couldn't load filtered books", err.message);
        res.sendStatus(404).send("Something went wrong");
    }

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

    let _book = null;

    try {
        _book = await db.getBook(newID); //(id);
    } catch (err) {
        console.log("Couldn't select book", err.message);
        res.sendStatus(404).send("Something went wrong");
    }
    
    _book.date_read = formatDate(_book.date_read);
    
    res.render("book.ejs", { book: _book, page: "selected-book"});
});

//Change that to get (and get id from param)
app.post("/edit", async (req, res) => {
    const id = req.body.id;
    let _book = null;
    try {
        _book = await db.getBook(id);
    } catch (err) {
        console.log("Couldn't update book", err.message);
        res.sendStatus(404).send("Something went wrong");
    }

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

    let _book = null;

    try {
        _book = await db.updateBook(updatedBook);
    } catch (err) {
        console.log("Couldn't update book", err.message);
        res.sendStatus(404).send("Something went wrong");
    }

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
    
    let _book = null; 

    try{
        _book = await db.addNewBook(newBook);

    } catch (err){
        console.log("Couldn't create new book", err.message);
        res.sendStatus(404).send("Something went wrong");
    }

    _book.date_read = formatDate(_book.date_read);

    res.redirect("/"); //?hascover=
});

app.post("/delete", async (req, res) => {
    var bookID = req.body.id;

    try{
        await db.deleteBookByID(bookID);
    } catch (err){
        console.log("Couldn't delete book", err.message);
        res.sendStatus(404).send("Something went wrong");
    }

    res.redirect("/");
});

app.listen(port, error => {
    error ? console.log("Error in server start-up") : console.log("Listening on port ", port);
});

