import 'dotenv/config';
import express from "express";
import bodyparser from "body-parser";
import pg from "pg";
import axios from "axios";
import url from "url";

const app = express();
const port = 4000;

const bookCoverAPI = "https://covers.openlibrary.org/b/";

app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));


const db = new pg.Client({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password:  process.env.PASSWORD,
    port:  process.env.PORT
});

db.connect();

const newBook = {
    title: "Witcher",
    summary: "A book about witchers",
    notes: "Null and void",
    id_type: "ISBN",
    id_number: "1506702457",
    date_read: "2020-09-13",
    rating: 6
};

//  Available Cover: 1506702457
//  Unavailable Cover: 1847941834
//setBookCovers(19, "ISBN", 1506702457);
//resetBookCovers();

// ------------------------- PostgreSQL Tests -------------------------
//await addNewBook(newBook);
//await updateBook(newBook);
//await deleteBookByID(2);
//await returnTopRatedBooks(3);
//await returnNewlyAddedBooks(3);
//await getBooks(10, 0);
//await getNumOfBooks();
// --------------------------------------------------------------------
// --------------------------------------------------------------------
// ----------------------- Book Cover API Tests -----------------------
//await getCover("ISBN", "1506702457", "L");

//checkIfHasCover("ISBN", 1405918845,"S");

app.get("/", async (req, res) => {
    let filter = req.query.filter;
    let asc = req.query.asc;

    let _books = await filterBooks(filter, asc);
    var topRated = await returnTopRatedBooks(3, 0, false);

    _books = _books <= 0 ? null : _books;
    topRated = topRated <= 0 ? null : topRated;

    if (_books != null) {
        //Formatting date to string (XX-XX-XXXX)
       for (var i = 0; i < _books.length; i++) {
           _books[i].date_read = _books[i].date_read.toLocaleString(`en-CA`, { year: `numeric`, month: `2-digit`, day: `2-digit` });
       }
   }

    // Refactor this: Just send the book.
    res.render("index.ejs", {books: _books, topRatedThree: topRated, filter: "date", page: "home"});
});

app.post("/filter", async (req, res) => {
    var filter = req.body.filter;

    res.redirect("/?filter=" + filter + "&asc=" + "asc");
    
    //To Test ---------------------------------<<<<<<<<<<<<
    // res.redirect(url.format({
    //     pathname: "/",
    //     query: {
    //         "filter": filter,
    //         "asc": "asc"
    //     }
    // }));
});

// Overriden =============================================== << 
async function filterBooks(filterType, asc = true)
{
    let books = null;
    switch (filterType)
    {
            case "date":
            {
                books = await returnNewlyAddedBooks(100, 0, false);
                return books;
            }
            case "name":
            {
                books = await returnBooksByName(100, 0, asc);    
                return books;
            }
            case "rating":
            {
                books = await returnTopRatedBooks(100, 0, false);  // Temp
                return books;
            }
            default:
            {
               // console.log("Default Filter");
                books = await returnNewlyAddedBooks(100, 0, false);
                return books;
            }
    }
}

app.post("/select", async (req, res) => { ///:ID
    const newID = req.body.book_id;
    const _book = await getBook(newID); //(id);
    res.render("book.ejs", { book: _book, page: "selected-book"});
});

//Change that to get (and get id from param)
app.post("/edit", async (req, res) => {
    const id = req.body.id;

    const _book = await getBook(id);
    _book[0].date_read = _book[0].date_read.toLocaleString(`en-CA`, { year: `numeric`, month: `2-digit`, day: `2-digit` });

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
    
    //console.log(updatedBook);
    //let _book =  <================================ Return a book to reload book page
    await updateBook(updatedBook);
    res.redirect("/");
});

app.get("/new", (req, res) => {
  
    // Send today as string to date read
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
    
    await addNewBook(newBook);

    res.redirect("/"); //?hascover=
});


app.post("/delete", async (req, res) => {
    var bookID = req.body.id;

    await deleteBookByID(bookID);
    res.redirect("/");
});


app.listen(port, error => {
    error ? console.log("Error in server start-up") : console.log("Listening on port ", port);
});

async function getBook(id)
{
    const result = await db.query(`
        SELECT *
        FROM books
        WHERE books.id = $1`, [id]);
    return result.rows;
};


async function addNewBook(book) {

    let hasCover = await checkIfHasCover(book.id_type, book.id_number, "M");

    try {
        const result = await db.query(`
        INSERT INTO books (title, summary, notes, id_type, id_number, date_read, rating, has_cover)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, id_type, id_number`,
            [book.title, book.summary, book.notes, book.id_type, book.id_number, book.date_read, book.rating, hasCover]);
        
        return result.rows[0].id;
    }
    catch (error)
    {
        console.log("AddNewBook Error: ", error.message);
    }
}  

//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Return a book to reload book page
async function updateBook(book)
{
    let hasCover = await checkIfHasCover(book.id_type, book.id_number, "M");
    console.log(book);
    try {
        const result = await db.query(`UPDATE books SET title=$2, summary=$3, notes=$4, id_type=$5, id_number=$6, date_read=$7, rating=$8, has_cover=$9 WHERE id = $1`,
            [book.id, book.title, book.summary, book.notes, book.id_type, book.id_number, book.date_read, book.rating, hasCover]);
    } catch (error)
    {
        console.log("Update Book Error: ", error.message);
    }
    
};

async function updateBookCovers()
{
    try
    {
        let books = (await db.query("SELECT * FROM books")).rows;

        for (let i = 0; i < books.length; i++)
        {
            try
            {
                let hasCover = await checkIfHasCover(books[i].id_type, books[i].id_number, "M");

                try {
                    await db.query("UPDATE books SET has_cover=$1 WHERE id = $2", [hasCover, books[i].id]);
                }
                catch (error)
                {
                    console.log(error.message);
                }
            }
            catch (error)
            {
                console.log(error.message);
            }
            
        }
    }
    catch (error)
    {
        console.log(error.message);
    }
}

async function deleteBookByID(id)
{
    try {
        const result = await db.query(`DELETE FROM books WHERE id = $1`, [id]);
    }
    catch (error)
    {
        console.log("deleteBookByID Error: ", error.message);
    }
};

async function deleteBookCoversByID(id)
{
    try {
        const result = await db.query(`DELETE FROM book_covers WHERE book_id = $1`, [id]);  
    }
    catch (error)
    {
        console.log("deleteBookCoversByID Error: ", error.message);
    }
}

async function returnTopRatedBooks(numOfBooks, offset = 0, asc = true)
{
    let direction = asc ? "ASC" : "DESC";

    const result = await db.query(`SELECT *
        FROM books
        ORDER BY rating ${direction}
        LIMIT $1 OFFSET $2`,[numOfBooks, offset]);
    
    return result.rows;
};

async function returnNewlyAddedBooks(numOfBooks, offset = 0, asc = true)
{
    let direction = asc ? "ASC" : "DESC";
    const result = await db.query(`SELECT *
    FROM books
    ORDER BY date_read ${direction}
    LIMIT $1 OFFSET $2`, [numOfBooks, offset]);

    return result.rows;
};

async function returnBooksByName(numOfBooks, offset = 0, asc = true)
{
    let direction = asc ? "ASC" : "DESC";

    const result = await db.query(`SELECT *
    FROM books
    ORDER BY TITLE ${direction}
    LIMIT $1 OFFSET $2`, [numOfBooks, offset]);

    return result.rows;
};

async function getNumOfBooks()
{
    const result = await db.query("SELECT COUNT(*) FROM books");
    return result.rows[0].count;
};

// Called then new books are added
async function setBookCover(book_id, id_type, id_number)
{
    const id = book_id;
    const idType = id_type;
    const idNumber = id_number;

    //Get covers
    const s_cover = await getCover(idType, idNumber, "S");
    const m_cover = await getCover(idType, idNumber, "M");


    // Check if book_covers already hold entry
    const result = await db.query(`SELECT COUNT(*) FROM book_covers WHERE book_id =$1`, [book_id]);

    try {
        if (result.rows[0].count > 0)
        {
            // Update existing covers
            await db.query("UPDATE book_covers SET s_cover=$1, m_cover = $2 WHERE book_id = $3 RETURNING s_cover, m_cover", [s_cover, m_cover, id]);
        }
        else
        {
            // Create new book covers
            await db.query(`INSERT INTO book_covers (book_id, s_cover, m_cover)
                                             VALUES ($1, $2, $3)`, [id, s_cover, m_cover]);   
        }
    }
    catch (error)
    {
        console.log("setCovers Error:", error.message);
    }
};

async function getCover(ID_Type, IBSN_number, size = "S")
{
    if (IBSN_number === null)
    {
        return null;
    }

    var coverLink = "";
    try
    {
        await axios.get(`https://covers.openlibrary.org/b/${ID_Type}/${IBSN_number}-${size}.jpg?default=false`); 
        coverLink = `${bookCoverAPI}${ID_Type}/${IBSN_number}-${size}.jpg?default=false`;

    }
    catch (error)
    {
        console.log(`Error, ${IBSN_number} cover couldn't be found: `, error.message);
    }

    if (coverLink == "")
    {
        return null;
    }
    
    return coverLink;
};

async function checkIfHasCover(ID_Type, IBSN_number, size = "S")
{
    let hasCover = false;
    try {
        await axios.get(`https://covers.openlibrary.org/b/${ID_Type}/${IBSN_number}-${size}.jpg?default=false`);
        hasCover = true;
    }
    catch (error)
    {
        console.log(`Error, ${IBSN_number} cover couldn't be found: `, error.message);
    }
    return hasCover;
}

async function resetBookCovers()
{
    await db.query(`SELECT id, id_type, id_number FROM books`, async function (error, result)
    {
        if (error)
        {
            console.log("Error, Failed to reset covers", error);
            return;    
        }

        var bookCount = result.rows.length;

        for (var i = 0; i < bookCount; i++)
        {
            //console.log(result.rows[i].id, " ", result.rows[i].id_type, " ", result.rows[i].id_number);
            await setBookCover(result.rows[i].id, result.rows[i].id_type, result.rows[i].id_number);
        }
    });

};

